import {randomBytes, timingSafeEqual} from 'node:crypto'
import {createServer, type IncomingMessage, type Server} from 'node:http'
import type {AddressInfo} from 'node:net'
import type {WebSocket, WebSocketServer} from 'ws'
import {type SystemEvent} from '@teaui/core'
import {ok, err, type Result} from '@teaui/result'
import {decodeMessage, errorReply} from './protocol.js'
import {
  remoteError,
  type RemoteControlError,
  type RequestError,
} from './errors.js'
import type {
  RemoteControlOptions,
  RemoteControlAddress,
  RemoteControlReply,
  SnapshotFormat,
} from './types.js'

interface Callbacks {
  dispatch(event: SystemEvent): Result<void, RequestError>
  snapshot(format: SnapshotFormat): Result<string, RequestError>
  failed(error: RemoteControlError): void
  sendFailed(error: RemoteControlError): void
}

const HOST = '127.0.0.1'
const MAX_PAYLOAD = 64 * 1024
// Styled full-screen snapshots can be much larger than individual input events.
const MAX_BUFFERED_REPLY_BYTES = 8 * 1024 * 1024
const OPEN = 1

/** One listening run. Never reused; callbacks cannot access another run's resources. */
export class Session {
  #options: RemoteControlOptions
  #callbacks: Callbacks
  #http?: Server
  #server?: WebSocketServer
  #abort = new AbortController()
  #stopped = false
  #setup?: Promise<void>
  #cleanup?: Promise<Result<void, RemoteControlError>>
  #address?: RemoteControlAddress
  #resolve?: (result: Result<RemoteControlAddress, RemoteControlError>) => void
  readonly ready = new Promise<
    Result<RemoteControlAddress, RemoteControlError>
  >(resolve => {
    this.#resolve = resolve
  })

  constructor(options: RemoteControlOptions, callbacks: Callbacks) {
    this.#options = options
    this.#callbacks = callbacks
  }

  get address(): RemoteControlAddress | undefined {
    return this.#address
  }

