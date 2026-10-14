import {existsSync, readFileSync} from 'node:fs'
import {lineWidth, removeAnsi} from '@teaui/core'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {showExample} from '../lib/examples.js'
import * as capture from '../lib/examples/samples/capture.js'
import {plotExample} from '../lib/examples/samples/plot.js'

const SIZE = {width: 27, height: 9}

function sampleUrl(framework: 'core' | 'react'): URL {
  return new URL(
    `../lib/examples/samples/plot.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
    import.meta.url,
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('plot CLI component example', () => {
  it.each(['core', 'react'] as const)(
    '%s displays and captures the exact public sample',
    async framework => {
      const moduleUrl = sampleUrl(framework)
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(plotExample.source[framework]()).toBe(source)
      expect(source).toContain(`from '@teaui/${framework}'`)
      if (framework === 'react') {
        expect(source).toContain('<Plot')
        expect(source).toContain('title="Daily orders"')
        expect(source).toContain(
          'yLabels={value => (value < 4 ? null : value.toFixed(0))}',
        )
        expect(source).toContain('<BarChart')
        expect(source).toContain('data={[2, 5, 3, 8]}')
        expect(source).toContain('extract={(value, index) => [index, value]}')
        expect(source).toContain(
          'xLabels={(_value, index) => (index % 2 === 0 ? String(index + 1) : null)}',
        )
        expect(source).toContain('barWidth={3}')
        expect(source).toContain('await run(')
        expect(source).not.toMatch(/createElement|tui-|from '@teaui\/core'/)
        expect(
          existsSync(
            new URL('../lib/examples/samples/plot.react.js', import.meta.url),
          ),
        ).toBe(false)
      } else {
        expect(source).toContain('plot.add(')
        expect(source).toContain('await Screen.start(plot)')
      }

      const captureSpy = vi.spyOn(capture, 'captureExample')
      const displayed = removeAnsi(await showExample('plot', framework))
      const [props, body] = displayed.split('\n\nExample\n')
      const [displayedSource, output] = body.split('\n\nOutput\n')
      expect(displayedSource).toBe(
        source
          .split('\n')
          .map(line => `  ${line}`)
          .join('\n'),
      )
      expect(props).toContain('yLabels?')
      expect(props.includes('children?')).toBe(framework === 'react')
      expect(output).toContain('Daily orders')
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)
    },
  )

  it.each(['core', 'react'] as const)(
    '%s preserves the deterministic chart output and styling',
    async framework => {
      const output = await plotExample.render[framework]()
      const text = removeAnsi(output)
      const lines = text.split('\n')
      expect(lines).toHaveLength(SIZE.height)
      expect(lines.map(line => lineWidth(line))).toEqual(
        Array(SIZE.height).fill(SIZE.width),
      )
      expect(lines.map(line => line.trimEnd())).toEqual([
        '         Daily orders',
        '8 │                   ███',
        '6 │                   ███',
        '5 │        ▆▆▆        ███',
        '  │        ███  ▂▂▂   ███',
        '  │  ▄▄▄   ███  ███   ███',
        '  │  ███   ███  ███   ███',
        '  └────────────────────────',
        '      1          3',
      ])
      expect(output).toMatchSnapshot()
      expect(await plotExample.render[framework]()).toBe(output)
    },
  )

  it('renders identical Core and React text', async () => {
    const core = await plotExample.render.core()
    const react = await plotExample.render.react()
    expect(removeAnsi(react)).toBe(removeAnsi(core))
  })
})
