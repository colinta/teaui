import {existsSync, readFileSync} from 'node:fs'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {lineWidth, removeAnsi} from '@teaui/core'

import {progressExample} from '../lib/examples/samples/progress.js'
import * as capture from '../lib/examples/samples/capture.js'

const SIZE = {width: 36, height: 19}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('progress CLI component example', () => {
  it('documents range defaults, external labels, and vertical limitations accurately', () => {
    expect(progressExample.name).toBe('progress')
    expect(progressExample.availability).toBe('both')
    for (const framework of ['core', 'react'] as const) {
      const props = progressExample.props.filter(
        prop => prop.availability === 'both' || prop.availability === framework,
      )
      const names = props.map(prop => prop.name)
      expect(names).toEqual([
        'direction',
        'min',
        'max',
        'value',
        'showPercent',
        'location',
        'purpose',
        'width',
        'height',
        ...(framework === 'react' ? ['ref'] : []),
      ])
      expect(new Set(names).size).toBe(names.length)
      for (const name of ['child', 'children', 'onChange', 'title', 'hotKey']) {
        expect(names).not.toContain(name)
      }
      const prop = (name: string) => props.find(prop => prop.name === name)
      expect(prop('direction')?.type).toBe("'horizontal' | 'vertical'")
      expect(prop('direction')?.description).toContain('bottom to top')
      expect(prop('direction')?.description).toContain(
        'does not display percentage text',
      )
      expect(prop('min')?.description).toContain('defaults to 0')
      expect(prop('max')?.description).toContain('defaults to 100')
      for (const name of ['min', 'max', 'value']) {
        expect(prop(name)?.type).toBe('number')
      }
      expect(prop('value')?.description).toContain('defaulting to min')
      expect(prop('value')?.description).toContain('clamped to the range')
      expect(prop('value')?.description).toContain(
        'Core value assignment invalidates rendering',
      )
      expect(prop('showPercent')?.type).toBe('boolean')
      expect(prop('showPercent')?.description).toContain('Defaults to false')
      expect(prop('showPercent')?.description).toContain('horizontal bars only')
      expect(prop('location')?.type).toBe("'left' | 'center' | 'right'")
      expect(prop('location')?.description).toContain('external')
      expect(prop('location')?.description).toContain('five-column reserve')
      expect(prop('purpose')?.type).toBe('Palette | Purpose')
      for (const name of ['width', 'height']) {
        expect(prop(name)?.type).toBe('Dimension')
      }
      expect(prop('height')?.description).toContain(
        'one row in either direction',
      )
    }
    expect(progressExample.props.find(prop => prop.name === 'ref')).toEqual({
      name: 'ref',
      type: 'React.Ref<Progress>',
      description: 'Reference to the underlying Core Progress',
      availability: 'react',
    })
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures the exact deterministic public sample',
    async framework => {
      const filename =
        framework === 'react' ? 'progress.react.tsx' : 'progress.core.js'
      const moduleUrl = new URL(
        `../lib/examples/samples/${filename}`,
        import.meta.url,
      )
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(progressExample.source[framework]()).toBe(source)
      expect(source).toContain(`from '@teaui/${framework}'`)
      expect(source).not.toMatch(
        /captureExample|HeadlessProgram|tui-|setTimeout|setInterval|Math\.random|Date\./,
      )
      for (const [core, react] of [
        ['width: 36', 'width={36}'],
        ['height: 19', 'height={19}'],
        ['value: 50', 'value={50}'],
        ['value: 65', 'value={65}'],
        ['value: 5', 'value={5}'],
        ['value: 150', 'value={150}'],
        ['min: 10', 'min={10}'],
        ['max: 30', 'max={30}'],
        ['value: 20', 'value={20}'],
        ['showPercent: true', 'showPercent'],
        ["location: 'center'", 'location="center"'],
        ["location: 'left'", 'location="left"'],
        ["location: 'right'", 'location="right"'],
        ["direction: 'vertical'", 'direction="vertical"'],
        ["purpose: 'primary'", 'purpose="primary"'],
        ["purpose: 'proceed'", 'purpose="proceed"'],
        ['height: 3', 'height={3}'],
        ['width: 3', 'width={3}'],
        ['height: 4', 'height={4}'],
      ]) {
        expect(source).toContain(framework === 'core' ? core : react)
      }
      if (framework === 'core') {
        expect(source).toContain('await Screen.start(examples)')
      } else {
        expect(source).toContain('await run(<App />)')
        expect(source).toContain('<Stack.down width={36} height={19}>')
        expect(source).toContain('<Text>Default: empty, no percentage</Text>')
        expect(source).toContain('<Progress height={1} />')
        expect(source).not.toContain('createElement')
        expect(source).not.toContain("from '@teaui/core'")
        expect(existsSync(new URL('progress.react.js', moduleUrl))).toBe(false)
      }

      const captureSpy = vi.spyOn(capture, 'captureExample')
      const output = await progressExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)
      expect(output).toBe(await captureSpy.mock.results[0].value)

      const rendered = removeAnsi(output)
      const lines = rendered.split('\n')
      expect(lines).toHaveLength(SIZE.height)
      expect(lines.map(line => lineWidth(line))).toEqual(
        Array(SIZE.height).fill(SIZE.width),
      )
      expect(lines[1]).toBe('╶' + '─'.repeat(34) + '╴')
      expect(lines[3]).not.toContain('%')
      expect(lines[5]).toContain('65%')
      expect(lines[7]).toMatch(/^  5% █/)
      expect(lines[9]).toBe('█'.repeat(31) + ' 100%')
      expect(lines[12]).toContain('50%')
      expect(lines.slice(15).map(line => line.trimEnd())).toEqual([
        '╭─╮',
        '│ │',
        '▐█▌',
        '▐█▌',
      ])
      expect(rendered).toMatchSnapshot()

      expect(await progressExample.render[framework]()).toBe(output)
      expect(captureSpy).toHaveBeenNthCalledWith(2, moduleUrl, SIZE)
    },
  )

  it('produces identical Core and public-wrapper React text', async () => {
    // captureExample replaces Screen.start temporarily; never capture concurrently.
    const core = await progressExample.render.core()
    const react = await progressExample.render.react()
    expect(removeAnsi(react)).toBe(removeAnsi(core))
  })
})
