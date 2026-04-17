import net from 'node:net'

import {DEFAULT_SOCKET_PATH} from './protocol.js'
import type {Level, LogMessage, Metadata} from './protocol.js'

const RECONNECT_INTERVAL = 2000

export interface ClientOptions {
  /** Name shown as the tab title in log-viewer. */
  name?: string
  /** Unix socket path. Defaults to `/tmp/teaui-log-viewer.sock`. */
  socketPath?: string
}

/**
 * Connects to the log-viewer app over a Unix domain socket.
 *
 * Automatically reconnects if the log-viewer isn't running yet or restarts.
 * Messages are silently dropped while disconnected.
 *
 * ```ts
 * import {Client} from '@teaui/log-viewer'
 *
 * const client = new Client({name: 'my-app'})
 * client.send({metadata: {level: 'info'}, message: 'hello'})
 * ```
 */
export class Client {
  #name: string
  #socketPath: string
  #socket: net.Socket | undefined
  #reconnectTimer: ReturnType<typeof setTimeout> | undefined

  constructor(options: ClientOptions = {}) {
    this.#name =
      options.name ??
      (typeof process !== 'undefined' ? inferName(process.argv[1]) : 'unknown')
    this.#socketPath = options.socketPath ?? DEFAULT_SOCKET_PATH

    this.#connect()

    if (typeof process !== 'undefined') {
      process.on('exit', () => this.close())
    }
  }

  /** Send a log message to the log-viewer. Silently dropped if disconnected. */
  send(log: Omit<LogMessage, 'type'>) {
    if (!this.#socket) return
    try {
      const message: LogMessage = {type: 'log', ...log}
      this.#socket.write(JSON.stringify(message) + '\n')
    } catch {}
  }

  /** Disconnect and stop reconnecting. */
  close() {
    if (this.#reconnectTimer) {
      clearTimeout(this.#reconnectTimer)
      this.#reconnectTimer = undefined
    }
    this.#socket?.end()
    this.#socket = undefined
  }

  get connected(): boolean {
    return this.#socket !== undefined
  }

  #connect() {
    const socket = net.createConnection(this.#socketPath, () => {
      this.#socket = socket
      socket.write(JSON.stringify({type: 'register', name: this.#name}) + '\n')
    })

    socket.on('error', () => {
      this.#socket = undefined
      this.#scheduleReconnect()
    })

    socket.on('close', () => {
      this.#socket = undefined
      this.#scheduleReconnect()
    })
  }

  #scheduleReconnect() {
    if (this.#reconnectTimer) return
    this.#reconnectTimer = setTimeout(() => {
      this.#reconnectTimer = undefined
      this.#connect()
    }, RECONNECT_INTERVAL)
    this.#reconnectTimer.unref()
  }
}

function inferName(argv1: string | undefined): string {
  if (!argv1) return 'unknown'
  const base = argv1.split('/').pop() ?? 'unknown'
  return base.replace(/\.[jt]s$/, '')
}
