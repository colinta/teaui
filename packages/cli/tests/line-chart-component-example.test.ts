import {readFileSync} from 'node:fs'
import {removeAnsi} from '@teaui/core'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {showExample} from '../lib/examples.js'
import * as capture from '../lib/examples/samples/capture.js'
import {lineChartExample} from '../lib/examples/samples/line-chart.js'

const SIZE = {width: 24, height: 6}

function indent(source: string): string {
  return source
    .split('\n')
    .map(line => `  ${line}`)
    .join('\n')
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('line-chart CLI component example', () => {
  it.each(['core', 'react'] as const)(
    '%s displays and captures its exact executable sample',
    async framework => {
      const moduleUrl = new URL(
        `../lib/examples/samples/line-chart.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
        import.meta.url,
      )
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(lineChartExample.source[framework]()).toBe(source)
      if (framework === 'react') {
        expect(source).toContain("import React from 'react'")
        expect(source).toContain('<LineChart<[number, number]>')
        expect(source).toContain('extract={point => point}')
        expect(source).not.toMatch(/createElement|tui-|from '@teaui\/core'/)
      }

      const captureSpy = vi.spyOn(capture, 'captureExample')
      const displayed = removeAnsi(await showExample('line-chart', framework))
      const [props, body] = displayed.split('\n\nExample\n')
      const [code, output] = body.split('\n\nOutput\n')
      expect(code).toBe(indent(source))
      expect(props.includes('data?')).toBe(framework === 'react')
      expect(props.includes('ref?')).toBe(framework === 'react')
      expect(props).not.toContain('yLabels?')
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)

      const rendered = await captureSpy.mock.results[0].value
      expect(output).toBe(`${indent(removeAnsi(rendered))}\n`)
      expect(removeAnsi(rendered)).toMatchSnapshot('line geometry')
      expect(rendered).toMatchSnapshot('exact styled capture')
      expect(await lineChartExample.render[framework]()).toBe(rendered)
      expect(captureSpy).toHaveBeenNthCalledWith(2, moduleUrl, SIZE)
    },
  )

  it('preserves identical Core and React output including styles', async () => {
    expect(await lineChartExample.render.react()).toBe(
      await lineChartExample.render.core(),
    )
  })
})
