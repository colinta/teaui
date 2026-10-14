import {existsSync, readFileSync} from 'node:fs'
import {lineWidth, removeAnsi, TestTerminal} from '@teaui/core'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {codeExample} from '../lib/examples/samples/code.js'
import * as capture from '../lib/examples/samples/capture.js'

const SIZE = {width: 40, height: 7}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('code CLI component example', () => {
  it('documents the separate package and only supported props for both APIs', () => {
    expect(codeExample.name).toBe('code')
    expect(codeExample.availability).toBe('both')
    expect(codeExample.description).toContain('@teaui/code/react')
    expect(
      codeExample.props.map(({name, type, availability}) => ({
        name,
        type,
        availability,
      })),
    ).toEqual([
      {name: 'code', type: 'string', availability: 'both'},
      {name: 'language', type: 'string', availability: 'both'},
      {name: 'showLineNumbers', type: 'boolean', availability: 'both'},
      {name: 'highlightLines', type: 'number[]', availability: 'both'},
      {name: 'wrap', type: 'boolean', availability: 'both'},
      {
        name: 'width',
        type: "number | 'fill' | 'shrink' | 'natural'",
        availability: 'both',
      },
      {
        name: 'height',
        type: "number | 'fill' | 'shrink' | 'natural'",
        availability: 'both',
      },
    ])
    const description = (name: string) =>
      codeExample.props.find(prop => prop.name === name)?.description
    expect(description('code')).toContain('Required')
    expect(description('language')).toContain('auto-detected')
    expect(description('showLineNumbers')).toContain('defaults to false')
    expect(description('highlightLines')).toContain('1-based')
    expect(description('highlightLines')).toContain('first display row')
    expect(description('wrap')).toContain('defaults to false (clip)')
    expect(description('wrap')).toContain('Continuation rows')
    // Unlike the main @teaui/react wrappers, @teaui/code/react does not
    // forward refs. Code is a leaf view: text is supplied by code, not children.
    expect(codeExample.props.map(prop => prop.name)).not.toContain('ref')
    expect(codeExample.props.map(prop => prop.name)).not.toContain('children')
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures the exact runnable public sample at 40 by 7',
    async framework => {
      const moduleUrl = new URL(
        `../lib/examples/samples/code.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
        import.meta.url,
      )
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(codeExample.source[framework]()).toBe(source)
      expect(source).not.toMatch(/captureExample|HeadlessProgram|tui-|\.\.\//)
      if (framework === 'core') {
        expect(source).toContain("language: 'javascript'")
        expect(source).toContain('showLineNumbers: true')
        expect(source).toContain('highlightLines: [2]')
        expect(source).toContain('wrap: true')
        expect(source).toContain('width: 40')
        expect(source).toContain('height: 7')
        expect(source).toContain("import {Code} from '@teaui/code'")
        expect(source).toContain("import {Screen} from '@teaui/core'")
        expect(source).toContain('await Screen.start(code)')
      } else {
        expect(source).toContain("import {Code} from '@teaui/code/react'")
        expect(source).toContain("import {run} from '@teaui/react'")
        expect(source).toContain("import React from 'react'")
        expect(source).toContain('<Code')
        expect(source).toContain('code={SOURCE}')
        expect(source).toContain('language="javascript"')
        expect(source).toContain('showLineNumbers')
        expect(source).toContain('highlightLines={[2]}')
        expect(source).toContain('wrap')
        expect(source).toContain('width={40}')
        expect(source).toContain('height={7}')
        expect(source).toContain('await run(')
        expect(source).not.toContain('createElement')
        expect(source).not.toContain("from '@teaui/core'")
        expect(
          existsSync(
            new URL('../lib/examples/samples/code.react.js', import.meta.url),
          ),
        ).toBe(false)
      }

      const captureSpy = vi.spyOn(capture, 'captureExample')
      const output = await codeExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)

      const text = removeAnsi(output)
      const lines = text.split('\n')
      expect(lines).toHaveLength(SIZE.height)
      expect(lines.map(line => lineWidth(line))).toEqual(
        Array(SIZE.height).fill(SIZE.width),
      )
      expect(lines[0]).toMatch(/^1│const message = /)
      // The long first source line continues without a repeated line number.
      expect(lines[1]).toMatch(/^  /)
      expect(lines[1]).toContain("wrap too.'")
      expect(lines[2]).toMatch(/^2│function greet\(name\) \{/)
      expect(lines[5]).toMatch(/^5│greet\('TeaUI'\)/)
      expect(text).toMatchSnapshot()

      // Replay the exact captured ANSI to verify styles, not just the text.
      const terminal = new TestTerminal({cols: SIZE.width, rows: SIZE.height})
      output.split('\n').forEach((line, y) => {
        terminal.move(0, y)
        terminal.write(line)
      })
      expect(terminal.styleAt(0, 0).dim).toBe(true)
      expect(terminal.styleAt(0, 2).background).toBe('gray')
      expect(terminal.styleAt(SIZE.width - 1, 2).background).toBe('gray')
      expect(terminal.styleAt(0, 0).background).not.toBe('gray')
      expect(terminal.styleAt(2, 0).foreground).not.toEqual(
        terminal.styleAt(8, 0).foreground,
      )
      expect(await codeExample.render[framework]()).toBe(output)
    },
  )

  it('renders identical Core and public React-wrapper text', async () => {
    // captureExample replaces Screen.start temporarily; captures stay sequential.
    const core = await codeExample.render.core()
    const react = await codeExample.render.react()
    expect(removeAnsi(react)).toBe(removeAnsi(core))
  })
})
