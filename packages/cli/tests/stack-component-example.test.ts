import {readFileSync} from 'node:fs'
import {lineWidth, removeAnsi, Screen, Size, Stack, Text} from '@teaui/core'
import {afterEach, describe, expect, it, vi} from 'vitest'

import * as capture from '../lib/examples/samples/capture.js'
import {stackExample} from '../lib/examples/samples/stack.js'

const SIZE = {width: 44, height: 13}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('stack CLI component example', () => {
  it('documents directions, natural-size fill, gaps, and framework-specific children', () => {
    expect(stackExample.name).toBe('stack')
    expect(stackExample.availability).toBe('both')
    expect(stackExample.description).toContain('four directions')
    expect(
      stackExample.props.map(({name, type, availability}) => ({
        name,
        type,
        availability,
      })),
    ).toEqual([
      {
        name: 'direction',
        type: "'up' | 'down' | 'left' | 'right'",
        availability: 'both',
      },
      {name: 'fill', type: 'boolean', availability: 'both'},
      {name: 'gap', type: 'number', availability: 'both'},
      {
        name: 'flex',
        type: "'natural' | number | `flex${number}`",
        availability: 'both',
      },
      {
        name: 'width',
        type: "number | 'fill' | 'shrink' | 'natural'",
        availability: 'both',
      },
      {
        name: 'height',
        type: "number | 'fill' | 'shrink' | 'natural'",
        availability: 'both',
      },
      {name: 'padding', type: 'number | Partial<Edges>', availability: 'both'},
      {
        name: 'child',
        type: '[FlexShorthand, View] | View',
        availability: 'core',
      },
      {
        name: 'children',
        type: '([FlexShorthand, View] | View)[]',
        availability: 'core',
      },
      {name: 'children', type: 'React.ReactNode', availability: 'react'},
      {name: 'ref', type: 'React.Ref<Stack>', availability: 'react'},
    ])

    const description = (name: string) =>
      stackExample.props.find(prop => prop.name === name)!.description
    expect(description('direction')).toContain("Defaults to 'down'")
    expect(description('direction')).toContain('Stack.down/up/right/left')
    expect(description('fill')).toContain('Defaults to true')
    expect(description('fill')).toContain('Only affects natural sizing')
    expect(description('fill')).toContain('does not set child flex')
    expect(description('gap')).toContain('Defaults to 0')
    expect(description('gap')).toContain('no leading or trailing gap')
    expect(description('child')).toContain('appended after children')

    for (const framework of ['core', 'react'] as const) {
      const names = stackExample.props
        .filter(
          prop =>
            prop.availability === 'both' || prop.availability === framework,
        )
        .map(prop => prop.name)
      expect(new Set(names).size).toBe(names.length)
      expect(names).toEqual([
        'direction',
        'fill',
        'gap',
        'flex',
        'width',
        'height',
        'padding',
        ...(framework === 'core' ? ['child', 'children'] : ['children', 'ref']),
      ])
    }
  })

  it('matches Core defaults, direction shortcuts, and appended child semantics', () => {
    const children = [new Text('A'), new Text('B')]
    const last = new Text('C')
    const stack = new Stack({children, child: last})
    expect(stack.direction).toBe('down')
    expect(stack.gap).toBe(0)
    expect(stack.children).toEqual([...children, last])
    expect(stack.naturalSize(new Size(44, 13))).toEqual(new Size(1, 3))

    for (const direction of ['down', 'up', 'right', 'left'] as const) {
      const shortcut = Stack[direction]([new Text('A'), new Text('B')], {
        gap: 2,
      })
      expect(shortcut.direction).toBe(direction)
      expect(shortcut.gap).toBe(2)
      expect(shortcut.naturalSize(new Size(44, 13))).toEqual(
        direction === 'up' || direction === 'down'
          ? new Size(1, 4)
          : new Size(4, 1),
      )
    }
  })

  it('fill changes natural sizing only with flex children, on the stack axis', () => {
    const available = new Size(28, 8)
    for (const direction of ['down', 'up', 'right', 'left'] as const) {
      const makeStack = (fill?: boolean) =>
        new Stack({
          direction,
          fill,
          children: [
            [1, new Text('A')],
            ['flex1', new Text('B')],
          ],
        })
      const filled =
        direction === 'up' || direction === 'down'
          ? new Size(1, 8)
          : new Size(28, 1)
      const natural =
        direction === 'up' || direction === 'down'
          ? new Size(1, 2)
          : new Size(2, 1)
      expect(makeStack().naturalSize(available)).toEqual(filled)
      expect(makeStack(true).naturalSize(available)).toEqual(filled)
      expect(makeStack(false).naturalSize(available)).toEqual(natural)
      expect(
        new Stack({
          direction,
          fill: true,
          children: [new Text('A'), new Text('B')],
        }).naturalSize(available),
      ).toEqual(natural)
    }
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures the exact deterministic public sample',
    async framework => {
      const extension = framework === 'react' ? 'tsx' : 'js'
      const moduleUrl = new URL(
        `../lib/examples/samples/stack.${framework}.${extension}`,
        import.meta.url,
      )
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(stackExample.source[framework]()).toBe(source)
      expect(source).toContain(`from '@teaui/${framework}'`)
      expect(source).not.toMatch(
        /captureExample|HeadlessProgram|tui-|setTimeout|setInterval|Math\.random|Date\./,
      )
      for (const direction of ['down', 'up', 'right', 'left']) {
        expect(source).toContain(
          framework === 'core' ? `Stack.${direction}(` : `<Stack.${direction}`,
        )
      }
      if (framework === 'core') {
        for (const setting of [
          'width: 44',
          'height: 13',
          'height: 5',
          'gap: 1',
          'gap: 2',
          'fill: true',
          'fill: false',
          "direction: 'right'",
          "[1, new Text('A')]",
        ]) {
          expect(source).toContain(setting)
        }
        expect(source).toContain('await Screen.start(examples)')
      } else {
        for (const setting of [
          'width={44}',
          'height={13}',
          'height={5}',
          'gap={1}',
          'gap={2}',
          'fill={true}',
          'fill={false}',
          'direction="right"',
          '<Text flex={1}>A</Text>',
        ]) {
          expect(source).toContain(setting)
        }
        expect(source).toContain('await run(<App />)')
        expect(source).not.toMatch(/createElement|from '@teaui\/core'/)
      }

      const start = Screen.start
      const captureSpy = vi.spyOn(capture, 'captureExample')
      const output = await stackExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)
      expect(output).toBe(await captureSpy.mock.results[0].value)
      expect(Screen.start).toBe(start)

      const lines = removeAnsi(output).split('\n')
      expect(lines).toHaveLength(SIZE.height)
      expect(lines.map(line => lineWidth(line))).toEqual(
        Array(SIZE.height).fill(SIZE.width),
      )
      expect(lines[0].trimEnd()).toBe('Directions: same children A, B, C')
      expect(lines[1].trimEnd()).toBe('down (gap 1)           up (gap 1)')
      expect(lines.slice(2, 7).map(line => [line[0], line[23]])).toEqual([
        ['A', 'C'],
        [' ', ' '],
        ['B', 'B'],
        [' ', ' '],
        ['C', 'A'],
      ])
      expect(lines[3]).toBe(' '.repeat(SIZE.width))
      expect(lines[5]).toBe(' '.repeat(SIZE.width))
      expect(lines[8]).toBe('A  B  C' + ' '.repeat(37))
      expect(lines[10]).toBe(' '.repeat(37) + 'C  B  A')
      expect(lines[11].slice(16)).toBe(
        'A' + ' '.repeat(13) + 'B' + ' '.repeat(13),
      )
      expect(lines[12].slice(16)).toBe('AB' + ' '.repeat(26))
      // Screen.start is replaced during capture; never render concurrently.
      expect(await stackExample.render[framework]()).toBe(output)
      expect(Screen.start).toBe(start)
    },
  )

  it('produces identical Core and JSX React output', async () => {
    const core = await stackExample.render.core()
    const react = await stackExample.render.react()
    expect(react).toBe(core)
    expect(removeAnsi(core)).toMatchSnapshot()
  })
})
