import {existsSync, readFileSync} from 'node:fs'
import {lineWidth, removeAnsi} from '@teaui/core'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {geometryExample} from '../lib/examples/samples/geometry.js'
import * as capture from '../lib/examples/samples/capture.js'

const SIZE = {width: 32, height: 6}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('geometry CLI component example', () => {
  it('documents changed content-size callbacks and framework-specific children', () => {
    expect(geometryExample.name).toBe('geometry')
    expect(geometryExample.availability).toBe('both')
    expect(geometryExample.description).toContain('fills available space')
    expect(
      geometryExample.props.map(({name, type, availability}) => ({
        name,
        type,
        availability,
      })),
    ).toEqual([
      {
        name: 'onLayout',
        type: '(size: Size) => void',
        availability: 'both',
      },
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
      {
        name: 'padding',
        type: 'number | Partial<Edges>',
        availability: 'both',
      },
      {name: 'child', type: 'View', availability: 'core'},
      {name: 'children', type: 'View[]', availability: 'core'},
      {
        name: 'children',
        type: 'React.ReactNode',
        availability: 'react',
      },
      {name: 'ref', type: 'React.Ref<Geometry>', availability: 'react'},
    ])
    const description = (name: string) =>
      geometryExample.props.find(prop => prop.name === name)?.description
    expect(description('onLayout')).toContain(
      'when non-empty content size changes',
    )
    expect(description('onLayout')).toContain('before children render')
    expect(description('onLayout')).toContain('terminal columns/rows')
    expect(description('onLayout')).toContain('excludes padding')
    expect(description('onLayout')).toContain('layout probes are skipped')
    expect(description('padding')).toContain('subtracted')
    expect(description('child')).toContain('takes precedence')
    expect(description('children')).toContain('Overlapping')
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures the exact runnable public sample',
    async framework => {
      const moduleUrl = new URL(
        `../lib/examples/samples/geometry.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
        import.meta.url,
      )
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(geometryExample.source[framework]()).toBe(source)
      expect(source).not.toMatch(/captureExample|HeadlessProgram|tui-|\.\.\//)
      expect(source).not.toMatch(/setTimeout|setInterval|Math\.random|Date\./)
      expect(source).toContain(
        framework === 'react' ? 'padding={1}' : 'padding: 1',
      )
      expect(source).toContain('size.height - 1')
      expect(source).toContain('Content: ${size.width}×${size.height}')
      expect(source).not.toContain('Content: 30×4')
      if (framework === 'core') {
        expect(source).toContain(
          "import {Geometry, Screen, Text} from '@teaui/core'",
        )
        expect(source).toContain('new Geometry(')
        expect(source).toContain('content.text =')
        expect(source).toContain('await Screen.start(geometry)')
      } else {
        expect(source).toContain(
          "import {Geometry, Text, run} from '@teaui/react'",
        )
        expect(source).not.toContain("from '@teaui/core'")
        expect(source).toContain('useState({width: 0, height: 0})')
        expect(source).toContain("import React, {useState} from 'react'")
        expect(source).toContain('<Geometry padding={1} onLayout={setSize}>')
        expect(source).toContain('<Text>{text}</Text>')
        expect(source).toContain('await run(<App />)')
        expect(source).not.toContain('createElement')
        expect(
          existsSync(
            new URL(
              '../lib/examples/samples/geometry.react.js',
              import.meta.url,
            ),
          ),
        ).toBe(false)
      }

      const captureSpy = vi.spyOn(capture, 'captureExample')
      const output = await geometryExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)

      const text = removeAnsi(output)
      const lines = text.split('\n')
      expect(lines).toHaveLength(SIZE.height)
      expect(lines.map(line => lineWidth(line))).toEqual(
        Array(SIZE.height).fill(SIZE.width),
      )
      expect(lines.map(line => line.trim())).toEqual([
        '',
        'Content: 30×4',
        '1. Tea',
        '2. Coffee',
        '3. Cocoa',
        '',
      ])
      expect(
        lines.every(line => line.startsWith(' ') && line.endsWith(' ')),
      ).toBe(true)
      expect(text).not.toMatch(/0×0|Water|Juice|Milk/)
      expect(text).toMatchSnapshot()
      expect(await geometryExample.render[framework]()).toBe(output)
    },
  )

  it.each(['core', 'react'] as const)(
    '%s recomputes content from a different measured viewport',
    async framework => {
      const output = await capture.captureExample(
        new URL(
          `../lib/examples/samples/geometry.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
          import.meta.url,
        ),
        {width: 20, height: 5},
      )
      const text = removeAnsi(output)
      expect(text.split('\n').map(line => line.trim())).toEqual([
        '',
        'Content: 18×3',
        '1. Tea',
        '2. Coffee',
        '',
      ])
      expect(text).not.toContain('Cocoa')
      expect(text).toMatchSnapshot()
    },
  )

  it('renders identical Core and public React-wrapper output', async () => {
    // Captures patch Screen.start temporarily, so execute sequentially.
    const core = await geometryExample.render.core()
    const react = await geometryExample.render.react()
    expect(react).toBe(core)
  })
})
