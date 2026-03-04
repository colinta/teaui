import {readdirSync} from 'fs'
import {execSync} from 'child_process'
import {basename, resolve, dirname} from 'path'
import {fileURLToPath} from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const name = process.argv[2]

const demos = readdirSync(__dirname)
  .filter(f => f.endsWith('.ts') && f !== 'demo.ts')
  .map(f => basename(f, '.ts'))
  .sort()

if (!name) {
  console.log('Available demos:\n')
  for (const d of demos) {
    console.log(`  ${d}`)
  }
  console.log(`\nUsage: pnpm demo <name>`)
  process.exit(0)
}

function fuzzyMatch(query, candidates) {
  // exact match first
  const exact = candidates.find(c => c === query)
  if (exact) return [exact]

  // prefix match
  const prefixed = candidates.filter(c => c.startsWith(query))
  if (prefixed.length) return prefixed

  // substring match
  const substr = candidates.filter(c => c.includes(query))
  if (substr.length) return substr

  // fuzzy: all query chars appear in order
  const fuzzy = candidates.filter(c => {
    let ci = 0
    for (const ch of query) {
      ci = c.indexOf(ch, ci)
      if (ci === -1) return false
      ci++
    }
    return true
  })
  return fuzzy
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
  console.log(`Running demo: ${demo}`)
}

execSync('pnpm checksum', {stdio: 'inherit', cwd: __dirname})
execSync(`node --enable-source-maps ${demo}`, {
  stdio: 'inherit',
  cwd: resolve(__dirname, '.dist'),
})
