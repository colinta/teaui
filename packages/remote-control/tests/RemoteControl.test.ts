import {execFile} from 'node:child_process'
import {once} from 'node:events'
import {Server} from 'node:http'
import {fileURLToPath} from 'node:url'
import {promisify} from 'node:util'
import {WebSocket} from 'ws'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {
  Screen,
  TestProgram,
  Text,
  Input,
  Button,
  Stack,
  type SystemEvent,
  type KeyEvent,
  type SystemMouseEvent,
} from '@teaui/core'
import {
  RemoteControlServer,
  type RemoteControlOptions,
  type RemoteControlReply,
} from '../lib/index.js'

const exec = promisify(execFile)
const screens: Screen[] = []
const servers: RemoteControlServer[] = []
const sockets: WebSocket[] = []
const modifiers = {ctrl: false, alt: false, gui: false, shift: false}

function key(name: string): KeyEvent {
  return {
    type: 'key',
    name,
    char: name.length === 1 ? name : '',
    full: name,
    ...modifiers,
  }
}
function mouse(name: SystemMouseEvent['name'], x = 3, y = 1): SystemMouseEvent {
  return {type: 'mouse', name, x, y, button: 'left', ...modifiers}
}
function setup() {
  const input = new Input({value: '', height: 1})
  let clicks = 0
  const text = new Text({text: 'Clicks: 0'})
  const button = new Button({
    title: 'Click',
    height: 1,
    onClick: () => {
      text.text = `Clicks: ${++clicks}`
    },
  })
  const program = new TestProgram({cols: 30, rows: 4})
  const screen = new Screen(program, Stack.down([input, button, text]))
  screens.push(screen)
  screen.start()
  return {screen, program, input}
}
function create(options?: RemoteControlOptions) {
  const remote = new RemoteControlServer(options)
  servers.push(remote)
  return remote
}
async function ready(remote: RemoteControlServer) {
  const result = await remote.listen()
  if (!result.ok) {
    throw result.error
  } // Test helper only; production API returns Result.
  return result.value
}
async function listen(options?: RemoteControlOptions) {
  const remote = create(options)
  return {remote, ...(await ready(remote))}
}
async function connect(url: string, options?: {origin: string}) {
  const socket = new WebSocket(url, options)
  sockets.push(socket)
  await once(socket, 'open')
  return socket
}
async function send(
  socket: WebSocket,
  event: unknown,
  binary = false,
): Promise<RemoteControlReply> {
  const response = once(socket, 'message')
  socket.send(typeof event === 'string' ? event : JSON.stringify(event), {
    binary,
  })
  const [data] = await response
  return JSON.parse(data.toString())
}

afterEach(async () => {
  for (const socket of sockets.splice(0)) {
    socket.terminate()
  }
  for (const screen of screens.splice(0)) {
    screen.stop()
  }
  for (const remote of servers.splice(0)) {
    await remote.close()
  }
  vi.restoreAllMocks()
})

