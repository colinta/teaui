import {existsSync, readFileSync} from 'node:fs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {
  Screen,
  fetchLogs,
  flushLogs,
  interceptConsoleLog,
  lineWidth,
  removeAnsi,
} from '@teaui/core'

import {consoleLogExample} from '../lib/examples/samples/console-log.js'
import * as capture from '../lib/examples/samples/capture.js'

const SIZE = {width: 36, height: 5}
const CONSOLE_LEVELS = ['debug', 'error', 'info', 'log', 'warn'] as const
let consoleMethods: (typeof console.log)[]
let exitListeners: ReturnType<typeof process.rawListeners>
let originalStart: typeof Screen.start

beforeEach(() => {
  consoleMethods = CONSOLE_LEVELS.map(level => console[level])
  exitListeners = process.rawListeners('exit')
  originalStart = Screen.start
})

afterEach(() => {
  try {
    flushLogs()
  } finally {
    vi.restoreAllMocks()
    CONSOLE_LEVELS.forEach((level, index) => {
      console[level] = consoleMethods[index]
    })
    for (const listener of process.rawListeners('exit')) {
      if (!exitListeners.includes(listener)) {
        process.removeListener('exit', listener as (code: number) => void)
      }
    }
    Screen.start = originalStart
  }
})

function expectInterceptionRestored() {
  CONSOLE_LEVELS.forEach((level, index) => {
    expect(console[level]).toBe(consoleMethods[index])
  })
  expect(process.rawListeners('exit')).toEqual(exitListeners)
  expect(Screen.start).toBe(originalStart)
  expect(fetchLogs()).toEqual([])
}

describe('console-log CLI component example', () => {
  it('documents ConsoleLog props, not the controlled Log API', () => {
    expect(consoleLogExample.name).toBe('console-log')
    expect(consoleLogExample.availability).toBe('both')
    expect(consoleLogExample.description).toContain('interceptConsoleLog()')
    expect(consoleLogExample.description).toContain(
      'debug calls are not displayed',
    )
    expect(consoleLogExample.props).toEqual([
      {
        name: 'width',
        type: 'Dimension',
        description: "Columns or 'fill', 'shrink', 'natural'",
        availability: 'both',
      },
      {
        name: 'height',
        type: 'Dimension',
        description: "Rows or 'fill', 'shrink', 'natural'",
        availability: 'both',
      },
      {
        name: 'ref',
        type: 'React.Ref<ConsoleLog>',
        description: 'Reference to the underlying Core ConsoleLog',
        availability: 'react',
      },
    ])
    expect(consoleLogExample.props.map(prop => prop.name)).not.toContain('logs')
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures the exact executable sample without leaking interception',
    async framework => {
      const moduleUrl = new URL(
        `../lib/examples/samples/console-log.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
        import.meta.url,
      )
      const executable = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(consoleLogExample.source[framework]()).toBe(executable)
      expect(executable).not.toMatch(
        /captureExample|HeadlessProgram|tui-|setLogs|appendLog/,
      )
      expect(executable).toContain(`from '@teaui/${framework}'`)
      expect(executable).toContain("from '@teaui/core'")
      expect(executable).toContain('interceptConsoleLog()')
      for (const level of ['log', 'info', 'warn', 'error']) {
        expect(executable).toContain(`console.${level}(`)
      }
      if (framework === 'react') {
        expect(executable).toContain("import React from 'react'")
        expect(executable).toContain(
          'await run(<ConsoleLog width={36} height={5} />)',
        )
        expect(executable).not.toContain('createElement')
        expect(
          existsSync(
            new URL(
              '../lib/examples/samples/console-log.react.js',
              import.meta.url,
            ),
          ),
        ).toBe(false)
      } else {
        expect(executable).toContain('width: 36, height: 5')
        expect(executable).toContain('await Screen.start(')
        expect(executable).toContain('new Window({child: new ConsoleLog(')
      }

      const captureSpy = vi.spyOn(capture, 'captureExample')
      const output = await consoleLogExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)
      expectInterceptionRestored()

      const text = removeAnsi(output)
      const lines = text.split('\n')
      expect(lines).toHaveLength(SIZE.height)
      expect(lines.every(line => lineWidth(line) === SIZE.width)).toBe(true)
      for (const message of [
        'Application ready',
        'Server started',
        'Slow connection',
        'Retry needed',
        'Check the network',
      ]) {
        expect(text).toContain(message)
      }
      expect(text).toMatchSnapshot()
      expect(await consoleLogExample.render[framework]()).toBe(output)
      expectInterceptionRestored()
    },
  )

  it('renders matching Core and public-wrapper React content', async () => {
    const core = await consoleLogExample.render.core()
    expectInterceptionRestored()
    const react = await consoleLogExample.render.react()
    expectInterceptionRestored()
    expect(removeAnsi(react)).toBe(removeAnsi(core))
  })

  it('preserves caller-installed console methods', async () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    await consoleLogExample.render.core()
    expect(console.info).toBe(spy)
    expect(spy).not.toHaveBeenCalled()
    expect(process.rawListeners('exit')).toEqual(exitListeners)
    expect(fetchLogs()).toEqual([])
  })

  it.each(['core', 'react'] as const)(
    '%s restores console methods and exit listeners when capture fails',
    async framework => {
      const error = new Error('Capture failed after interception')
      vi.spyOn(capture, 'captureExample').mockImplementation(async () => {
        interceptConsoleLog()
        throw error
      })

      await expect(consoleLogExample.render[framework]()).rejects.toBe(error)
      expectInterceptionRestored()
    },
  )
})
