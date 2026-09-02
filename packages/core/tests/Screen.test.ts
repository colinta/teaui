import type {InputEvent as TermInputEvent} from '@teaui/term'
import {afterEach, describe, expect, test, vi} from 'vitest'
import type {SystemEvent} from '../lib/events/index.js'
import {Text} from '../lib/components/Text.js'
import {Window} from '../lib/components/Window.js'
import {Screen, TerminalProgram} from '../lib/Screen.js'
import {TestProgram} from '../lib/TestProgram.js'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Screen.start', () => {
  test('awaits asynchronous setup before constructing the root view', async () => {
    let finishSetup: () => void = () => {}
    const setup = vi
      .spyOn(TerminalProgram.prototype, 'setup')
      .mockImplementation(
        () =>
          new Promise<void>(resolve => {
            finishSetup = resolve
          }),
      )
    const teardown = vi
      .spyOn(TerminalProgram.prototype, 'teardown')
      .mockImplementation(() => {})
    const constructionError = new Error('view construction failed')
    const constructView = vi.fn(async (): Promise<never> => {
      throw constructionError
    })

    const start = Screen.start(constructView, {quitChar: false})
    await Promise.resolve()

    expect(setup).toHaveBeenCalledOnce()
    expect(constructView).not.toHaveBeenCalled()

    finishSetup()
    await expect(start).rejects.toBe(constructionError)
    expect(constructView).toHaveBeenCalledOnce()
    expect(teardown).toHaveBeenCalledOnce()
  })

  test('tears down the program when setup fails', async () => {
    const setupError = new Error('setup failed')
    vi.spyOn(TerminalProgram.prototype, 'setup').mockRejectedValue(setupError)
    const teardown = vi
      .spyOn(TerminalProgram.prototype, 'teardown')
      .mockImplementation(() => {})

    await expect(Screen.start()).rejects.toBe(setupError)

    expect(teardown).toHaveBeenCalledOnce()
  })
})

describe('Screen lifecycle', () => {
  test('does not deliver or render a key event after its binding stops the screen', () => {
    const program = new TestProgram({cols: 10, rows: 5})
    const screen = new Screen(program, new Window())
    screen.key('x', () => screen.stop())
    screen.start()
    const trigger = vi.spyOn(screen, 'trigger')

    program.sendEvent({
      type: 'key',
      name: 'x',
      char: 'x',
      full: 'x',
      ctrl: false,
      alt: false,
      gui: false,
      shift: false,
    })

    expect(trigger).not.toHaveBeenCalled()
  })

  test('stops and tears down only once', () => {
    const program = new TestProgram({cols: 10, rows: 5})
    const teardown = vi.spyOn(program, 'teardown')
    const screen = new Screen(program, new Window())
    screen.onExit(() => program.teardown())
    screen.start()

    screen.stop()
    screen.stop()

    expect(teardown).toHaveBeenCalledOnce()
  })

  test('fully repaints after a resize event', () => {
    const program = new TestProgram({cols: 10, rows: 5})
    const screen = new Screen(program, new Text({text: 'repaint'}))
    screen.start()
    expect(program.terminal.textContent()).toBe('repaint')

    program.terminal.reset()
    program.sendResize()

    expect(program.terminal.textContent()).toBe('repaint')
    screen.stop()
  })

  test('waits for queued stdout teardown writes before exiting', () => {
    let didFlushStdout: (() => void) | undefined
    vi.spyOn(process.stdout, 'write').mockImplementation(((
      _chunk: unknown,
      callback?: () => void,
    ) => {
      didFlushStdout = callback
      return true
    }) as typeof process.stdout.write)
    const exit = vi
      .spyOn(process, 'exit')
      .mockImplementation((() => undefined) as never)
    const screen = new Screen(
      new TestProgram({cols: 10, rows: 5}),
      new Window(),
    )

    screen.exit()

    expect(exit).not.toHaveBeenCalled()
    expect(didFlushStdout).toBeTypeOf('function')

    didFlushStdout?.()
    expect(exit).toHaveBeenCalledWith(0)
  })
})

