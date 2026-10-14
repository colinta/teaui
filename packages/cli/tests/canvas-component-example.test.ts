import {existsSync, readFileSync} from 'node:fs'
import {Canvas, lineWidth, removeAnsi} from '@teaui/core'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {canvasExample} from '../lib/examples/samples/canvas.js'
import * as capture from '../lib/examples/samples/capture.js'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('canvas CLI component example', () => {
  it('documents drawing and terminal dimensions, not drawing methods as props', () => {
    expect(canvasExample.name).toBe('canvas')
    expect(canvasExample.availability).toBe('both')
    expect(canvasExample.description).toContain('2×4 pixels')
    expect(canvasExample.props).toEqual([
      expect.objectContaining({
        name: 'draw',
        type: '(canvas: Canvas) => void',
        availability: 'both',
      }),
      expect.objectContaining({
        name: 'width',
        type: "number | 'fill' | 'shrink' | 'natural'",
        availability: 'both',
      }),
      expect.objectContaining({
        name: 'height',
        type: "number | 'fill' | 'shrink' | 'natural'",
        availability: 'both',
      }),
      expect.objectContaining({
        name: 'ref',
        type: 'React.Ref<Canvas>',
        availability: 'react',
      }),
    ])
    expect(canvasExample.props[0].description).toContain('cleared before each')
    expect(canvasExample.props[1].description).toContain('terminal columns')
    expect(canvasExample.props[2].description).toContain('terminal rows')
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures the exact runnable sample at 24 by 8',
    async framework => {
      const moduleUrl = new URL(
        `../lib/examples/samples/canvas.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
        import.meta.url,
      )
      const executable = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(canvasExample.source[framework]()).toBe(executable)
      expect(executable).toContain(`from '@teaui/${framework}'`)
      expect(executable).not.toMatch(/captureExample|HeadlessProgram|tui-/)
      expect(executable).toContain(
        framework === 'react' ? 'width={24}' : 'width: 24',
      )
      expect(executable).toContain(
        framework === 'react' ? 'height={8}' : 'height: 8',
      )
      expect(executable).toContain(
        framework === 'core' ? 'await Screen.start(canvas)' : 'await run(',
      )
      if (framework === 'react') {
        expect(executable).toContain("import {Canvas, run} from '@teaui/react'")
        expect(executable).toContain("import React from 'react'")
        expect(executable).toContain('<Canvas')
        expect(executable).toContain('draw={canvas => {')
        expect(executable).not.toContain('createElement')
        expect(executable).not.toContain("from '@teaui/core'")
        expect(
          existsSync(
            new URL('../lib/examples/samples/canvas.react.js', import.meta.url),
          ),
        ).toBe(false)
      }

      const captureSpy = vi.spyOn(capture, 'captureExample')
      const rectSpy = vi.spyOn(Canvas.prototype, 'rect')
      const lineSpy = vi.spyOn(Canvas.prototype, 'line')
      const circleSpy = vi.spyOn(Canvas.prototype, 'circle')
      const output = await canvasExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, {
        width: 24,
        height: 8,
      })
      // The draw callback receives a sized 48×32-pixel buffer.
      expect(rectSpy).toHaveBeenCalledWith(0, 0, 48, 32)
      expect(lineSpy).toHaveBeenCalledWith(0, 31, 47, 0)
      expect(circleSpy).toHaveBeenCalledWith(24, 16, 10)

      const text = removeAnsi(output)
      const lines = text.split('\n')
      expect(lines).toHaveLength(8)
      expect(lines.map(line => lineWidth(line))).toEqual(Array(8).fill(24))
      expect(text.replaceAll('\n', '')).toMatch(/^[\u2800-\u28ff]+$/u)
      expect(text).toMatchSnapshot()
      expect(await canvasExample.render[framework]()).toBe(output)
    },
  )

  it('renders identical Core and public React output', async () => {
    // captureExample temporarily replaces Screen.start; captures are sequential.
    const core = await canvasExample.render.core()
    const react = await canvasExample.render.react()
    expect(react).toBe(core)
  })
})
