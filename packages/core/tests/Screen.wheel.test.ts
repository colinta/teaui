import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {Screen} from '../lib/Screen.js'
import {TestProgram} from '../lib/TestProgram.js'
import type {View} from '../lib/View.js'
import type {Viewport} from '../lib/Viewport.js'
import type {SystemEvent, SystemMouseEvent} from '../lib/events/index.js'
import {Point} from '../lib/geometry.js'
import {Scrollable} from '../lib/components/Scrollable.js'
import {Stack} from '../lib/components/Stack.js'
import {Text} from '../lib/components/Text.js'
import {Checkbox} from '../lib/components/Checkbox.js'

const screens: Screen[] = []
beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  for (const screen of screens.splice(0)) {
    screen.stop()
  }
  vi.restoreAllMocks()
  vi.useRealTimers()
})

function wheel(
  name: SystemMouseEvent['name'] = 'mouse.wheel.down',
  props: Partial<SystemMouseEvent> = {},
): SystemMouseEvent {
  return {
    type: 'mouse',
    name,
    x: 1,
    y: 1,
    button: 'wheel',
    ctrl: false,
    alt: false,
    gui: false,
    shift: false,
    ...props,
  }
}

function mount(root: View) {
  const program = new TestProgram({cols: 20, rows: 5})
  const screen = new Screen(program, root)
  screens.push(screen)
  screen.start()
  // Clear any size invalidation raised during initial layout, before observing
  // input-triggered frames. Some tests also intentionally keep animation ticks.
  vi.advanceTimersByTime(32)
  return {program, screen, render: vi.spyOn(screen, 'render')}
}

function scroll() {
  const offsets: Point[] = []
  const root = new Scrollable({
    showScrollbars: false,
    children: [
      new Text({
        lines: Array.from({length: 30}, (_, i) => `row ${i} ${'x'.repeat(40)}`),
      }),
    ],
    onOffsetChange: p => offsets.push(p),
  })
  return {root, offsets, ...mount(root)}
}

