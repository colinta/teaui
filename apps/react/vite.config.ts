import {resolve} from 'node:path'
import react from '@vitejs/plugin-react'
import {defineConfig} from 'vite'

const workspaceRoot = resolve(import.meta.dirname, '../..')

export default defineConfig({
  appType: 'custom',
  plugins: [react()],
  resolve: {
    alias: {
      '@teaui/react': resolve(workspaceRoot, 'packages/react/lib/index.ts'),
      '@teaui/core': resolve(workspaceRoot, 'packages/core/lib/index.ts'),
      '@teaui/term': resolve(workspaceRoot, 'packages/term/src/index.ts'),
    },
  },
  server: {
    watch: {
      ignored: ['**/.dist/**', '**/node_modules/**', '**/.git/**'],
    },
    fs: {
      allow: [workspaceRoot],
    },
  },
  ssr: {
    noExternal: ['@teaui/core', '@teaui/react', '@teaui/term'],
  },
})