describe('remote lifecycle', () => {
  it('constructs an idle source and preserves screen delivery across restart', async () => {
    const {screen} = setup()
    const binding = vi.fn()
    screen.key('x', binding)
    const remote = create()
    const notification = vi.fn()
    remote.onListening(notification)
    screen.addEventSource(remote)
    expect(remote.closed).toBe(true)
    expect(remote.url).toBeUndefined()
    const first = await ready(remote)
    expect(remote.closed).toBe(false)
    expect(remote.url).toBe(first.url)
    const socket = await connect(first.url)
    await send(socket, key('x'))
    const disconnected = once(socket, 'close')
    await remote.close()
    await disconnected
    expect(remote.closed).toBe(true)
    expect(remote.url).toBeUndefined()
    expect(remote.port).toBeUndefined()
    const second = await ready(remote)
    expect(new URL(second.url).searchParams.get('token')).not.toBe(
      new URL(first.url).searchParams.get('token'),
    )
    await send(await connect(second.url), key('x'))
    expect(binding).toHaveBeenCalledTimes(2)
    expect(notification.mock.calls).toEqual([[first], [second]])
  })

  it('joins concurrent startup and reports the current address while listening', async () => {
    const remote = create()
    const notification = vi.fn()
    remote.onListening(notification)
    const [first, second] = await Promise.all([ready(remote), ready(remote)])
    expect(first).toEqual(second)
    expect(await ready(remote)).toEqual(first)
    expect(notification).toHaveBeenCalledOnce()
    await connect(first.url)
  })

  it('allows close before first listen and registration while stopped', async () => {
    const remote = create()
    expect(await remote.close()).toEqual({ok: true, value: undefined})
    const received = vi.fn()
    remote.onEvents(received)
    const address = await ready(remote)
    await send(await connect(address.url), key('x'))
    expect(received).toHaveBeenCalledOnce()
  })

  it.each([0, 1, 2])(
    'cancels queued setup and can restart immediately (%s microtasks)',
    async turns => {
      const remote = create()
      const error = vi.fn()
      const notification = vi.fn()
      remote.onError(error)
      remote.onListening(notification)
      const first = remote.listen()
      for (let i = 0; i < turns; i++) {
        await Promise.resolve()
      }
      const cleanup = remote.close()
      const next = remote.listen()
      await expect(first).resolves.toMatchObject({
        ok: false,
        error: {type: 'startup-canceled'},
      })
      await cleanup
      const result = await next
      expect(result.ok).toBe(true)
      if (!result.ok) {
        throw result.error
      }
      await connect(result.value.url)
      expect(notification).toHaveBeenCalledOnce()
      expect(error).not.toHaveBeenCalled()
    },
  )

  it('aborts a bind and ignores old server events after restarting on the same port', async () => {
    const occupied = await listen()
    await occupied.remote.close()
    const remote = create({port: occupied.port})
    const original = Server.prototype.listen
    const bind = vi
      .spyOn(Server.prototype, 'listen')
      .mockImplementationOnce(function (
        this: Server,
        ...args: Parameters<typeof original>
      ) {
        const result = original.apply(this, args)
        void remote.close()
        return result
      })
    const error = vi.fn()
    const notification = vi.fn()
    remote.onError(error)
    remote.onListening(notification)
    await expect(remote.listen()).resolves.toMatchObject({
      ok: false,
      error: {type: 'startup-canceled'},
    })
    const address = await ready(remote)
    expect(address.port).toBe(occupied.port)
    const oldHttp = bind.mock.contexts[0] as Server
    oldHttp.emit('error', new Error('late bind failure'))
    oldHttp.emit('listening')
    const socket = await connect(address.url)
    expect(await send(socket, key('x'))).toEqual({type: 'ack', sequence: 1})
    expect(bind).toHaveBeenCalledTimes(2)
    expect(notification).toHaveBeenCalledOnce()
    expect(error).not.toHaveBeenCalled()
  })

  it('waits for cleanup, and close also cancels a queued restart', async () => {
    const bind = vi.spyOn(Server.prototype, 'listen')
    const {remote} = await listen()
    const http = bind.mock.contexts[0] as Server
    const originalClose = http.close.bind(http)
    let release: (() => void) | undefined
    vi.spyOn(http, 'close').mockImplementationOnce(callback =>
      originalClose(error => {
        release = () => callback?.(error)
      }),
    )
    const stopping = remote.close()
    const canceled = remote.listen()
    await vi.waitFor(() => expect(release).toBeDefined())
    expect(bind).toHaveBeenCalledOnce()
    const canceledCleanup = remote.close()
    const next = remote.listen()
    await expect(canceled).resolves.toMatchObject({
      ok: false,
      error: {type: 'startup-canceled'},
    })
    expect(bind).toHaveBeenCalledOnce()
    release!()
    await Promise.all([stopping, canceledCleanup])
    const result = await next
    expect(result.ok).toBe(true)
    if (!result.ok) {
      throw result.error
    }
    await connect(result.value.url)
    expect(bind).toHaveBeenCalledTimes(2)
  })

  it('retries a bind failure on the same object without losing registrations', async () => {
    const occupied = await listen()
    const remote = create({port: occupied.port})
    const errors = vi.fn()
    const received = vi.fn()
    const notification = vi.fn()
    remote.onError(errors)
    remote.onEvents(received)
    remote.onListening(notification)
    const result = await remote.listen()
    expect(result).toMatchObject({
      ok: false,
      error: {type: 'startup-failed', cause: {code: 'EADDRINUSE'}},
    })
    if (result.ok) {
      throw new Error('Expected port collision')
    }
    expect(errors).toHaveBeenCalledExactlyOnceWith(result.error)
    expect(remote.closed).toBe(true)
    const lateError = vi.fn()
    remote.onError(lateError)
    await Promise.resolve()
    expect(lateError).not.toHaveBeenCalled() // No historical failure replay.
    await occupied.remote.close()
    const address = await ready(remote)
    await send(await connect(address.url), key('x'))
    expect(received).toHaveBeenCalledOnce()
    expect(notification).toHaveBeenCalledOnce()
    expect(errors).toHaveBeenCalledOnce()
  })

  it('stops on a runtime server failure, then can listen again', async () => {
    const bind = vi.spyOn(Server.prototype, 'listen')
    const {remote} = await listen()
    const http = bind.mock.contexts[0] as Server
    const error = vi.fn()
    remote.onError(error)
    const failure = new Error('listener failed')
    http.emit('error', failure)
    expect(error).toHaveBeenCalledExactlyOnceWith({
      type: 'server-failed',
      cause: failure,
      message: failure.message,
    })
    expect(remote.closed).toBe(true)
    expect(remote.url).toBeUndefined()
    const address = await ready(remote)
    await connect(address.url)
    expect(remote.closed).toBe(false)
  })

  it.each(['throw', 'callback'])(
    'reports cleanup errors after attempting other tasks (%s)',
    async kind => {
      const bind = vi.spyOn(Server.prototype, 'listen')
      const {remote, url, port} = await listen()
      const http = bind.mock.contexts[0] as Server
      const socket = await connect(url)
      const disconnected = once(socket, 'close')
      const failure = new Error('connection cleanup failed')
      if (kind === 'throw') {
        vi.spyOn(http, 'closeAllConnections').mockImplementationOnce(() => {
          throw failure
        })
      } else {
        const originalClose = http.close.bind(http)
        vi.spyOn(http, 'close').mockImplementationOnce(callback =>
          originalClose(() => callback?.(failure)),
        )
      }
      const errors = vi.fn()
      remote.onError(errors)
      const cleanup = remote.close()
      const result = await cleanup
      expect(result).toMatchObject({
        ok: false,
        error: {type: 'cleanup-failed', causes: [failure]},
      })
      if (result.ok) {
        throw new Error('Expected cleanup failure')
      }
      await disconnected
      expect(errors).toHaveBeenCalledExactlyOnceWith(result.error)
      expect(remote.closed).toBe(true)
      // A new operation is not poisoned by the previous cleanup result.
      await connect((await ready(remote)).url)
      await remote.close()
      const replacement = await listen({port})
      await connect(replacement.url)
    },
  )

  it('returns every cleanup cause without rejecting, and reports the same error once', async () => {
    const bind = vi.spyOn(Server.prototype, 'listen')
    const {remote} = await listen()
    const http = bind.mock.contexts[0] as Server
    const originalClose = http.close.bind(http)
    const httpFailure = new Error('HTTP cleanup failed')
    const connectionFailure = Object.create(null)
    vi.spyOn(http, 'close').mockImplementationOnce(callback =>
      originalClose(() => callback?.(httpFailure)),
    )
    vi.spyOn(http, 'closeAllConnections').mockImplementationOnce(() => {
      throw connectionFailure
    })
    const reported = vi.fn()
    remote.onError(reported)
    const result = await remote.close()
    expect(result).toEqual({
      ok: false,
      error: {
        type: 'cleanup-failed',
        causes: [httpFailure, connectionFailure],
        message: 'Remote control cleanup failed',
      },
    })
    if (result.ok) {
      throw new Error('Expected cleanup failure')
    }
    expect(reported).toHaveBeenCalledExactlyOnceWith(result.error)
    expect(await remote.close()).toBe(result)
    expect(reported).toHaveBeenCalledOnce()
    await connect((await ready(remote)).url)
    expect(await remote.close()).toEqual({ok: true, value: undefined})
  })

  it.each([new Error('setup failed'), 'setup failed'])(
    'cleans partial setup and permits retry after a thrown failure (%s)',
    async failure => {
      vi.spyOn(Server.prototype, 'listen').mockImplementationOnce(() => {
        throw failure
      })
      const remote = create()
      const errors = vi.fn()
      remote.onError(errors)
      const result = await remote.listen()
      expect(result).toMatchObject({
        ok: false,
        error: {
          type: 'startup-failed',
          message: 'setup failed',
          cause: failure,
        },
      })
      if (result.ok) {
        throw new Error('Expected setup to fail')
      }
      expect(result.error).not.toBeInstanceOf(Error)
      if (result.error.type === 'startup-failed') {
        expect(result.error.cause).toBe(failure)
      }
      expect(errors).toHaveBeenCalledExactlyOnceWith(result.error)
      expect(remote.closed).toBe(true)
      await connect((await ready(remote)).url)
    },
  )

  it.each([-1, 65536, 1.5, NaN, Infinity])(
    'returns a failure Result for invalid port %s',
    async port => {
      const remote = create({port})
      const result = await remote.listen()
      expect(result).toEqual({
        ok: false,
        error: {
          type: 'invalid-port',
          port,
          message: 'Remote control port must be an integer from 0 to 65535',
        },
      })
      expect(remote.closed).toBe(true)
      // A non-awaited retry also reports failure without an unhandled rejection.
      const error = vi.fn()
      remote.onError(error)
      remote.listen()
      await vi.waitFor(() => expect(error).toHaveBeenCalledOnce())
    },
  )
})

