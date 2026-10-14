import {readFileSync} from 'node:fs'
import {lineWidth, removeAnsi} from '@teaui/core'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {alignExample} from '../lib/examples/samples/align.js'
import * as capture from '../lib/examples/samples/capture.js'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('align component example', () => {
  it('documents shared layout props and framework-specific child APIs', () => {
    expect(alignExample.name).toBe('align')
    expect(alignExample.availability).toBe('both')
    expect(
      alignExample.props.map(({name, type, availability}) => ({
        name,
        type,
        availability,
      })),
    ).toEqual([
      {
        name: 'direction',
        type: "'up' | 'down' | 'left' | 'right'",
        availability: 'both',
      },
      {name: 'separator', type: 'string', availability: 'both'},
      {name: 'separatorStyle', type: 'Style', availability: 'both'},
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
      {
        name: 'children',
        type: 'React.ReactNode',
        availability: 'react',
      },
      {name: 'ref', type: 'React.Ref<Align>', availability: 'react'},
    ])
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures its exact executable sample',
    async framework => {
      const moduleUrl = new URL(
        `../lib/examples/samples/align.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
        import.meta.url,
      )
      const executable = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(alignExample.source[framework]()).toBe(executable)
      expect(executable).toContain(`from '@teaui/${framework}'`)
      expect(executable).not.toMatch(/captureExample|HeadlessProgram|tui-/)
      expect(executable).toContain(
        framework === 'core' ? 'await Screen.start(align)' : 'await run(',
      )
      expect(executable).toContain(
        framework === 'core' ? 'Align.row(' : '<Align.Row>',
      )
      if (framework === 'react') {
        expect(executable).not.toContain("from '@teaui/core'")
        expect(executable).not.toContain('createElement')
        expect(executable).toContain('<Align width={21} height={4}>')
        expect(executable).toContain('<Text>TeaUI project details</Text>')
        expect(executable.match(/<Align.Row>/g)).toHaveLength(3)
      }

      const captureSpy = vi.spyOn(capture, 'captureExample')
      const output = await alignExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, {
        width: 21,
        height: 4,
      })
      // Screen.start is temporarily replaced during capture: render sequentially.
      expect(await alignExample.render[framework]()).toBe(output)
    },
  )

  it('renders identical 21-column by 4-row aligned output', async () => {
    const core = await alignExample.render.core()
    const react = await alignExample.render.react()
    expect(react).toBe(core)

    const text = removeAnsi(core)
    const lines = text.split('\n')
    expect(lines).toHaveLength(4)
    expect(lines.map(line => lineWidth(line))).toEqual([21, 21, 21, 21])
    expect(lines[0]).toBe('TeaUI project details')
    expect(lines.slice(1).map(line => line.indexOf('│'))).toEqual([9, 9, 9])
    expect(text).toMatchSnapshot()
  })
})
