import {existsSync, readFileSync} from 'node:fs'
import {lineWidth, removeAnsi, TestTerminal} from '@teaui/core'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {headerExample} from '../lib/examples/samples/header.js'
import * as capture from '../lib/examples/samples/capture.js'

const SIZE = {width: 48, height: 19}
const PRESETS = [
  {text: 'H1: Double / bold', row: 0, border: '═', bold: true, dim: false},
  {text: 'H2: Heavy / bold', row: 3, border: '━', bold: true, dim: false},
  {text: 'H3: Single / bold', row: 6, border: '─', bold: true, dim: false},
  {text: 'H4: Single / normal', row: 9, border: '─', bold: false, dim: false},
  {text: 'H5: Single / dim', row: 12, border: '─', bold: false, dim: true},
  {text: 'H6: No border / dim', row: 15, border: '', bold: false, dim: true},
]

afterEach(() => {
  vi.restoreAllMocks()
})

describe('header CLI component example', () => {
  it('documents configurable Header options and the shared H1–H6 presets', () => {
    expect(headerExample.name).toBe('header')
    expect(headerExample.availability).toBe('both')
    expect(headerExample.description).toContain('H1–H6')
    expect(headerExample.description).toContain('Configurable Header')
    expect(
      headerExample.props.map(({name, type, availability}) => ({
        name,
        type,
        availability,
      })),
    ).toEqual([
      {name: 'text', type: 'string', availability: 'both'},
      {name: 'children', type: 'string', availability: 'react'},
      {
        name: 'border',
        type: "'none' | 'single' | 'bold' | 'double'",
        availability: 'both',
      },
      {name: 'font', type: 'FontFamily', availability: 'both'},
      {name: 'bold', type: 'boolean', availability: 'both'},
      {name: 'dim', type: 'boolean', availability: 'both'},
      {name: 'ref', type: 'React.Ref<Header>', availability: 'react'},
    ])
    const description = (name: string) =>
      headerExample.props.find(prop => prop.name === name)?.description
    expect(description('text')).toContain('required by the Core Header')
    expect(description('text')).toContain('optional in React')
    expect(description('border')).toContain('H3–H5 single, and H6 none')
    expect(description('font')).toContain('not configurable on H1–H6 presets')
    expect(description('bold')).toContain('enabled by H1–H3')
    expect(description('dim')).toContain('enabled by H5–H6')
    expect(
      headerExample.props
        .filter(prop => prop.availability === 'both')
        .map(prop => prop.name),
    ).toEqual(['text', 'border', 'font', 'bold', 'dim'])
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures the exact deterministic public sample',
    async framework => {
      const moduleUrl = new URL(
        `../lib/examples/samples/header.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
        import.meta.url,
      )
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(headerExample.source[framework]()).toBe(source)
      expect(source).toContain(`from '@teaui/${framework}'`)
      expect(source).not.toMatch(
        /captureExample|HeadlessProgram|tui-|setTimeout|setInterval|Math.random|Date.now|\.\.\//,
      )
      for (let index = 1; index <= 6; index++) {
        expect(source).toContain(
          framework === 'core' ? `H${index}('` : `<H${index}`,
        )
      }
      if (framework === 'core') {
        expect(source).toContain('new Header({')
        expect(source).toContain("font: 'double-struck'")
        expect(source).toContain("border: 'double'")
        expect(source).toContain('bold: false')
        expect(source).toContain('dim: true')
        expect(source).toContain('await Screen.start(headings)')
      } else {
        expect(source).toContain("import React from 'react'")
        expect(source).toContain('<Stack.down width={48} height={19} gap={1}>')
        expect(source).toContain('<H1 text="H1: Double / bold" />')
        expect(source).toContain('<H2>H2: Heavy / bold</H2>')
        expect(source).toContain('<H3 text="H3: Single / bold" />')
        expect(source).toContain('<H4>H4: Single / normal</H4>')
        expect(source).toContain('<H5 text="H5: Single / dim" />')
        expect(source).toContain('<H6>H6: No border / dim</H6>')
        expect(source).toContain(
          '<Header border="double" font="double-struck" bold={false} dim>',
        )
        expect(source).toContain('Custom font')
        expect(source).toContain('await run(<App />)')
        expect(source).not.toMatch(/createElement|new Header/)
        expect(
          existsSync(
            new URL('../lib/examples/samples/header.react.js', import.meta.url),
          ),
        ).toBe(false)
        expect(source).not.toContain("from '@teaui/core'")
      }

      const captureSpy = vi.spyOn(capture, 'captureExample')
      const output = await headerExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)
      const text = removeAnsi(output)
      const lines = text.split('\n')
      expect(lines).toHaveLength(SIZE.height)
      expect(lines.map(line => lineWidth(line))).toEqual(
        Array(SIZE.height).fill(SIZE.width),
      )
      expect(text).toMatchSnapshot()

      // Replay the exact captured ANSI to verify each preset's emphasis.
      const terminal = new TestTerminal({cols: SIZE.width, rows: SIZE.height})
      output.split('\n').forEach((line, y) => {
        terminal.move(0, y)
        terminal.write(line)
      })
      for (const preset of PRESETS) {
        expect(lines[preset.row].trim()).toBe(preset.text)
        expect(lines[preset.row].startsWith(` ${preset.text}`)).toBe(true)
        expect(terminal.styleAt(1, preset.row).bold === true).toBe(preset.bold)
        expect(terminal.styleAt(1, preset.row).dim === true).toBe(preset.dim)
        expect(lines[preset.row + 1].trim()).toBe(
          preset.border.repeat(preset.text.length + 2),
        )
        if (preset.border) {
          expect(terminal.styleAt(0, preset.row + 1).bold === true).toBe(
            preset.bold,
          )
          expect(terminal.styleAt(0, preset.row + 1).dim === true).toBe(
            preset.dim,
          )
        }
      }
      expect(lines[17].trim()).toBe('ℂ𝕦𝕤𝕥𝕠𝕞 𝕗𝕠𝕟𝕥')
      expect(lines[18].trim()).toBe('═'.repeat(13))
      expect(terminal.styleAt(1, 17).bold === true).toBe(false)
      expect(terminal.styleAt(1, 17).dim).toBe(true)
      expect(await headerExample.render[framework]()).toBe(output)
      expect(captureSpy).toHaveBeenNthCalledWith(2, moduleUrl, SIZE)
    },
  )

  it('renders the same configurable Header and presets in Core and React', async () => {
    // Captures replace Screen.start temporarily, so they must run sequentially.
    const core = await headerExample.render.core()
    const react = await headerExample.render.react()
    expect(removeAnsi(react)).toBe(removeAnsi(core))
  })
})
