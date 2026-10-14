import {readFileSync} from 'node:fs'
import {removeAnsi} from '@teaui/core'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {showExample} from '../lib/examples.js'
import {barChartExample} from '../lib/examples/samples/bar-chart.js'
import * as capture from '../lib/examples/samples/capture.js'

const SIZE = {width: 16, height: 5}

function indent(source: string): string {
  return source
    .split('\n')
    .map(line => `  ${line}`)
    .join('\n')
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('bar-chart CLI component example', () => {
  it.each(['core', 'react'] as const)(
    '%s displays and captures its exact executable sample',
    async framework => {
      const moduleUrl = new URL(
        `../lib/examples/samples/bar-chart.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
        import.meta.url,
      )
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(barChartExample.source[framework]()).toBe(source)
      if (framework === 'react') {
        expect(source).toContain("import React from 'react'")
        expect(source).toContain('<BarChart')
        expect(source).toContain('data={[2, 4, 6, 8]}')
        expect(source).toContain('extract={(value, index) => [index, value]}')
        expect(source).toContain('barWidth={2}')
        expect(source).not.toMatch(/createElement|tui-|from '@teaui\/core'/)
      }

      const captureSpy = vi.spyOn(capture, 'captureExample')
      const displayed = removeAnsi(await showExample('bar-chart', framework))
      const [props, body] = displayed.split('\n\nExample\n')
      const [code, output] = body.split('\n\nOutput\n')
      expect(code).toBe(indent(source))
      expect(props.includes('data?')).toBe(framework === 'react')
      expect(props.includes('ref?')).toBe(framework === 'react')
      expect(props).not.toContain('yLabels?')
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)

      const rendered = await captureSpy.mock.results[0].value
      expect(output).toBe(`${indent(removeAnsi(rendered))}\n`)
      expect(removeAnsi(rendered)).toMatchSnapshot('bars')
      expect(rendered).toMatchSnapshot('exact styled capture')
      expect(await barChartExample.render[framework]()).toBe(rendered)
      expect(captureSpy).toHaveBeenNthCalledWith(2, moduleUrl, SIZE)
    },
  )

  it('preserves equivalent Core and React bar geometry', async () => {
    expect(removeAnsi(await barChartExample.render.react())).toBe(
      removeAnsi(await barChartExample.render.core()),
    )
  })
})
