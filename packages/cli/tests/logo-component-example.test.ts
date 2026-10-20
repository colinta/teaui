import {readFileSync} from 'node:fs'
import {lineWidth, Logo, removeAnsi, Screen, TestTerminal} from '@teaui/core'
import {afterEach, describe, expect, it, vi} from 'vitest'

import * as capture from '../lib/examples/samples/capture.js'
import {logoExample} from '../lib/examples/samples/logo.js'

const SIZE = {width: 16, height: 7}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('logo CLI component example', () => {
  it('documents animation, construction-only seeding, natural size, and the React ref', () => {
    expect(logoExample.name).toBe('logo')
    expect(logoExample.availability).toBe('both')
    expect(logoExample.description).toContain('animated braille steam')
    expect(
      logoExample.props.map(({name, type, availability}) => ({
        name,
        type,
        availability,
      })),
    ).toEqual([
      {name: 'isAnimating', type: 'boolean', availability: 'both'},
      {name: 'seed', type: 'number', availability: 'both'},
      {name: 'width', type: 'Dimension', availability: 'both'},
      {name: 'height', type: 'Dimension', availability: 'both'},
      {name: 'ref', type: 'React.Ref<Logo>', availability: 'react'},
    ])
    const description = (name: string) =>
      logoExample.props.find(prop => prop.name === name)?.description
    expect(description('isAnimating')).toContain('defaults to false')
    expect(description('isAnimating')).toContain('static steam')
    expect(description('seed')).toContain('Construction-only')
    expect(description('seed')).toContain('same tick sequence')
    expect(description('seed')).toContain('defaults to time and randomness')
    expect(description('seed')).toContain('Later prop updates do not reseed')
    expect(description('width')).toContain('natural width is 16')
    expect(description('width')).toContain('rather than scaling')
    expect(description('height')).toContain('natural height is 7')
    expect(description('height')).toContain('two steam rows')
    expect(logoExample.props.map(prop => prop.name)).not.toContain('children')
    expect(logoExample.props.map(prop => prop.name)).not.toContain('style')
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures the exact deterministic public sample',
    async framework => {
      const moduleUrl = new URL(
        `../lib/examples/samples/logo.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
        import.meta.url,
      )
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(logoExample.source[framework]()).toBe(source)
      expect(source).toContain(`from '@teaui/${framework}'`)
      expect(source).not.toMatch(
        /captureExample|HeadlessProgram|tui-|setTimeout|setInterval|Math.random|Date.now|\.\.\//,
      )
      if (framework === 'core') {
        expect(source).toContain('new Logo(')
        expect(source).toContain('{isAnimating: false, seed: 42}')
        expect(source).toContain('await Screen.start(logo)')
      } else {
        expect(source).toContain("import React from 'react'")
        expect(source).toContain('<Logo isAnimating={false} seed={42} />')
        expect(source).toContain('await run(logo)')
        expect(source).not.toMatch(/createElement|from '@teaui\/core'/)
      }

      const originalStart = Screen.start
      const captureSpy = vi.spyOn(capture, 'captureExample')
      const stopSpy = vi.spyOn(Screen.prototype, 'stop')
      const tickSpy = vi.spyOn(Logo.prototype, 'receiveTick')
      const output = await logoExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)
      expect(Screen.start).toBe(originalStart)
      expect(stopSpy).toHaveBeenCalledOnce()
      expect(tickSpy).not.toHaveBeenCalled()

      const text = removeAnsi(output)
      const lines = text.split('\n')
      expect(lines).toHaveLength(SIZE.height)
      expect(lines.map(line => lineWidth(line))).toEqual(
        Array(SIZE.height).fill(SIZE.width),
      )
      expect(lines[0]).toBe('     ) ) )      ')
      expect(lines[1]).toBe('    ( ( (       ')
      expect(lines[4]).toContain(' TeaUI  ')
      expect(lines[6]).toContain('╰▄▄▄▄▄▄▄▄╯')
      expect(text).not.toMatch(/[\u2800-\u28ff]/)
      expect(text).toMatchSnapshot()

      // Verify styles by replaying captured ANSI, not by rendering a second view.
      const terminal = new TestTerminal({cols: SIZE.width, rows: SIZE.height})
      output.split('\n').forEach((line, y) => {
        terminal.move(0, y)
        terminal.write(line)
      })
      expect(terminal.styleAt(5, 0).foreground).toEqual([128, 128, 128])
      expect(terminal.styleAt(1, 2).foreground).toEqual([240, 223, 175])
      expect(terminal.styleAt(2, 3).foreground).toEqual([140, 208, 211])
      expect(terminal.styleAt(11, 2).foreground).toEqual([128, 128, 128])
      expect(terminal.styleAt(2, 6).foreground).toEqual([240, 223, 175])

      expect(await logoExample.render[framework]()).toBe(output)
      expect(captureSpy).toHaveBeenNthCalledWith(2, moduleUrl, SIZE)
      expect(Screen.start).toBe(originalStart)
      expect(stopSpy).toHaveBeenCalledTimes(2)
      expect(tickSpy).not.toHaveBeenCalled()
    },
  )

  it('renders identical Core and public React-wrapper text', async () => {
    // Capture patches Screen.start temporarily, so execute sequentially.
    // React adds a Root whose default style also colors trailing blank cells.
    const core = await logoExample.render.core()
    const react = await logoExample.render.react()
    expect(removeAnsi(react)).toBe(removeAnsi(core))
  })
})
