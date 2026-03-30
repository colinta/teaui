import type {Plugin} from '@docusaurus/types'
import {execSync} from 'child_process'
import path from 'path'

const DOCS_ROOT = path.resolve(__dirname, '..', '..')

export default function watchExamplesPlugin(): Plugin {
  return {
    name: 'watch-examples',

    getPathsToWatch() {
      return [path.join(DOCS_ROOT, 'examples', '**', '*.example.tsx')]
    },

    async loadContent() {
      try {
        execSync('pnpm screenshots', {
          cwd: DOCS_ROOT,
          stdio: 'inherit',
        })
      } catch (e) {
        console.error(
          '\n[watch-examples] Screenshot build failed:',
          (e as Error).message,
        )
      }
    },
  }
}
