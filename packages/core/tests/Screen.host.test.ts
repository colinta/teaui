import {readdirSync, readFileSync, statSync} from 'node:fs'
import {join} from 'node:path'
import type {TerminalInput, TerminalOutput} from '@teaui/term'
import {describe, expect, test, vi} from 'vitest'
import {Text} from '../lib/components/Text.js'
import {Screen} from '../lib/Screen.js'

// The shape a browser terminal emulator adapter provides.
function makeHost({columns = 20, rows = 3} = {}) {
  let output = ''
  const dataListeners = new Set<(data: string | Uint8Array) => void>()
  const stdout: TerminalOutput = {
    columns,
    rows,
    write(data: string) {
      output += data
    },
    on() {},
    removeListener() {},
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
    send(data: string) {
      for (const listener of dataListeners) {
        listener(data)
      }
    },
    dataListenerCount: () => dataListeners.size,
  }
}

describe('Screen.start with host-provided terminal streams', () => {
  test('renders to the provided output and reads the provided input', async () => {
    const host = makeHost()
    const exit = vi.fn()
    const [screen] = await Screen.start(new Text({text: 'hello web'}), {
      terminal: {stdout: host.stdout, stdin: host.stdin, env: {}},
      exit,
    })

    expect(host.getOutput()).toContain('hello web')

    const onKey = vi.fn()
    screen.key('x', onKey)
    host.send('x')
    expect(onKey).toHaveBeenCalledOnce()

    // quitChar (C-c) stops the screen and calls the custom exit instead of
    // process.exit.
    const processExit = vi
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never)
    host.send('\x03')
    expect(exit).toHaveBeenCalledOnce()
    expect(processExit).not.toHaveBeenCalled()
    expect(host.dataListenerCount()).toBe(0)
    processExit.mockRestore()
  })
})

describe('@teaui/core sources', () => {
  const NODE_ONLY = [
    /\bprocess\.\w/,
    /\bBuffer\.(from|alloc|concat|isBuffer)\b/,
    /\bNodeJS\./,
    /from 'node:/,
    /\brequire\(/,
    /\bsetImmediate\(/,
  ]

  function sourceFiles(dir: string): string[] {
    return readdirSync(dir).flatMap(name => {
      const path = join(dir, name)
      if (statSync(path).isDirectory()) {
        return sourceFiles(path)
      }
      return path.endsWith('.ts') ? [path] : []
    })
  }

  const libDir = join(import.meta.dirname, '../lib')
  for (const file of sourceFiles(libDir)) {
    test(`${file.slice(libDir.length + 1)} does not use Node-only globals`, () => {
      const code = readFileSync(file, 'utf-8')
        .split('\n')
        .filter(line => !/^\s*(\/\/|\/?\*)/.test(line))
        .join('\n')
      for (const pattern of NODE_ONLY) {
        expect(code).not.toMatch(pattern)
      }
    })
  }
})
