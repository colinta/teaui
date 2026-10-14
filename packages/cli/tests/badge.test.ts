import {readFileSync} from 'node:fs'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {removeAnsi} from '@teaui/core'

import {badgeExample} from '../lib/examples/samples/badge.js'
import * as capture from '../lib/examples/samples/capture.js'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('badge example', () => {
  it('documents shared props and the React-only ref', () => {
    expect(badgeExample.name).toBe('badge')
    expect(badgeExample.availability).toBe('both')
    expect(
      badgeExample.props.map(({name, availability}) => ({
        name,
        availability,
      })),
    ).toEqual([
      {name: 'text', availability: 'both'},
      {name: 'purpose', availability: 'both'},
      {name: 'ref', availability: 'react'},
    ])
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures the exact runnable sample',
    async framework => {
      const moduleUrl = new URL(
        `../lib/examples/samples/badge.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
        import.meta.url,
      )
      const executable = readFileSync(moduleUrl, 'utf8').trimEnd()
      const captureSpy = vi.spyOn(capture, 'captureExample')

      expect(badgeExample.source[framework]()).toBe(executable)
      expect(executable).not.toMatch(/captureExample|HeadlessProgram|tui-/)
      expect(executable).toContain(`from '@teaui/${framework}'`)
      if (framework === 'react') {
        expect(executable).toContain('<Badge text="Ready" purpose="proceed" />')
        expect(executable).not.toContain('createElement')
      }

      const output = await badgeExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, {
        width: 7,
        height: 1,
      })
      expect(removeAnsi(output)).toMatchInlineSnapshot(`"Ready"`)
      expect(await badgeExample.render[framework]()).toBe(output)
    },
  )

  it('renders identical Core and public-wrapper React output', async () => {
    const core = await badgeExample.render.core()
    const react = await badgeExample.render.react()
    expect(react).toBe(core)
  })
})
