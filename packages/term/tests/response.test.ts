import {EventEmitter} from 'node:events'
import {describe, expect, it, vi} from 'vitest'
import {InputReader, parseInput} from '../src/input.js'
import {
  TerminalResponseRouter,
  type TerminalResponseMatcher,
} from '../src/response.js'
import type {InputEvent} from '../src/types.js'

function exactResponse(expected: string): TerminalResponseMatcher<string> {
  const bytes = Buffer.from(expected)

  return candidate => {
    const comparedLength = Math.min(candidate.length, bytes.length)
    for (let i = 0; i < comparedLength; i++) {
      if (candidate[i] !== bytes[i]) return {status: 'none'}
    }
    if (candidate.length < bytes.length) return {status: 'partial'}
    return {status: 'match', length: bytes.length, value: expected}
  }
}

describe('TerminalResponseRouter', () => {
  it('forwards input unchanged when no response route is active', () => {
    const forward = vi.fn()
    const router = new TerminalResponseRouter(forward)
    const input = Buffer.from('abc')

    router.push(input)

    expect(forward).toHaveBeenCalledOnce()
    expect(forward).toHaveBeenCalledWith(input)
  })

  it('recognizes a response split across chunks', () => {
    const forwarded: Buffer[] = []
    const responses: Array<{value: string; raw: string}> = []
    const router = new TerminalResponseRouter(data => forwarded.push(data))
    router.onResponse(exactResponse('\x1b[12;34R'), (value, raw) => {
      responses.push({value, raw: raw.toString()})
    })

    router.push(Buffer.from('\x1b[12;'))
    expect(forwarded).toEqual([])
    router.push(Buffer.from('34R'))

    expect(responses).toEqual([{value: '\x1b[12;34R', raw: '\x1b[12;34R'}])
    expect(forwarded).toEqual([])
  })

  it('removes only responses and preserves mixed keyboard and mouse bytes', () => {
    const events: InputEvent[] = []
    const responses: string[] = []
    const router = new TerminalResponseRouter(data => {
      events.push(...parseInput(data))
    })
    router.onResponse(exactResponse('\x1b[12;34R'), value => {
      responses.push(value)
    })

    router.push(Buffer.from('a\x1b[12;34R\x1b[<0;2;3Mb'))

    expect(responses).toEqual(['\x1b[12;34R'])
    expect(events).toEqual([
      {
        type: 'key',
        key: 'a',
        ctrl: false,
        alt: false,
        shift: false,
        gui: false,
      },
      {
        type: 'mouse',
        action: 'press',
        button: 'left',
        x: 1,
        y: 2,
        ctrl: false,
        alt: false,
        shift: false,
        gui: false,
      },
      {
        type: 'key',
        key: 'b',
        ctrl: false,
        alt: false,
        shift: false,
        gui: false,
      },
    ])
  })

  it('preserves a fragmented mouse sequence that shares a response prefix', () => {
    const forwarded: Buffer[] = []
    const router = new TerminalResponseRouter(data => forwarded.push(data))
    router.onResponse(exactResponse('\x1b[12;34R'), () => {})

    router.push(Buffer.from('\x1b['))
    router.push(Buffer.from('<0;2;3M'))

    expect(Buffer.concat(forwarded).toString()).toBe('\x1b[<0;2;3M')
    expect(parseInput(Buffer.concat(forwarded))).toMatchObject([
      {type: 'mouse', action: 'press', x: 1, y: 2},
    ])
  })

  it('forwards retained bytes when a response route is cancelled', () => {
    const forwarded: Buffer[] = []
    const router = new TerminalResponseRouter(data => forwarded.push(data))
    const cancel = router.onResponse(exactResponse('\x1b[12;34R'), () => {})

    router.push(Buffer.from('\x1b[12;'))
    cancel()

    expect(Buffer.concat(forwarded).toString()).toBe('\x1b[12;')
  })

  it('can remove a route after its first response', () => {
    const forwarded: Buffer[] = []
    const responses: string[] = []
    const router = new TerminalResponseRouter(data => forwarded.push(data))
    const cancel = router.onResponse(
      exactResponse('\x1b[12;34R'),
      value => responses.push(value),
      {once: true},
    )

    router.push(Buffer.from('\x1b[12;34R\x1b[12;34R'))
    cancel()

    expect(responses).toEqual(['\x1b[12;34R'])
    expect(Buffer.concat(forwarded).toString()).toBe('\x1b[12;34R')
  })

  it('bounds bytes retained by a partial matcher', () => {
    const forwarded: Buffer[] = []
    const router = new TerminalResponseRouter(data => forwarded.push(data), {
      maxPendingBytes: 4,
    })
    router.onResponse(
      () => ({status: 'partial'}),
      () => {},
    )

    router.push(Buffer.from('12345'))

    expect(Buffer.concat(forwarded).toString()).toBe('12345')
  })
})

describe('InputReader response routing', () => {
  it('does not emit matched responses as keys', () => {
    const stream = new EventEmitter()
    const reader = new InputReader()
    const events: InputEvent[] = []
    const responses: string[] = []
    reader.onInput(event => events.push(event))
    reader.onResponse(exactResponse('\x1b[12;34R'), value => {
      responses.push(value)
    })
    reader.attach(stream as NodeJS.ReadableStream)

    stream.emit('data', Buffer.from('a\x1b[12;'))
    stream.emit('data', Buffer.from('34R\x1b[<0;2;3M'))

    expect(responses).toEqual(['\x1b[12;34R'])
    expect(events).toMatchObject([
      {type: 'key', key: 'a'},
      {type: 'mouse', action: 'press', x: 1, y: 2},
    ])
    reader.detach()
  })
})
