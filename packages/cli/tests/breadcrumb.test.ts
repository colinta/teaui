import {readFileSync} from 'node:fs'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {lineWidth, removeAnsi} from '@teaui/core'
import {breadcrumbExample} from '../lib/examples/samples/breadcrumb.js'
import * as capture from '../lib/examples/samples/capture.js'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('breadcrumb CLI example', () => {
  it('documents shared props and the React-only ref', () => {
    expect(breadcrumbExample.availability).toBe('both')
    expect(breadcrumbExample.props).toEqual([
      expect.objectContaining({name: 'items', availability: 'both'}),
      expect.objectContaining({name: 'isActive', availability: 'both'}),
      expect.objectContaining({name: 'palette', availability: 'both'}),
      expect.objectContaining({
        name: 'ref',
        type: 'React.Ref<Breadcrumb>',
        availability: 'react',
      }),
    ])
  })

  it.each(['core', 'react'] as const)(
    '%s displays the exact executable sample and captures a fixed viewport',
    async framework => {
      const moduleUrl = new URL(
        `../lib/examples/samples/breadcrumb.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
        import.meta.url,
      )
      const executable = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(breadcrumbExample.source[framework]()).toBe(executable)
      expect(executable).not.toMatch(/captureExample|HeadlessProgram|tui-/)
      expect(executable).toContain(`from '@teaui/${framework}'`)
      if (framework === 'react') {
        expect(executable).toContain('<Breadcrumb')
        expect(executable).toContain(
          "items={[{title: 'Home'}, {title: 'Products'}, {title: 'Electronics'}]}",
        )
        expect(executable).toContain('await run(')
        expect(executable).not.toContain('createElement')
      }

      const captureSpy = vi.spyOn(capture, 'captureExample')
      const output = await breadcrumbExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, {
        width: 40,
        height: 1,
      })
      const text = removeAnsi(output)
      expect(text.split('\n')).toHaveLength(1)
      expect(lineWidth(text)).toBe(40)
      expect(text).toContain('Electronics')
      expect(text).toMatchSnapshot()
      expect(await breadcrumbExample.render[framework]()).toBe(output)
    },
  )

  it('produces identical Core and public-wrapper React text', async () => {
    const core = removeAnsi(await breadcrumbExample.render.core())
    const react = removeAnsi(await breadcrumbExample.render.react())
    expect(react).toBe(core)
    expect(breadcrumbExample.source.react()).not.toContain("from '@teaui/core'")
  })
})
