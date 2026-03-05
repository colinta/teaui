import {defineConfig, mergeConfig} from 'vitest/config'
import shared from '../../shared/vitest.config.js'

export default mergeConfig(
  shared,
  defineConfig({
    resolve: {
      alias: {
        '@teaui/core': new URL('../core/lib/index.ts', import.meta.url)
          .pathname,
      },
    },
  }),
)