  start(afterCleanup: Promise<void>): void {
    this.#setup = afterCleanup
      .then(() => this.#bind())
      .catch(cause => this.#fail(remoteError({type: 'startup-failed', cause})))
  }

  #settle(result: Result<RemoteControlAddress, RemoteControlError>) {
    this.#resolve?.(result)
    this.#resolve = undefined
  }

  async #bind() {
    if (this.#stopped) return
    const {port = 0} = this.#options
    if (!Number.isInteger(port) || port < 0 || port > 65535) {
      this.#fail(remoteError({type: 'invalid-port', port}))
      return
    }
    const {WebSocketServer} = await import('ws')
    if (this.#stopped) return
    const token = randomBytes(32).toString('hex')
    const secret = Buffer.from(token)
    const http = createServer((_req, response) => {
      response.writeHead(426)
      response.end('WebSocket upgrade required')
    })
    this.#http = http
    // Keep an HTTP error handler even after ws removes its forwarding handlers.
    http.on('error', cause => this.#transportFailed(cause))
    const server = new WebSocketServer({
      server: http,
      maxPayload: MAX_PAYLOAD,
      perMessageDeflate: false,
      verifyClient: ({req}: {req: IncomingMessage}) => {
        if (this.#stopped || req.headers.origin !== undefined) return false
        try {
          const url = new URL(req.url ?? '/', `http://${HOST}`)
          const candidate = Buffer.from(url.searchParams.get('token') ?? '')
          return (
            url.pathname === '/' &&
            candidate.length === secret.length &&
            timingSafeEqual(candidate, secret)
          )
        } catch {
          return false
        }
      },
    })
    this.#server = server
    server.on('error', cause => this.#transportFailed(cause))
    server.on('connection', socket => this.#connect(socket))
    server.once('listening', () => {
      if (this.#stopped) return
      const boundPort = (http.address() as AddressInfo).port
      this.#address = Object.freeze({
        port: boundPort,
        url: `ws://${HOST}:${boundPort}/?token=${token}`,
      })
      this.#settle(ok(this.#address))
    })
    http.listen({host: HOST, port, signal: this.#abort.signal})
  }

  #transportFailed(cause: unknown) {
    this.#fail(
      remoteError({
        type: this.#address ? 'server-failed' : 'startup-failed',
        cause,
      }),
    )
  }

  #fail(error: RemoteControlError) {
    if (this.#stopped) return
    this.#settle(err(error))
    this.#callbacks.failed(error)
  }

  #connect(socket: WebSocket) {
    if (this.#stopped) {
      socket.terminate()
      return
    }
    let sequence = 0
    // Invalid frames and oversized messages affect this client only.
    socket.on('error', () => socket.terminate())
    socket.on('message', (data, isBinary) => {
      if (this.#stopped) return
      sequence += 1
      const decoded = decodeMessage(isBinary ? '' : data.toString(), isBinary)
      let result: Result<RemoteControlReply, RequestError>
      if (!decoded.ok) {
        result = decoded
      } else if (decoded.value.type === 'snapshot') {
        const {format} = decoded.value
        const captured = this.#callbacks.snapshot(format)
        result = captured.ok
          ? ok({
              type: 'snapshot',
              sequence,
              format,
              snapshot: captured.value,
            })
          : captured
      } else {
        const delivered = this.#callbacks.dispatch(decoded.value)
        result = delivered.ok ? ok({type: 'ack', sequence}) : delivered
      }
      const reply = result.ok
        ? result.value
        : errorReply(sequence, result.error)
      // Transmission is not part of dispatch. Never relabel a send failure.
      this.#send([socket], reply)
    })
  }

  /** Unsolicited messages deliberately have no request sequence. */
  sendSnapshot(format: SnapshotFormat, snapshot: string): void {
    if (this.#stopped || !this.#address || !this.#server) return
    this.#send(this.#server.clients, {type: 'snapshot', format, snapshot})
  }

  #send(sockets: Iterable<WebSocket>, reply: RemoteControlReply) {
    if (this.#stopped) return
    const recipients = [...sockets].filter(socket => socket.readyState === OPEN)
    if (!recipients.length) return

    // One encoding for this send, shared by all recipients; never retained.
    let text: string
    let bytes: number
    try {
      text = JSON.stringify(reply)
      bytes = Buffer.byteLength(text)
    } catch (error) {
      for (const socket of recipients) this.#sendFailed(socket, error)
      return
    }

    for (const socket of recipients) {
      if (this.#stopped || socket.readyState !== OPEN) continue
      try {
        if (socket.bufferedAmount + bytes > MAX_BUFFERED_REPLY_BYTES) {
          socket.terminate()
          continue
        }
        socket.send(text, error => {
          if (error) this.#sendFailed(socket, error)
        })
      } catch (error) {
        this.#sendFailed(socket, error)
      }
    }
  }

  #sendFailed(socket: WebSocket, error: unknown) {
    if (this.#stopped) return
    socket.terminate()
    this.#callbacks.sendFailed(remoteError({type: 'send-failed', cause: error}))
  }

  /** Stop now; attempt all cleanup tasks and return any failures as a Result. */
  close(): Promise<Result<void, RemoteControlError>> {
    if (this.#cleanup) return this.#cleanup
    this.#stopped = true
    this.#address = undefined
    const canceled = remoteError({type: 'startup-canceled'})
    this.#settle(err(canceled))
    const tasks: Promise<void>[] = this.#setup ? [this.#setup] : []
    const attempt = (fn: () => void) => {
      try {
        fn()
      } catch (error) {
        tasks.push(Promise.reject(error))
      }
    }
    if (this.#http) {
      const http = this.#http
      tasks.push(
        new Promise<void>((resolve, reject) =>
          http.close(error => {
            if (
              error &&
              (error as NodeJS.ErrnoException).code !== 'ERR_SERVER_NOT_RUNNING'
            )
              reject(error)
            else resolve()
          }),
        ),
      )
      attempt(() => http.closeAllConnections())
    }
    attempt(() => this.#abort.abort(canceled))
    if (this.#server) {
      const server = this.#server
      for (const socket of server.clients) attempt(() => socket.terminate())
      tasks.push(
        new Promise<void>((resolve, reject) =>
          server.close(error => {
            if (error) reject(error)
            else resolve()
          }),
        ),
      )
    }
    // Waiting for setup (not readiness) also covers cancellation during import.
    this.#cleanup = Promise.allSettled(tasks).then(results => {
      const failures = results
        .filter(result => result.status === 'rejected')
        .map(result => result.reason)
      return failures.length
        ? err(remoteError({type: 'cleanup-failed', causes: failures}))
        : ok(undefined)
    })
    return this.#cleanup
  }
}
