import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import {execSync} from 'child_process'
import {fileURLToPath} from 'url'

const HASHABLE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.yaml',
  '.yml',
  '.css',
])
const IGNORED_DIRECTORIES = new Set(['node_modules', '.dist', 'dist', '.git'])
const CHECKSUM_FILE = '.sum'
const BUILD_OUTPUT_DIRECTORY = '.dist'
const SHARED_PACKAGE_NAME = '@teaui/shared'
const WORKSPACE_MANIFEST = 'pnpm-workspace.yaml'

async function fileExists(filePath) {
  try {
    const stat = await fs.promises.stat(filePath)
    return stat.isFile()
  } catch {
    return false
  }
}

async function directoryExists(dirPath) {
  try {
    const stat = await fs.promises.stat(dirPath)
    return stat.isDirectory()
  } catch {
    return false
  }
}

function isHashableFile(fileName) {
  if (fileName === CHECKSUM_FILE) {
    return false
  }

  return HASHABLE_EXTENSIONS.has(path.extname(fileName))
}

async function generateFileHash(filePath) {
  const fileContent = await fs.promises.readFile(filePath)
  return crypto.createHash('sha1').update(fileContent).digest('hex')
}

async function findHashableFiles(startPath) {
  const files = []

  async function traverse(currentPath) {
    const entries = await fs.promises.readdir(currentPath, {
      withFileTypes: true,
    })

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name)

      if (entry.isDirectory()) {
        if (IGNORED_DIRECTORIES.has(entry.name)) {
          continue
        }

        await traverse(fullPath)
        continue
      }

      if (entry.isFile() && isHashableFile(entry.name)) {
        files.push(fullPath)
      }
    }
  }

  await traverse(startPath)
  return files.sort()
}

export async function calculateProjectChecksum(projectDir = '.') {
  const rootDir = await fs.promises.realpath(projectDir)
  const files = await findHashableFiles(rootDir)
  const hashes = []

  for (const file of files) {
    const hash = await generateFileHash(file)
    hashes.push(`${hash}  ${path.relative(rootDir, file)}`)
  }

  return crypto.createHash('sha1').update(hashes.join('\n')).digest('hex')
}

async function readPackageJson(projectDir) {
  const packageJsonPath = path.join(projectDir, 'package.json')
  const packageJson = await fs.promises.readFile(packageJsonPath, 'utf8')
  return JSON.parse(packageJson)
}

function workspaceDependencyNames(packageJson) {
  const names = []
  const sections = [
    packageJson.dependencies || {},
    packageJson.devDependencies || {},
    packageJson.peerDependencies || {},
  ]

  for (const section of sections) {
    for (const [name, version] of Object.entries(section)) {
      if (!String(version).startsWith('workspace:')) {
        continue
      }

      if (name === SHARED_PACKAGE_NAME) {
        continue
      }

      names.push(name)
    }
  }

  return [...new Set(names)]
}

function installDependencyNames(packageJson) {
  const names = []
  const sections = [
    packageJson.dependencies || {},
    packageJson.devDependencies || {},
    packageJson.optionalDependencies || {},
  ]

  for (const section of sections) {
    names.push(...Object.keys(section))
  }

  return [...new Set(names)]
}

async function findWorkspaceRoot(startDir) {
  let currentDir = await fs.promises.realpath(startDir)

  while (true) {
    const workspaceManifest = path.join(currentDir, WORKSPACE_MANIFEST)
    if (await fileExists(workspaceManifest)) {
      return currentDir
    }

    const parentDir = path.dirname(currentDir)
    if (parentDir === currentDir) {
      throw new Error(
        `Could not find ${WORKSPACE_MANIFEST} starting from ${startDir}`,
      )
    }

    currentDir = parentDir
  }
}

async function resolveInstalledDependencyDir(projectDir, packageName) {
  const workspaceRoot = await findWorkspaceRoot(projectDir)
  const candidatePaths = [
    path.join(projectDir, 'node_modules', packageName),
    path.join(workspaceRoot, 'node_modules', packageName),
  ]

  for (const candidatePath of candidatePaths) {
    try {
      return await fs.promises.realpath(candidatePath)
    } catch {
      // Try the next candidate.
    }
  }

  return null
}