describe('Screen wheel frame batching', () => {
  it('delivers every event immediately but paints a burst once on the next frame', () => {
    const {program, screen, render, offsets} = scroll()
    const original = screen.snapshot()
    for (let i = 0; i < 12; i++) {
      program.sendEvent(wheel())
    }
    expect(offsets.map(p => p.y)).toEqual(
      Array.from({length: 12}, (_, i) => i + 1),
    )
    expect(screen.snapshot()).toBe(original) // snapshot is not a render barrier
    expect(render).not.toHaveBeenCalled()
    vi.advanceTimersByTime(15)
    expect(render).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(render).toHaveBeenCalledOnce()
    expect(program.terminal.textContent().split('\n')[0]).toContain('row 12 ')
    vi.advanceTimersByTime(100)
    expect(render).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('does not postpone the deadline during a continuous stream', () => {
    const {program, render} = scroll()
    for (let i = 0; i < 20; i++) {
      program.sendEvent(wheel())
      vi.advanceTimersByTime(4)
      expect(render).toHaveBeenCalledTimes(Math.floor((i + 1) / 4))
    }
    expect(render).toHaveBeenCalledTimes(5)
  })

  it('batches terminal, additional sources, dispatch and trigger without configuration', () => {
    const {program, screen, render, offsets} = scroll()
    let emit: (event: SystemEvent) => void = () => {}
    screen.addEventSource({
      onEvents(listener) {
        emit = listener
        return () => {}
      },
    })
    program.sendEvent(wheel())
    emit(wheel())
    screen.dispatch(wheel())
    screen.trigger(wheel())
    expect(offsets.map(p => p.y)).toEqual([1, 2, 3, 4])
    expect(render).not.toHaveBeenCalled()
    vi.advanceTimersByTime(16)
    expect(render).toHaveBeenCalledOnce()
    expect(program.terminal.textContent().split('\n')[0]).toContain('row 4 ')
  })

  it('preserves direction changes, clamping at both ends, and horizontal steps', () => {
    const batched = scroll()
    const immediate = scroll()
    const events = [
      wheel('mouse.wheel.up'),
      wheel(),
      ...Array.from({length: 40}, () => wheel()),
      wheel('mouse.wheel.up'),
      wheel('mouse.wheel.up'),
      wheel('mouse.wheel.left'),
      wheel('mouse.wheel.left'),
      wheel('mouse.wheel.right'),
    ]
    for (const event of events) {
      batched.program.sendEvent(event)
      immediate.program.sendEvent(event)
      immediate.screen.render() // reference: paint after every individual step
    }
    vi.advanceTimersByTime(16)
    expect(batched.offsets).toEqual(immediate.offsets)
    expect(batched.screen.snapshot()).toBe(immediate.screen.snapshot())
    expect(batched.render).toHaveBeenCalledOnce()
  })

  it.each<Partial<SystemMouseEvent>>([
    {x: 2},
    {y: 2},
    {ctrl: true},
    {alt: true},
    {gui: true},
    {shift: true},
  ])('flushes before changing pointer or modifiers: %j', props => {
    const {program, render, offsets} = scroll()
    program.sendEvent(wheel())
    program.sendEvent(wheel('mouse.wheel.down', props))
    expect(render).toHaveBeenCalledOnce()
    expect(program.terminal.textContent().split('\n')[0]).toContain('row 1 ')
    vi.advanceTimersByTime(16)
    expect(render).toHaveBeenCalledTimes(2)
    expect(offsets.at(-1)?.y).toBe(props.ctrl ? 6 : 2)
  })

  it('remembers pointer context even when a source reuses its event object', () => {
    const {program, render} = scroll()
    const event = wheel()
    program.sendEvent(event)
    event.x = 2
    program.sendEvent(event)
    expect(render).toHaveBeenCalledOnce()
    vi.advanceTimersByTime(16)
    expect(render).toHaveBeenCalledTimes(2)
  })

  it('flushes before a click so it hits the newly visible checkbox', () => {
    const checks = Array.from(
      {length: 20},
      (_, i) => new Checkbox({title: `row ${i}`, value: false}),
    )
    const root = new Scrollable({
      showScrollbars: false,
      children: [Stack.down(checks)],
    })
    const {program} = mount(root)
    program.sendEvent(wheel())
    program.sendEvent(wheel('mouse.button.down', {x: 0, y: 0, button: 'left'}))
    program.sendEvent(wheel('mouse.button.up', {x: 0, y: 0, button: 'left'}))
    expect(checks[0].value).toBe(false)
    expect(checks[1].value).toBe(true)
  })

  it('flushes before screen key bindings, not only before view input', () => {
    const {program, screen} = scroll()
    let frame = ''
    screen.key('x', () => {
      frame = program.terminal.textContent()
    })
    program.sendEvent(wheel())
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
    expect(frame.split('\n')[0]).toContain('row 1 ')
  })

  it.each<SystemEvent>([
    {type: 'paste', text: 'pasted'},
    {type: 'resize'},
    {type: 'blur'},
    {type: 'focus'},
    wheel('mouse.move.in', {button: 'unknown'}),
  ])('flushes before other input (%j)', event => {
    const {screen, program, render} = scroll()
    program.sendEvent(wheel())
    screen.trigger(event) // lower-level callers get the same ordering
    expect(render).toHaveBeenCalledTimes(2)
    expect(program.terminal.textContent().split('\n')[0]).toContain('row 1 ')
    vi.advanceTimersByTime(32)
    expect(render).toHaveBeenCalledTimes(2)
  })

  it('explicit rendering consumes the pending wheel frame', () => {
    const {program, screen, render} = scroll()
    program.sendEvent(wheel())
    screen.render()
    vi.advanceTimersByTime(32)
    expect(render).toHaveBeenCalledOnce()
  })

  it.each([false, true])(
    'cancels pending work on stop (inside wheel callback: %s)',
    inCallback => {
      const {root, program, screen, render} = scroll()
      program.sendEvent(wheel())
      if (inCallback) {
        root.addMouseListener(() => screen.stop(), {events: ['mouse.wheel']})
        // Install the listener without consuming the existing pending burst.
        screen.render()
        render.mockClear()
        program.sendEvent(wheel())
      } else {
        screen.stop()
      }
      screen.needsRender()
      vi.advanceTimersByTime(100)
      expect(render).not.toHaveBeenCalled()
      expect(vi.getTimerCount()).toBe(0)
    },
  )

  it('retains pending work while an inline region is updating', () => {
    const {program, render} = scroll()
    const region = vi
      .spyOn(program, 'isUpdatingRegion', 'get')
      .mockReturnValue(true)
    program.sendEvent(wheel())
    vi.advanceTimersByTime(16)
    expect(program.terminal.textContent().split('\n')[0]).toContain('row 0 ')
    region.mockReturnValue(false)
    vi.advanceTimersByTime(16)
    expect(program.terminal.textContent().split('\n')[0]).toContain('row 1 ')
    expect(render).toHaveBeenCalledTimes(2)
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('render request consumption', () => {
  it.each([false, true])(
    'preserves invalidations raised during render (tick initiated: %s)',
    fromTick => {
      class InvalidatesOnce extends Text {
        invalidateNext = false
        render(v: Viewport) {
          super.render(v)
          if (this.invalidateNext) {
            this.invalidateNext = false
            this.invalidateRender()
          }
        }
      }
      const root = new InvalidatesOnce({text: 'content'})
      const {screen, render} = mount(root)
      root.invalidateNext = true
      if (fromTick) {
        screen.needsRender()
        vi.advanceTimersByTime(16)
      } else {
        screen.render()
      }
      expect(render).toHaveBeenCalledOnce()
      vi.advanceTimersByTime(16)
      expect(render).toHaveBeenCalledTimes(2)
      vi.advanceTimersByTime(32)
      expect(render).toHaveBeenCalledTimes(2)
      expect(vi.getTimerCount()).toBe(0)
    },
  )

  it('does not repaint consumed invalidations, but continues animation ticks', () => {
    class Animated extends Text {
      ticks = 0
      render(v: Viewport) {
        v.registerTick()
        super.render(v)
      }
      receiveTick() {
        this.ticks++
        return false
      }
    }
    const root = new Animated({text: 'animation'})
    const {screen, render} = mount(root)
    const ticks = root.ticks
    screen.needsRender()
    screen.render()
    vi.advanceTimersByTime(32)
    expect(render).toHaveBeenCalledOnce()
    expect(root.ticks).toBe(ticks + 2)
    screen.needsRender()
    vi.advanceTimersByTime(16)
    expect(render).toHaveBeenCalledTimes(2)
  })
})
