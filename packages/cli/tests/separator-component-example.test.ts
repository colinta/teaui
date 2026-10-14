import {readFileSync} from 'node:fs'
import {lineWidth, removeAnsi, Separator, Size} from '@teaui/core'
import {afterEach, describe, expect, it, vi} from 'vitest'

import * as capture from '../lib/examples/samples/capture.js'
import {separatorExample} from '../lib/examples/samples/separator.js'

const SIZE = {width: 36, height: 20}
const BORDERS = [
  {name: 'single', char: '─'},
  {name: 'leading', char: '▔'},
  {name: 'trailing', char: '▁'},
  {name: 'bold', char: '━'},
  {name: 'dash', char: '╴'},
  {name: 'dash2', char: '╌'},
  {name: 'dash3', char: '┄'},
  {name: 'dash4', char: '┈'},
  {name: 'double', char: '═'},
]

afterEach(() => {
  vi.restoreAllMocks()
})

describe('separator CLI component example', () => {
  it('describes direction helpers, all border presets, numeric padding, and React refs', () => {
    expect(separatorExample.name).toBe('separator')
    expect(separatorExample.availability).toBe('both')
    expect(separatorExample.description).toContain('nine border styles')
    expect(
      separatorExample.props.map(({name, type, availability}) => ({
        name,
        type,
        availability,
      })),
    ).toEqual([
      {
        name: 'direction',
        type: "'horizontal' | 'vertical'",
        availability: 'both',
      },
      {
        name: 'border',
        type: "'single' | 'leading' | 'trailing' | 'bold' | 'dash' | 'dash2' | 'dash3' | 'dash4' | 'double'",
        availability: 'both',
      },
      {name: 'padding', type: 'number', availability: 'both'},
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
      {name: 'purpose', type: 'Palette | Purpose', availability: 'both'},
      {name: 'ref', type: 'React.Ref<Separator>', availability: 'react'},
    ])
    const description = (name: string) =>
      separatorExample.props.find(prop => prop.name === name)!.description
    expect(description('direction')).toContain('Required on the base Separator')
    expect(description('direction')).toContain('Separator.horizontal')
    expect(description('direction')).toContain('Separator.vertical')
    expect(description('border')).toContain("defaults to 'single'")
    expect(description('padding')).toContain('Defaults to 0')
    expect(description('padding')).toContain('1 + 4 × padding')
    expect(description('purpose')).toContain('text style')
    expect(separatorExample.props.some(prop => prop.name === 'children')).toBe(
      false,
    )
  })

  it('documents the actual public natural dimensions for numeric padding', () => {
    const available = new Size(SIZE.width, SIZE.height)
    expect(Separator.horizontal().naturalSize(available)).toEqual(
      new Size(SIZE.width, 1),
    )
    expect(Separator.vertical().naturalSize(available)).toEqual(
      new Size(1, SIZE.height),
    )
    expect(Separator.horizontal({padding: 1}).naturalSize(available)).toEqual(
      new Size(SIZE.width, 5),
    )
    expect(Separator.vertical({padding: 1}).naturalSize(available)).toEqual(
      new Size(5, SIZE.height),
    )
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures its exact deterministic executable sample',
    async framework => {
      const filename = `separator.${framework}.${framework === 'react' ? 'tsx' : 'js'}`
      const moduleUrl = new URL(
        `../lib/examples/samples/${filename}`,
        import.meta.url,
      )
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(separatorExample.source[framework]()).toBe(source)
      expect(source).toContain(`from '@teaui/${framework}'`)
      expect(source).not.toMatch(
        /captureExample|HeadlessProgram|tui-|createElement|setTimeout|setInterval|Math.random|Date.now|\.\.\//,
      )
      for (const border of BORDERS) {
        expect(source).toContain(`'${border.name}'`)
      }
      if (framework === 'core') {
        expect(source).toContain("new Separator({direction: 'horizontal'")
        expect(source).toContain('Separator.vertical()')
        expect(source).toContain("Separator.vertical({border: 'bold'})")
        expect(source).toContain(
          "Separator.horizontal({border: 'double', padding: 1})",
        )
        expect(source).toContain('await Screen.start(examples)')
      } else {
        expect(source).toContain('<Separator direction="horizontal"')
        expect(source).toContain('<Separator.vertical />')
        expect(source).toContain('<Separator.vertical border="bold" />')
        expect(source).toContain(
          '<Separator.horizontal border="double" padding={1} />',
        )
        expect(source).toContain('await run(<App />)')
        expect(source).not.toContain("from '@teaui/core'")
      }

      const captureSpy = vi.spyOn(capture, 'captureExample')
      const output = await separatorExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)
      const text = removeAnsi(output)
      const lines = text.split('\n')
      expect(lines).toHaveLength(SIZE.height)
      expect(lines.map(line => lineWidth(line))).toEqual(
        Array(SIZE.height).fill(SIZE.width),
      )
      expect(text).toMatchSnapshot()

      expect(lines[0].trim()).toBe('Horizontal borders')
      BORDERS.forEach((border, index) => {
        expect(lines[index + 1]).toBe(
          border.name.padEnd(10) + border.char.repeat(26),
        )
      })
      expect(lines[10].trim()).toBe('Vertical: single / bold / double')
      expect(lines[11].trimEnd()).toBe('Left    │Middle  ┃Right   ║')
      for (const row of [11, 12, 13]) {
        expect(lines[row][8]).toBe('│')
        expect(lines[row][17]).toBe('┃')
        expect(lines[row][26]).toBe('║')
      }
      expect(lines[14].trim()).toBe('Numeric padding: 1 (five rows)')
      for (const row of [15, 16, 18, 19]) {
        expect(lines[row]).toBe(' '.repeat(SIZE.width))
      }
      expect(lines[17]).toBe(` ${'═'.repeat(34)} `)
      expect(await separatorExample.render[framework]()).toBe(output)
      expect(captureSpy).toHaveBeenNthCalledWith(2, moduleUrl, SIZE)
    },
  )

  it('captures identical visible Core and JSX output', async () => {
    // Captures temporarily replace Screen.start, so execute them sequentially.
    const core = await separatorExample.render.core()
    const react = await separatorExample.render.react()
    expect(removeAnsi(react)).toBe(removeAnsi(core))
  })
})
