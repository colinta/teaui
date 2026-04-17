/**
 * Protocol for log-viewer ↔ demo app communication over Unix domain sockets.
 *
 * The log-viewer is the server; demo apps are clients.
 * Messages are newline-delimited JSON.
 */

export const LOG_VIEWER_SOCKET = '/tmp/teaui-log-viewer.sock'

export type Message = RegisterMessage | LogMessage

export interface RegisterMessage {
  type: 'register'
  name: string
}

export interface LogMessage {
  type: 'log'
  level: string
  args: any[]
}