describe('remote callbacks', () => {
  it('gives each registration its own detach function and snapshots delivery', async () => {
    const {remote, url} = await listen()
    const received = vi.fn()
    const stale = remote.onEvents(received)
    stale()
    const detach = remote.onEvents(received)
    stale()
    const second = remote.onEvents(received)
    const socket = await connect(url)
    await send(socket, key('x'))
    expect(received).toHaveBeenCalledTimes(2)
    detach()
    detach()
    await send(socket, key('y'))
    expect(received).toHaveBeenCalledTimes(3)
    second()
    const added = vi.fn()
    const add = remote.onEvents(() => {
      remote.onEvents(added)
    })
    await send(socket, key('a'))
    expect(added).not.toHaveBeenCalled()
    add()
    await send(socket, key('b'))
    expect(added).toHaveBeenCalledOnce()
  })

  it('does not redeliver the same event when a handler registers itself again', async () => {
    const {remote, url} = await listen()
    let count = 0
    let detach: () => void
    const handler = () => {
      count++
      detach()
      detach = remote.onEvents(handler)
    }
    detach = remote.onEvents(handler)
    const removed = vi.fn()
    let removeLater: () => void
    remote.onEvents(() => removeLater())
    removeLater = remote.onEvents(removed)
    const socket = await connect(url)
    await send(socket, key('x'))
    expect(count).toBe(1)
    await send(socket, key('y'))
    expect(count).toBe(2)
    expect(removed).not.toHaveBeenCalled()
  })

  it('notifies once when subscribing between bind and readiness delivery', async () => {
    const remote = create()
    const notification = vi.fn()
    const original = Server.prototype.listen
    vi.spyOn(Server.prototype, 'listen').mockImplementationOnce(function (
      this: Server,
      ...args: Parameters<typeof original>
    ) {
      this.once('listening', () => {
        remote.onListening(notification)
      })
      return original.apply(this, args)
    })
    await ready(remote)
    await Promise.resolve()
    expect(notification).toHaveBeenCalledOnce()
    await remote.close()
    await ready(remote)
    expect(notification).toHaveBeenCalledTimes(2)
  })

  it('keeps readiness subscriptions until detached and cancels stale queued notifications', async () => {
    const {remote} = await listen()
    const received = vi.fn()
    const stale = remote.onListening(received)
    stale()
    const detach = remote.onListening(received)
    stale()
    await Promise.resolve()
    expect(received).toHaveBeenCalledOnce()
    const skipped = vi.fn()
    remote.onListening(skipped)
    await remote.close()
    expect(skipped).not.toHaveBeenCalled()
    await ready(remote)
    expect(received).toHaveBeenCalledTimes(2)
    expect(skipped).toHaveBeenCalledOnce()
    detach()
    await remote.close()
    await ready(remote)
    expect(received).toHaveBeenCalledTimes(2)
  })

  it('gives duplicate error registrations independent ownership', async () => {
    const remote = create({port: -1})
    const error = vi.fn()
    const stale = remote.onError(error)
    stale()
    const first = remote.onError(error)
    stale()
    remote.onError(error)
    await remote.listen()
    expect(error).toHaveBeenCalledTimes(2)
    first()
    first()
    await remote.listen()
    expect(error).toHaveBeenCalledTimes(3)
  })

  it.each([false, true])(
    'isolates readiness and error callback failures (async: %s)',
    async asynchronous => {
      const warning = vi
        .spyOn(process, 'emitWarning')
        .mockImplementation(() => {})
      const remote = create()
      const failure = new Error('readiness callback failed')
      const observerFailure = new Error('error callback failed')
      const throwOrReject = (error: Error) => {
        if (asynchronous) {
          return Promise.reject(error)
        }
        throw error
      }
      remote.onListening(() => throwOrReject(failure))
      const otherReady = vi.fn()
      remote.onListening(otherReady)
      remote.onError(() => throwOrReject(observerFailure))
      const otherError = vi.fn()
      remote.onError(otherError)
      const address = await ready(remote)
      await vi.waitFor(() => expect(warning).toHaveBeenCalledOnce())
      expect(warning.mock.calls[0][0]).toBe(
        'Remote control error callback failed: error callback failed',
      )
      expect(otherReady).toHaveBeenCalledOnce()
      expect(otherError).toHaveBeenCalledExactlyOnceWith({
        type: 'callback-failed',
        callback: 'listening',
        cause: failure,
        message: `Remote control listening callback failed: ${failure.message}`,
      })
      expect(remote.closed).toBe(false)
      await connect(address.url)
    },
  )

  it('isolates errors from late readiness callbacks too', async () => {
    const {remote} = await listen()
    const errors = vi.fn()
    remote.onError(errors)
    const failure = new Error('late callback failed')
    remote.onListening(() => {
      throw failure
    })
    await Promise.resolve()
    expect(errors).toHaveBeenCalledExactlyOnceWith({
      type: 'callback-failed',
      callback: 'listening',
      cause: failure,
      message: `Remote control listening callback failed: ${failure.message}`,
    })
    expect(remote.closed).toBe(false)
  })

  it('returns dispatch-failed but still calls other input handlers', async () => {
    const {remote, url} = await listen()
    const detach = remote.onEvents(() => {
      throw new Error('handler failed')
    })
    const other = vi.fn()
    remote.onEvents(other)
    const socket = await connect(url)
    expect(await send(socket, key('x'))).toEqual({
      type: 'error',
      sequence: 1,
      code: 'dispatch-failed',
      message: 'handler failed',
    })
    expect(other).toHaveBeenCalledOnce()
    detach()
    expect(await send(socket, key('y'))).toEqual({type: 'ack', sequence: 2})
  })

  it('observes asynchronous input failures without treating ACK as an async barrier', async () => {
    const {remote, url} = await listen()
    let reject: (error: Error) => void = () => {}
    remote.onEvents(
      () =>
        new Promise<void>((_resolve, fail) => {
          reject = fail
        }),
    )
    const error = vi.fn()
    remote.onError(error)
    const socket = await connect(url)
    expect(await send(socket, key('x'))).toEqual({type: 'ack', sequence: 1})
    const failure = new Error('async handler failed')
    reject(failure)
    await vi.waitFor(() =>
      expect(error).toHaveBeenCalledExactlyOnceWith({
        type: 'dispatch-failed',
        causes: [failure],
        message: failure.message,
      }),
    )
    expect(remote.closed).toBe(false)
  })

  it('stops old readiness delivery when a callback closes and restarts the source', async () => {
    const remote = create()
    let first = true
    remote.onListening(() => {
      if (!first) {
        return
      }
      first = false
      void remote.close()
      remote.listen()
    })
    const next = vi.fn()
    remote.onListening(next)
    await remote.listen()
    await vi.waitFor(() => expect(next).toHaveBeenCalledOnce())
    expect(next.mock.calls[0][0].url).toBe(remote.url)
    await connect(remote.url!)
  })
})

