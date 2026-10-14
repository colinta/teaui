import {existsSync, readFileSync} from 'node:fs'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {lineWidth, removeAnsi, TestTerminal} from '@teaui/core'

import {fontStyleExample} from '../lib/examples/samples/font-style.js'
import * as capture from '../lib/examples/samples/capture.js'

const SIZE = {width: 48, height: 5}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('font-style CLI component example', () => {
  it('documents named boolean styles, not the managed ToggleGroup props', () => {
    expect(fontStyleExample.name).toBe('font-style')
    expect(fontStyleExample.availability).toBe('both')
    expect(fontStyleExample.description).toContain('independently with a mouse')

    for (const framework of ['core', 'react'] as const) {
      const props = fontStyleExample.props.filter(
        prop => prop.availability === 'both' || prop.availability === framework,
      )
      expect(props.map(prop => prop.name)).toEqual([
        'value',
        'onChange',
        'purpose',
        'width',
        'height',
        ...(framework === 'react' ? ['ref'] : []),
      ])
      expect(props.find(prop => prop.name === 'value')?.type).toBe(
        'FontStyleValue',
      )
      expect(props.find(prop => prop.name === 'value')?.description).toContain(
        'bold, italic, underline, and strikethrough',
      )
      expect(props.find(prop => prop.name === 'onChange')?.type).toBe(
        '(value: FontStyleValue) => void',
      )
      expect(props.find(prop => prop.name === 'width')?.type).toBe('Dimension')
      expect(props.find(prop => prop.name === 'height')?.type).toBe('Dimension')
    }

    expect(fontStyleExample.props.find(prop => prop.name === 'ref')).toEqual({
      name: 'ref',
      type: 'React.Ref<FontStyle>',
      description: 'Reference to the underlying Core FontStyle',
      availability: 'react',
    })
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures the exact deterministic public sample',
    async framework => {
      const moduleUrl = new URL(
        `../lib/examples/samples/font-style.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
        import.meta.url,
      )
      const executable = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(fontStyleExample.source[framework]()).toBe(executable)
      expect(executable).toContain(`from '@teaui/${framework}'`)
      expect(executable).toContain('FontStyle')
      expect(executable).toContain('strikethrough: false')
      expect(executable).not.toMatch(
        /captureExample|HeadlessProgram|tui-|setTimeout|setInterval|Math.random|Date.now/,
      )
      if (framework === 'core') {
        expect(executable).toContain('await Screen.start(toolbar)')
        expect(executable).toContain('summary.text = describeStyles(value)')
        expect(executable).toContain('onChange:')
      } else {
        expect(executable).toContain('await run(<App />)')
        expect(executable).toContain(
          '<Stack.down width={48} height={5} gap={1}>',
        )
        expect(executable).toContain(
          '<FontStyle value={value} onChange={setValue} />',
        )
        expect(executable).toContain('<Text>{describeStyles(value)}</Text>')
        expect(executable).not.toContain('createElement')
        expect(executable).not.toContain("from '@teaui/core'")
        expect(
          existsSync(
            new URL(
              '../lib/examples/samples/font-style.react.js',
              import.meta.url,
            ),
          ),
        ).toBe(false)
      }

      const captureSpy = vi.spyOn(capture, 'captureExample')
      const output = await fontStyleExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)

      const rendered = removeAnsi(output)
      expect(rendered).toMatchSnapshot()
      expect(rendered).toContain('Enabled: bold, underline')
      expect(rendered.split('\n')).toHaveLength(SIZE.height)
      expect(
        rendered.split('\n').every(line => lineWidth(line) === SIZE.width),
      ).toBe(true)
      const terminal = new TestTerminal({cols: SIZE.width, rows: SIZE.height})
      output.split('\n').forEach((line, y) => {
        terminal.move(0, y)
        terminal.write(line)
      })
      expect(terminal.styleOf('B')?.bold).toBe(true)
      expect(terminal.styleOf('I')?.italic).toBe(true)
      expect(terminal.styleOf('U')?.underline).toBe(true)
      expect(terminal.styleOf('S')?.strikeout).toBe(true)
      for (const label of ['B', 'U']) {
        expect(terminal.styleOf(label)?.background).toEqual([97, 97, 97])
      }
      for (const label of ['I', 'S']) {
        expect(terminal.styleOf(label)?.background).not.toEqual([97, 97, 97])
      }
      expect(await fontStyleExample.render[framework]()).toBe(output)
      expect(captureSpy).toHaveBeenNthCalledWith(2, moduleUrl, SIZE)
    },
  )

  it('produces identical Core and public React wrapper text output', async () => {
    // captureExample temporarily replaces Screen.start, so captures are sequential.
    const core = await fontStyleExample.render.core()
    const react = await fontStyleExample.render.react()
    expect(removeAnsi(react)).toBe(removeAnsi(core))
  })
})
