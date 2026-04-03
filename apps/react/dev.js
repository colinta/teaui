#!/usr/bin/env node

import {readdirSync} from 'node:fs'
import {basename, dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import React from 'react'
import {createServer} from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))
const workspaceRoot = resolve(__dirname, '../..')
const name = process.argv[2]

const demos = readdirSync(__dirname)
  .filter(file => file.endsWith('.tsx'))
  .map(file => basename(file, '.tsx'))
  .sort()

if (!name) {
  console.info('Available demos:\n')
  for (const demo of demos) {
    console.info(`  ${demo}`)
  }
  console.info('\nUsage: pnpm dev <name> [args...]')
  process.exit(0)
}

function fuzzyMatch(query, candidates) {
  const exact = candidates.find(candidate => candidate === query)
  if (exact) return [exact]

  const prefixed = candidates.filter(candidate => candidate.startsWith(query))
  if (prefixed.length) return prefixed

  const substr = candidates.filter(candidate => candidate.includes(query))
  if (substr.length) return substr

  return candidates.filter(candidate => {
    let index = 0
    for (const char of query) {
      index = candidate.indexOf(char, index)
      if (index === -1) {
        return false
      }
      index += 1
    }
    return true
  })
}

const matches = fuzzyMatch(name, demos)

if (matches.length === 0) {
  console.error(`No demo matching "${name}"\n`)
  console.error('Available demos:\n')
  for (const demo of demos) {
    console.error(`  ${demo}`)
  }
  process.exit(1)
}

if (matches.length > 1) {
  console.error(`Ambiguous demo "${name}", matches:\n`)
  for (const demo of matches) {
    console.error(`  ${demo}`)
  }
  process.exit(1)
}

const demo = matches[0]
if (demo !== name) {
  console.info(`Running demo: ${demo}`)
}

const server = await createServer({
  configFile: resolve(__dirname, 'vite.config.ts'),
  root: __dirname,
  server: {
    middlewareMode: true,
  },
})

const runtimeModule = await server.ssrLoadModule('/dev-runtime.tsx')
const runtime = await runtimeModule.createHotReloadRuntime()

let isReloading = false
let queuedReload = false

async function reload() {
  if (isReloading) {
    queuedReload = true
    return
  }

  isReloading = true

  try {
    // Re-import @teaui/react every reload so the reconciler picks up
    // changes to @teaui/core classes (e.g. Slider, Button, etc.)
    // Invalidate our source modules so transitive changes (e.g. Slider.ts)
    // are picked up when @teaui/react and @teaui/core are re-evaluated.
    // We must NOT invalidate node_modules (react, react-reconciler, etc.)
    // because those are CJS and can't be re-evaluated by Vite's ESM runner.
    const moduleGraph = server.environments?.ssr?.moduleGraph
    if (moduleGraph) {
      for (const mod of moduleGraph.idToModuleMap.values()) {
        if (mod.id && !mod.id.includes('/node_modules/')) {
          moduleGraph.invalidateModule(mod)
        }
      }
    }

    const [{render}, module] = await Promise.all([
      server.ssrLoadModule('@teaui/react'),
      server.ssrLoadModule(`/${demo}.tsx`),
    ])

    const component = pickComponent(module)
    if (!component) {
      throw new Error(
        `Could not find a React component export in apps/react/${demo}.tsx`,
      )
    }

    runtime.remount(render, React.createElement(component))
  } catch (error) {
    // For error display, try to get a fresh render — but fall back
    // gracefully if @teaui/react itself is broken
    try {
      const {render, Box, Stack, Style, Text} =
        await server.ssrLoadModule('@teaui/react')
      const message = formatError(error)
      runtime.remount(
        render,
        React.createElement(
          Box,
          {border: 'rounded', padding: 1, flex: 1},
          React.createElement(
            Stack.down,
            {gap: 1, flex: 1},
            React.createElement(
              Text,
              null,
              React.createElement(
                Style,
                {bold: true, foreground: 'red'},
                'TeaUI Vite reload failed',
              ),
            ),
            React.createElement(Text, {wrap: true}, message),
          ),
        ),
      )
    } catch {
      // Can't even render the error — just log to stderr
      process.stderr.write(
        `\n[teaui-dev] reload error: ${formatError(error)}\n`,
      )
    }
  } finally {
    isReloading = false
    if (queuedReload) {
      queuedReload = false
      await reload()
    }
  }
}

function formatError(error) {
  if (error instanceof Error) {
    return error.stack ?? error.message
  }
  return String(error)
}

function pickComponent(module) {
  if (typeof module.default === 'function') {
    return module.default
  }

  for (const key of ['App', 'Demo', 'BrowseAnything']) {
    if (typeof module[key] === 'function') {
      return module[key]
    }
  }

  const exportedComponents = Object.entries(module)
    .filter(
      ([key, value]) => key !== '__esModule' && typeof value === 'function',
    )
    .map(([, value]) => value)

  if (exportedComponents.length === 1) {
    return exportedComponents[0]
  }

  return null
}

let reloadTimer

function scheduleReload(file) {
  if (!shouldReload(file)) {
    return
  }

  clearTimeout(reloadTimer)
  reloadTimer = setTimeout(() => {
    void reload()
  }, 30)
}

function shouldReload(file) {
  return (
    (file.startsWith(resolve(workspaceRoot, 'apps/react')) ||
      file.startsWith(resolve(workspaceRoot, 'packages/core')) ||
      file.startsWith(resolve(workspaceRoot, 'packages/react')) ||
      file.startsWith(resolve(workspaceRoot, 'packages/term'))) &&
    /\.(c|m)?(t|j)sx?$/.test(file)
  )
}

server.watcher.on('add', scheduleReload)
server.watcher.on('change', scheduleReload)
server.watcher.on('unlink', scheduleReload)

let isClosing = false

async function close() {
  if (isClosing) {
    return
  }

  isClosing = true
  clearTimeout(reloadTimer)
  runtime.dispose()
  await server.close()
}

process.once('SIGTERM', () => {
  void close()
})
process.once('SIGINT', () => {
  void close()
})
process.once('beforeExit', () => {
  void close()
})

await reload()
