import {readFileSync} from 'node:fs'
import {lineWidth, removeAnsi, TestTerminal} from '@teaui/core'
import {afterEach, describe, expect, it, vi} from 'vitest'

import * as capture from '../lib/examples/samples/capture.js'
import {textExample} from '../lib/examples/samples/text.js'

const SIZE = {width: 36, height: 11}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('text CLI component example', () => {
  it('distinguishes Core content and Style instances from React children and style objects', () => {
    expect(textExample.name).toBe('text')
    expect(textExample.availability).toBe('both')
    expect(textExample.description).toContain('word wrapping')
    expect(textExample.description).toContain('left/center/right alignment')
    expect(
      textExample.props.map(({name, type, availability}) => ({
        name,
        type,
        availability,
      })),
    ).toEqual([
      {name: 'text', type: 'string', availability: 'core'},
      {name: 'lines', type: 'string[]', availability: 'core'},
      {name: 'children', type: 'React.ReactNode', availability: 'react'},
      {
        name: 'alignment',
        type: "'left' | 'center' | 'right'",
        availability: 'both',
      },
      {name: 'wrap', type: 'boolean', availability: 'both'},
      {name: 'font', type: 'FontFamily', availability: 'both'},
      {name: 'style', type: 'Style', availability: 'core'},
      {name: 'style', type: 'Partial<Style>', availability: 'react'},
      ...[
        'bold',
        'dim',
        'italic',
        'underline',
        'strikeout',
        'inverse',
        'blink',
        'invisible',
      ].map(name => ({name, type: 'boolean', availability: 'react'})),
      {name: 'foreground', type: 'Color', availability: 'react'},
      {name: 'background', type: 'Color', availability: 'react'},
      {name: 'link', type: 'string', availability: 'react'},
      {name: 'linkParams', type: 'string', availability: 'react'},
      {name: 'width', type: 'Dimension', availability: 'both'},
      {name: 'height', type: 'Dimension', availability: 'both'},
      {
        name: 'ref',
        type: 'React.Ref<React.ComponentRef<typeof Text>>',
        availability: 'react',
      },
    ])
    const description = (name: string) =>
      textExample.props.find(prop => prop.name === name)!.description
    expect(description('text')).toContain('Mutually exclusive with lines')
    expect(description('alignment')).toContain("defaults to 'left'")
    expect(description('wrap')).toContain('Defaults to false (clip)')
    expect(description('font')).toContain('not a terminal font selection')
    expect(description('font')).toContain("defaults to 'default'")
    expect(description('ref')).toContain('not an underlying Core Text')
    expect(description('blink')).toContain('does not emit blink codes')
    expect(description('invisible')).toContain('does not emit conceal codes')
    expect(
      textExample.props.find(
        prop => prop.name === 'style' && prop.availability === 'react',
      )?.description,
    ).toContain('override direct styling props')
    for (const framework of ['core', 'react'] as const) {
      const names = textExample.props
        .filter(
          prop =>
            prop.availability === 'both' || prop.availability === framework,
        )
        .map(prop => prop.name)
      expect(new Set(names).size).toBe(names.length)
      expect(names).not.toContain('align')
      expect(names).not.toContain('strikethrough')
      if (framework === 'core') {
        expect(names).toContain('text')
        expect(names).toContain('lines')
        expect(names).not.toContain('children')
        expect(names).not.toContain('bold')
      } else {
        expect(names).toContain('children')
        expect(names).not.toContain('text')
        expect(names).not.toContain('lines')
      }
    }
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures the exact deterministic executable public sample',
    async framework => {
      const extension = framework === 'core' ? 'js' : 'tsx'
      const moduleUrl = new URL(
        `../lib/examples/samples/text.${framework}.${extension}`,
        import.meta.url,
      )
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(textExample.source[framework]()).toBe(source)
      expect(source).toContain(`from '@teaui/${framework}'`)
      expect(source).not.toMatch(
        /captureExample|HeadlessProgram|tui-|createElement|setTimeout|setInterval|Math.random|Date.now|\.\.\//,
      )
      if (framework === 'core') {
        expect(source).toContain('new Text(')
        expect(source).toContain('new Style(')
        expect(source).toContain(
          "lines: ['First source line', 'Second source line']",
        )
        expect(source).toContain("alignment: 'center'")
        expect(source).toContain("alignment: 'right'")
        expect(source).toContain('wrap: true')
        expect(source).toContain('wrap: false')
        expect(source).toContain('await Screen.start(example)')
      } else {
        expect(source).toContain("import React from 'react'")
        expect(source).toContain('<Stack.down width={WIDTH} height={HEIGHT}>')
        expect(source).toContain('<Text style={headingStyle}>')
        expect(source).toContain('alignment="center"')
        expect(source).toContain('alignment="right"')
        expect(source).toContain('wrap={false}')
        expect(source).toContain('<Text font="monospace">TeaUI 123</Text>')
        expect(source).toContain('await run(<App />)')
        expect(source).not.toContain("from '@teaui/core'")
      }

      const captureSpy = vi.spyOn(capture, 'captureExample')
      const output = await textExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)

      const text = removeAnsi(output)
      const lines = text.split('\n')
      expect(lines).toHaveLength(SIZE.height)
      expect(lines.map(line => lineWidth(line))).toEqual(
        Array(SIZE.height).fill(SIZE.width),
      )
      expect(lines.map(line => line.trimEnd())).toEqual([
        'Text: style, wrap, alignment',
        'Left aligned',
        '              Centered',
        '                       Right aligned',
        'Wrap: words stay',
        'together with room',
        'to spare',
        'No wrap: this line',
        'First source line',
        'Second source line',
        '𝚃𝚎𝚊𝚄𝙸 𝟷𝟸𝟹',
      ])
      expect(text).not.toContain('is clipped here.')
      expect(text).toMatchSnapshot()

      const terminal = new TestTerminal({cols: SIZE.width, rows: SIZE.height})
      output.split('\n').forEach((line, y) => {
        terminal.move(0, y)
        terminal.write(line)
      })
      expect(terminal.styleOf('Text: style, wrap, alignment')?.bold).toBe(true)
      expect(
        terminal.styleOf('Text: style, wrap, alignment')?.foreground,
      ).toEqual([255, 170, 0])
      expect(terminal.styleOf('Centered')?.italic).toBe(true)
      expect(terminal.styleOf('Centered')?.foreground).toEqual([136, 170, 255])
      expect(terminal.styleOf('Right aligned')?.underline).toBe(true)
      expect(terminal.styleOf('Right aligned')?.foreground).toEqual([
        0, 255, 136,
      ])
      expect(terminal.styleOf('Right aligned')?.background).toEqual([
        32, 32, 64,
      ])
      for (const label of [
        'Wrap: words stay',
        'together with room',
        'to spare',
      ]) {
        expect(terminal.styleOf(label)?.foreground).toEqual([0, 255, 136])
        expect(terminal.styleOf(label)?.underline).not.toBe(true)
        expect(terminal.styleOf(label)?.background).not.toEqual([32, 32, 64])
      }
      for (const y of [1, 7, 8, 9, 10]) {
        const style = terminal.styleAt(0, y)
        expect(style?.bold).not.toBe(true)
        expect(style?.italic).not.toBe(true)
        expect(style?.underline).not.toBe(true)
        expect(style?.foreground).not.toEqual([0, 255, 136])
        expect(style?.foreground).not.toEqual([255, 170, 0])
        expect(style?.background).not.toEqual([32, 32, 64])
      }
      expect(await textExample.render[framework]()).toBe(output)
      expect(captureSpy).toHaveBeenNthCalledWith(2, moduleUrl, SIZE)
    },
  )

  it('produces identical Core and public React JSX text output', async () => {
    // Screen.start is temporarily replaced, so captures must remain sequential.
    const core = await textExample.render.core()
    const react = await textExample.render.react()
    expect(removeAnsi(react)).toBe(removeAnsi(core))
  })
})
