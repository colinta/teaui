import {existsSync, readFileSync} from 'node:fs'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {lineWidth, removeAnsi} from '@teaui/core'

import {calloutExample} from '../lib/examples/samples/callout.js'
import * as capture from '../lib/examples/samples/capture.js'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('callout example', () => {
  it('documents shared props and framework-specific body content', () => {
    expect(calloutExample.name).toBe('callout')
    expect(calloutExample.availability).toBe('both')
    expect(
      calloutExample.props.map(({name, availability}) => ({
        name,
        availability,
      })),
    ).toEqual([
      {name: 'title', availability: 'both'},
      {name: 'purpose', availability: 'both'},
      {name: 'direction', availability: 'both'},
      {name: 'child', availability: 'core'},
      {name: 'children', availability: 'core'},
      {name: 'children', availability: 'react'},
      {name: 'ref', availability: 'react'},
    ])
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures the exact runnable sample',
    async framework => {
      const extension = framework === 'react' ? 'tsx' : 'js'
      const moduleUrl = new URL(
        `../lib/examples/samples/callout.${framework}.${extension}`,
        import.meta.url,
      )
      const executable = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(calloutExample.source[framework]()).toBe(executable)
      expect(executable).not.toMatch(/captureExample|HeadlessProgram|tui-/)
      expect(executable).toContain(`from '@teaui/${framework}'`)
      if (framework === 'react') {
        expect(executable).toContain('<Callout title="Note" purpose="primary">')
        expect(executable).toContain('<Text>Remember to save your work.</Text>')
        expect(executable).not.toContain('createElement')
        expect(
          existsSync(
            new URL(
              '../lib/examples/samples/callout.react.js',
              import.meta.url,
            ),
          ),
        ).toBe(false)
      }

      const captureSpy = vi.spyOn(capture, 'captureExample')
      const output = await calloutExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, {
        width: 32,
        height: 5,
      })
      const text = removeAnsi(output)
      const lines = text.split('\n')
      expect(lines).toHaveLength(5)
      expect(lines.map(line => lineWidth(line))).toEqual([32, 32, 32, 32, 32])
      expect(text).toContain('Note')
      expect(text).toContain('Remember to save your work.')
      expect(text).toMatchSnapshot()
      expect(await calloutExample.render[framework]()).toBe(output)
    },
  )

  it('renders identical Core and public-wrapper React output', async () => {
    const core = await calloutExample.render.core()
    const react = await calloutExample.render.react()
    expect(react).toBe(core)
    expect(calloutExample.source.react()).not.toContain("from '@teaui/core'")
  })
})