async function ensureWorkspaceInstall(projectDir) {
  const packageNodeModules = path.join(projectDir, 'node_modules')
  if (!(await directoryExists(packageNodeModules))) {
    const workspaceRoot = await findWorkspaceRoot(projectDir)
    console.log(`Installing workspace dependencies from ${workspaceRoot}`)
    execSync('pnpm install', {stdio: 'inherit', cwd: workspaceRoot})
    return true
  }

  const packageJson = await readPackageJson(projectDir)
  for (const dependencyName of installDependencyNames(packageJson)) {
    const dependencyDir = await resolveInstalledDependencyDir(
      projectDir,
      dependencyName,
    )

    if (dependencyDir) {
      continue
    }

    const workspaceRoot = await findWorkspaceRoot(projectDir)
    console.log(
      `Installing workspace dependencies from ${workspaceRoot} because ${dependencyName} is missing`,
    )
    execSync('pnpm install', {stdio: 'inherit', cwd: workspaceRoot})
    return true
  }

  return false
}

async function resolveWorkspaceDependencyDir(projectDir, packageName) {
  const dependencyDir = await resolveInstalledDependencyDir(
    projectDir,
    packageName,
  )

  if (dependencyDir) {
    return dependencyDir
  }

  console.warn(`Warning: could not resolve workspace dependency ${packageName}`)
  return null
}

async function collectWorkspaceBuildOrder(projectDir, visited, results) {
  const realProjectDir = await fs.promises.realpath(projectDir)
  if (visited.has(realProjectDir)) {
    return
  }

  visited.add(realProjectDir)

  const packageJson = await readPackageJson(realProjectDir)
  for (const dependencyName of workspaceDependencyNames(packageJson)) {
    const dependencyDir = await resolveWorkspaceDependencyDir(
      realProjectDir,
      dependencyName,
    )

    if (!dependencyDir) {
      continue
    }

    await collectWorkspaceBuildOrder(dependencyDir, visited, results)
  }

  results.push(realProjectDir)
}

export async function getWorkspaceBuildOrder(projectDir = '.') {
  const results = []
  await collectWorkspaceBuildOrder(projectDir, new Set(), results)
  return results
}

async function calculateWorkspaceAwareChecksum(projectDir) {
  const buildOrder = await getWorkspaceBuildOrder(projectDir)
  const checksums = []

  for (const dependencyDir of buildOrder) {
    const checksum = await calculateProjectChecksum(dependencyDir)
    const relativeDir = path.relative(projectDir, dependencyDir) || '.'
    checksums.push(`${relativeDir}:${checksum}`)
  }

  return crypto.createHash('sha1').update(checksums.join('\n')).digest('hex')
}

export async function compare(projectDir = '.') {
  const realProjectDir = await fs.promises.realpath(projectDir)
  const checksumPath = path.join(realProjectDir, CHECKSUM_FILE)
  const outputDir = path.join(realProjectDir, BUILD_OUTPUT_DIRECTORY)

  if (!(await directoryExists(outputDir))) {
    try {
      await fs.promises.unlink(checksumPath)
    } catch {
      // Ignore missing checksum file.
    }

    return 1
  }

  const newChecksum = await calculateWorkspaceAwareChecksum(realProjectDir)

  if (await fileExists(checksumPath)) {
    const oldChecksum = await fs.promises.readFile(checksumPath, 'utf8')
    if (oldChecksum.trim() === newChecksum) {
      return 0
    }
  }

  return 1
}

async function buildProject(projectDir) {
  const changed = await compare(projectDir)

  if (changed === 0) {
    console.log('No changes')
    return false
  }

  console.log('Changes detected')
  execSync('pnpm _build', {stdio: 'inherit', cwd: projectDir})

  const checksumPath = path.join(projectDir, CHECKSUM_FILE)
  const checksum = await calculateWorkspaceAwareChecksum(projectDir)
  await fs.promises.writeFile(checksumPath, checksum)
  return true
}

export async function build(projectDir = '.') {
  const realProjectDir = await fs.promises.realpath(projectDir)
  await ensureWorkspaceInstall(realProjectDir)

  const buildOrder = await getWorkspaceBuildOrder(realProjectDir)

  for (const dependencyDir of buildOrder) {
    await buildProject(dependencyDir)
  }
}

export function main(...args) {
  if (args.length > 1) {
    console.error('Usage: node shared/check.js [project-dir]')
    process.exit(1)
  }

  const projectDir = args[0] || '.'

  build(projectDir).catch(error => {
    console.error('Error:', error)
    process.exit(1)
  })
}

const entrypoint = process.argv[1]
if (entrypoint && path.resolve(entrypoint) === fileURLToPath(import.meta.url)) {
  main(...process.argv.slice(2))
}