describe('TerminalProgram display options', () => {
  test('defaults to fullscreen display', () => {
    expect(new TerminalProgram().display).toEqual({mode: 'fullscreen'})
  })

  test('defaults to clearing an inline display on exit', () => {
    const program = new TerminalProgram({mode: 'inline', height: 9})

    expect(program.display).toEqual({
      mode: 'inline',
      region: {
        originY: 0,
        originKnown: false,
        height: Math.min(9, program.terminal.rows),
        configuredHeight: 9,
      },
      clearOnExit: true,
    })
  })

  test("uses the root view natural height when inline height is 'natural'", async () => {
    const program = new TerminalProgram({mode: 'inline', height: 'natural'})
    const reserveRows = vi
      .spyOn(program.terminal, 'reserveRows')
      .mockResolvedValue({x: 0, y: 12})
    vi.spyOn(program.terminal, 'startInput').mockReturnValue(program.terminal)
    vi.spyOn(program.terminal, 'enterApplication').mockReturnValue(
      program.terminal,
    )
    vi.spyOn(program.terminal, 'flushWrites').mockReturnValue(program.terminal)

    await program.setup()
    expect(reserveRows).not.toHaveBeenCalled()

    await program.setupRootView(new Text({text: 'first\nsecond'}))

    expect(program.display).toEqual({
      mode: 'inline',
      region: {
        originY: 12,
        originKnown: true,
        height: 2,
        configuredHeight: 2,
      },
      clearOnExit: true,
    })
    expect(reserveRows).toHaveBeenCalledWith(2, undefined, expect.any(Function))

    vi.spyOn(program.terminal, 'exitApplication').mockReturnValue(
      program.terminal,
    )
    vi.spyOn(program.terminal, 'clearRows').mockReturnValue(program.terminal)
    vi.spyOn(program.terminal, 'stopInput').mockReturnValue(program.terminal)
    program.teardown()
  })

  test('clamps a natural inline height to the physical terminal', async () => {
    const program = new TerminalProgram({mode: 'inline', height: 'natural'})
    vi.spyOn(program.terminal, 'reserveRows').mockResolvedValue({x: 0, y: 0})
    vi.spyOn(program.terminal, 'startInput').mockReturnValue(program.terminal)
    vi.spyOn(program.terminal, 'enterApplication').mockReturnValue(
      program.terminal,
    )
    vi.spyOn(program.terminal, 'flushWrites').mockReturnValue(program.terminal)
    const lines = Array.from(
      {length: program.terminal.size.rows + 10},
      (_, index) => `line ${index}`,
    ).join('\n')

    await program.setupRootView(new Text({text: lines}))

    expect(program.rows).toBe(program.terminal.size.rows)
    expect(program.display).toEqual(
      expect.objectContaining({
        region: expect.objectContaining({
          configuredHeight: program.terminal.size.rows,
        }),
      }),
    )

    vi.spyOn(program.terminal, 'exitApplication').mockReturnValue(
      program.terminal,
    )
    vi.spyOn(program.terminal, 'clearRows').mockReturnValue(program.terminal)
    vi.spyOn(program.terminal, 'stopInput').mockReturnValue(program.terminal)
    program.teardown()
  })

  test('allows preserving an inline display on exit', () => {
    const program = new TerminalProgram({
      mode: 'inline',
      height: 9,
      clearOnExit: false,
    })

    expect(program.display).toEqual({
      mode: 'inline',
      region: {
        originY: 0,
        originKnown: false,
        height: Math.min(9, program.terminal.rows),
        configuredHeight: 9,
      },
      clearOnExit: false,
    })
  })

  test('uses the inline region as its logical screen size', () => {
    const program = new TerminalProgram({mode: 'inline', height: 9})

    expect(program.cols).toBe(program.terminal.cols)
    expect(program.rows).toBe(Math.min(9, program.terminal.rows))
  })

  test('clamps inline height to the physical terminal height', () => {
    const program = new TerminalProgram({mode: 'inline', height: 1_000})

    expect(program.rows).toBe(program.terminal.rows)
  })

  test.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid inline height %s',
    height => {
      expect(() => new TerminalProgram({mode: 'inline', height})).toThrowError(
        'Inline display height must be a positive integer',
      )
    },
  )

  test('sets up inline mode without entering or clearing fullscreen', async () => {
    const program = new TerminalProgram({mode: 'inline', height: 9})
    const startInput = vi
      .spyOn(program.terminal, 'startInput')
      .mockReturnValue(program.terminal)
    const reserveRows = vi
      .spyOn(program.terminal, 'reserveRows')
      .mockResolvedValue({x: 0, y: 12})
    const enterApplication = vi
      .spyOn(program.terminal, 'enterApplication')
      .mockReturnValue(program.terminal)
    vi.spyOn(program.terminal, 'flushWrites').mockReturnValue(program.terminal)
    const enterFullscreen = vi.spyOn(program.terminal, 'enterFullscreen')
    const clear = vi.spyOn(program.terminal, 'clear')

    await program.setup()

    expect(startInput).toHaveBeenCalledOnce()
    expect(reserveRows).toHaveBeenCalledWith(9, undefined, expect.any(Function))
    expect(enterApplication).toHaveBeenCalledWith({
      mouse: true,
      hideCursor: true,
      focusEvents: true,
    })
    expect(enterFullscreen).not.toHaveBeenCalled()
    expect(clear).not.toHaveBeenCalled()
  })

  test('disables inline mouse reporting when the origin is unavailable', async () => {
    const program = new TerminalProgram({mode: 'inline', height: 9})
    vi.spyOn(program.terminal, 'startInput').mockReturnValue(program.terminal)
    vi.spyOn(program.terminal, 'reserveRows').mockResolvedValue(null)
    vi.spyOn(program.terminal, 'saveCursor').mockReturnValue(program.terminal)
    const enterApplication = vi
      .spyOn(program.terminal, 'enterApplication')
      .mockReturnValue(program.terminal)
    vi.spyOn(program.terminal, 'flushWrites').mockReturnValue(program.terminal)

    await program.setup()

    expect(enterApplication).toHaveBeenCalledWith({
      mouse: false,
      hideCursor: true,
      focusEvents: true,
    })
  })

  test('clears only the inline region on teardown by default', async () => {
    const program = new TerminalProgram({mode: 'inline', height: 9})
    vi.spyOn(program.terminal, 'startInput').mockReturnValue(program.terminal)
    vi.spyOn(program.terminal, 'reserveRows').mockResolvedValue({
      x: 0,
      y: 12,
    })
    vi.spyOn(program.terminal, 'enterApplication').mockReturnValue(
      program.terminal,
    )
    const flushWrites = vi
      .spyOn(program.terminal, 'flushWrites')
      .mockReturnValue(program.terminal)
    const exitApplication = vi
      .spyOn(program.terminal, 'exitApplication')
      .mockReturnValue(program.terminal)
    const moveTo = vi
      .spyOn(program.terminal, 'moveTo')
      .mockReturnValue(program.terminal)
    const clearRows = vi
      .spyOn(program.terminal, 'clearRows')
      .mockReturnValue(program.terminal)
    const stopInput = vi
      .spyOn(program.terminal, 'stopInput')
      .mockReturnValue(program.terminal)
    const clear = vi.spyOn(program.terminal, 'clear')
    const exitFullscreen = vi.spyOn(program.terminal, 'exitFullscreen')

    await program.setup()
    flushWrites.mockClear()
    program.teardown()

    expect(exitApplication).toHaveBeenCalledOnce()
    expect(moveTo).toHaveBeenCalledWith(0, 0)
    expect(clearRows).toHaveBeenCalledWith(9)
    expect(flushWrites).toHaveBeenCalledOnce()
    expect(stopInput).toHaveBeenCalledOnce()
    expect(clear).not.toHaveBeenCalled()
    expect(exitFullscreen).not.toHaveBeenCalled()
    expect(exitApplication.mock.invocationCallOrder[0]).toBeLessThan(
      clearRows.mock.invocationCallOrder[0],
    )
    expect(clearRows.mock.invocationCallOrder[0]).toBeLessThan(
      stopInput.mock.invocationCallOrder[0],
    )
  })

  test('clears from the saved inline origin when cursor reporting failed', async () => {
    const program = new TerminalProgram({mode: 'inline', height: 9})
    vi.spyOn(program.terminal, 'startInput').mockReturnValue(program.terminal)
    vi.spyOn(program.terminal, 'reserveRows').mockResolvedValue(null)
    const saveCursor = vi
      .spyOn(program.terminal, 'saveCursor')
      .mockReturnValue(program.terminal)
    vi.spyOn(program.terminal, 'enterApplication').mockReturnValue(
      program.terminal,
    )
    vi.spyOn(program.terminal, 'exitApplication').mockReturnValue(
      program.terminal,
    )
    const restoreCursor = vi
      .spyOn(program.terminal, 'restoreCursor')
      .mockReturnValue(program.terminal)
    const clearRows = vi
      .spyOn(program.terminal, 'clearRows')
      .mockReturnValue(program.terminal)
    vi.spyOn(program.terminal, 'flushWrites').mockReturnValue(program.terminal)
    vi.spyOn(program.terminal, 'stopInput').mockReturnValue(program.terminal)

    await program.setup()
    program.teardown()

    expect(saveCursor).toHaveBeenCalledOnce()
    expect(restoreCursor).toHaveBeenCalledOnce()
    expect(clearRows).toHaveBeenCalledWith(9)
  })

  test('preserves keyboard input while the inline origin is unknown', () => {
    const program = new TerminalProgram({mode: 'inline', height: 9})
    const events: SystemEvent[] = []
    program.onEvents(event => events.push(event))

    emitTermInput(program, {
      type: 'key',
      key: 'a',
      ctrl: false,
      alt: false,
      shift: false,
      gui: false,
    })

    expect(events).toEqual([expect.objectContaining({type: 'key', char: 'a'})])
  })

  test('forwards mouse events inside the inline region as local events', () => {
    const program = new TerminalProgram({mode: 'inline', height: 9})
    if (program.display.mode !== 'inline')
      throw new Error('Expected inline mode')
    program.display.region.originY = 12
    program.display.region.originKnown = true
    const events: SystemEvent[] = []
    program.onEvents(event => events.push(event))

    emitTermInput(program, termMouse(program.cols - 1, 12 + program.rows - 1))

    expect(events).toEqual([
      expect.objectContaining({
        type: 'mouse',
        name: 'mouse.button.down',
        x: program.cols - 1,
        y: program.rows - 1,
      }),
    ])
  })

  test.each<[string, number, number]>([
    ['above', 0, -1],
    ['below', 0, 9],
    ['left', -1, 0],
    ['right', Number.POSITIVE_INFINITY, 0],
  ])('discards mouse events %s the inline region', (_name, x, y) => {
    const program = new TerminalProgram({mode: 'inline', height: 9})
    if (program.display.mode !== 'inline')
      throw new Error('Expected inline mode')
    program.display.region.originKnown = true
    const events: SystemEvent[] = []
    program.onEvents(event => events.push(event))

    emitTermInput(
      program,
      termMouse(x === Number.POSITIVE_INFINITY ? program.cols : x, y),
    )

    expect(events).toEqual([])
  })

  test('preserves fullscreen mouse coordinates', () => {
    const program = new TerminalProgram()
    const events: SystemEvent[] = []
    program.onEvents(event => events.push(event))

    emitTermInput(program, termMouse(program.cols + 5, program.rows + 5))

    expect(events).toEqual([
      expect.objectContaining({
        type: 'mouse',
        x: program.cols + 5,
        y: program.rows + 5,
      }),
    ])
  })
})

function termMouse(x: number, y: number): TermInputEvent {
  return {
    type: 'mouse',
    action: 'press',
    button: 'left',
    x,
    y,
    ctrl: false,
    alt: false,
    gui: false,
    shift: false,
  }
}

function emitTermInput(program: TerminalProgram, event: TermInputEvent): void {
  const inputReader = Reflect.get(program.terminal, 'inputReader') as {
    listeners: Array<(event: TermInputEvent) => void>
  }
  for (const listener of inputReader.listeners) listener(event)
}
