import {readFileSync} from 'node:fs'
import {
  HeadlessProgram,
  lineWidth,
  removeAnsi,
  Screen,
  Size,
  Spinner,
  Stack,
  TestTerminal,
  Text,
} from '@teaui/core'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import * as capture from '../lib/examples/samples/capture.js'
import {spinnerExample} from '../lib/examples/samples/spinner.js'

const SIZE = {width: 44, height: 12}
const INITIAL_FRAMES = ['⣾', '', '▄ ▄ ▄', ' ▀▀▀', '━━', '⣾']
const ACCENTS = [
  {row: 2, columns: [0], foreground: [90, 122, 194]},
  {row: 5, columns: [0, 2, 4], foreground: [88, 168, 119]},
  {row: 7, columns: [1, 2, 3], foreground: [208, 146, 75]},
  {row: 9, columns: [0, 1], foreground: [196, 98, 100]},
  {row: 11, columns: [0], foreground: [90, 122, 194]},
]

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

describe('spinner CLI component example', () => {
  it('documents public animation, styles, natural sizes, accent colors, and React refs', () => {
    expect(spinnerExample.name).toBe('spinner')
    expect(spinnerExample.availability).toBe('both')
    expect(spinnerExample.description).toContain('initial frame')
    expect(spinnerExample.description).toContain('standalone samples animate')
    for (const framework of ['core', 'react'] as const) {
      expect(
        spinnerExample.props
          .filter(
            prop =>
              prop.availability === 'both' || prop.availability === framework,
          )
          .map(prop => prop.name),
      ).toEqual([
        'style',
        'isAnimating',
        'purpose',
        'width',
        'height',
        ...(framework === 'react' ? ['ref'] : []),
      ])
    }
    const prop = (name: string) =>
      spinnerExample.props.find(prop => prop.name === name)
    expect(prop('style')?.type).toBe("'dots' | 'bounce' | 'loop' | 'kitt'")
    expect(prop('style')?.description).toContain('Defaults to dots')
    expect(prop('style')?.description).toContain(
      'dots 1x1, bounce 5x2, loop 5x1, and kitt 7x1',
    )
    expect(prop('style')?.description).toContain(
      'resets the frame and elapsed time',
    )
    expect(prop('style')?.description).toContain(
      'Core style assignment invalidates sizing',
    )
    expect(prop('isAnimating')?.type).toBe('boolean')
    expect(prop('isAnimating')?.description).toContain('Defaults to true')
    expect(prop('isAnimating')?.description).toContain(
      'without hiding or resetting',
    )
    expect(prop('isAnimating')?.description).toContain('10 frames per second')
    expect(prop('isAnimating')?.description).toContain(
      'kitt uses approximately 20',
    )
    expect(prop('purpose')?.type).toBe('Palette | Purpose')
    expect(prop('purpose')?.description).toContain('accent text color')
    expect(prop('purpose')?.description).toContain('even when paused')
    expect(prop('width')?.type).toBe('Dimension')
    expect(prop('height')?.type).toBe('Dimension')
    expect(prop('ref')).toEqual({
      name: 'ref',
      type: 'React.Ref<Spinner>',
      description: 'Reference to the underlying Core Spinner',
      availability: 'react',
    })
  })

  it.each(['core', 'react'] as const)(
    '%s displays and captures the exact public sample at the initial frame with deterministic ANSI styles',
    async framework => {
      const extension = framework === 'react' ? 'tsx' : 'js'
      const moduleUrl = new URL(
        `../lib/examples/samples/spinner.${framework}.${extension}`,
        import.meta.url,
      )
      const source = readFileSync(moduleUrl, 'utf8').trimEnd()
      expect(spinnerExample.source[framework]()).toBe(source)
      expect(source).toContain(`from '@teaui/${framework}'`)
      expect(source).not.toMatch(
        /captureExample|HeadlessProgram|tui-|setTimeout|setInterval|Math\.random|Date\.|registerTick|receiveTick/,
      )
      for (const style of ['bounce', 'loop', 'kitt']) {
        expect(source).toContain(
          framework === 'core' ? `style: '${style}'` : `style="${style}"`,
        )
      }
      for (const purpose of ['primary', 'proceed', 'secondary', 'cancel']) {
        expect(source).toContain(
          framework === 'core'
            ? `purpose: '${purpose}'`
            : `purpose="${purpose}"`,
        )
      }
      if (framework === 'core') {
        expect(source).toContain('width: 44')
        expect(source).toContain('height: 12')
        expect(source).toContain("new Spinner({purpose: 'primary'})")
        expect(source).toContain('isAnimating: true')
        expect(source).toContain('isAnimating: false')
        expect(source).toContain('await Screen.start(examples)')
      } else {
        expect(source).toContain(
          '<Stack.down width={44} height={12} background="default">',
        )
        expect(source).toContain('<Spinner purpose="primary" />')
        expect(source).toContain('isAnimating={true}')
        expect(source).toContain('isAnimating={false}')
        expect(source).toContain('await run(<App />)')
        expect(source).not.toMatch(/createElement|from '@teaui\/core'/)
      }

      const start = Screen.start
      const registerTick = Screen.prototype.registerTick
      const render = vi.spyOn(Spinner.prototype, 'render')
      const receiveTick = vi.spyOn(Spinner.prototype, 'receiveTick')
      const captureSpy = vi.spyOn(capture, 'captureExample')
      const output = await spinnerExample.render[framework]()
      expect(captureSpy).toHaveBeenCalledExactlyOnceWith(moduleUrl, SIZE)
      expect(output).toBe(await captureSpy.mock.results[0].value)
      expect(Screen.start).toBe(start)
      expect(Screen.prototype.registerTick).toBe(registerTick)
      expect(receiveTick).not.toHaveBeenCalled()
      const spinners = [
        ...new Set(
          render.mock.contexts.filter(
            (view): view is Spinner => view instanceof Spinner,
          ),
        ),
      ]
      expect(spinners.map(view => [view.style, view.isAnimating])).toEqual([
        ['dots', true],
        ['bounce', true],
        ['loop', true],
        ['kitt', true],
        ['dots', false],
      ])
      expect(spinners.map(view => view.naturalSize(new Size(80, 24)))).toEqual([
        new Size(1, 1),
        new Size(5, 2),
        new Size(5, 1),
        new Size(7, 1),
        new Size(1, 1),
      ])
      // React's scheduler may queue an immediate callback after its commit.
      vi.runOnlyPendingTimers()
      expect(vi.getTimerCount()).toBe(0)

      const rendered = removeAnsi(output)
      const lines = rendered.split('\n')
      expect(lines).toHaveLength(SIZE.height)
      expect(lines.map(line => lineWidth(line))).toEqual(
        Array(SIZE.height).fill(SIZE.width),
      )
      expect([2, 4, 5, 7, 9, 11].map(y => lines[y].trimEnd())).toEqual(
        INITIAL_FRAMES,
      )
      const terminal = replay(output)
      const accents = ACCENTS.map(({row, columns, foreground}) => {
        for (const x of columns) {
          const style = terminal.styleAt(x, row)
          expect(style.foreground).toEqual(foreground)
          expect(style.background).toBe('default')
          expect(style.bold).toBeFalsy()
        }
        const style = terminal.styleAt(columns[0], row)
        return {row, foreground: style.foreground, background: style.background}
      })
      expect({text: rendered, accents}).toMatchSnapshot()

      vi.advanceTimersByTime(1500)
      expect(await spinnerExample.render[framework]()).toBe(output)
      expect(captureSpy).toHaveBeenNthCalledWith(2, moduleUrl, SIZE)
      expect(receiveTick).not.toHaveBeenCalled()
      vi.runOnlyPendingTimers()
      expect(vi.getTimerCount()).toBe(0)
    },
  )

  it('produces identical Core and JSX React ANSI output', async () => {
    // Capture hooks replace public APIs temporarily; captures must be sequential.
    const core = await spinnerExample.render.core()
    const react = await spinnerExample.render.react()
    expect(react).toBe(core)
  })

  it('freezes only Spinner ticks and restores the hook when capture fails', async () => {
    const registerTick = vi
      .spyOn(Screen.prototype, 'registerTick')
      .mockImplementation(() => {})
    const error = new Error('capture failed')
    vi.spyOn(capture, 'captureExample').mockImplementation(async () => {
      const screen = new Screen(
        new HeadlessProgram({cols: 1, rows: 1}),
        new Text(),
      )
      screen.registerTick(new Spinner())
      expect(registerTick).not.toHaveBeenCalled()
      const text = new Text()
      screen.registerTick(text)
      expect(registerTick).toHaveBeenCalledExactlyOnceWith(text)
      throw error
    })
    await expect(spinnerExample.render.core()).rejects.toBe(error)
    expect(Screen.prototype.registerTick).toBe(registerTick)
  })

  it('leaves normal public-API animation and pause/resume enabled after capture', async () => {
    await spinnerExample.render.core()
    const program = new HeadlessProgram({cols: 2, rows: 1})
    const active = new Spinner()
    const paused = new Spinner({isAnimating: false})
    const screen = new Screen(
      program,
      Stack.right({children: [active, paused]}),
    )
    try {
      screen.start()
      expect(removeAnsi(program.terminal.output)).toBe('⣾⣾')
      screen.tick(101)
      expect(removeAnsi(program.terminal.output)).toBe('⣷⣾')
      active.isAnimating = false
      paused.isAnimating = true
      screen.render()
      screen.tick(101)
      expect(removeAnsi(program.terminal.output)).toBe('⣷⣷')
      active.style = 'loop'
      screen.render()
      expect(active.naturalSize(new Size(80, 24))).toEqual(new Size(5, 1))
    } finally {
      screen.stop()
    }
    vi.runOnlyPendingTimers()
    expect(vi.getTimerCount()).toBe(0)
  })
})
