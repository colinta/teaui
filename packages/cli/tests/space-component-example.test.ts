import {readFileSync} from 'node:fs'
import {
  lineWidth,
  removeAnsi,
  Screen,
  Size,
  Space,
  TestTerminal,
} from '@teaui/core'
import {afterEach, describe, expect, it, vi} from 'vitest'

import * as capture from '../lib/examples/samples/capture.js'
import {spaceExample} from '../lib/examples/samples/space.js'

const SIZE = {width: 40, height: 14}

const EXPECTED_LINES = [
  'Natural: no implicit gap',
  'AB',
  'Fixed width: 4 columns',
  'Left    Right',
  'Flexible: consumes remaining width',
  'Left' + ' '.repeat(31) + 'Right',
  'Fixed height: 2 rows',
  'Top',
  '',
  '',
  'Bottom',
  'Background: cyan, 8 x 2',
  '[        ]',
  '',
]

function inspectOutput(output: string) {
  const terminal = new TestTerminal({cols: SIZE.width, rows: SIZE.height})
  output.split('\n').forEach((line, y) => {
    terminal.move(0, y)
    terminal.write(line)
  })
  const background = Array.from({length: SIZE.height}, (_, y) =>
    Array.from({length: SIZE.width}, (_, x) => {
      const background = terminal.styleAt(x, y).background
      return background === 'cyan' ? 'C' : '.'
    }).join(''),
  ).join('\n')
  return {terminal, background}
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('space CLI component example', () => {
  it('documents actual sizing, background, Core helpers, and React-only refs', () => {
    expect(spaceExample.name).toBe('space')
    expect(spaceExample.availability).toBe('both')
    expect(spaceExample.description).toContain('zero natural size')
    expect(spaceExample.description).toContain(
      'Space.horizontal(size, extraProps)',
    )
    expect(spaceExample.description).toContain(
      'Space.vertical(size, extraProps)',
    )
    expect(spaceExample.description).toContain(
      'React uses width and height props instead',
    )
    expect(
      spaceExample.props.map(({name, type, availability}) => ({
        name,
        type,
        availability,
      })),
    ).toEqual([
      {name: 'width', type: 'Dimension', availability: 'both'},
      {name: 'height', type: 'Dimension', availability: 'both'},
      {name: 'flex', type: 'FlexShorthand', availability: 'both'},
      {name: 'background', type: 'Color', availability: 'both'},
      {name: 'ref', type: 'React.Ref<Space>', availability: 'react'},
    ])
    for (const framework of ['core', 'react'] as const) {
      const names = spaceExample.props
        .filter(
          prop =>
            prop.availability === 'both' || prop.availability === framework,
        )
        .map(prop => prop.name)
      expect(names).toEqual([
        'width',
        'height',
        'flex',
        'background',
        ...(framework === 'react' ? ['ref'] : []),
      ])
      expect(new Set(names).size).toBe(names.length)
      expect(names).not.toContain('children')
      expect(names).not.toContain('direction')
    }
    const description = (name: string) =>
      spaceExample.props.find(prop => prop.name === name)!.description
    expect(description('width')).toContain('Natural width is 0')
    expect(description('height')).toContain('Natural height is 0')
    expect(description('flex')).toContain("Defaults to 'natural'")
    expect(description('flex')).toContain('parent Stack direction')
    expect(description('background')).toContain('Omitted by default')
    expect(description('background')).toContain(
      'without changing the natural size',
    )
  })

  it('verifies documented dimensions and helper arguments through the public API', () => {
    const available = new Size(SIZE.width, SIZE.height)
    expect(new Space().naturalSize(available)).toEqual(Size.zero)
    expect(new Space().flex).toBe('natural')
    expect(new Space().background).toBeUndefined()
    expect(new Space({background: 'cyan'}).naturalSize(available)).toEqual(
      Size.zero,
    )
    expect(new Space({flex: 1}).naturalSize(available)).toEqual(Size.zero)
    expect(Space.horizontal(4).naturalSize(available)).toEqual(new Size(4, 0))
    expect(Space.vertical(2).naturalSize(available)).toEqual(new Size(0, 2))
    expect(
      Space.horizontal(4, {height: 2, background: 'cyan'}).naturalSize(
        available,
      ),
    ).toEqual(new Size(4, 2))
    expect(Space.vertical(2, {width: 8}).naturalSize(available)).toEqual(
      new Size(8, 2),
    )
    expect(
      new Space({width: 'fill', height: 'fill'}).naturalSize(available),
    ).toEqual(available)
    for (const dimension of ['natural', 'shrink'] as const) {
      expect(
        new Space({width: dimension, height: dimension}).naturalSize(available),
      ).toEqual(Size.zero)
    }
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures the exact deterministic executable sample',
    async framework => {
      const moduleUrl = new URL(
        `../lib/examples/samples/space.${framework}.${framework === 'react' ? 'tsx' : 'js'}`,
        import.meta.url,
      )
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(spaceExample.source[framework]()).toBe(source)
      expect(source).toContain(`from '@teaui/${framework}'`)
      expect(source).not.toMatch(
        /captureExample|HeadlessProgram|tui-|createElement|setTimeout|setInterval|Math\.random|Date\.|\.\.\//,
      )
      if (framework === 'core') {
        expect(source).toContain('new Space()')
        expect(source).toContain('Space.horizontal(4)')
        expect(source).toContain('Space.vertical(2)')
        expect(source).toContain('new Space({flex: 1})')
        expect(source).toContain(
          "new Space({width: 8, height: 2, background: 'cyan'})",
        )
        expect(source).toContain('await Screen.start(examples)')
      } else {
        expect(source).toContain(
          '<Stack.down width={40} height={14} background="default">',
        )
        expect(source).toContain('<Space />')
        expect(source).toContain('<Space width={4} />')
        expect(source).toContain('<Space height={2} />')
        expect(source).toContain('<Space flex={1} />')
        expect(source).toContain(
          '<Space width={8} height={2} background="cyan" />',
        )
        expect(source).toContain('await run(<App />)')
        expect(source).not.toMatch(
          /Space\.(horizontal|vertical)|from '@teaui\/core'/,
        )
      }

      const start = Screen.start
      const captureSpy = vi.spyOn(capture, 'captureExample')
      const output = await spaceExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)
      expect(output).toBe(await captureSpy.mock.results[0].value)
      expect(Screen.start).toBe(start)

      const text = removeAnsi(output)
      const lines = text.split('\n')
      expect(lines).toHaveLength(SIZE.height)
      expect(lines.map(line => lineWidth(line))).toEqual(
        Array(SIZE.height).fill(SIZE.width),
      )
      expect(lines).toEqual(EXPECTED_LINES.map(line => line.padEnd(SIZE.width)))

      // A Space paints blank cells: preserve its color footprint in the snapshot.
      const {terminal, background} = inspectOutput(output)
      expect({text, background}).toMatchSnapshot()
      expect(background.split('\n')).toEqual([
        ...Array(12).fill('.'.repeat(SIZE.width)),
        ...Array(2).fill('.' + 'C'.repeat(8) + '.'.repeat(31)),
      ])
      for (let y = 0; y < SIZE.height; y++) {
        for (let x = 0; x < SIZE.width; x++) {
          if (y >= 12 && x >= 1 && x <= 8) {
            expect(terminal.styleAt(x, y).background).toBe('cyan')
            expect(terminal.charAt(x, y)).toBe(' ')
          } else {
            expect(terminal.styleAt(x, y).background).toBe('default')
          }
        }
      }
      expect(await spaceExample.render[framework]()).toBe(output)
      expect(captureSpy).toHaveBeenNthCalledWith(2, moduleUrl, SIZE)
      expect(Screen.start).toBe(start)
    },
  )

  it('captures identical Core and JSX text and background footprints', async () => {
    // captureExample temporarily replaces Screen.start, so capture sequentially.
    const core = await spaceExample.render.core()
    const react = await spaceExample.render.react()
    expect(removeAnsi(react)).toBe(removeAnsi(core))
    expect(inspectOutput(react).background).toBe(inspectOutput(core).background)
  })
})
