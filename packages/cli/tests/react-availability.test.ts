import {existsSync, readFileSync} from 'node:fs'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {removeAnsi} from '@teaui/core'
import {listExamples, showExample} from '../lib/examples.js'
import {barChartExample} from '../lib/examples/samples/bar-chart.js'
import * as capture from '../lib/examples/samples/capture.js'
import {COMPONENTS} from '../lib/examples/catalog.js'
import {lineChartExample} from '../lib/examples/samples/line-chart.js'
import {logExample} from '../lib/examples/samples/log.js'
import {plotExample} from '../lib/examples/samples/plot.js'
import {trackMouseExample} from '../lib/examples/samples/track-mouse.js'

const examples = [
  {example: barChartExample, width: 16, height: 5},
  {example: lineChartExample, width: 24, height: 6},
  {example: logExample, width: 36, height: 5},
  {example: plotExample, width: 27, height: 9},
  {example: trackMouseExample, width: 24, height: 5},
]
const samples = examples.flatMap(({example, width, height}) =>
  (['core', 'react'] as const).map(framework => ({
    example,
    name: example.name,
    framework,
    width,
    height,
  })),
)

function indent(source: string): string {
  return source
    .split('\n')
    .map(line => `  ${line}`)
    .join('\n')
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('new Core and React examples', () => {
  it.each(examples)(
    '$example.name is ready in both framework catalogs',
    ({example}) => {
      expect(example.availability).toBe('both')
      expect(
        COMPONENTS.find(component => component.name === example.name)
          ?.availability,
      ).toBe('both')
      for (const framework of [undefined, 'core', 'react'] as const) {
        expect(listExamples(framework)).toMatch(
          new RegExp(`^\\s+${example.name}\\s+ready$`, 'm'),
        )
      }
    },
  )

  it.each(samples)(
    '$name ($framework) displays and captures its exact executable sample',
    async ({example, name, framework, width, height}) => {
      const captureSpy = vi.spyOn(capture, 'captureExample')
      const tsxUrl = new URL(
        `../lib/examples/samples/${name}.${framework}.tsx`,
        import.meta.url,
      )
      const moduleUrl = existsSync(tsxUrl)
        ? tsxUrl
        : new URL(
            `../lib/examples/samples/${name}.${framework}.js`,
            import.meta.url,
          )
      const executable = readFileSync(moduleUrl, 'utf8').trimEnd()
      const displayed = removeAnsi(await showExample(name, framework))
      const [props, body] = displayed.split('\n\nExample\n')
      const [source, output] = body.split('\n\nOutput\n')

      expect(example.source[framework]()).toBe(executable)
      expect(source).toBe(indent(executable))
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, {
        width,
        height,
      })
      expect(executable).not.toMatch(
        /captureExample|HeadlessProgram|entryPoint/,
      )
      if (framework === 'react') {
        expect(executable).toContain("from '@teaui/react'")
        expect(executable).not.toMatch(/tui-|from '@teaui\/core'/)
        expect(props).toContain('ref?')
      } else {
        expect(props).not.toContain('ref?')
        expect(props).not.toContain('React.')
      }

      const rendered = removeAnsi(await example.render[framework]())
      expect(captureSpy).toHaveBeenNthCalledWith(2, moduleUrl, {width, height})
      expect(output).toBe(`${indent(rendered)}\n`)
      expect(rendered).toMatchSnapshot()
      const lines = rendered.split('\n')
      expect(lines).toHaveLength(height)
      expect(lines.every(line => Array.from(line).length === width)).toBe(true)

      switch (name) {
        case 'bar-chart':
          expect(lines[0]).toContain('██')
          expect(lines[height - 1].match(/██/g)).toHaveLength(4)
          expect(rendered).toContain('▂▂')
          expect(props.includes('data?')).toBe(framework === 'react')
          expect(props).not.toContain('yLabels?')
          break
        case 'line-chart':
          expect(lines[0]).toContain('⡠⠊')
          expect(lines[height - 1]).toMatch(/^⡠⠊/)
          expect(rendered).not.toContain('│')
          expect(props.includes('data?')).toBe(framework === 'react')
          expect(props).not.toContain('yLabels?')
          break
        case 'log':
          expect(rendered).toContain('INFO   Server started')
          expect(rendered).toContain('WARN   Slow connection')
          expect(rendered).toContain('ERROR  ▼ Retry needed')
          expect(rendered).toContain('Check the network')
          expect(props.includes('logs?')).toBe(framework === 'react')
          break
        case 'plot':
          expect(rendered).toContain('Daily orders')
          expect(rendered).toContain('8 │')
          expect(rendered).not.toContain('0 │')
          expect(rendered).toContain('└────────────────────────')
          expect(lines[height - 1]).toMatch(/1\s+3\s*$/)
          expect(rendered).toContain('███')
          expect(props).toContain('yLabels?')
          expect(props.includes('children?')).toBe(framework === 'react')
          break
        case 'track-mouse':
          expect(lines[0]).toBe(' 0123456789⠁123456789⠉12')
          expect(rendered).toContain('0Move over this panel')
          expect(rendered).toContain('1Rulers show position.')
          expect(lines[height - 1]).toMatch(/0, 0$/)
          expect(props).toContain(
            framework === 'react' ? 'React.ReactNode' : 'View[]',
          )
          break
      }
    },
  )

  it.each(examples)(
    '$example.name produces the same Core and React output',
    async ({example}) => {
      const core = removeAnsi(await example.render.core())
      const react = removeAnsi(await example.render.react())
      expect(react).toBe(core)
    },
  )

  it.each([
    ['bar', 'bar-chart'],
    ['line', 'line-chart'],
    ['log', 'log'],
    ['plo', 'plot'],
    ['track', 'track-mouse'],
  ])('resolves the unique abbreviation %s to %s', async (query, name) => {
    for (const framework of ['core', 'react'] as const) {
      expect(await showExample(query, framework)).toBe(
        await showExample(name, framework),
      )
    }
  })

  it('rejects ambiguous abbreviations across the implemented examples', async () => {
    await expect(showExample('l')).rejects.toThrow(
      'Ambiguous component: l\nMatches: legend, line-chart, log, logo',
    )
  })
})
