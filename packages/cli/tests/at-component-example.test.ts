import {readFileSync} from 'node:fs'
import {lineWidth, removeAnsi} from '@teaui/core'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {atExample} from '../lib/examples/samples/at.js'
import * as capture from '../lib/examples/samples/capture.js'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('at CLI component example', () => {
  it('documents anchors, sizing, and framework-specific child APIs', () => {
    expect(atExample.name).toBe('at')
    expect(atExample.availability).toBe('both')
    expect(
      atExample.props.map(({name, type, availability}) => ({
        name,
        type,
        availability,
      })),
    ).toEqual([
      {
        name: 'location',
        type: "'top-left' | 'top-center' | 'top-right' | 'left' | 'center' | 'right' | 'bottom-left' | 'bottom-center' | 'bottom-right'",
        availability: 'both',
      },
      {name: 'useAvailable', type: 'boolean', availability: 'both'},
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
      {name: 'child', type: 'View', availability: 'core'},
      {name: 'children', type: 'View[]', availability: 'core'},
      {name: 'children', type: 'React.ReactNode', availability: 'react'},
      {name: 'ref', type: 'React.Ref<At>', availability: 'react'},
    ])
    expect(atExample.props[0].description).toContain("defaults to 'top-left'")
    expect(atExample.props[1].description).toContain('defaults to false')
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures its exact executable sample at 28 by 5',
    async framework => {
      const moduleUrl = new URL(
        `../lib/examples/samples/at.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
        import.meta.url,
      )
      const executable = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(atExample.source[framework]()).toBe(executable)
      expect(executable).toContain(`from '@teaui/${framework}'`)
      expect(executable).not.toMatch(/captureExample|HeadlessProgram|tui-/)
      expect(executable).toContain(
        framework === 'core' ? 'await Screen.start(layout)' : 'await run(',
      )
      expect(executable).toContain(
        framework === 'core'
          ? "location: 'top-left'"
          : '<At location="top-left">',
      )
      expect(executable).toContain('At.topRight')
      expect(executable).toContain('At.center')
      expect(executable).toContain('At.bottomLeft')
      expect(executable).toContain('At.bottomRight')
      if (framework === 'react') {
        expect(executable).not.toContain("from '@teaui/core'")
        expect(executable).not.toContain('createElement')
        expect(executable).toContain('<ZStack width={28} height={5}>')
        expect(executable).toContain('<Text>Start</Text>')
        expect(executable).toContain('<At.topRight>')
        expect(executable).toContain('<At.center>')
        expect(executable).toContain('<At.bottomLeft>')
        expect(executable).toContain('<At.bottomRight>')
      }

      const captureSpy = vi.spyOn(capture, 'captureExample')
      const output = await atExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, {
        width: 28,
        height: 5,
      })
      // Screen.start is temporarily replaced during capture: render sequentially.
      expect(await atExample.render[framework]()).toBe(output)
    },
  )

  it('renders identical 28-column by 5-row anchored output', async () => {
    const core = await atExample.render.core()
    const react = await atExample.render.react()
    expect(react).toBe(core)

    const text = removeAnsi(core)
    const lines = text.split('\n')
    expect(lines).toHaveLength(5)
    expect(lines.map(line => lineWidth(line))).toEqual(Array(5).fill(28))
    expect(lines[0].slice(0, 5)).toBe('Start')
    expect(lines[0].slice(-5)).toBe('Ready')
    expect(lines[2].indexOf('TeaUI')).toBe(12)
    expect(lines[4].slice(0, 4)).toBe('Help')
    expect(lines[4].slice(-4)).toBe('Exit')
    expect(text).toMatchSnapshot()
  })
})
