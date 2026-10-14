import {readFileSync} from 'node:fs'
import {lineWidth, Point, removeAnsi, Screen, TestTerminal} from '@teaui/core'
import {Subprocess} from '@teaui/subprocess'
import {afterEach, describe, expect, it, vi} from 'vitest'

import * as capture from '../lib/examples/samples/capture.js'
import {subprocessExample} from '../lib/examples/samples/subprocess.js'

const SIZE = {width: 40, height: 6}
const EXIT_MESSAGE = '[Process exited with code 0]'
const ERROR_MESSAGE = 'Error: example spawn failure'
const DIMENSION = "number | 'fill' | 'shrink' | 'natural'"

afterEach(() => {
  vi.restoreAllMocks()
})

function replay(output: string): TestTerminal {
  const terminal = new TestTerminal({cols: SIZE.width, rows: SIZE.height})
  output.split('\n').forEach((line, y) => {
    terminal.move(0, y)
    terminal.write(line)
  })
  return terminal
}

function terminalState(output: string) {
  const terminal = replay(output)
  return {
    text: terminal.textContent(),
    styles: Array.from({length: SIZE.height}, (_, y) =>
      Array.from({length: SIZE.width}, (_, x) => terminal.styleAt(x, y)),
    ),
  }
}

describe('subprocess CLI component example', () => {
  it('documents the separate package, exact props, lifecycle, and Core-only getters', () => {
    expect(subprocessExample.name).toBe('subprocess')
    expect(subprocessExample.availability).toBe('both')
    expect(subprocessExample.description).toContain('@teaui/subprocess/react')
    expect(subprocessExample.description).toContain('native node-pty')
    expect(subprocessExample.description).toContain('@xterm/headless')
    expect(subprocessExample.description).toContain('Spawns on mount')
    expect(subprocessExample.description).toContain('when focused')
    expect(subprocessExample.description).toContain('kills/disposes on unmount')
    expect(subprocessExample.description).toContain('construction-time only')
    expect(
      subprocessExample.props.map(({name, type, availability}) => ({
        name,
        type,
        availability,
      })),
    ).toEqual([
      {name: 'command', type: 'string', availability: 'both'},
      {name: 'args', type: 'string[]', availability: 'both'},
      {name: 'env', type: 'Record<string, string>', availability: 'both'},
      {name: 'cwd', type: 'string', availability: 'both'},
      {name: 'onData', type: '(data: string) => void', availability: 'both'},
      {
        name: 'onExit',
        type: '(exitCode: number, signal?: number) => void',
        availability: 'both',
      },
      {name: 'onFocus', type: '() => void', availability: 'both'},
      {name: 'onBlur', type: '() => void', availability: 'both'},
      {name: 'width', type: DIMENSION, availability: 'both'},
      {name: 'height', type: DIMENSION, availability: 'both'},
      {
        name: 'processState',
        type: "'idle' | 'starting' | 'running' | 'exited' | 'error'",
        availability: 'core',
      },
      {name: 'exitCode', type: 'number | null', availability: 'core'},
    ])
    const description = (name: string) =>
      subprocessExample.props.find(prop => prop.name === name)?.description
    expect(description('command')).toContain('not a shell command line')
    expect(description('args')).toContain('Defaults to []')
    expect(description('env')).toContain('merged over process.env')
    expect(description('env')).toContain('TERM=xterm-256color')
    expect(description('cwd')).toContain('undefined by default')
    expect(description('onData')).toContain('before xterm parses')
    expect(description('onData')).toContain('chunks need not match lines')
    expect(description('onExit')).toContain('pending output parsing')
    expect(description('onExit')).toContain('instead of invoking onExit')
    expect(description('width')).toContain("Defaults to 'fill'")
    expect(description('height')).toContain("Defaults to 'fill'")
    for (const name of ['processState', 'exitCode']) {
      expect(description(name)).toContain('read-only property')
      expect(description(name)).toContain('not a constructor prop')
    }
    // The external wrapper is not forwardRef and has no children/restart API.
    expect(subprocessExample.props.map(prop => prop.name)).not.toContain('ref')
    expect(subprocessExample.props.map(prop => prop.name)).not.toContain(
      'children',
    )
    expect(subprocessExample.props.map(prop => prop.name)).not.toContain(
      'restart',
    )
  })

  it.each(['core', 'react'] as const)(
    '%s captures the exact executable public sample with a real short-lived PTY and cleanup',
    async framework => {
      const extension = framework === 'core' ? 'js' : 'tsx'
      const moduleUrl = new URL(
        `../lib/examples/samples/subprocess.${framework}.${extension}`,
        import.meta.url,
      )
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(subprocessExample.source[framework]()).toBe(source)
      expect(source).toContain('const WIDTH = 40')
      expect(source).toContain('const HEIGHT = 6')
      expect(source).toContain('process.execPath')
      expect(source).toContain("['--eval', CHILD_SCRIPT]")
      expect(source).toContain("TEAUI_EXAMPLE_MESSAGE: 'hello from child'")
      expect(source).toContain('received += data')
      expect(source).toContain('exitCode = code')
      expect(source).toContain('received.includes(OUTPUT_MARKER)')
      expect(source).toContain('output.includes(OUTPUT_MARKER)')
      expect(source).toContain('output.includes(EXIT_MESSAGE)')
      expect(source).toContain('await delay(POLL_INTERVAL)')
      expect(source).toContain('finally {')
      expect(source).toContain('screen.stop()')
      expect(source).not.toMatch(
        /captureExample|HeadlessProgram|testRender|tui-|createElement|Math\.random|Date\.|process\.exit\(|\/bin\//,
      )
      if (framework === 'core') {
        expect(source).toContain("import {Subprocess} from '@teaui/subprocess'")
        expect(source).toContain("import {Screen} from '@teaui/core'")
        expect(source).toContain('new Subprocess({')
        expect(source).toContain('await Screen.start(terminal)')
        expect(source).toContain("terminal.processState === 'exited'")
        expect(source).toContain('terminal.exitCode === 0')
      } else {
        expect(source).toContain(
          "import {Subprocess} from '@teaui/subprocess/react'",
        )
        expect(source).toContain("import {run} from '@teaui/react'")
        expect(source).toContain('<Subprocess')
        expect(source).toContain('command={process.execPath}')
        expect(source).toContain('onData={data => {')
        expect(source).toContain('onExit={code => {')
        expect(source).toContain('await run(')
        expect(source).toContain('unmount()')
        expect(source).not.toContain("from '@teaui/core'")
        expect(source).not.toContain('ref=')
      }

      const originalStart = Screen.start
      const captureSpy = vi.spyOn(capture, 'captureExample')
      const stopSpy = vi.spyOn(Screen.prototype, 'stop')
      const mountSpy = vi.spyOn(Subprocess.prototype, 'didMount')
      const unmountSpy = vi.spyOn(Subprocess.prototype, 'didUnmount')
      const output = await subprocessExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)
      expect(output).toBe(await captureSpy.mock.results[0].value)
      expect(Screen.start).toBe(originalStart)
      expect(mountSpy).toHaveBeenCalledOnce()
      expect(unmountSpy).toHaveBeenCalledOnce()
      // The executable sample stops in finally; capture also stops idempotently.
      expect(stopSpy).toHaveBeenCalledTimes(2)
      const terminalView = mountSpy.mock.contexts[0] as Subprocess
      expect(terminalView.processState).toBe('exited')
      expect(terminalView.exitCode).toBe(0)
      expect(terminalView.screen).toBeUndefined()
      expect(unmountSpy.mock.contexts[0]).toBe(terminalView)

      const text = removeAnsi(output)
      const lines = text.split('\n')
      expect(lines).toHaveLength(SIZE.height)
      expect(lines.map(line => lineWidth(line))).toEqual(
        Array(SIZE.height).fill(SIZE.width),
      )
      expect(lines.map(line => line.trimEnd())).toEqual([
        'Subprocess in a PTY',
        'message: hello from child',
        'one command, no shell',
        '',
        '',
        `${' '.repeat(6)}${EXIT_MESSAGE}`,
      ])
      expect(text).not.toContain('Starting process...')
      expect(text).toMatchSnapshot('parsed child output and exit overlay')

      const terminal = replay(output)
      const title = terminal.styleAt(0, 0)
      expect(title.bold).toBe(true)
      expect(title.foreground).toBe('green')
      const body = terminal.styleAt(0, 1)
      expect(body.bold).toBeFalsy()
      expect(body.foreground).toBe('default')
      const exit = terminal.styleAt(6, 5)
      expect(exit.dim).toBe(true)
      expect(exit.inverse).toBe(true)
      expect({title, body, exit}).toMatchSnapshot(
        'child SGR and overlay styles',
      )

      // PTY redraw timing can add a redundant leading SGR reset. Verify the
      // entire displayed buffer and styles, not the serializer's history.
      expect(
        terminalState(await subprocessExample.render[framework]()),
      ).toEqual(terminalState(output))
      expect(captureSpy).toHaveBeenNthCalledWith(2, moduleUrl, SIZE)
      expect(mountSpy).toHaveBeenCalledTimes(2)
      expect(unmountSpy).toHaveBeenCalledTimes(2)
      expect(stopSpy).toHaveBeenCalledTimes(4)
      expect(Screen.start).toBe(originalStart)
    },
    10_000,
  )

  it('produces identical Core and public JSX-wrapper content and styles', async () => {
    // Capture temporarily replaces Screen.start, so never run these concurrently.
    const core = await subprocessExample.render.core()
    const react = await subprocessExample.render.react()
    expect(terminalState(react)).toEqual(terminalState(core))
  })

  it.each(['core', 'react'] as const)(
    '%s cleans up and restores capture hooks when a spawn-error view is displayed',
    async framework => {
      const originalStart = Screen.start
      const stopSpy = vi.spyOn(Screen.prototype, 'stop')
      // Inject the public error state without spawning a real child in this case.
      const mountSpy = vi
        .spyOn(Subprocess.prototype, 'didMount')
        .mockImplementation(() => {})
      vi.spyOn(Subprocess.prototype, 'processState', 'get').mockReturnValue(
        'error',
      )
      vi.spyOn(Subprocess.prototype, 'render').mockImplementation(viewport => {
        viewport.write(ERROR_MESSAGE, new Point(0, 0))
      })
      const unmountSpy = vi.spyOn(Subprocess.prototype, 'didUnmount')
      await expect(subprocessExample.render[framework]()).rejects.toThrow(
        ERROR_MESSAGE,
      )
      expect(Screen.start).toBe(originalStart)
      expect(stopSpy).toHaveBeenCalledTimes(2)
      expect(unmountSpy).toHaveBeenCalledOnce()
      expect((mountSpy.mock.contexts[0] as Subprocess).screen).toBeUndefined()
    },
  )

  it.each(['core', 'react'] as const)(
    '%s times out instead of hanging and cleans up a child that never becomes ready',
    async framework => {
      const originalStart = Screen.start
      const mountSpy = vi
        .spyOn(Subprocess.prototype, 'didMount')
        .mockImplementation(() => {})
      const unmountSpy = vi.spyOn(Subprocess.prototype, 'didUnmount')
      await expect(subprocessExample.render[framework]()).rejects.toThrow(
        'Subprocess did not finish rendering before the deadline',
      )
      expect(Screen.start).toBe(originalStart)
      expect(unmountSpy).toHaveBeenCalledOnce()
      expect((mountSpy.mock.contexts[0] as Subprocess).screen).toBeUndefined()
    },
    10_000,
  )
})
