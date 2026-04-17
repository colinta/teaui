/**
 * Protocol for log-viewer ↔ client communication over Unix domain sockets.
 *
 * The log-viewer app is the server; clients connect and send messages.
 * Messages are newline-delimited JSON.
 */

export const DEFAULT_SOCKET_PATH = '/tmp/teaui-log-viewer.sock'

export type Level = 'debug' | 'error' | 'info' | 'log' | 'warn'

export interface Metadata {
  level: Level
  source?: string
}

export type Message = RegisterMessage | LogMessage

export interface RegisterMessage {
  type: 'register'
  name: string
}

export interface LogMessage {
  type: 'log'
  metadata: Metadata
  message: string
}
