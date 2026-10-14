import {readFileSync} from 'node:fs'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {lineWidth, removeAnsi, TestTerminal} from '@teaui/core'

import {radioExample} from '../lib/examples/samples/radio.js'
import * as capture from '../lib/examples/samples/capture.js'

const SIZE = {width: 28, height: 5}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('radio CLI component example', () => {
  it('documents generic option values without inventing RadioGroup or container props', () => {
    expect(radioExample.name).toBe('radio')
    expect(radioExample.availability).toBe('both')
    expect(radioExample.description).toContain('nearest RadioGroup')

    for (const framework of ['core', 'react'] as const) {
      const props = radioExample.props.filter(
        prop => prop.availability === 'both' || prop.availability === framework,
      )
      const names = props.map(prop => prop.name)
      expect(names).toEqual([
        'title',
        'value',
        'hotKey',
        'purpose',
        'width',
        'height',
        ...(framework === 'react' ? ['ref'] : []),
      ])
      expect(new Set(names).size).toBe(names.length)
      for (const name of [
        'onChange',
        'selected',
        'child',
        'children',
        'focusable',
      ]) {
        expect(names).not.toContain(name)
      }
      const prop = (name: string) => props.find(prop => prop.name === name)
      expect(prop('title')?.type).toBe('string')
      expect(prop('value')?.type).toBe('T')
      expect(prop('value')?.description).toContain('Required option value')
      expect(prop('value')?.description).toContain('T defaults to unknown')
      expect(prop('value')?.description).toContain('Object.is')
      expect(prop('value')?.description).toContain('Use unique values')
      expect(prop('hotKey')?.type).toBe('HotKey')
      expect(prop('hotKey')?.description).toContain(
        'Does not register an unfocused shortcut',
      )
      expect(prop('purpose')?.type).toBe('Palette | Purpose')
      for (const name of ['width', 'height']) {
        expect(prop(name)?.type).toBe('Dimension')
      }
    }

    expect(radioExample.props.find(prop => prop.name === 'ref')).toEqual({
      name: 'ref',
      type: 'React.Ref<Radio<T>>',
      description:
        'Reference to the underlying Core Radio with the same value type',
      availability: 'react',
    })
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures the exact deterministic executable sample',
    async framework => {
      const moduleUrl = new URL(
        `../lib/examples/samples/radio.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
        import.meta.url,
      )
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(radioExample.source[framework]()).toBe(source)
      expect(source).toContain(`from '@teaui/${framework}'`)
      expect(source).not.toMatch(
        /captureExample|HeadlessProgram|tui-|setTimeout|setInterval|Math\.random|Date\./,
      )
      expect(source).toContain('RadioGroup')
      expect(source).toContain('Stack.down')
      for (const value of ['compact', 'comfortable', 'spacious']) {
        expect(source).toContain(
          framework === 'react' ? `value="${value}"` : `value: '${value}'`,
        )
      }
      if (framework === 'react') {
        expect(source).toContain("import React, {useState} from 'react'")
        expect(source).toContain("useState('comfortable')")
        expect(source).toContain('<Stack.down width={28} height={5}>')
        expect(source).toContain(
          '<RadioGroup value={value} onChange={setValue} purpose="primary">',
        )
        expect(source).toContain('await run(<App />)')
        expect(source).not.toMatch(/createElement|from '@teaui\/core'/)
      } else {
        expect(source).toContain('width: 28')
        expect(source).toContain('height: 5')
        expect(source).toContain('selected.text = `Selected: ${value}`')
        expect(source).toContain('await Screen.start(examples)')
      }

      const captureSpy = vi.spyOn(capture, 'captureExample')
      const output = await radioExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)
      expect(output).toBe(await captureSpy.mock.results[0].value)

      const rendered = removeAnsi(output)
      expect(rendered).toContain('Choose a density')
      expect(rendered).toContain('◯ Compact')
      expect(rendered).toContain('⦿ Comfortable')
      expect(rendered).toContain('◯ Spacious')
      expect(rendered).toContain('Selected: comfortable')
      expect(rendered.match(/⦿/g)).toHaveLength(1)
      expect(rendered.match(/◯/g)).toHaveLength(2)
      const lines = rendered.split('\n')
      expect(lines).toHaveLength(SIZE.height)
      expect(lines.map(line => lineWidth(line))).toEqual(
        Array(SIZE.height).fill(SIZE.width),
      )
      expect(rendered).toMatchSnapshot()

      // Replay the captured ANSI rather than rendering a test-only substitute.
      const terminal = new TestTerminal({cols: SIZE.width, rows: SIZE.height})
      output.split('\n').forEach((line, y) => {
        terminal.move(0, y)
        terminal.write(line)
      })
      expect(terminal.styleOf('⌥c')?.underline).toBe(true)
      expect(terminal.styleOf('⌥o')?.underline).toBe(true)
      expect(terminal.styleOf('⌥s')?.underline).toBe(true)
      expect(terminal.styleOf('Compact')?.underline).not.toBe(true)

      expect(await radioExample.render[framework]()).toBe(output)
      expect(captureSpy).toHaveBeenNthCalledWith(2, moduleUrl, SIZE)
    },
  )

  it('produces identical Core and public-wrapper React output', async () => {
    // captureExample temporarily replaces Screen.start, so run sequentially.
    const core = await radioExample.render.core()
    const react = await radioExample.render.react()
    expect(react).toBe(core)
  })
})
