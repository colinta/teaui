import {existsSync, readFileSync} from 'node:fs'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {lineWidth, removeAnsi} from '@teaui/core'

import {dropdownExample} from '../lib/examples/samples/dropdown.js'
import * as capture from '../lib/examples/samples/capture.js'

const SIZE = {width: 30, height: 12}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('dropdown CLI component example', () => {
  it('documents generic values and mode-dependent props for each public API', () => {
    expect(dropdownExample.name).toBe('dropdown')
    expect(dropdownExample.availability).toBe('both')

    for (const framework of ['core', 'react'] as const) {
      const props = dropdownExample.props.filter(
        prop => prop.availability === 'both' || prop.availability === framework,
      )
      const names = props.map(prop => prop.name)
      expect(names).toEqual([
        'choices',
        'title',
        'multiple',
        'selected',
        'onSelect',
        'purpose',
        'width',
        'height',
      ])
      expect(new Set(names).size).toBe(names.length)
      expect(props.find(prop => prop.name === 'choices')).toEqual(
        expect.objectContaining({
          type: '[string, T][]',
          description: expect.stringContaining('strict equality'),
          availability: 'both',
        }),
      )
      expect(props.find(prop => prop.name === 'title')?.description).toContain(
        'Placeholder when nothing is selected',
      )
      expect(props.find(prop => prop.name === 'multiple')).toEqual(
        expect.objectContaining({
          type: 'boolean',
          description: expect.stringContaining('do not toggle it in updates'),
        }),
      )
      for (const name of ['width', 'height']) {
        expect(props.find(prop => prop.name === name)?.type).toBe('Dimension')
      }
      for (const name of ['child', 'children', 'hotKey', 'ref']) {
        expect(names).not.toContain(name)
      }
    }

    const coreProps = dropdownExample.props.filter(
      prop => prop.availability === 'core',
    )
    expect(coreProps).toEqual([
      expect.objectContaining({
        name: 'selected',
        type: 'M extends true ? readonly T[] : T | undefined',
        description: expect.stringContaining('required array'),
      }),
      expect.objectContaining({
        name: 'onSelect',
        type: 'M extends true ? (values: T[]) => void : (value: T) => void',
      }),
    ])
    const reactProps = dropdownExample.props.filter(
      prop => prop.availability === 'react',
    )
    expect(reactProps).toEqual([
      expect.objectContaining({
        name: 'selected',
        type: 'T | readonly T[]',
        description: expect.stringContaining(
          'Optional in React types, but multiple mode needs an array at runtime',
        ),
      }),
      expect.objectContaining({
        name: 'onSelect',
        type: '((value: T) => void) | ((values: T[]) => void)',
        description: expect.stringContaining('determined by multiple'),
      }),
    ])
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures the exact executable sample',
    async framework => {
      const moduleUrl = new URL(
        `../lib/examples/samples/dropdown.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
        import.meta.url,
      )
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(dropdownExample.source[framework]()).toBe(source)
      expect(source).not.toMatch(/captureExample|HeadlessProgram|tui-/)
      expect(source).not.toMatch(/setTimeout|Math\.random|Date\./)
      expect(source).toContain(`from '@teaui/${framework}'`)
      expect(source).toContain(
        framework === 'react' ? 'width={30}' : 'width: 30',
      )
      expect(source).toContain(
        framework === 'react' ? 'height={12}' : 'height: 12',
      )
      expect(source).toContain("['apple', 'cherry']")
      expect(source).toContain("['Banana', 'banana']")
      if (framework === 'react') {
        expect(source).toContain('await run(<App />)')
        expect(source).toContain('<Stack.down')
        expect(source).toContain('<Dropdown<string>')
        expect(source).toContain('multiple={false}')
        expect(source).toMatch(/\n\s+multiple\n/)
        expect(source).toContain('selected={single}')
        expect(source).toContain('selected={multiple}')
        expect(source).toContain('onSelect={setSingle}')
        expect(source).toContain('onSelect={setMultiple}')
        expect(source).toContain('useState<string | undefined>(undefined)')
        expect(source).not.toContain('createElement')
        expect(source).not.toContain("from '@teaui/core'")
        expect(
          existsSync(
            new URL(
              '../lib/examples/samples/dropdown.react.js',
              import.meta.url,
            ),
          ),
        ).toBe(false)
      } else {
        expect(source).toContain('multiple: false')
        expect(source).toContain('multiple: true')
        expect(source).toContain('await Screen.start(examples)')
        expect(source).toContain('single.selected = value')
        expect(source).toContain('multiple.selected = values')
      }

      const captureSpy = vi.spyOn(capture, 'captureExample')
      const output = await dropdownExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)
      expect(output).toBe(await captureSpy.mock.results[0].value)

      const rendered = removeAnsi(output)
      expect(rendered).toContain('Single selection')
      expect(rendered).toContain('Pick a fruit')
      expect(rendered).toContain('Multiple selection')
      expect(rendered).toContain('Apple, Cherry')
      expect(rendered).not.toContain('Pick several fruits')
      expect(rendered).not.toContain('Banana')
      expect(rendered.match(/▽/g)).toHaveLength(2)
      const lines = rendered.split('\n')
      expect(lines).toHaveLength(SIZE.height)
      expect(lines.map(line => lineWidth(line))).toEqual(
        Array(SIZE.height).fill(SIZE.width),
      )
      expect(rendered).toMatchSnapshot()
      expect(await dropdownExample.render[framework]()).toBe(output)
    },
  )

  it('produces identical Core and public-wrapper React text', async () => {
    expect(removeAnsi(await dropdownExample.render.react())).toBe(
      removeAnsi(await dropdownExample.render.core()),
    )
  })
})
