import {existsSync, readFileSync} from 'node:fs'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {removeAnsi} from '@teaui/core'

import {brExample} from '../lib/examples/samples/br.js'
import * as capture from '../lib/examples/samples/capture.js'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('br component example', () => {
  it('documents a prop-free, React-only line break without a Core sample', () => {
    expect(brExample.name).toBe('br')
    expect(brExample.availability).toBe('react')
    expect(brExample.props).toEqual([])
    expect(Object.keys(brExample.source)).toEqual(['react'])
    expect(Object.keys(brExample.render)).toEqual(['react'])
  })

  it('displays and captures the exact public React sample deterministically', async () => {
    const moduleUrl = new URL(
      '../lib/examples/samples/br.react.tsx',
      import.meta.url,
    )
    const executable = readFileSync(moduleUrl, 'utf8').trimEnd()
    const captureSpy = vi.spyOn(capture, 'captureExample')

    expect(brExample.source.react()).toBe(executable)
    expect(executable).toContain("import {Br, Text, run} from '@teaui/react'")
    expect(executable).toContain("import React from 'react'")
    expect(executable).toContain('await run(')
    expect(executable).toContain('<Text>')
    expect(executable.match(/<Br \/>/g)).toHaveLength(3)
    expect(executable).not.toMatch(
      /createElement|captureExample|HeadlessProgram|tui-|from '@teaui\/core'/,
    )
    expect(existsSync(new URL('./br.react.js', moduleUrl))).toBe(false)

    const output = await brExample.render.react()
    expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, {
      width: 16,
      height: 4,
    })
    const rendered = removeAnsi(output)
    expect(rendered).toMatchSnapshot()
    expect(rendered.split('\n')).toEqual([
      'First line      ',
      'Second line     ',
      '                ',
      'After blank line',
    ])
    expect(await brExample.render.react()).toBe(output)
    expect(captureSpy).toHaveBeenNthCalledWith(2, moduleUrl, {
      width: 16,
      height: 4,
    })
  })
})
