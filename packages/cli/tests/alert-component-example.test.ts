import {existsSync, readFileSync} from 'node:fs'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {lineWidth, removeAnsi} from '@teaui/core'

import {alertExample} from '../lib/examples/samples/alert.js'
import * as capture from '../lib/examples/samples/capture.js'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('alert component example', () => {
  it('documents modal props and framework-specific body content', () => {
    expect(alertExample.name).toBe('alert')
    expect(alertExample.availability).toBe('both')
    expect(
      alertExample.props.map(({name, availability}) => ({
        name,
        availability,
      })),
    ).toEqual([
      {name: 'title', availability: 'both'},
      {name: 'purpose', availability: 'both'},
      {name: 'direction', availability: 'both'},
      {name: 'visible', availability: 'both'},
      {name: 'dim', availability: 'both'},
      {name: 'dismissOnEsc', availability: 'both'},
      {name: 'dismissOnClick', availability: 'both'},
      {name: 'onDismiss', availability: 'both'},
      {name: 'child', availability: 'core'},
      {name: 'children', availability: 'core'},
      {name: 'children', availability: 'react'},
    ])
    expect(
      alertExample.props.find(({name}) => name === 'visible')?.description,
    ).toContain('defaults to false')
    for (const propName of ['dim', 'dismissOnEsc', 'dismissOnClick']) {
      expect(
        alertExample.props.find(({name}) => name === propName)?.description,
      ).toContain('defaults to true')
    }
    // The public Alert wrapper is not a forwardRef component.
    expect(alertExample.props.some(({name}) => name === 'ref')).toBe(false)
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures the exact runnable sample',
    async framework => {
      const extension = framework === 'react' ? 'tsx' : 'js'
      const moduleUrl = new URL(
        `../lib/examples/samples/alert.${framework}.${extension}`,
        import.meta.url,
      )
      const executable = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(alertExample.source[framework]()).toBe(executable)
      expect(executable).not.toMatch(/captureExample|HeadlessProgram|tui-/)
      expect(executable).toContain(`from '@teaui/${framework}'`)
      if (framework === 'core') {
        expect(executable).toContain('visible: true')
      } else {
        expect(executable).toContain('<Stack.down>')
        expect(executable).toContain(
          '<Alert visible title="Unsaved changes" purpose="secondary">',
        )
        expect(executable).toContain(
          '<Text>Save before closing this document.</Text>',
        )
        expect(executable).not.toContain('createElement')
        expect(
          existsSync(
            new URL('../lib/examples/samples/alert.react.js', import.meta.url),
          ),
        ).toBe(false)
      }

      const captureSpy = vi.spyOn(capture, 'captureExample')
      const output = await alertExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, {
        width: 48,
        height: 11,
      })
      const text = removeAnsi(output)
      const lines = text.split('\n')
      expect(lines).toHaveLength(11)
      expect(lines.map(line => lineWidth(line))).toEqual(Array(11).fill(48))
      expect(text).toContain('Document editor')
      expect(text).toContain('Unsaved changes')
      expect(text).toContain('Save before closing this document.')
      expect(text).toMatchSnapshot()
      expect(await alertExample.render[framework]()).toBe(output)
    },
  )

  it('renders identical Core and public-wrapper React output', async () => {
    const core = await alertExample.render.core()
    const react = await alertExample.render.react()
    expect(react).toBe(core)
    expect(alertExample.source.react()).not.toContain("from '@teaui/core'")
  })
})
