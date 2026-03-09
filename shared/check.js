import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import {promisify} from 'util'
import {execSync} from 'child_process'

const readFile = promisify(fs.readFile)
const readDir = promisify(fs.readdir)
const writeFile = promisify(fs.writeFile)
const unlink = promisify(fs.unlink)
const stat = promisify(fs.stat)

async function generateFileHash(filePath) {
  const fileContent = await readFile(filePath)
  return crypto.createHash('sha1').update(fileContent).digest('hex')
}

async function findFiles(startPath) {
  const files = []

  async function traverse(currentPath) {
    const items = await readDir(currentPath)

    for (const item of items) {
      const fullPath = path.join(currentPath, item)
      const fileStat = await stat(fullPath)

      if (fileStat.isDirectory()) {
        if (item === 'node_modules' || item === '.dist' || item === 'dist') {
          continue
        }
        await traverse(fullPath)
      } else if (
        fileStat.isFile() &&
        ['.ts', '.tsx', '.js'].some(ext => item.endsWith(ext))
      ) {
        files.push(fullPath)
      }
    }
  }

  await traverse(startPath)
  return files.sort()
}

async function calculateChecksum(directories) {
  const hashes = []

  for (const directory of directories) {
    const files = await findFiles(directory)
    for (const file of files) {
      const hash = await generateFileHash(file)
      hashes.push(`${hash}  ${file}`)
    }
  }

  // Sort the hashes and create a final combined hash
  const sortedHashes = hashes.sort().join('\n')
  return crypto.createHash('sha1').update(sortedHashes).digest('hex')
}

async function dirExists(dirPath) {
  try {
    const s = await stat(dirPath)
    return s.isDirectory()
  } catch {
    return false
  }
}

/**
 * Resolve workspace:* dependencies from a package dir, walking the full
 * transitive dependency tree. Returns {needs, sources} where:
 *   - needs: .dist dirs that must exist for each workspace dep
 *   - sources: source dirs (src/ or lib/) to watch for changes
 *
 * @teaui/shared is excluded since it's a build tool, not a compiled dep.
 */
async function resolveWorkspaceDeps() {
  const needs = ['.dist']
  const sources = ['.']
  const visited = new Set()

  async function walk(pkgDir) {
    const realDir = await fs.promises.realpath(pkgDir)
    if (visited.has(realDir)) return
    visited.add(realDir)

    let pkg
    try {
      pkg = JSON.parse(await readFile(path.join(realDir, 'package.json'), 'utf8'))
    } catch {
      return
    }

    const allDeps = {
      ...(pkg.dependencies || {}),
      ...(pkg.devDependencies || {}),
    }

    for (const [name, version] of Object.entries(allDeps)) {
      if (!version.startsWith('workspace:')) continue
      if (name === '@teaui/shared') continue

      const nmPath = path.join(realDir, 'node_modules', name)
      let depDir
      try {
        depDir = await fs.promises.realpath(nmPath)
      } catch {
        // Might not be hoisted here, try from the original cwd
        try {
          depDir = await fs.promises.realpath(path.join('node_modules', name))
        } catch {
          console.warn(`Warning: could not resolve ${name}`)
          continue
        }
      }

      if (visited.has(depDir)) continue

      // needs: the .dist directory
      needs.push(path.join(depDir, '.dist'))

      // sources: prefer src/, fall back to lib/
      const srcDir = path.join(depDir, 'src')
      const libDir = path.join(depDir, 'lib')
      if (await dirExists(srcDir)) {
        sources.push(srcDir)
      } else if (await dirExists(libDir)) {
        sources.push(libDir)
      }

      // Recurse into this dep's own workspace deps
      await walk(depDir)
    }
  }

  await walk('.')
  return {needs, sources}
}

export async function compare(directories, needs) {
  try {
    // If any required output directory is missing, force rebuild
    for (const dir of needs) {
      if (!(await dirExists(dir))) {
        // Clear the sum so the next run after build will save a fresh one
        try {
          await unlink('.sum')
        } catch {}
        return 1
      }
    }

    const newSum = await calculateChecksum(directories)

    try {
      const oldSum = await readFile('.sum', 'utf8')

      if (oldSum.trim() === newSum) {
        return 0
      }
    } catch (error) {}

    try {
      // Remove old sum file if it exists
      try {
        await unlink('.sum')
      } catch (error) {
        // Ignore error if file doesn't exist
      }

      // Write new sum
      await writeFile('.sum', newSum)
      return 1
    } catch (error) {
      return error.status || 1
    }
  } catch (error) {
    console.error('Error:', error)
    return 1
  }
}

export function main(...args) {
  const command = args.pop()
  const directories = []
  const needs = []
  let autoResolve = true

  for (const arg of args) {
    if (arg.startsWith('--needs=')) {
      needs.push(arg.slice('--needs='.length))
      autoResolve = false
    } else {
      directories.push(arg)
      autoResolve = false
    }
  }

  if (!command) {
    console.error('Usage: check [--needs=<dir>]... [<dir>...] <command>')
    console.error('    If no --needs or dirs are given, they are auto-resolved')
    console.error('    from workspace:* dependencies in package.json.')
    process.exit(1)
  }

  const run = async () => {
    if (autoResolve) {
      const resolved = await resolveWorkspaceDeps()
      needs.push(...resolved.needs)
      directories.push(...resolved.sources)
    }

    if (directories.length === 0) {
      console.error('Error: no source directories found. Provide dirs or add workspace:* deps.')
      process.exit(1)
    }

    const changed = await compare(directories, needs)

    if (changed === 0) {
      console.log('No changes')
    } else {
      console.log('Changes detected')
      execSync(command, {stdio: 'inherit'})
      // Save checksum after successful build so the next run is a no-op
      const newSum = await calculateChecksum(directories)
      await writeFile('.sum', newSum)
    }
    process.exit(0)
  }

  run().catch(error => {
    console.error(error)
    process.exit(1)
  })
}
