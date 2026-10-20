import {readFileSync} from 'node:fs'
import {lineWidth, removeAnsi, Screen} from '@teaui/core'
import {afterEach, describe, expect, it, vi} from 'vitest'

import * as capture from '../lib/examples/samples/capture.js'
import {windowExample} from '../lib/examples/samples/window.js'

const SIZE = {width: 44, height: 10}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('window CLI component example', () => {
  it('documents each prop once per framework', () => {
    expect(windowExample.name).toBe('window')
    expect(windowExample.availability).toBe('both')
    for (const framework of ['core', 'react'] as const) {
      const names = windowExample.props
        .filter(
          prop =>
            prop.availability === 'both' || prop.availability === framework,
        )
        .map(prop => prop.name)
      expect(new Set(names).size).toBe(names.length)
      expect(names).toContain('children')
      expect(names.includes('ref')).toBe(framework === 'react')
      expect(names.includes('child')).toBe(framework === 'core')
    }
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures the exact public sample',
    async framework => {
      const extension = framework === 'react' ? 'tsx' : 'js'
      const moduleUrl = new URL(
        `../lib/examples/samples/window.${framework}.${extension}`,
        import.meta.url,
      )
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(windowExample.source[framework]()).toBe(source)
      expect(source).toContain(`from '@teaui/${framework}'`)
      expect(source).not.toMatch(
        /captureExample|HeadlessProgram|tui-|setTimeout|setInterval|Math\.random|Date\./,
      )
      if (framework === 'react') {
        expect(source).toContain('await run(<App />)')
        expect(source).not.toMatch(/createElement|from '@teaui\/core'/)
      } else {
        expect(source).toContain('await Screen.start(')
      }

      const start = Screen.start
      const captureSpy = vi.spyOn(capture, 'captureExample')
      const output = await windowExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)
      expect(output).toBe(await captureSpy.mock.results[0].value)
      expect(Screen.start).toBe(start)

      const lines = removeAnsi(output).split('\n')
      expect(lines).toHaveLength(SIZE.height)
      expect(lines.map(line => lineWidth(line))).toEqual(
        Array(SIZE.height).fill(SIZE.width),
      )
    },
  )

  it('produces identical Core and JSX React output', async () => {
    const core = await windowExample.render.core()
    const react = await windowExample.render.react()
    expect(react).toBe(core)
    expect(removeAnsi(core)).toMatchSnapshot()
  })
})
