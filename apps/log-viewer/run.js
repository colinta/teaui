import {execSync} from 'child_process'
import {resolve, dirname} from 'path'
import {fileURLToPath} from 'url'
import {getWorkspaceBuildOrder} from '../../shared/check.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const buildOrder = await getWorkspaceBuildOrder(__dirname)
for (const projectDir of buildOrder) {
  execSync('pnpm build', {stdio: 'inherit', cwd: projectDir})
}

execSync('node --enable-source-maps .dist/main.js', {
  stdio: 'inherit',
  cwd: __dirname,
})
