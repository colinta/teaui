import {Button, Screen, Text} from '@teaui/core'
import {describe, expect, test, vi} from 'vitest'
import {DEFAULT_WEB_ENV, WebTerminalHost} from '../lib/WebTerminalHost.js'

function makeSink() {
  let output = ''
  return {
    sink: {
      write(data: string) {
        output += data
      },
    },
    getOutput: () => output,
    clear() {
      output = ''
    },
  }
}

describe('WebTerminalHost', () => {
  test('forwards output to the sink', () => {
    const {sink, getOutput} = makeSink()
    const host = new WebTerminalHost(sink, {cols: 10, rows: 2})

    host.stdout.write('hi')

    expect(getOutput()).toBe('hi')
  })

  test('reports size and emits resize only on change', () => {
    const {sink} = makeSink()
    const host = new WebTerminalHost(sink, {cols: 10, rows: 2})
    const onResize = vi.fn()
    host.stdout.on?.('resize', onResize)

    host.resize(10, 2)
    expect(onResize).not.toHaveBeenCalled()

    host.resize(30, 8)
    expect(onResize).toHaveBeenCalledOnce()
    expect(host.stdout.columns).toBe(30)
    expect(host.stdout.rows).toBe(8)

    host.stdout.removeListener?.('resize', onResize)
    host.resize(40, 9)
    expect(onResize).toHaveBeenCalledOnce()
  })

  test('delivers received input to data listeners', () => {
    const {sink} = makeSink()
    const host = new WebTerminalHost(sink, {cols: 10, rows: 2})
    const onData = vi.fn()
    host.stdin.on('data', onData)

    host.receive('a')
    host.stdin.removeListener('data', onData)
    host.receive('b')

    expect(onData.mock.calls).toEqual([['a']])
  })

  test('merges env over the web defaults', () => {
    const {sink} = makeSink()
    const host = new WebTerminalHost(sink, {
      cols: 10,
      rows: 2,
      env: {LANG: 'fr_FR.UTF-8'},
    })

    expect(host.env).toEqual({...DEFAULT_WEB_ENV, LANG: 'fr_FR.UTF-8'})
    expect(host.terminalOptions.env).toBe(host.env)
  })
})

describe('Screen over WebTerminalHost', () => {
  test('renders, handles mouse input, resizes, and exits', async () => {
    const {sink, getOutput, clear} = makeSink()
    const host = new WebTerminalHost(sink, {cols: 20, rows: 3})
    const onClick = vi.fn()
    const onExit = vi.fn()

    const [screen] = await Screen.start(new Button({title: 'Press', onClick}), {
      terminal: host.terminalOptions,
      exit: onExit,
    })

    const output = getOutput()
    // Enters the alternate screen with mouse reporting, then draws.
    expect(output).toContain('\x1b[?1049h')
    expect(output).toContain('\x1b[?1006h')
    expect(output).toContain('Press')

    // SGR mouse press and release, as wterm reports them (1-based).
    host.receive('\x1b[<0;5;2M')
    host.receive('\x1b[<0;5;2m')
    expect(onClick).toHaveBeenCalledOnce()

    clear()
    host.resize(30, 3)
    screen.render()
    expect(getOutput()).toContain('Press')

    host.receive('\x03')
    expect(onExit).toHaveBeenCalledOnce()
    expect(getOutput()).toContain('\x1b[?1049l')
  })

  test('renders text content', async () => {
    const {sink, getOutput} = makeSink()
    const host = new WebTerminalHost(sink, {cols: 20, rows: 1})
    const [screen] = await Screen.start(new Text({text: 'from the web'}), {
      terminal: host.terminalOptions,
      exit: () => {},
    })

    expect(getOutput()).toContain('from the web')
    screen.stop()
  })
})
