import {readdirSync} from 'fs'
import {execSync, execFileSync} from 'child_process'
import {basename, resolve, dirname} from 'path'
import {fileURLToPath} from 'url'
import {getWorkspaceBuildOrder} from '../../shared/check.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const name = process.argv[2]
const extraArgs = process.argv.slice(3)

const demos = readdirSync(__dirname)
  .filter(f => f.endsWith('.ts') && f !== 'demo.ts')
  .map(f => basename(f, '.ts'))
  .sort()

if (!name) {
  console.info('Available demos:\n')
  for (const d of demos) {
    console.info(`  ${d}`)
  }
  console.info(`\nUsage: pnpm demo <name>`)
  process.exit(0)
}

function fuzzyMatch(query, candidates) {
  const exact = candidates.find(c => c === query)
  if (exact) return [exact]

  const prefixed = candidates.filter(c => c.startsWith(query))
  if (prefixed.length) return prefixed

  const substr = candidates.filter(c => c.includes(query))
  if (substr.length) return substr

  return candidates.filter(c => {
    let ci = 0
    for (const ch of query) {
      ci = c.indexOf(ch, ci)
      if (ci === -1) {
        return false
      }
      ci++
    }
    return true
  })
}

async function buildWorkspaceProjects() {
  const buildOrder = await getWorkspaceBuildOrder(__dirname)

  for (const projectDir of buildOrder) {
    execSync('pnpm build', {stdio: 'inherit', cwd: projectDir})
  }
}

const matches = fuzzyMatch(name, demos)

if (matches.length === 0) {
  console.error(`No demo matching "${name}"\n`)
  console.error('Available demos:\n')
  for (const d of demos) {
    console.error(`  ${d}`)
  }
  process.exit(1)
}

if (matches.length > 1) {
  console.error(`Ambiguous demo "${name}", matches:\n`)
  for (const d of matches) {
    console.error(`  ${d}`)
  }
  process.exit(1)
}

const demo = matches[0]
if (demo !== name) {
  console.info(`Running demo: ${demo}`)
}

await buildWorkspaceProjects()
execFileSync('node', ['--enable-source-maps', demo, ...extraArgs], {
  stdio: 'inherit',
  cwd: resolve(__dirname, '.dist'),
})
