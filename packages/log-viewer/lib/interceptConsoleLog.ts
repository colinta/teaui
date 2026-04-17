import {Client} from './client.js'
import type {Level} from './protocol.js'

const LEVELS: Level[] = ['debug', 'error', 'info', 'log', 'warn']

const originals: Record<string, (...args: any[]) => void> = {}

export interface InterceptOptions {
  /** Source label attached to every message's metadata (e.g. `'database'`). */
  source?: string
  /**
   * When `true`, suppresses the original `console.*` output so logs are only
   * sent to the log-viewer socket. When `false`, the original console methods
   * are still called (useful for debugging without the log-viewer running).
   *
   * @default true
   */
  silence?: boolean
}

/**
 * Intercept all `console.*` methods and forward them to a log-viewer {@link Client}.
 *
 * By default, the original console output is silenced — pass `{silence: false}`
 * to preserve it.
 *
 * ```ts
 * import {Client, interceptConsoleLog} from '@teaui/log-viewer'
 *
 * const client = new Client({name: 'my-app'})
 * interceptConsoleLog(client)
 *
 * // keep terminal output while also forwarding to log-viewer
 * interceptConsoleLog(client, {silence: false})
 * ```
 */
export function interceptConsoleLog(
  client: Client,
  options: InterceptOptions = {},
) {
  const {source, silence = true} = options

  for (const level of LEVELS) {
    if (!originals[level]) {
      originals[level] = console[level]
    }
    const original = originals[level]

    console[level] = function (...args: any[]) {
      if (!silence) {
        original.apply(console, args)
      }

      const message = args
        .map(arg => (typeof arg === 'string' ? arg : JSON.stringify(arg)))
        .join(' ')
      client.send({metadata: {level, source}, message})
    }
  }
}
