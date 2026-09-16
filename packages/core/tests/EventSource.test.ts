import {afterEach, describe, expect, it, vi} from 'vitest'
import {Screen} from '../lib/Screen.js'
import {TestProgram} from '../lib/TestProgram.js'
import {Text} from '../lib/components/Text.js'
import type {EventSource} from '../lib/types.js'
import type {KeyEvent, SystemEvent} from '../lib/events/index.js'

// No network, drawing, setup, or teardown API is needed to provide events.
class TestEventSource implements EventSource {
  listeners = new Set<(event: SystemEvent) => void>()
  unsubscribe = vi.fn()

  onEvents(listener: (event: SystemEvent) => void) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
      this.unsubscribe()
    }
  }

  emit(event: SystemEvent) {
    for (const listener of this.listeners) listener(event)
  }
}

const key: KeyEvent = {
  type: 'key',
  name: 'x',
  char: 'x',
  full: 'x',
  ctrl: false,
  alt: false,
  gui: false,
  shift: false,
}
const screens: Screen[] = []

function setup() {
  const program = new TestProgram({cols: 10, rows: 1})
  const screen = new Screen(program, new Text({text: 'test'}))
  screens.push(screen)
  return {screen, program}
}

afterEach(() => {
  for (const screen of screens.splice(0)) screen.stop()
  vi.restoreAllMocks()
})

describe('Screen event sources', () => {
  it('subscribes Program through the same protocol as additional event sources', () => {
    const {screen, program} = setup()
    const add = vi.spyOn(screen, 'addEventSource')
    const dispatch = vi.spyOn(screen, 'dispatch')
    const binding = vi.fn()
    screen.key('x', binding)
    screen.start()
    expect(add).toHaveBeenCalledWith(program)

    const first = new TestEventSource()
    const second = new TestEventSource()
    screen.addEventSource(first)
    screen.addEventSource(second)
    program.sendEvent(key)
    first.emit(key)
    second.emit(key)
    expect(dispatch.mock.calls).toEqual([[key], [key], [key]])
    expect(binding).toHaveBeenCalledTimes(3)
  })

  it('detaches just one source, idempotently, without disturbing the program', () => {
    const {screen, program} = setup()
    screen.start()
    const source = new TestEventSource()
    const dispatch = vi.spyOn(screen, 'dispatch')
    const detach = screen.addEventSource(source)
    detach()
    detach()
    source.emit(key)
    program.sendEvent(key)
    expect(dispatch).toHaveBeenCalledOnce()
    expect(source.unsubscribe).toHaveBeenCalledOnce()
    screen.stop()
    expect(source.unsubscribe).toHaveBeenCalledOnce()
  })

  it('detaches every source and the program when stopped', () => {
    const {screen, program} = setup()
    screen.start()
    const first = new TestEventSource()
    const second = new TestEventSource()
    screen.addEventSource(first)
    const detach = screen.addEventSource(second)
    screen.stop()
    screen.stop()
    detach()
    const dispatch = vi.spyOn(screen, 'dispatch')
    first.emit(key)
    second.emit(key)
    program.sendEvent(key)
    expect(dispatch).not.toHaveBeenCalled()
    expect(first.unsubscribe).toHaveBeenCalledOnce()
    expect(second.unsubscribe).toHaveBeenCalledOnce()
    expect(first.listeners.size).toBe(0)
    expect(second.listeners.size).toBe(0)
    expect(() => screen.addEventSource(new TestEventSource())).toThrow(
      'stopped screen',
    )
  })

  it('attempts every cleanup and exit callback before reporting failures', () => {
    const {screen, program} = setup()
    const resizeCleanup = vi.fn()
    vi.spyOn(program, 'onResize').mockReturnValue(resizeCleanup)
    screen.start()
    const detachFailure = new Error('detach failed')
    const exitFailure = new Error('exit failed')
    const badCleanup = vi.fn(() => {
      throw detachFailure
    })
    const goodCleanup = vi.fn()
    screen.addEventSource({onEvents: () => badCleanup})
    const detach = screen.addEventSource({onEvents: () => goodCleanup})
    screen.onExit(() => {
      throw exitFailure
    })
    const restoreTerminal = vi.fn()
    screen.onExit(restoreTerminal)
    const warning = vi.spyOn(process, 'emitWarning').mockImplementation(() => {
      expect(restoreTerminal).toHaveBeenCalledOnce()
    })
    expect(() => screen.stop()).not.toThrow()
    expect(warning.mock.calls).toEqual([[detachFailure], [exitFailure]])
    expect(badCleanup).toHaveBeenCalledOnce()
    expect(goodCleanup).toHaveBeenCalledOnce()
    expect(resizeCleanup).toHaveBeenCalledOnce()
    expect(restoreTerminal).toHaveBeenCalledOnce()
    screen.stop()
    detach()
    expect(goodCleanup).toHaveBeenCalledOnce()
    expect(restoreTerminal).toHaveBeenCalledOnce()
    expect(warning).toHaveBeenCalledTimes(2)
  })

  it('reports all cleanup errors, including view and exit failures', () => {
    const {screen} = setup()
    screen.start()
    const viewFailure = new Error('view unmount failed')
    const exitFailure = new Error('exit failed')
    vi.spyOn(screen.rootView, 'moveToScreen').mockImplementationOnce(() => {
      throw viewFailure
    })
    const cleanup = vi.fn()
    screen.addEventSource({onEvents: () => cleanup})
    screen.onExit(() => {
      throw exitFailure
    })
    const restored = vi.fn()
    screen.onExit(restored)
    const warning = vi
      .spyOn(process, 'emitWarning')
      .mockImplementation(() => {})
    expect(() => screen.stop()).not.toThrow()
    expect(warning.mock.calls).toEqual([[viewFailure], [exitFailure]])
    expect(cleanup).toHaveBeenCalledOnce()
    expect(restored).toHaveBeenCalledOnce()
  })

  it.each(['cleanup failed', null, undefined, {reason: 'cleanup failed'}])(
    'reports non-Error cleanup failures as warnings (%j)',
    failure => {
      const {screen} = setup()
      screen.start()
      screen.onExit(() => {
        throw failure
      })
      const warning = vi
        .spyOn(process, 'emitWarning')
        .mockImplementation(() => {})
      expect(() => screen.stop()).not.toThrow()
      expect(warning).toHaveBeenCalledOnce()
      const error = warning.mock.calls[0][0]
      expect(error).toBeInstanceOf(Error)
      expect(error).toHaveProperty('cause', failure)
    },
  )

  it('accepts sources before start but only dispatches into the UI while running', () => {
    const {screen} = setup()
    const source = new TestEventSource()
    const binding = vi.fn()
    screen.key('x', binding)
    screen.addEventSource(source)
    source.emit(key)
    expect(binding).not.toHaveBeenCalled()
    screen.start()
    source.emit(key)
    expect(binding).toHaveBeenCalledOnce()
  })

  it('detaches even if a source synchronously stops the screen during subscription', () => {
    const {screen} = setup()
    screen.start()
    screen.key('x', () => screen.stop())
    const cleanup = vi.fn()
    const source: EventSource = {
      onEvents(listener) {
        listener(key)
        return cleanup
      },
    }
    const detach = screen.addEventSource(source)
    expect(cleanup).toHaveBeenCalledOnce()
    detach()
    expect(cleanup).toHaveBeenCalledOnce()
  })
})
