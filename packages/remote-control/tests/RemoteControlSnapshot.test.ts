import {once} from 'node:events'
import {execFile} from 'node:child_process'
import {fileURLToPath} from 'node:url'
import {promisify} from 'node:util'
import {mkdtempSync, writeFileSync, rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {WebSocket} from 'ws'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {removeAnsi, Screen, TestProgram, Text, Style} from '@teaui/core'
import {
  RemoteControlServer,
  type RemoteControlReply,
  type SnapshotFormat,
} from '../lib/index.js'

const servers: RemoteControlServer[] = []
const sockets: WebSocket[] = []
const screens: Screen[] = []
const frame = 'hi'
const ansiFrame = '\x1b[31mhi\x1b[0m'
const formats: SnapshotFormat[] = ['plain', 'ansi']
const key = {
  type: 'key',
  name: 'x',
  char: 'x',
  full: 'x',
  ctrl: false,
  alt: false,
  gui: false,
  shift: false,
}

function create() {
  const remote = new RemoteControlServer()
  servers.push(remote)
  return remote
}
async function connect(remote: RemoteControlServer) {
  const address = await remote.listen()
  if (!address.ok) throw address.error
  const socket = new WebSocket(address.value.url)
  sockets.push(socket)
  await once(socket, 'open')
  return socket
}
async function send(
  socket: WebSocket,
  request: unknown,
): Promise<RemoteControlReply> {
  const pending = once(socket, 'message', {signal: AbortSignal.timeout(5000)})
  socket.send(JSON.stringify(request))
  const [data] = await pending
  return JSON.parse(data.toString())
}

afterEach(async () => {
  for (const socket of sockets.splice(0)) socket.terminate()
  for (const screen of screens.splice(0)) screen.stop()
  for (const remote of servers.splice(0)) await remote.close()
  vi.restoreAllMocks()
})

describe('remote snapshots', () => {
  it.each(formats)(
    'formats one ANSI snapshot without dispatching input (%s)',
    async format => {
      const remote = create()
      const provider = vi.fn(() => ansiFrame)
      const events = vi.fn()
      remote.setSnapshotProvider(provider)
      remote.onEvents(events)
      const socket = await connect(remote)
      expect(provider).not.toHaveBeenCalled()
      expect(await send(socket, {type: 'snapshot', format})).toEqual({
        type: 'snapshot',
        sequence: 1,
        format,
        snapshot: format === 'plain' ? frame : ansiFrame,
      })
      expect(provider).toHaveBeenCalledExactlyOnceWith()
      expect(events).not.toHaveBeenCalled()
      expect(await send(socket, key)).toEqual({type: 'ack', sequence: 2})
      expect(events).toHaveBeenCalledOnce()
      expect(provider).toHaveBeenCalledOnce()
    },
  )

  it('returns empty text as a successful snapshot without causing a render', async () => {
    const screen = new Screen(
      new TestProgram({cols: 12, rows: 2}),
      new Text({text: 'pending'}),
    )
    screens.push(screen)
    const render = vi.spyOn(screen, 'render')
    const remote = create()
    remote.setSnapshotProvider(() => screen.snapshot())
    const socket = await connect(remote)
    for (const [index, format] of formats.entries()) {
      expect(await send(socket, {type: 'snapshot', format})).toEqual({
        type: 'snapshot',
        sequence: index + 1,
        format,
        snapshot: '',
      })
    }
    expect(render).not.toHaveBeenCalled()
  })

  it.each([undefined, null, 'both', 'text', 0, ['plain', 'ansi']])(
    'rejects invalid or missing format before calling the provider (%j)',
    async format => {
      const remote = create()
      const provider = vi.fn(() => frame)
      remote.setSnapshotProvider(provider)
      expect(
        await send(await connect(remote), {type: 'snapshot', format}),
      ).toMatchObject({type: 'error', code: 'invalid-event'})
      expect(provider).not.toHaveBeenCalled()
    },
  )

  it('lets another process control the screen and request each output format', async () => {
    const view = new Text({
      text: new Style({foreground: 'red', bold: true}).toSGR(
        Style.NONE,
        'before',
      ),
    })
    const screen = new Screen(new TestProgram({cols: 12, rows: 2}), view)
    screens.push(screen)
    screen.start()
    screen.key('x', () => {
      view.text = 'after'
    })
    const remote = create()
    screen.addEventSource(remote)
    remote.setSnapshotProvider(() => screen.snapshot())
    const address = await remote.listen()
    if (!address.ok) throw address.error
    const client = fileURLToPath(
      new URL('./fixtures/remote-client.mjs', import.meta.url),
    )
    const requests = [
      {type: 'snapshot', format: 'ansi'},
      key,
      {type: 'snapshot', format: 'plain'},
    ]
    const result = await promisify(execFile)(
      process.execPath,
      [client, address.value.url, JSON.stringify(requests)],
      {timeout: 7000},
    )
    const replies = result.stdout
      .trim()
      .split('\n')
      .map(line => JSON.parse(line))
    expect(replies[0]).toMatchObject({
      type: 'snapshot',
      sequence: 1,
      format: 'ansi',
    })
    expect(replies[0].snapshot).toContain('\x1b[')
    expect(removeAnsi(replies[0].snapshot)).toBe('before      \n            ')
    expect(replies[1]).toEqual({type: 'ack', sequence: 2})
    expect(replies[2]).toEqual({
      type: 'snapshot',
      sequence: 3,
      format: 'plain',
      snapshot: 'after       \n            ',
    })
  })

  it('keeps broadcasts separate from request replies in the JSONL driver', async () => {
    const remote = create()
    remote.setSnapshotProvider(() => ansiFrame)
    remote.onEvents(() => remote.sendSnapshot('ansi', ansiFrame))
    const address = await remote.listen()
    if (!address.ok) throw address.error
    const directory = mkdtempSync(join(tmpdir(), 'teaui-snapshot-'))
    try {
      const endpoint = join(directory, 'endpoint.json')
      writeFileSync(endpoint, JSON.stringify(address.value), {mode: 0o600})
      const driver = fileURLToPath(
        new URL('../examples/remote-control.mjs', import.meta.url),
      )
      const execution = promisify(execFile)(
        process.execPath,
        [driver, endpoint],
        {timeout: 7000},
      )
      execution.child.stdin!.end(
        [key, {type: 'snapshot', format: 'plain'}]
          .map(event => JSON.stringify(event))
          .join('\n') + '\n',
      )
      const result = await execution
      const replies = result.stdout
        .trim()
        .split('\n')
        .map(line => JSON.parse(line))
      expect(replies).toEqual([
        {type: 'snapshot', format: 'ansi', snapshot: ansiFrame},
        {type: 'ack', sequence: 1},
        {type: 'snapshot', sequence: 2, format: 'plain', snapshot: frame},
      ])
    } finally {
      rmSync(directory, {recursive: true, force: true})
    }
  })

  it('supports provider replacement, independent detach, and restart', async () => {
    const remote = create()
    const stale = remote.setSnapshotProvider(() => frame)
    const nextFrame = 'ok'
    const detach = remote.setSnapshotProvider(() => nextFrame)
    stale()
    let socket = await connect(remote)
    expect(
      await send(socket, {type: 'snapshot', format: 'plain'}),
    ).toMatchObject({snapshot: nextFrame})
    await remote.close()
    socket = await connect(remote)
    expect(
      await send(socket, {type: 'snapshot', format: 'plain'}),
    ).toMatchObject({sequence: 1, snapshot: nextFrame})
    detach()
    detach()
    expect(
      await send(socket, {type: 'snapshot', format: 'plain'}),
    ).toMatchObject({type: 'error', code: 'snapshot-unavailable'})
  })

  it('reports missing/throwing providers without breaking event delivery', async () => {
    const remote = create()
    const socket = await connect(remote)
    expect(
      await send(socket, {type: 'snapshot', format: 'plain'}),
    ).toMatchObject({type: 'error', code: 'snapshot-unavailable', sequence: 1})
    remote.setSnapshotProvider(() => {
      throw new Error('capture failed')
    })
    expect(await send(socket, {type: 'snapshot', format: 'ansi'})).toEqual({
      type: 'error',
      code: 'snapshot-failed',
      sequence: 2,
      message: 'capture failed',
    })
    expect(await send(socket, key)).toEqual({type: 'ack', sequence: 3})
    remote.setSnapshotProvider(() => frame)
    expect(
      await send(socket, {type: 'snapshot', format: 'plain'}),
    ).toMatchObject({type: 'snapshot', sequence: 4})
  })

  it.each([
    undefined,
    null,
    false,
    Object.create(null),
    {
      get message() {
        throw new Error('message getter failed')
      },
    },
  ])(
    'contains unusual provider and input failures at the wire boundary (%#)',
    async cause => {
      const remote = create()
      const socket = await connect(remote)
      remote.setSnapshotProvider(() => {
        throw cause
      })
      const detach = remote.onEvents(() => {
        throw cause
      })
      expect(await send(socket, {type: 'snapshot', format: 'plain'})).toEqual({
        type: 'error',
        sequence: 1,
        code: 'snapshot-failed',
        message: 'Remote control snapshot failed',
      })
      expect(await send(socket, key)).toEqual({
        type: 'error',
        sequence: 2,
        code: 'dispatch-failed',
        message: 'Remote control input callback failed',
      })
      detach()
      expect(await send(socket, key)).toEqual({type: 'ack', sequence: 3})
    },
  )

  it('broadcasts application snapshots while request replies remain private', async () => {
    const remote = create()
    remote.sendSnapshot('plain', ansiFrame) // Idle broadcasts are not queued.
    remote.setSnapshotProvider(() => ansiFrame)
    const first = await connect(remote)
    const second = await connect(remote)
    const secondMessages = vi.fn()
    second.on('message', secondMessages)
    expect(
      await send(first, {type: 'snapshot', format: 'plain'}),
    ).toMatchObject({sequence: 1})
    const pending = [once(first, 'message'), once(second, 'message')]
    remote.sendSnapshot('ansi', ansiFrame)
    for (const [data] of await Promise.all(pending)) {
      expect(JSON.parse(data.toString())).toEqual({
        type: 'snapshot',
        format: 'ansi',
        snapshot: ansiFrame,
      })
    }
    expect(secondMessages).toHaveBeenCalledOnce()
    expect(await send(first, key)).toEqual({type: 'ack', sequence: 2})
    expect(await send(second, key)).toEqual({type: 'ack', sequence: 1})
    await remote.close()
    remote.sendSnapshot('plain', ansiFrame)
  })

  it('encodes each broadcast once, without caching or encoding for absent clients', async () => {
    const remote = create()
    const encode = vi.spyOn(JSON, 'stringify')
    remote.sendSnapshot('plain', frame)
    await remote.listen()
    remote.sendSnapshot('plain', frame)
    expect(encode).not.toHaveBeenCalled()
    const first = await connect(remote)
    const second = await connect(remote)
    encode.mockClear()
    for (const [index, [ansi, plain]] of [
      [ansiFrame, frame],
      ['\x1b[1mnew frame\x1b[0m', 'new frame'],
    ].entries()) {
      const pending = [once(first, 'message'), once(second, 'message')]
      remote.sendSnapshot('plain', ansi)
      expect(encode).toHaveBeenCalledTimes(index + 1)
      expect(encode).toHaveBeenLastCalledWith({
        type: 'snapshot',
        format: 'plain',
        snapshot: plain,
      })
      for (const [data] of await Promise.all(pending)) {
        expect(JSON.parse(data.toString())).toEqual({
          type: 'snapshot',
          format: 'plain',
          snapshot: plain,
        })
      }
    }
  })

  it.each(['backpressure', 'send failure'])(
    'keeps broadcasting to healthy clients after %s',
    async failure => {
      const remote = create()
      const first = await connect(remote)
      const second = await connect(remote)
      const errors = vi.fn()
      remote.onError(errors)
      if (failure === 'backpressure') {
        vi.spyOn(
          WebSocket.prototype,
          'bufferedAmount',
          'get',
        ).mockReturnValueOnce(8 * 1024 * 1024)
      } else {
        vi.spyOn(WebSocket.prototype, 'send').mockImplementationOnce(() => {
          throw new Error('send failed')
        })
      }
      const closed = once(first, 'close')
      const received = once(second, 'message')
      const encode = vi.spyOn(JSON, 'stringify')
      remote.sendSnapshot('plain', ansiFrame)
      expect(encode).toHaveBeenCalledOnce()
      const [data] = await received
      await closed
      expect(JSON.parse(data.toString())).toEqual({
        type: 'snapshot',
        format: 'plain',
        snapshot: frame,
      })
      expect(remote.closed).toBe(false)
      expect(errors).toHaveBeenCalledTimes(failure === 'backpressure' ? 0 : 1)
    },
  )

  it('allows ANSI output larger than the input payload limit', async () => {
    const remote = create()
    const snapshot = Array(100).fill('\x1b[31mx\x1b[0m'.repeat(200)).join('\n')
    expect(Buffer.byteLength(snapshot)).toBeGreaterThan(64 * 1024)
    remote.setSnapshotProvider(() => snapshot)
    expect(
      await send(await connect(remote), {type: 'snapshot', format: 'ansi'}),
    ).toEqual({type: 'snapshot', sequence: 1, format: 'ansi', snapshot})
  })

  it('bounds oversized output without shutting down the server', async () => {
    const remote = create()
    remote.setSnapshotProvider(() => 'x'.repeat(8 * 1024 * 1024))
    const socket = await connect(remote)
    const closed = once(socket, 'close')
    socket.send(JSON.stringify({type: 'snapshot', format: 'ansi'}))
    await closed
    expect(remote.closed).toBe(false)
    remote.setSnapshotProvider(() => frame)
    expect(
      await send(await connect(remote), {type: 'snapshot', format: 'plain'}),
    ).toMatchObject({snapshot: frame})
  })
})
