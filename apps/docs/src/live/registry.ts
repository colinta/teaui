import type {ComponentType} from 'react'

/** The default export of an `examples/*.example.tsx` file. */
export interface ExampleSpec {
  width: number
  height: number
  title?: string
  App: ComponentType
}

interface WebpackContext {
  keys(): string[]
  (key: string): Promise<{default: unknown}>
}

declare global {
  interface NodeRequire {
    context(
      directory: string,
      recursive: boolean,
      pattern: RegExp,
      mode: 'lazy',
    ): WebpackContext
  }
}

/** Examples that depend on Node-only packages (sharp, cli-highlight). */
const NODE_ONLY_EXAMPLES = ['code', 'image']

// Bundle every browser-safe example as a lazy chunk. Keep this regex in sync
// with NODE_ONLY_EXAMPLES; webpack needs a literal here.
const context = require.context(
  '../../examples',
  false,
  /^\.\/(?!(?:code|image)\.)[\w-]+\.example\.tsx$/,
  'lazy',
)

const loaders = new Map<string, () => Promise<ExampleSpec>>(
  context.keys().map(key => {
    const name = key.replace(/^\.\//, '').replace(/\.example\.tsx$/, '')
    const load = async () => {
      const module = await context(key)
      return module.default as ExampleSpec
    }
    return [name, load] as const
  }),
)

/** Names of the examples that can run live in the browser, sorted. */
// (Array.from, not spread: the docs' loose Babel transform breaks iterator
// spread.)
export const liveExampleNames: readonly string[] = Array.from(loaders.keys())
  .filter(name => !NODE_ONLY_EXAMPLES.includes(name))
  .sort()

export function canRunLive(name: string): boolean {
  return loaders.has(name) && !NODE_ONLY_EXAMPLES.includes(name)
}

export function loadLiveExample(name: string): Promise<ExampleSpec> {
  const load = loaders.get(name)
  if (!load || NODE_ONLY_EXAMPLES.includes(name)) {
    return Promise.reject(new Error(`No live example named "${name}"`))
  }
  return load()
}
