import {readFileSync} from 'node:fs'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {removeAnsi} from '@teaui/core'

import {buttonExample} from '../lib/examples/samples/button.js'
import * as capture from '../lib/examples/samples/capture.js'

const SIZE = {width: 24, height: 3}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('button example', () => {
  it('documents shared and framework-specific props accurately', () => {
    expect(buttonExample.name).toBe('button')
    expect(buttonExample.availability).toBe('both')

    for (const framework of ['core', 'react'] as const) {
      const props = buttonExample.props.filter(
        prop => prop.availability === 'both' || prop.availability === framework,
      )
      const names = props.map(prop => prop.name)
      expect(new Set(names).size).toBe(names.length)
      expect(names).toEqual(
        expect.arrayContaining([
          'title',
          'onClick',
          'align',
          'border',
          'hotKey',
          'focusable',
          'foreground',
          'purpose',
          'width',
          'height',
          'children',
        ]),
      )
      expect(props.find(prop => prop.name === 'onClick')?.type).toBe(
        '() => void',
      )
      expect(props.find(prop => prop.name === 'children')?.type).toBe(
        framework === 'core' ? 'View[]' : 'React.ReactNode',
      )
      expect(names.includes('ref')).toBe(framework === 'react')
      expect(names.includes('child')).toBe(framework === 'core')
    }
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures the same executable module',
    async framework => {
      const moduleUrl = new URL(
        `../lib/examples/samples/button.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
        import.meta.url,
      )
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()
      const captureSpy = vi.spyOn(capture, 'captureExample')

      expect(buttonExample.source[framework]()).toBe(source)
      expect(source).not.toMatch(/captureExample|HeadlessProgram|tui-/)
      expect(source).toContain(`from '@teaui/${framework}'`)
      if (framework === 'react') {
        expect(source).toContain("import React, {useState} from 'react'")
        expect(source).toContain('<Button')
        expect(source).toContain('title={`Clicks: ${clicks}`}')
        expect(source).toContain(
          'onClick={() => setClicks(count => count + 1)}',
        )
        expect(source).toContain('await run(<App />)')
        expect(source).not.toMatch(/createElement|from '@teaui\/core'/)
      } else {
        expect(source).toContain('await Screen.start(button)')
      }

      const rendered = removeAnsi(await buttonExample.render[framework]())
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)
      expect(rendered).toContain('[ Clicks: 0 ]')
      expect(rendered).toMatchSnapshot()

      const lines = rendered.split('\n')
      expect(lines).toHaveLength(SIZE.height)
      expect(lines.every(line => Array.from(line).length === SIZE.width)).toBe(
        true,
      )
      expect(removeAnsi(await buttonExample.render[framework]())).toBe(rendered)
    },
  )

  it('produces identical Core and React output', async () => {
    expect(await buttonExample.render.react()).toBe(
      await buttonExample.render.core(),
    )
  })
})
