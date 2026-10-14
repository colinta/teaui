import {readFileSync} from 'node:fs'
import {
  HeadlessProgram,
  lineWidth,
  removeAnsi,
  Screen,
  Skeleton,
  TestTerminal,
  Text,
} from '@teaui/core'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import * as capture from '../lib/examples/samples/capture.js'
import {skeletonExample} from '../lib/examples/samples/skeleton.js'

const SIZE = {width: 44, height: 13}
const INITIAL_GRAY = [77, 77, 77]

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

function replay(output: string): TestTerminal {
  const terminal = new TestTerminal({cols: SIZE.width, rows: SIZE.height})
  output.split('\n').forEach((line, y) => {
    terminal.move(0, y)
    terminal.write(line)
  })
  return terminal
}

function paintedCells(terminal: TestTerminal): string {
  return Array.from({length: SIZE.height}, (_, y) =>
    Array.from({length: SIZE.width}, (_, x) =>
      Array.isArray(terminal.styleAt(x, y).background) ? '#' : '.',
    ).join(''),
  ).join('\n')
}

describe('skeleton CLI component example', () => {
  it('documents real shapes, natural sizing, and automatic animation without inventing props', () => {
    expect(skeletonExample.name).toBe('skeleton')
    expect(skeletonExample.availability).toBe('both')
    expect(skeletonExample.description).toContain(
      'automatic three-second pulse',
    )
    expect(skeletonExample.description).toContain('initial frame')
    expect(skeletonExample.props).toEqual([
      expect.objectContaining({
        name: 'shape',
        type: "'rect' | 'circle' | 'rounded-rect' | 'row' | 'column'",
        availability: 'both',
      }),
      expect.objectContaining({
        name: 'width',
        type: 'Dimension',
        availability: 'both',
      }),
      expect.objectContaining({
        name: 'height',
        type: 'Dimension',
        availability: 'both',
      }),
      {
        name: 'ref',
        type: 'React.Ref<Skeleton>',
        description: 'Reference to the underlying Core Skeleton',
        availability: 'react',
      },
    ])
    const description = (name: string) =>
      skeletonExample.props.find(prop => prop.name === name)?.description
    expect(description('shape')).toContain('Defaults to rect')
    expect(description('shape')).toContain('four corner cells')
    expect(description('shape')).toContain('width twice the height')
    expect(description('shape')).toContain('Core shape assignment')
    expect(description('width')).toContain('column, which is one column wide')
    expect(description('height')).toContain('row, which is one row tall')
    for (const name of ['width', 'height']) {
      expect(description(name)).toContain('Explicit dimensions override')
    }
    for (const framework of ['core', 'react'] as const) {
      expect(
        skeletonExample.props
          .filter(
            prop =>
              prop.availability === 'both' || prop.availability === framework,
          )
          .map(prop => prop.name),
      ).toEqual([
        'shape',
        'width',
        'height',
        ...(framework === 'react' ? ['ref'] : []),
      ])
    }
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures the exact public sample at the initial animation frame',
    async framework => {
      const extension = framework === 'react' ? 'tsx' : 'js'
      const moduleUrl = new URL(
        `../lib/examples/samples/skeleton.${framework}.${extension}`,
        import.meta.url,
      )
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(skeletonExample.source[framework]()).toBe(source)
      expect(source).toContain(`from '@teaui/${framework}'`)
      expect(source).not.toMatch(
        /captureExample|HeadlessProgram|tui-|setTimeout|setInterval|Math\.random|Date\.|registerTick|receiveTick/,
      )
      for (const shape of ['rounded-rect', 'circle', 'row', 'column']) {
        expect(source).toContain(
          framework === 'core' ? `shape: '${shape}'` : `shape="${shape}"`,
        )
      }
      if (framework === 'core') {
        expect(source).toContain('new Skeleton({width: 14, height: 4})')
        expect(source).toContain('width: 44')
        expect(source).toContain('height: 13')
        expect(source).toContain("shape: 'circle', width: 8, height: 4")
        expect(source).toContain("shape: 'row', height: 'natural'")
        expect(source).toContain("shape: 'column', width: 'natural', height: 4")
        expect(source).toContain('await Screen.start(examples)')
      } else {
        expect(source).toContain(
          '<Stack.down width={44} height={13} background="default">',
        )
        expect(source).toContain('<Skeleton width={14} height={4} />')
        expect(source).toContain(
          '<Skeleton shape="circle" width={8} height={4} />',
        )
        expect(source).toContain('<Skeleton shape="row" height="natural" />')
        expect(source).toContain(
          '<Skeleton shape="column" width="natural" height={4} />',
        )
        expect(source).toContain('await run(<App />)')
        expect(source).not.toMatch(/createElement|from '@teaui\/core'/)
      }

      const start = Screen.start
      const registerTick = Screen.prototype.registerTick
      const receiveTick = vi.spyOn(Skeleton.prototype, 'receiveTick')
      const captureSpy = vi.spyOn(capture, 'captureExample')
      const output = await skeletonExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)
      expect(output).toBe(await captureSpy.mock.results[0].value)
      expect(Screen.start).toBe(start)
      expect(Screen.prototype.registerTick).toBe(registerTick)
      expect(receiveTick).not.toHaveBeenCalled()
      // React's scheduler may have an immediate callback queued after commit.
      vi.runOnlyPendingTimers()
      expect(vi.getTimerCount()).toBe(0)

      const rendered = removeAnsi(output)
      const lines = rendered.split('\n')
      expect(lines).toHaveLength(SIZE.height)
      expect(lines.map(line => lineWidth(line))).toEqual(
        Array(SIZE.height).fill(SIZE.width),
      )
      expect(lines[0].trimEnd()).toBe('Skeleton loading placeholders')
      expect(lines[1].trimEnd()).toBe(
        'rect (default) rounded-rect   circle (8x4)',
      )
      expect(lines[6].trimEnd()).toBe('row: natural height = 1')
      expect(lines[8].trimEnd()).toBe('column: natural width = 1')

      // Skeleton paints spaces, so a text-only snapshot cannot detect shape bugs.
      const terminal = replay(output)
      const mask = paintedCells(terminal)
      expect({text: rendered, paintedCells: mask}).toMatchSnapshot()
      for (let y = 0; y < SIZE.height; y++) {
        for (let x = 0; x < SIZE.width; x++) {
          const background = terminal.styleAt(x, y).background
          if (Array.isArray(background)) {
            expect(background).toEqual(INITIAL_GRAY)
          }
        }
      }
      const maskLines = mask.split('\n')
      expect(maskLines.slice(2, 6).map(line => line.slice(0, 14))).toEqual(
        Array(4).fill('#'.repeat(14)),
      )
      expect(maskLines.slice(2, 6).map(line => line.slice(15, 29))).toEqual([
        '.' + '#'.repeat(12) + '.',
        '#'.repeat(14),
        '#'.repeat(14),
        '.' + '#'.repeat(12) + '.',
      ])
      expect(maskLines.slice(2, 6).map(line => line.slice(30, 38))).toEqual([
        '.######.',
        '########',
        '########',
        '.######.',
      ])
      expect(maskLines[7]).toBe('#'.repeat(SIZE.width))
      expect(maskLines.slice(9)).toEqual(
        Array(4).fill('#' + '.'.repeat(SIZE.width - 1)),
      )

      vi.advanceTimersByTime(1500)
      expect(await skeletonExample.render[framework]()).toBe(output)
      expect(captureSpy).toHaveBeenNthCalledWith(2, moduleUrl, SIZE)
      expect(receiveTick).not.toHaveBeenCalled()
      vi.runOnlyPendingTimers()
      expect(vi.getTimerCount()).toBe(0)
    },
  )

  it('produces identical Core and JSX React ANSI output', async () => {
    // captureExample and the animation hook both temporarily replace public APIs.
    const core = await skeletonExample.render.core()
    const react = await skeletonExample.render.react()
    expect(react).toBe(core)
  })

  it('freezes only Skeleton ticks and restores the capture hook on failure', async () => {
    const registerTick = vi
      .spyOn(Screen.prototype, 'registerTick')
      .mockImplementation(() => {})
    const error = new Error('capture failed')
    vi.spyOn(capture, 'captureExample').mockImplementation(async () => {
      const screen = new Screen(
        new HeadlessProgram({cols: 1, rows: 1}),
        new Text(),
      )
      const skeleton = new Skeleton()
      const text = new Text()
      screen.registerTick(skeleton)
      expect(registerTick).not.toHaveBeenCalled()
      screen.registerTick(text)
      expect(registerTick).toHaveBeenCalledExactlyOnceWith(text)
      throw error
    })
    await expect(skeletonExample.render.core()).rejects.toBe(error)
    expect(Screen.prototype.registerTick).toBe(registerTick)
  })

  it('leaves normal public-API animation enabled after capture', async () => {
    await skeletonExample.render.core()
    const program = new HeadlessProgram({cols: 1, rows: 1})
    const screen = new Screen(program, new Skeleton())
    try {
      screen.start()
      expect(replay(program.terminal.output).styleAt(0, 0).background).toEqual(
        INITIAL_GRAY,
      )
      screen.tick(1500)
      expect(replay(program.terminal.output).styleAt(0, 0).background).toEqual([
        128, 128, 128,
      ])
    } finally {
      screen.stop()
    }
    expect(vi.getTimerCount()).toBe(0)
  })
})
