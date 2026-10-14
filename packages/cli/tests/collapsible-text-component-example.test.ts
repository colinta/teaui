import {readFileSync} from 'node:fs'
import {lineWidth, removeAnsi} from '@teaui/core'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {collapsibleTextExample} from '../lib/examples/samples/collapsible-text.js'
import * as capture from '../lib/examples/samples/capture.js'

const SIZE = {width: 32, height: 4}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('collapsible-text CLI component example', () => {
  it('documents text preview and style without unsupported controlled state or children', () => {
    expect(collapsibleTextExample.name).toBe('collapsible-text')
    expect(collapsibleTextExample.availability).toBe('both')
    expect(collapsibleTextExample.description).toContain('click')

    for (const framework of ['core', 'react'] as const) {
      const props = collapsibleTextExample.props.filter(
        prop => prop.availability === 'both' || prop.availability === framework,
      )
      const names = props.map(prop => prop.name)
      expect(names).toEqual([
        'text',
        'preview',
        'style',
        'purpose',
        'width',
        'height',
        ...(framework === 'react' ? ['ref'] : []),
      ])
      expect(new Set(names).size).toBe(names.length)
      expect(props.find(prop => prop.name === 'text')).toEqual(
        expect.objectContaining({
          type: 'string',
          description: expect.stringContaining('Required'),
        }),
      )
      expect(props.find(prop => prop.name === 'preview')).toEqual(
        expect.objectContaining({
          type: 'number',
          description: expect.stringContaining('defaults to 1'),
        }),
      )
      expect(
        props.find(prop => prop.name === 'preview')?.description,
      ).toContain('minimum of 1')
      expect(props.find(prop => prop.name === 'style')?.type).toBe('Style')
      expect(props.find(prop => prop.name === 'purpose')?.type).toBe(
        'Palette | Purpose',
      )
      expect(props.find(prop => prop.name === 'width')?.type).toBe('Dimension')
      expect(props.find(prop => prop.name === 'height')?.type).toBe('Dimension')
    }

    expect(
      collapsibleTextExample.props.find(prop => prop.name === 'ref'),
    ).toEqual({
      name: 'ref',
      type: 'React.Ref<CollapsibleText>',
      description: 'Reference to the underlying Core CollapsibleText',
      availability: 'react',
    })
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures the exact executable two-line preview',
    async framework => {
      const extension = framework === 'react' ? 'tsx' : 'js'
      const moduleUrl = new URL(
        `../lib/examples/samples/collapsible-text.${framework}.${extension}`,
        import.meta.url,
      )
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(collapsibleTextExample.source[framework]()).toBe(source)
      expect(source).not.toMatch(/captureExample|HeadlessProgram|tui-/)
      expect(source).toContain(`from '@teaui/${framework}'`)
      if (framework === 'core') {
        expect(source).toContain('preview: 2')
        expect(source).toContain('width: 32')
        expect(source).toContain('height: 4')
        expect(source).toContain('new CollapsibleText(')
        expect(source).toContain('await Screen.start(text)')
      } else {
        expect(source).toContain('<CollapsibleText')
        expect(source).toContain('preview={2}')
        expect(source).toContain('purpose="primary"')
        expect(source).toContain('width={32}')
        expect(source).toContain('height={4}')
        expect(source).toContain('await run(')
        expect(source).not.toMatch(/createElement|from '@teaui\/core'/)
      }

      const captureSpy = vi.spyOn(capture, 'captureExample')
      const output = await collapsibleTextExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)

      const text = removeAnsi(output)
      const lines = text.split('\n')
      expect(lines).toHaveLength(SIZE.height)
      expect(lines.map(line => lineWidth(line))).toEqual(
        Array(SIZE.height).fill(SIZE.width),
      )
      expect(lines.map(line => line.trimEnd())).toEqual([
        '► Deployment summary',
        '  3 checks passed',
        '',
        '',
      ])
      expect(text).not.toContain('No warnings found')
      expect(text).not.toContain('Ready to release')
      expect(text).not.toContain('▼')
      expect(text).toMatchSnapshot()
      expect(await collapsibleTextExample.render[framework]()).toBe(output)
    },
  )

  it('produces identical Core and public-wrapper React output', async () => {
    const core = await collapsibleTextExample.render.core()
    const react = await collapsibleTextExample.render.react()
    expect(react).toBe(core)
  })
})
