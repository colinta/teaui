#!/usr/bin/env node

import {existsSync} from 'fs'
import {readFile, readdir, writeFile} from 'fs/promises'
import {join} from 'path'

const MAIN_PACKAGE = 'packages/core/package.json'
const VERSIONED_PACKAGES = [
  'shared/package.json',
  ...(await findPackageJsonFiles('packages')),
]

async function findPackageJsonFiles(directory) {
  const entries = await readdir(directory, {withFileTypes: true})
  const packagePaths = entries
    .filter(entry => entry.isDirectory())
    .map(entry => join(directory, entry.name, 'package.json'))
    .filter(packagePath => existsSync(packagePath))

  return await Promise.all(
    packagePaths.filter(async packagePath => {
      const packageJson = await readPackageJson(packagePath)
      return packageJson.name.startsWith('@teaui/')
    }),
  )
}

async function readPackageJson(filePath) {
  const content = await readFile(filePath, 'utf-8')
  return JSON.parse(content)
}

async function writePackageJson(filePath, content) {
  await writeFile(filePath, JSON.stringify(content, null, 2) + '\n')
}

function bumpVersion(version, type) {
  const [major, minor, patch] = version.split('.').map(Number)

  switch (type) {
    case 'major':
      return `${major + 1}.0.0`
    case 'minor':
      return `${major}.${minor + 1}.${patch}`
    case 'patch':
    case 'bug':
      return `${major}.${minor}.${patch + 1}`
    default:
      throw new Error('Invalid bump type. Use "major", "minor", or "patch"')
  }
}

async function updatePackageVersions(newVersion, isDryRun) {
  const packages = await Promise.all(
    VERSIONED_PACKAGES.map(async packagePath => ({
      packagePath,
      packageJson: await readPackageJson(packagePath),
    })),
  )

  for (const {packagePath, packageJson} of packages) {
    packageJson.version = newVersion
    if (isDryRun) {
      console.info(`[Dry-run] ${packagePath} to version ${newVersion}`)
    } else {
      await writePackageJson(packagePath, packageJson)
      console.info(`Updated ${packagePath} to version ${newVersion}`)
    }
  }
}

async function main() {
  const bumpType = process.argv[2]
  const isDryRun = process.argv.includes('--dry-run')

  if (!['major', 'minor', 'bug', 'patch'].includes(bumpType)) {
    console.error('Please specify bump type: "major" "minor" or "patch"')
    process.exit(1)
  }

  try {
    // Read and update main package version
    const mainPkg = await readPackageJson(MAIN_PACKAGE)
    const currentVersion = mainPkg.version
    const newVersion = bumpVersion(currentVersion, bumpType)

    console.info(`Bumped version from ${currentVersion} to ${newVersion}`)

    // Update all versioned workspace packages
    await updatePackageVersions(newVersion, isDryRun)

    console.info('Version bump completed successfully!')
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

main()