describe('remote protocol and screen integration', () => {
  it('delivers input from a separate process through Screen dispatch', async () => {
    const {screen, input, program} = setup()
    screen.requestFocus(input)
    screen.render()
    const binding = vi.fn()
    screen.key('x', binding)
    const {remote, url} = await listen()
    screen.addEventSource(remote)
    const events: SystemEvent[] = [
      key('x'),
      {type: 'paste', text: 'hello 🌍'},
      mouse('mouse.move.in'),
      mouse('mouse.button.down'),
      mouse('mouse.button.up'),
    ]
    const client = fileURLToPath(
      new URL('./fixtures/remote-client.mjs', import.meta.url),
    )
    const result = await exec(
      process.execPath,
      [client, url, JSON.stringify(events)],
      {timeout: 7000},
    )
    expect(
      result.stdout
        .trim()
        .split('\n')
        .map(line => JSON.parse(line)),
    ).toEqual(events.map((_, i) => ({type: 'ack', sequence: i + 1})))
    expect(input.value).toBe('xhello 🌍')
    expect(program.terminal.textContent()).toContain('Clicks: 1')
    expect(binding).toHaveBeenCalledOnce()
  })

  it('forwards all SystemEvent families unchanged and in order', async () => {
    const {screen} = setup()
    const dispatch = vi.spyOn(screen, 'dispatch')
    const {remote, url} = await listen()
    screen.addEventSource(remote)
    const socket = await connect(url)
    const events: SystemEvent[] = [
      key('tab'),
      mouse('mouse.move.in', 10, 3),
      mouse('mouse.button.down', 10, 3),
      mouse('mouse.move.in', 20, 3),
      mouse('mouse.button.up', 20, 3),
      {...mouse('mouse.wheel.down'), button: 'wheel'},
      {type: 'paste', text: 'two\nlines'},
      {type: 'focus'},
      {type: 'blur'},
      {type: 'resize'},
    ]
    for (const [index, event] of events.entries()) {
      expect(await send(socket, event)).toEqual({
        type: 'ack',
        sequence: index + 1,
      })
    }
    expect(dispatch.mock.calls.map(([event]) => event)).toEqual(events)
  })

  it('rejects invalid messages without dispatch and continues serving valid events', async () => {
    const {remote, url} = await listen()
    const received = vi.fn()
    remote.onEvents(received)
    const socket = await connect(url)
    expect(await send(socket, '{broken')).toMatchObject({
      type: 'error',
      code: 'invalid-json',
      sequence: 1,
    })
    for (const value of [
      null,
      [],
      {},
      {type: 'key'},
      {type: 'mouse', position: {x: 1, y: 1}},
      {type: 'paste', text: 42},
    ]) {
      expect(await send(socket, value)).toMatchObject({
        type: 'error',
        code: 'invalid-event',
      })
    }
    expect(await send(socket, key('x'), true)).toMatchObject({
      type: 'error',
      code: 'binary-message',
    })
    expect(received).not.toHaveBeenCalled()
    expect(await send(socket, key('x'))).toMatchObject({type: 'ack'})
    expect(received).toHaveBeenCalledOnce()
  })

  it('rejects missing/wrong tokens and browser Origins, including old tokens after restart', async () => {
    const {remote, url} = await listen()
    const withoutToken = url.split('?')[0]
    await expect(connect(withoutToken)).rejects.toThrow('401')
    await expect(connect(`${withoutToken}?token=wrong`)).rejects.toThrow('401')
    await expect(connect(url, {origin: 'https://example.com'})).rejects.toThrow(
      '401',
    )
    expect(url).toMatch(/^ws:\/\/127\.0\.0\.1:\d+\/\?token=[a-f0-9]{64}$/)
    await remote.close()
    const next = await ready(remote)
    const stale = new URL(next.url)
    stale.searchParams.set('token', new URL(url).searchParams.get('token')!)
    await expect(connect(stale.href)).rejects.toThrow('401')
    expect(await send(await connect(next.url), key('x'))).toEqual({
      type: 'ack',
      sequence: 1,
    })
  })

  it('closes oversized messages without stopping the server', async () => {
    const {remote, url} = await listen()
    const socket = await connect(url)
    const closed = once(socket, 'close')
    socket.send('x'.repeat(65 * 1024))
    expect((await closed)[0]).toBe(1009)
    expect(await send(await connect(url), key('x'))).toEqual({
      type: 'ack',
      sequence: 1,
    })
    expect(remote.closed).toBe(false)
  })

  it.each([false, true])(
    'reports send failures without a false dispatch-failed reply (async: %s)',
    async asynchronous => {
      const {remote, url} = await listen()
      const socket = await connect(url)
      const received = vi.fn()
      const errors = vi.fn()
      const replies = vi.fn()
      remote.onEvents(received)
      remote.onError(errors)
      socket.on('message', replies)
      const failure = new Error('send failed')
      const original = WebSocket.prototype.send
      const transmit = vi
        .spyOn(WebSocket.prototype, 'send')
        .mockImplementationOnce(function (
          this: WebSocket,
          ...args: Parameters<typeof original>
        ) {
          if (asynchronous) {
            const callback = typeof args[1] === 'function' ? args[1] : args[2]
            queueMicrotask(() => callback?.(failure))
            return
          }
          throw failure
        })
      const closed = once(socket, 'close')
      // Bypass the spy only for the driver's send; inject a failure in the server reply.
      original.call(socket, JSON.stringify(key('x')), {}, () => {})
      await closed
      expect(received).toHaveBeenCalledOnce()
      expect(replies).not.toHaveBeenCalled()
      expect(errors).toHaveBeenCalledExactlyOnceWith({
        type: 'send-failed',
        cause: failure,
        message: failure.message,
      })
      expect(transmit).toHaveBeenCalledOnce()
      transmit.mockRestore()
      expect(remote.closed).toBe(false)
      await connect(url)
    },
  )

  it('detaches a stopped screen without closing the remote transport', async () => {
    const {screen} = setup()
    const {remote, url} = await listen()
    const dispatch = vi.spyOn(screen, 'dispatch')
    screen.addEventSource(remote)
    const socket = await connect(url)
    await send(socket, key('x'))
    screen.stop()
    await send(socket, key('y'))
    expect(dispatch).toHaveBeenCalledOnce()
    expect(remote.closed).toBe(false)
  })

  it('lets the app close the transport on quit, and supports a new run afterward', async () => {
    const {screen} = setup()
    const {remote, url} = await listen()
    screen.addEventSource(remote)
    screen.onExit(() => {
      void remote.close()
    })
    screen.key('q', () => screen.stop())
    const socket = await connect(url)
    const closed = once(socket, 'close')
    socket.send(JSON.stringify(key('q')))
    await closed
    await remote.close()
    expect(remote.closed).toBe(true)
    await connect((await ready(remote)).url)
  })
})
