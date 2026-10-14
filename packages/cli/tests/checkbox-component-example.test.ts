import {readFileSync} from 'node:fs'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {lineWidth, removeAnsi} from '@teaui/core'

import {checkboxExample} from '../lib/examples/samples/checkbox.js'
import * as capture from '../lib/examples/samples/capture.js'

const SIZE = {width: 24, height: 1}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('checkbox CLI component example', () => {
  it('documents the boolean control without unsupported container props', () => {
    expect(checkboxExample.name).toBe('checkbox')
    expect(checkboxExample.availability).toBe('both')

    for (const framework of ['core', 'react'] as const) {
      const props = checkboxExample.props.filter(
        prop => prop.availability === 'both' || prop.availability === framework,
      )
      const names = props.map(prop => prop.name)
      expect(names).toEqual([
        'title',
        'value',
        'onChange',
        'hotKey',
        'purpose',
        'width',
        'height',
        ...(framework === 'react' ? ['ref'] : []),
      ])
      expect(new Set(names).size).toBe(names.length)
      expect(props.find(prop => prop.name === 'value')?.type).toBe('boolean')
      expect(props.find(prop => prop.name === 'onChange')?.type).toBe(
        '(value: boolean) => void',
      )
      expect(props.find(prop => prop.name === 'width')?.type).toBe('Dimension')
      expect(props.find(prop => prop.name === 'height')?.type).toBe('Dimension')
    }
    expect(checkboxExample.props.find(prop => prop.name === 'ref')).toEqual({
      name: 'ref',
      type: 'React.Ref<Checkbox>',
      description: 'Reference to the underlying Core Checkbox',
      availability: 'react',
    })
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures the exact executable sample',
    async framework => {
      const moduleUrl = new URL(
        `../lib/examples/samples/checkbox.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
        import.meta.url,
      )
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(checkboxExample.source[framework]()).toBe(source)
      expect(source).not.toMatch(/captureExample|HeadlessProgram|tui-/)
      expect(source).toContain(`from '@teaui/${framework}'`)
      if (framework === 'react') {
        expect(source).toContain('<Checkbox')
        expect(source).toContain('width={24}')
        expect(source).toContain('height={1}')
        expect(source).toContain('value={value}')
        expect(source).toContain('onChange={setValue}')
        expect(source).toContain('await run(<App />)')
        expect(source).not.toContain('createElement')
        expect(source).not.toContain("from '@teaui/core'")
      } else {
        expect(source).toContain('width: 24')
        expect(source).toContain('height: 1')
        expect(source).toContain('await Screen.start(checkbox)')
      }

      const captureSpy = vi.spyOn(capture, 'captureExample')
      const output = await checkboxExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)

      const rendered = removeAnsi(output)
      expect(rendered).toContain('☐ Notifications: off')
      expect(rendered).toMatchSnapshot()
      const lines = rendered.split('\n')
      expect(lines).toHaveLength(SIZE.height)
      expect(lines.every(line => lineWidth(line) === SIZE.width)).toBe(true)
      expect(await checkboxExample.render[framework]()).toBe(output)
    },
  )

  it('produces identical Core and public-wrapper React output', async () => {
    expect(await checkboxExample.render.react()).toBe(
      await checkboxExample.render.core(),
    )
  })
})
