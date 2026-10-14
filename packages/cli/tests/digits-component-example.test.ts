import {existsSync, readFileSync} from 'node:fs'
import {lineWidth, removeAnsi, TestTerminal} from '@teaui/core'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {digitsExample} from '../lib/examples/samples/digits.js'
import * as capture from '../lib/examples/samples/capture.js'

const SIZE = {width: 12, height: 10}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('digits CLI component example', () => {
  it('documents supported shared props and the public React-only ref', () => {
    expect(digitsExample.name).toBe('digits')
    expect(digitsExample.availability).toBe('both')
    expect(
      digitsExample.props.map(({name, type, availability}) => ({
        name,
        type,
        availability,
      })),
    ).toEqual([
      {name: 'text', type: 'string | number', availability: 'both'},
      {name: 'style', type: 'Style', availability: 'both'},
      {name: 'bold', type: 'boolean', availability: 'both'},
      {name: 'width', type: 'Dimension', availability: 'both'},
      {name: 'height', type: 'Dimension', availability: 'both'},
      {name: 'ref', type: 'React.Ref<Digits>', availability: 'react'},
    ])
    const description = (name: string) =>
      digitsExample.props.find(prop => prop.name === name)?.description
    expect(description('text')).toContain('Required')
    expect(description('text')).toContain('lowercase letters become uppercase')
    expect(description('text')).toContain('unsupported characters are ignored')
    expect(description('text')).toContain('newlines')
    expect(description('style')).toContain('@teaui/core')
    expect(description('bold')).toContain('not the ANSI bold')
    expect(description('bold')).toContain('defaults to false')
    expect(description('height')).toContain('three rows per line')
    expect(digitsExample.props.map(prop => prop.name)).not.toContain('children')
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures the exact runnable public sample',
    async framework => {
      const moduleUrl = new URL(
        `../lib/examples/samples/digits.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
        import.meta.url,
      )
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(digitsExample.source[framework]()).toBe(source)
      expect(source).not.toMatch(/captureExample|HeadlessProgram|tui-|\.\.\//)
      if (framework === 'core') {
        expect(source).toContain("text: 'tea\\n3.14'")
        expect(source).toContain('text: 2026')
        expect(source).toContain('bold: true')
        expect(source).toContain("style: new Style({foreground: 'cyan'})")
        expect(source).toContain(
          "import {Digits, Screen, Stack, Style} from '@teaui/core'",
        )
        expect(source).toContain('new Digits(')
        expect(source).toContain('await Screen.start(digits)')
      } else {
        expect(source).toContain("import {Style} from '@teaui/core'")
        expect(source).toContain(
          "import {Digits, Stack, run} from '@teaui/react'",
        )
        expect(source).toContain("import React from 'react'")
        expect(source).toContain('<Stack direction="down" gap={1}>')
        expect(source).toContain("<Digits text={'tea\\n3.14'} />")
        expect(source).toContain(
          "<Digits text={2026} bold style={new Style({foreground: 'cyan'})} />",
        )
        expect(source).not.toContain('createElement')
        expect(source).toContain('await run(')
        expect(
          existsSync(
            new URL('../lib/examples/samples/digits.react.js', import.meta.url),
          ),
        ).toBe(false)
      }

      const captureSpy = vi.spyOn(capture, 'captureExample')
      const output = await digitsExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)

      const text = removeAnsi(output)
      const lines = text.split('\n')
      expect(lines).toHaveLength(SIZE.height)
      expect(lines.map(line => lineWidth(line))).toEqual(
        Array(SIZE.height).fill(SIZE.width),
      )
      // Lowercase input is converted to letters, and the newline advances
      // three rows. The decimal point remains a one-column punctuation glyph.
      expect(lines[0]).toContain('╶┬╴┌─╴╭─╮')
      expect(lines[5]).toContain('╶─╯.╶┴╴  ╵')
      expect(lines[6].trim()).toBe('')
      expect(lines[7]).toBe('╺━┓┏━┓╺━┓┏━╸')
      expect(text).toMatchSnapshot()

      const terminal = new TestTerminal({cols: SIZE.width, rows: SIZE.height})
      output.split('\n').forEach((line, y) => {
        terminal.move(0, y)
        terminal.write(line)
      })
      expect(terminal.styleAt(0, 7).foreground).toBe('cyan')
      expect(terminal.styleAt(5, 9).foreground).toBe('cyan')
      expect(terminal.styleAt(0, 0).foreground).not.toBe('cyan')
      // The bold prop selects a different glyph set, not an SGR attribute.
      expect(terminal.styleAt(0, 7).bold).not.toBe(true)
      expect(await digitsExample.render[framework]()).toBe(output)
    },
  )

  it('renders identical Core and public React-wrapper output', async () => {
    // Captures patch Screen.start temporarily, so execute sequentially.
    const core = await digitsExample.render.core()
    const react = await digitsExample.render.react()
    expect(react).toBe(core)
  })
})
