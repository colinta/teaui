import {readFileSync} from 'node:fs'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {lineWidth, removeAnsi} from '@teaui/core'

import {accordionExample} from '../lib/examples/samples/accordion.js'
import * as capture from '../lib/examples/samples/capture.js'

const SIZE = {width: 30, height: 5}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('accordion CLI example', () => {
  it('documents section props and framework-specific content', () => {
    expect(accordionExample.name).toBe('accordion')
    expect(accordionExample.availability).toBe('both')

    for (const framework of ['core', 'react'] as const) {
      const props = accordionExample.props.filter(
        prop => prop.availability === 'both' || prop.availability === framework,
      )
      const names = props.map(prop => prop.name)
      expect(new Set(names).size).toBe(names.length)
      expect(names).toEqual(
        expect.arrayContaining([
          'multiple',
          'width',
          'height',
          'children',
          'Section.title',
          'Section.isOpen',
          'Section.children',
        ]),
      )
      expect(props.find(prop => prop.name === 'multiple')?.type).toBe('boolean')
      expect(props.find(prop => prop.name === 'Section.title')?.type).toBe(
        'string',
      )
      expect(props.find(prop => prop.name === 'Section.isOpen')).toEqual(
        expect.objectContaining({
          type: 'boolean',
          description: expect.stringContaining('Initially'),
        }),
      )
      for (const name of ['children', 'Section.children']) {
        expect(props.find(prop => prop.name === name)?.type).toBe(
          framework === 'core' ? 'View[]' : 'React.ReactNode',
        )
      }
      expect(names.includes('child')).toBe(framework === 'core')
      expect(names.includes('Section.child')).toBe(framework === 'core')
      expect(names.includes('Section.ref')).toBe(framework === 'react')
    }
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures the exact executable sample',
    async framework => {
      const moduleUrl = new URL(
        `../lib/examples/samples/accordion.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
        import.meta.url,
      )
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(accordionExample.source[framework]()).toBe(source)
      expect(source).not.toMatch(/captureExample|HeadlessProgram|tui-/)
      expect(source).toContain(`from '@teaui/${framework}'`)
      if (framework === 'core') {
        expect(source).toContain('Accordion.create(')
        expect(source).toContain('await Screen.start(accordion)')
      } else {
        expect(source).toContain('await run(')
        expect(source).toContain(
          '<Accordion multiple={false} width={30} height={5}>',
        )
        expect(source).toContain('<Accordion.Section title="Overview" isOpen>')
        expect(source).toContain('<Accordion.Section title="Details">')
        expect(source).not.toContain('createElement')
        expect(source).not.toContain("from '@teaui/core'")
      }

      const captureSpy = vi.spyOn(capture, 'captureExample')
      const output = await accordionExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)

      const text = removeAnsi(output)
      const lines = text.split('\n')
      expect(lines).toHaveLength(SIZE.height)
      expect(lines.map(line => lineWidth(line))).toEqual(
        Array(SIZE.height).fill(SIZE.width),
      )
      expect(text).toContain('Overview')
      expect(text).toContain('Hello, world!')
      expect(text).toContain('Details')
      expect(text).not.toContain('Click to reveal details.')
      expect(text.match(/△/g)).toHaveLength(1)
      expect(text.match(/▽/g)).toHaveLength(1)
      expect(text.match(/╶/g)).toHaveLength(2)
      expect(text).toMatchSnapshot()
      expect(await accordionExample.render[framework]()).toBe(output)
    },
  )

  it('produces identical Core and public-wrapper React text', async () => {
    expect(removeAnsi(await accordionExample.render.react())).toBe(
      removeAnsi(await accordionExample.render.core()),
    )
  })
})
