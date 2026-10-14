import {readFileSync} from 'node:fs'
import {Pane, Text, lineWidth, removeAnsi} from '@teaui/core'
import {afterEach, describe, expect, it, vi} from 'vitest'

import * as capture from '../lib/examples/samples/capture.js'
import {paneExample} from '../lib/examples/samples/pane.js'

const SIZE = {width: 44, height: 8}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('pane CLI component example', () => {
  it('documents collapse limits, child roles, and framework-specific APIs', () => {
    expect(paneExample.name).toBe('pane')
    expect(paneExample.availability).toBe('both')
    expect(paneExample.description).toContain('draggable')

    for (const framework of ['core', 'react'] as const) {
      const props = paneExample.props.filter(
        prop => prop.availability === 'both' || prop.availability === framework,
      )
      const names = props.map(prop => prop.name)
      expect(new Set(names).size).toBe(names.length)
      expect(names).toEqual([
        'border',
        'collapsible',
        'width',
        'height',
        'padding',
        ...(framework === 'core' ? ['child', 'children'] : ['children', 'ref']),
      ])
      expect(props.find(prop => prop.name === 'border')).toEqual(
        expect.objectContaining({
          type: 'boolean',
          description: expect.stringContaining('defaults to false'),
        }),
      )
      const collapsible = props.find(prop => prop.name === 'collapsible')!
      expect(collapsible.type).toBe('boolean')
      for (const text of [
        'Defaults to true',
        'click a separator',
        '3 columns or fewer',
        'collapse on release',
        '4-column drag minimum',
      ]) {
        expect(collapsible.description).toContain(text)
      }
      for (const name of ['width', 'height']) {
        expect(props.find(prop => prop.name === name)?.type).toBe(
          "number | 'fill' | 'shrink' | 'natural'",
        )
      }
      expect(props.find(prop => prop.name === 'padding')?.type).toBe(
        'number | Partial<Edges>',
      )
      const children = props.find(prop => prop.name === 'children')!
      expect(children.type).toBe(
        framework === 'core' ? 'View[]' : 'React.ReactNode',
      )
      expect(children.description).toContain('browser panes')
      expect(children.description).toContain('detail pane')
      expect(children.description).toContain('fills the remaining width')
      if (framework === 'core') {
        expect(props.find(prop => prop.name === 'child')).toEqual(
          expect.objectContaining({
            type: 'View',
            description: expect.stringContaining('takes precedence'),
          }),
        )
      } else {
        expect(props.find(prop => prop.name === 'ref')?.type).toBe(
          'React.Ref<Pane>',
        )
      }
    }
  })

  it('matches Core defaults and browser/detail child semantics', () => {
    const pane = new Pane()
    expect(pane.border).toBe(false)
    expect(pane.browserViews).toEqual([])
    expect(pane.detailView).toBeUndefined()

    const folder = new Text('Folders')
    const file = new Text('Files')
    const preview = new Text('Preview')
    pane.update({children: [folder, file, preview]})
    expect(pane.browserViews).toEqual([folder, file])
    expect(pane.detailView).toBe(preview)

    const single = new Pane({child: preview, children: [folder, file]})
    expect(single.children).toEqual([preview])
    expect(single.browserViews).toEqual([])
    expect(single.detailView).toBe(preview)
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures the exact executable sample',
    async framework => {
      const moduleUrl = new URL(
        `../lib/examples/samples/pane.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
        import.meta.url,
      )
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(paneExample.source[framework]()).toBe(source)
      expect(source).toContain(`from '@teaui/${framework}'`)
      expect(source).not.toMatch(
        /captureExample|HeadlessProgram|tui-|setTimeout|setInterval|Math\.random|Date\./,
      )
      for (const [prop, value] of [
        ['width', 44],
        ['height', 8],
        ['height', 5],
        ['height', 3],
        ['border', true],
        ['border', false],
        ['collapsible', true],
        ['collapsible', false],
      ] as const) {
        expect(source).toContain(
          framework === 'react' ? `${prop}={${value}}` : `${prop}: ${value}`,
        )
      }
      if (framework === 'react') {
        expect(source).toContain("import React from 'react'")
        expect(source).toContain('await run(')
        expect(source).toContain('<Stack.down')
        expect(source).toContain('<Pane')
        expect(source).toContain('<Text>')
        expect(source).not.toContain('createElement')
        expect(source).not.toContain("from '@teaui/core'")
      } else {
        expect(source).toContain('new Pane(')
        expect(source).toContain('await Screen.start(examples)')
      }

      const captureSpy = vi.spyOn(capture, 'captureExample')
      const output = await paneExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)

      const text = removeAnsi(output)
      const lines = text.split('\n')
      expect(lines).toHaveLength(SIZE.height)
      expect(lines.map(line => lineWidth(line))).toEqual(
        Array(SIZE.height).fill(SIZE.width),
      )
      for (const label of [
        'Folders',
        'Files',
        'Preview',
        'Selected message',
        'Drag separators to resize',
        'Pinned',
        'Non-collapsible',
        'Click keeps the sidebar open',
        'Drag minimum: 4 columns',
      ]) {
        expect(text).toContain(label)
      }
      expect(lines[0].match(/┰/g)).toHaveLength(2)
      expect(lines[4].match(/┸/g)).toHaveLength(2)
      expect(lines[1].match(/┃/g)).toHaveLength(2)
      expect(lines[5].match(/┃/g)).toHaveLength(1)
      expect(lines[5]).not.toContain('│')
      expect(text).toMatchSnapshot()
      expect(await paneExample.render[framework]()).toBe(output)
    },
  )

  it('produces identical Core and public-wrapper React output', async () => {
    // captureExample overrides Screen.start; captures must remain sequential.
    const core = await paneExample.render.core()
    const react = await paneExample.render.react()
    expect(react).toBe(core)
  })
})
