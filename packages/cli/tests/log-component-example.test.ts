import {existsSync, readFileSync} from 'node:fs'
import {lineWidth, removeAnsi, Screen} from '@teaui/core'
import {afterEach, describe, expect, it, vi} from 'vitest'

import * as capture from '../lib/examples/samples/capture.js'
import {logExample} from '../lib/examples/samples/log.js'

const SIZE = {width: 36, height: 5}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('log CLI component example', () => {
  it.each(['core', 'react'] as const)(
    '%s displays and captures the exact executable sample',
    async framework => {
      const moduleUrl = new URL(
        `../lib/examples/samples/log.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
        import.meta.url,
      )
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(logExample.source[framework]()).toBe(source)
      expect(source).toContain(`from '@teaui/${framework}'`)
      expect(source).not.toMatch(/captureExample|HeadlessProgram|tui-/)
      if (framework === 'react') {
        expect(source).toContain("import React from 'react'")
        expect(source).toContain('<Log')
        expect(source).toContain('logs={[')
        expect(source).toContain('await run(')
        expect(source).not.toContain('createElement')
        expect(
          existsSync(
            new URL('../lib/examples/samples/log.react.js', import.meta.url),
          ),
        ).toBe(false)
      }

      const originalStart = Screen.start
      const captureSpy = vi.spyOn(capture, 'captureExample')
      const output = await logExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)
      expect(Screen.start).toBe(originalStart)

      const text = removeAnsi(output)
      const lines = text.split('\n')
      expect(lines).toHaveLength(SIZE.height)
      expect(lines.every(line => lineWidth(line) === SIZE.width)).toBe(true)
      for (const message of [
        'Server started',
        'Slow connection',
        'Retry needed',
        'Check the network',
      ]) {
        expect(text).toContain(message)
      }
      expect(text).toMatchSnapshot()
      expect(output).toMatchSnapshot('ANSI output')
      expect(await logExample.render[framework]()).toBe(output)
      expect(Screen.start).toBe(originalStart)
    },
  )

  it('renders matching Core and public-wrapper React content', async () => {
    const core = await logExample.render.core()
    const react = await logExample.render.react()
    expect(removeAnsi(react)).toBe(removeAnsi(core))
  })
})
