import {readdirSync, readFileSync} from 'node:fs'
import {join} from 'node:path'
import {describe, expect, it} from 'vitest'
import {Terminal} from '../src/terminal.js'
import type {TerminalInput, TerminalOutput} from '../src/types.js'
import type {InputEvent} from '../src/types.js'

// A non-Node host (e.g. a browser terminal emulator) provides plain objects
// instead of process streams.
function makeHost({columns = 40, rows = 10} = {}) {
  let output = ''
  const resizeListeners = new Set<() => void>()
  const dataListeners = new Set<(data: string | Uint8Array) => void>()

  const stdout: TerminalOutput & {columns: number; rows: number} = {
    columns,
    rows,
    write(data: string) {
      output += data
    },
    on(_event, listener) {
      resizeListeners.add(listener)
    },
    removeListener(_event, listener) {
      resizeListeners.delete(listener)
    },
  }
  const stdin: TerminalInput = {
    on(_event, listener) {
      dataListeners.add(listener)
    },
    removeListener(_event, listener) {
      dataListeners.delete(listener)
    },
  }

  return {
    stdout,
    stdin,
    getOutput: () => output,
    send(data: string | Uint8Array) {
      for (const listener of dataListeners) {
        listener(data)
      }
    },
    resize(nextColumns: number, nextRows: number) {
      stdout.columns = nextColumns
      stdout.rows = nextRows
      for (const listener of resizeListeners) {
        listener()
      }
    },
    listenerCounts: () => ({
      data: dataListeners.size,
      resize: resizeListeners.size,
    }),
  }
}

describe('Terminal with host-provided streams', () => {
  it('writes to the provided output', () => {
    const host = makeHost()
    const term = new Terminal({stdout: host.stdout, stdin: host.stdin})

    term.write('hello')

    expect(host.getOutput()).toBe('hello')
    expect(term.size).toEqual({columns: 40, rows: 10})
  })

  it('parses string and byte input', () => {
    const host = makeHost()
    const term = new Terminal({stdout: host.stdout, stdin: host.stdin})
    const events: InputEvent[] = []
    term.onInput(event => events.push(event))
    term.startInput()

    host.send('a')
    host.send(new TextEncoder().encode('b'))

    expect(events).toMatchObject([
      {type: 'key', key: 'a'},
      {type: 'key', key: 'b'},
    ])

    term.stopInput()
    expect(host.listenerCounts().data).toBe(0)
  })

  it('subscribes to resize events on the provided output', () => {
    const host = makeHost()
    const term = new Terminal({stdout: host.stdout, stdin: host.stdin})
    const sizes: Array<{columns: number; rows: number}> = []

    const unsubscribe = term.onResize(size => sizes.push(size))
    host.resize(100, 30)
    unsubscribe()
    host.resize(120, 40)

    expect(sizes).toEqual([{columns: 100, rows: 30}])
    expect(host.listenerCounts().resize).toBe(0)
  })

  it('detects capabilities from the provided env', () => {
    const host = makeHost()
    const term = new Terminal({
      stdout: host.stdout,
      stdin: host.stdin,
      env: {COLORTERM: 'truecolor'},
    })

    expect(term.colorSupport).toBe('truecolor')
  })

  it('resolves cursor position responses sent as strings', async () => {
    const host = makeHost()
    const term = new Terminal({stdout: host.stdout, stdin: host.stdin})
    term.startInput()

    const position = term.queryCursorPosition()
    host.send('\x1b[3;7R')

    await expect(position).resolves.toEqual({x: 6, y: 2})
  })

  it('delivers raw data once as bytes', () => {
    const host = makeHost()
    const term = new Terminal({stdout: host.stdout, stdin: host.stdin})
    const received: string[] = []

    term.onceRawData(data => received.push(new TextDecoder().decode(data)))
    host.send('first')
    host.send('second')

    expect(received).toEqual(['first'])
  })
})

describe('@teaui/term sources', () => {
  // Keep the package loadable without Node globals; host access belongs in
  // platform.ts.
  const NODE_ONLY = [
    /\bprocess\.\w/,
    /\bBuffer\.\w/,
    /\bNodeJS\./,
    /from 'node:/,
    /\brequire\(/,
  ]

  const srcDir = join(import.meta.dirname, '../src')
  for (const file of readdirSync(srcDir).filter(name => name.endsWith('.ts'))) {
    it(`${file} does not use Node-only globals`, () => {
      const code = readFileSync(join(srcDir, file), 'utf-8')
        .split('\n')
        .filter(line => !/^\s*(\/\/|\/?\*)/.test(line))
        .join('\n')
      for (const pattern of NODE_ONLY) {
        expect(code).not.toMatch(pattern)
      }
    })
  }
})
