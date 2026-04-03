import type {Plugin} from '@docusaurus/types'
import {execSync} from 'child_process'
import path from 'path'

const MONOREPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..')
const BUILD_CMD =
  'pnpm --filter @teaui/term --filter @teaui/core --filter @teaui/react build'
const TEAUI_MODULE_RE = /Can't resolve '@teaui\//

export default function autoRebuildPlugin(): Plugin {
  let isRebuilding = false

  return {
    name: 'auto-rebuild-teaui',

    configureWebpack() {
      return {
        plugins: [
          {
            apply(compiler: any) {
              compiler.hooks.afterCompile.tap(
                'AutoRebuildTeaUI',
                (compilation: any) => {
                  if (isRebuilding) return

                  const hasTeauiError = compilation.errors.some(
                    (err: any) =>
                      err.message && TEAUI_MODULE_RE.test(err.message),
                  )

                  if (!hasTeauiError) return

                  isRebuilding = true
                  console.info(
                    '\n[auto-rebuild] @teaui/* module resolution failed — rebuilding packages...\n',
                  )

                  try {
                    execSync(BUILD_CMD, {
                      cwd: MONOREPO_ROOT,
                      stdio: 'inherit',
                    })
                    console.info(
                      '\n[auto-rebuild] Rebuild complete. Webpack will recompile.\n',
                    )
                  } catch (e) {
                    console.error(
                      '\n[auto-rebuild] Rebuild failed:',
                      (e as Error).message,
                    )
                  } finally {
                    isRebuilding = false
                  }
                },
              )
            },
          },
        ],
      }
    },
  }
}
