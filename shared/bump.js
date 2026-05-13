#!/usr/bin/env node

import {readFile, writeFile} from 'fs/promises'

const MAIN_PACKAGE = 'packages/core/package.json'
const VERSIONED_PACKAGES = [
  'shared/package.json',
  'packages/cli/package.json',
  'packages/code/package.json',
  'packages/core/package.json',
  'packages/image/package.json',
  'packages/inspect/package.json',
  'packages/log-viewer/package.json',
  'packages/react/package.json',
  'packages/subprocess/package.json',
  'packages/term/package.json',
]

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

async function updatePackageVersions(newVersion) {
  for (const packagePath of VERSIONED_PACKAGES) {
    const pkg = await readPackageJson(packagePath)
    pkg.version = newVersion
    await writePackageJson(packagePath, pkg)
    console.info(`Updated ${packagePath} to version ${newVersion}`)
  }
}

async function main() {
  const bumpType = process.argv[2]

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
    await updatePackageVersions(newVersion)

    console.info('Version bump completed successfully!')
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

main()
