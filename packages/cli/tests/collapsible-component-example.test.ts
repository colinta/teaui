import {existsSync, readFileSync} from 'node:fs'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {lineWidth, removeAnsi} from '@teaui/core'

import {collapsibleExample} from '../lib/examples/samples/collapsible.js'
import * as capture from '../lib/examples/samples/capture.js'

const SIZE = {width: 32, height: 8}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('collapsible CLI component example', () => {
  it('documents preview state and framework-specific content slots', () => {
    expect(collapsibleExample.name).toBe('collapsible')
    expect(collapsibleExample.availability).toBe('both')

    for (const framework of ['core', 'react'] as const) {
      const props = collapsibleExample.props.filter(
        prop => prop.availability === 'both' || prop.availability === framework,
      )
      const names = props.map(prop => prop.name)
      expect(new Set(names).size).toBe(names.length)
      expect(names).toEqual([
        'isCollapsed',
        'showCollapsed',
        'preview',
        'collapsed',
        'expanded',
        'width',
        'height',
        ...(framework === 'core' ? ['child', 'children'] : ['ref']),
      ])
      expect(props.find(prop => prop.name === 'isCollapsed')).toEqual(
        expect.objectContaining({
          type: 'boolean',
          description: expect.stringContaining('clicks toggle it internally'),
        }),
      )
      expect(props.find(prop => prop.name === 'showCollapsed')).toEqual(
        expect.objectContaining({
          type: 'boolean',
          description: expect.stringContaining('full collapsed view'),
        }),
      )
      expect(props.find(prop => prop.name === 'preview')).toEqual(
        expect.objectContaining({
          type: 'number',
          description: expect.stringContaining('clamped to at least 1'),
        }),
      )
      for (const name of ['collapsed', 'expanded']) {
        expect(props.find(prop => prop.name === name)?.type).toBe(
          framework === 'core' ? 'View' : 'React.ReactNode',
        )
      }
      for (const name of ['width', 'height']) {
        expect(props.find(prop => prop.name === name)?.type).toBe('Dimension')
      }
    }
    expect(
      collapsibleExample.props.find(prop => prop.name === 'children'),
    ).toEqual(expect.objectContaining({type: 'View[]', availability: 'core'}))
    expect(collapsibleExample.props.find(prop => prop.name === 'ref')).toEqual({
      name: 'ref',
      type: 'React.Ref<Collapsible>',
      description: 'Reference to the underlying Core Collapsible',
      availability: 'react',
    })
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures the exact executable sample',
    async framework => {
      const moduleUrl = new URL(
        `../lib/examples/samples/collapsible.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
        import.meta.url,
      )
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(collapsibleExample.source[framework]()).toBe(source)
      expect(source).not.toMatch(/captureExample|HeadlessProgram|tui-/)
      expect(source).toContain(`from '@teaui/${framework}'`)
      if (framework === 'react') {
        expect(source).toContain("import React from 'react'")
        expect(source).toContain('await run(')
        expect(source).toContain('<Stack.down width={32} height={8} gap={1}>')
        expect(source.match(/<Collapsible\s/g)).toHaveLength(3)
        expect(source).toContain('preview={2}')
        expect(source).toMatch(/\s+isCollapsed\s+preview=/)
        expect(source.match(/isCollapsed=\{false\}/g)).toHaveLength(2)
        expect(source).toMatch(/\s+showCollapsed\s+collapsed=/)
        expect(source).toContain('collapsed={')
        expect(source).toContain('expanded={<Text>Additional details</Text>}')
        expect(source).not.toContain('createElement')
        expect(source).not.toContain("from '@teaui/core'")
        expect(
          existsSync(
            new URL(
              '../lib/examples/samples/collapsible.react.js',
              import.meta.url,
            ),
          ),
        ).toBe(false)
      } else {
        expect(source).toContain('width: 32')
        expect(source).toContain('height: 8')
        expect(source).toContain('preview: 2')
        expect(source).toContain('showCollapsed: true')
        expect(source).toContain('new Collapsible(')
        expect(source).toContain('await Screen.start(examples)')
      }

      const captureSpy = vi.spyOn(capture, 'captureExample')
      const output = await collapsibleExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)

      const text = removeAnsi(output)
      const lines = text.split('\n')
      expect(lines).toHaveLength(SIZE.height)
      expect(lines.map(line => lineWidth(line))).toEqual(
        Array(SIZE.height).fill(SIZE.width),
      )
      expect(text).toContain('Two-line preview')
      expect(text).toContain('Click to expand')
      expect(text).toContain('Expanded content')
      expect(text).toContain('Click to collapse')
      expect(text).toContain('Summary stays visible')
      expect(text).toContain('Additional details')
      expect(text).not.toContain('Hidden preview line')
      expect(text).not.toContain('Hidden expanded content')
      expect(text).not.toContain('Replaced preview')
      expect(text.match(/►/g)).toHaveLength(1)
      expect(text.match(/▼/g)).toHaveLength(2)
      expect(text).toMatchSnapshot()
      expect(await collapsibleExample.render[framework]()).toBe(output)
    },
  )

  it('produces identical Core and public-wrapper React text', async () => {
    expect(removeAnsi(await collapsibleExample.render.react())).toBe(
      removeAnsi(await collapsibleExample.render.core()),
    )
  })
})
