#!/usr/bin/env node

import {existsSync} from 'fs'
import {spawn} from 'child_process'
import path from 'path'

const args = process.argv.slice(2)
if (args.length === 0) {
  console.error('Usage: pnpm demo <filename> [args...]')
  process.exit(1)
}

const filename = args[0]
const demoArgs = args.slice(1)

// Try to find the demo file
const distDir = '.dist'
let targetFile = null

// First try the filename as-is
if (existsSync(path.join(distDir, filename))) {
  targetFile = filename
}
// Then try with .js extension
else if (existsSync(path.join(distDir, filename + '.js'))) {
  targetFile = filename + '.js'
}
// File not found
else {
  console.error(`Demo not found: ${filename}`)
  console.error(`Available demos:`)

  // List available .js files (excluding .d.ts and .map files)
  const fs = await import('fs')
  const files = fs
    .readdirSync(distDir)
    .filter(f => f.endsWith('.js'))
    .map(f => f.replace(/\.js$/, ''))
    .sort()

  files.forEach(f => console.error(`  ${f}`))
  process.exit(1)
}

// Run the demo
const child = spawn(
  'node',
  ['--enable-source-maps', '--', targetFile, ...demoArgs],
  {
    cwd: distDir,
    stdio: 'inherit',
  },
)

child.on('exit', code => {
  process.exit(code || 0)
})
