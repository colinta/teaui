import {describe, expect, it, vi} from 'vitest'
import {testRender} from '../../lib/TestScreen.js'
import {Button} from '../../lib/components/Button.js'
import {Stack} from '../../lib/components/Stack.js'
import {Text} from '../../lib/components/Text.js'
import {Point, Rect, Size} from '../../lib/geometry.js'
import type {MouseEvent} from '../../lib/events/index.js'
import {Probe} from './Probe.js'

const names = (events: MouseEvent[]) => events.map(event => event.name)

describe('addMouseListener', () => {
  describe('piggy-backing (no events option)', () => {
    it('is called with the events the view registered for itself', () => {
      const button = new Button({title: 'OK', onClick: vi.fn()})
      const listener = vi.fn()
      button.addMouseListener(listener)
      const t = testRender(button, {width: 10, height: 3})

      t.sendMouse('mouse.move.in', {x: 2, y: 1})
      t.sendMouse('mouse.button.down', {x: 2, y: 1})
      t.sendMouse('mouse.button.up', {x: 2, y: 1})

      const received = names(listener.mock.calls.map(call => call[0]))
      expect(received).toContain('mouse.move.enter')
      expect(received).toContain('mouse.button.down')
      expect(received).toContain('mouse.button.up')
    })

    it('does not interfere with the view handling its own events', () => {
      const onClick = vi.fn()
      const button = new Button({title: 'OK', onClick})
      const listener = vi.fn()
      button.addMouseListener(listener)
      const t = testRender(button, {width: 10, height: 3})

      t.sendMouse('mouse.button.down', {x: 2, y: 1})
      t.sendMouse('mouse.button.up', {x: 2, y: 1})

      expect(onClick).toHaveBeenCalledOnce()
    })

    it('never registers: a view that did not register is never called', () => {
      const text = new Text({text: 'hello'})
      const listener = vi.fn()
      text.addMouseListener(listener)
      const t = testRender(text, {width: 10, height: 1})

      t.sendMouse('mouse.move.in', {x: 1, y: 0})
      t.sendMouse('mouse.button.down', {x: 1, y: 0})
      t.sendMouse('mouse.button.up', {x: 1, y: 0})
      t.sendMouse('mouse.wheel.down', {x: 1, y: 0})

      expect(listener).not.toHaveBeenCalled()
    })

    it('only sees the events the view registered for', () => {
      const probe = new Probe({mouse: ['mouse.move']})
      const listener = vi.fn()
      probe.addMouseListener(listener)
      const t = testRender(probe, {width: 10, height: 1})

      t.sendMouse('mouse.wheel.down', {x: 1, y: 0})
      expect(listener).not.toHaveBeenCalled()

      t.sendMouse('mouse.move.in', {x: 1, y: 0})
      expect(names(listener.mock.calls.map(c => c[0]))).toEqual([
        'mouse.move.enter',
        'mouse.move.in',
      ])
    })

    it('is called after receiveMouse, with the same events', () => {
      const probe = new Probe({mouse: ['mouse.move']})
      const order: string[] = []
      const receive = probe.receiveMouse.bind(probe)
      probe.receiveMouse = (event: MouseEvent) => {
        order.push(`receive ${event.name}`)
        receive(event)
      }
      probe.addMouseListener(event => order.push(`listener ${event.name}`))
      const t = testRender(probe, {width: 10, height: 1})

      t.sendMouse('mouse.move.in', {x: 1, y: 0})

      expect(order).toEqual([
        'receive mouse.move.enter',
        'listener mouse.move.enter',
        'receive mouse.move.in',
        'listener mouse.move.in',
      ])
    })

    it('reports positions relative to the content, even when the view registered in a clipped viewport', () => {
      const probe = new Probe({
        mouse: ['mouse.move'],
        mouseClipped: new Rect(new Point(3, 0), new Size(4, 1)),
      })
      const listener = vi.fn()
      probe.addMouseListener(listener)
      const t = testRender(probe, {width: 10, height: 1})

      t.sendMouse('mouse.move.in', {x: 5, y: 0})

      // the view's own receiveMouse sees positions relative to the clipped viewport
      expect(probe.mouse.at(-1)!.position).toEqual(new Point(2, 0))
      // the listener sees positions relative to the view's content
      expect(listener.mock.calls.at(-1)![0].position).toEqual(new Point(5, 0))
    })
  })

  describe('explicit events', () => {
    it('registers the view for the events, without calling receiveMouse', () => {
      const probe = new Probe()
      const listener = vi.fn()
      probe.addMouseListener(listener, {events: ['mouse.move']})
      const t = testRender(probe, {width: 10, height: 2})

      t.sendMouse('mouse.move.in', {x: 3, y: 1})

      expect(names(listener.mock.calls.map(c => c[0]))).toEqual([
        'mouse.move.enter',
        'mouse.move.in',
      ])
      expect(probe.mouse).toEqual([])
    })

    it('does not update the isHover / isPressed state of the view', () => {
      const probe = new Probe()
      probe.addMouseListener(() => {}, {
        events: ['mouse.move', 'mouse.button.left'],
      })
      const t = testRender(probe, {width: 10, height: 2})

      t.sendMouse('mouse.move.in', {x: 3, y: 1})
      t.sendMouse('mouse.button.down', {x: 3, y: 1})

      expect(probe.isHover).toBe(false)
      expect(probe.isPressed).toBe(false)
    })

    it('only registers for the listed events', () => {
      const probe = new Probe()
      const listener = vi.fn()
      probe.addMouseListener(listener, {events: ['mouse.wheel']})
      const t = testRender(probe, {width: 10, height: 2})

      t.sendMouse('mouse.move.in', {x: 3, y: 1})
      t.sendMouse('mouse.button.down', {x: 3, y: 1})
      t.sendMouse('mouse.button.up', {x: 3, y: 1})
      expect(listener).not.toHaveBeenCalled()

      t.sendMouse('mouse.wheel.down', {x: 3, y: 1})
      expect(names(listener.mock.calls.map(c => c[0]))).toEqual([
        'mouse.wheel.down',
      ])
    })

    it('registers for a single button', () => {
      const probe = new Probe()
      const listener = vi.fn()
      probe.addMouseListener(listener, {events: ['mouse.button.left']})
      const t = testRender(probe, {width: 10, height: 2})

      t.sendMouse('mouse.button.down', {x: 3, y: 1})
      t.sendMouse('mouse.button.up', {x: 3, y: 1})

      expect(names(listener.mock.calls.map(c => c[0]))).toEqual([
        'mouse.button.down',
        'mouse.button.up',
      ])
    })

    it('`events: true` registers for move, buttons, and wheel', () => {
      const probe = new Probe()
      const listener = vi.fn()
      probe.addMouseListener(listener, {events: true})
      const t = testRender(probe, {width: 10, height: 2})

      t.sendMouse('mouse.move.in', {x: 3, y: 1})
      t.sendMouse('mouse.button.down', {x: 3, y: 1})
      t.sendMouse('mouse.button.up', {x: 3, y: 1})
      t.sendMouse('mouse.wheel.up', {x: 3, y: 1})

      const received = names(listener.mock.calls.map(c => c[0]))
      expect(received).toContain('mouse.move.enter')
      expect(received).toContain('mouse.button.down')
      expect(received).toContain('mouse.button.up')
      expect(received).toContain('mouse.wheel.up')
      expect(probe.mouse).toEqual([])
    })

    it('`events: []` registers nothing', () => {
      const probe = new Probe()
      const listener = vi.fn()
      probe.addMouseListener(listener, {events: []})
      const t = testRender(probe, {width: 10, height: 2})

      t.sendMouse('mouse.move.in', {x: 3, y: 1})
      t.sendMouse('mouse.button.down', {x: 3, y: 1})
      t.sendMouse('mouse.button.up', {x: 3, y: 1})
      t.sendMouse('mouse.wheel.up', {x: 3, y: 1})

      expect(listener).not.toHaveBeenCalled()
    })

    it('does not register outside of the view', () => {
      const stack = Stack.down([
        new Probe({}, {height: 1}),
        new Probe({}, {height: 1}),
      ])
      const [first] = stack.children
      const listener = vi.fn()
      first.addMouseListener(listener, {events: ['mouse.move']})
      const t = testRender(stack, {width: 10, height: 2})

      t.sendMouse('mouse.move.in', {x: 3, y: 1})
      expect(listener).not.toHaveBeenCalled()

      t.sendMouse('mouse.move.in', {x: 3, y: 0})
      expect(listener).toHaveBeenCalled()
    })

    it('passes positions relative to the content, along with its contentSize', () => {
      const probe = new Probe({}, {padding: 1})
      const listener = vi.fn()
      probe.addMouseListener(listener, {events: ['mouse.move']})
      const t = testRender(probe, {width: 12, height: 5})

      t.sendMouse('mouse.move.in', {x: 1, y: 1})
      let [event, contentSize] = listener.mock.calls.at(-1)!
      expect(event.position).toEqual(new Point(0, 0))
      expect(contentSize).toEqual(new Size(10, 3))

      t.sendMouse('mouse.move.in', {x: 10, y: 3})
      ;[event, contentSize] = listener.mock.calls.at(-1)!
      expect(event.position).toEqual(new Point(9, 2))
      expect(contentSize).toEqual(new Size(10, 3))

      // padding is not part of the content
      listener.mockClear()
      t.sendMouse('mouse.move.in', {x: 0, y: 0})
      expect(names(listener.mock.calls.map(c => c[0]))).toEqual([
        'mouse.move.exit',
      ])
    })

    it('can ignore events along the edges, using contentSize', () => {
      const text = new Text({text: 'hello world'})
      const hovered: boolean[] = []
      text.addMouseListener(
        (event, contentSize) => {
          if (event.name !== 'mouse.move.in') {
            return
          }
          hovered.push(event.position.x < contentSize.width - 2)
        },
        {events: ['mouse.move']},
      )
      const t = testRender(text, {width: 11, height: 1})

      t.sendMouse('mouse.move.in', {x: 1, y: 0})
      t.sendMouse('mouse.move.in', {x: 10, y: 0})
      expect(hovered).toEqual([true, false])
    })

    it('passes a System that can request focus', () => {
      const probe = new Probe({focus: {isDefault: false}})
      const systems: unknown[] = []
      probe.addMouseListener(
        (_event, _size, system) => {
          systems.push(system)
          system.requestFocus()
        },
        {events: ['mouse.button.left']},
      )
      const t = testRender(probe, {width: 10, height: 1})
      expect(probe.hasFocus).toBe(false)

      t.sendMouse('mouse.button.down', {x: 1, y: 0})

      expect(systems).toHaveLength(1)
      expect(probe.hasFocus).toBe(true)
    })
  })

  describe("explicit events combined with the view's own registrations", () => {
    it('an explicit move listener does not widen the native hover area', () => {
      const probe = new Probe({
        mouse: ['mouse.move'],
        mouseRect: new Rect(Point.zero, new Size(3, 1)),
      })
      const listener = vi.fn()
      probe.addMouseListener(listener, {events: ['mouse.move']})
      const t = testRender(probe, {width: 10, height: 1})

      // outside the native region: only the listener is involved
      t.sendMouse('mouse.move.in', {x: 6, y: 0})
      expect(probe.mouse).toEqual([])
      expect(probe.isHover).toBe(false)
      expect(names(listener.mock.calls.map(c => c[0]))).toEqual([
        'mouse.move.enter',
        'mouse.move.in',
      ])

      // crossing into the native region: the native destination *enters*, even
      // though the pointer never left the view
      listener.mockClear()
      t.sendMouse('mouse.move.in', {x: 1, y: 0})
      expect(names(probe.mouse)).toEqual(['mouse.move.enter', 'mouse.move.in'])
      expect(probe.isHover).toBe(true)
      expect(names(listener.mock.calls.map(c => c[0]))).toEqual([
        'mouse.move.in',
      ])

      // and leaving the native region again exits only the native destination
      probe.mouse.length = 0
      listener.mockClear()
      t.sendMouse('mouse.move.in', {x: 6, y: 0})
      expect(names(probe.mouse)).toEqual(['mouse.move.exit'])
      expect(probe.isHover).toBe(false)
      expect(names(listener.mock.calls.map(c => c[0]))).toEqual([
        'mouse.move.in',
      ])
    })

    it('a piggy-backing listener only sees the native region', () => {
      const probe = new Probe({
        mouse: ['mouse.move'],
        mouseRect: new Rect(Point.zero, new Size(3, 1)),
      })
      const piggyBack = vi.fn()
      const explicit = vi.fn()
      probe.addMouseListener(piggyBack)
      probe.addMouseListener(explicit, {events: ['mouse.move']})
      const t = testRender(probe, {width: 10, height: 1})

      t.sendMouse('mouse.move.in', {x: 6, y: 0})
      expect(piggyBack).not.toHaveBeenCalled()
      expect(explicit).toHaveBeenCalled()

      t.sendMouse('mouse.move.in', {x: 1, y: 0})
      expect(names(piggyBack.mock.calls.map(c => c[0]))).toEqual([
        'mouse.move.enter',
        'mouse.move.in',
      ])
    })

    it('a piggy-backing listener is not given the explicit events of other listeners', () => {
      const probe = new Probe({mouse: ['mouse.move']})
      const piggyBack = vi.fn()
      probe.addMouseListener(piggyBack)
      probe.addMouseListener(() => {}, {events: ['mouse.wheel']})
      const t = testRender(probe, {width: 10, height: 1})

      t.sendMouse('mouse.wheel.down', {x: 1, y: 0})

      expect(piggyBack).not.toHaveBeenCalled()
      expect(probe.mouse).toEqual([])
    })

    it('overlapping regions deliver each event once per destination', () => {
      const probe = new Probe({mouse: ['mouse.move']})
      const listener = vi.fn()
      probe.addMouseListener(listener, {events: ['mouse.move']})
      probe.addMouseListener(listener, {events: ['mouse.move']})
      const t = testRender(probe, {width: 10, height: 1})

      t.sendMouse('mouse.move.in', {x: 1, y: 0})

      // native: once; two listeners (same callback, two subscriptions): once each
      expect(names(probe.mouse)).toEqual(['mouse.move.enter', 'mouse.move.in'])
      expect(listener).toHaveBeenCalledTimes(4)
    })

    it('the native destination is delivered before the explicit one', () => {
      const probe = new Probe({mouse: ['mouse.button.left']})
      const order: string[] = []
      const receive = probe.receiveMouse.bind(probe)
      probe.receiveMouse = (event: MouseEvent) => {
        order.push(`native ${event.name}`)
        receive(event)
      }
      probe.addMouseListener(event => order.push(`explicit ${event.name}`), {
        events: ['mouse.button.left'],
      })
      const t = testRender(probe, {width: 10, height: 1})

      t.sendMouse('mouse.button.down', {x: 1, y: 0})
      t.sendMouse('mouse.button.up', {x: 1, y: 0})

      expect(order).toEqual([
        'native mouse.button.down',
        'explicit mouse.button.down',
        'native mouse.button.up',
        'explicit mouse.button.up',
      ])
    })

    it('an explicit `mouse.button.all` also receives the button the view registered for', () => {
      const probe = new Probe({mouse: ['mouse.button.left']})
      const listener = vi.fn()
      probe.addMouseListener(listener, {events: ['mouse.button.all']})
      const t = testRender(probe, {width: 10, height: 1})

      t.sendMouse('mouse.button.down', {x: 1, y: 0})
      t.sendMouse('mouse.button.up', {x: 1, y: 0})

      expect(names(probe.mouse)).toEqual([
        'mouse.button.down',
        'mouse.button.up',
      ])
      expect(names(listener.mock.calls.map(c => c[0]))).toEqual([
        'mouse.button.down',
        'mouse.button.up',
      ])
    })

    it('an explicit button listener does not widen the native drag-inside area', () => {
      const probe = new Probe({
        mouse: ['mouse.button.left'],
        mouseRect: new Rect(Point.zero, new Size(3, 1)),
      })
      const listener = vi.fn()
      probe.addMouseListener(listener, {events: ['mouse.button.left']})
      const t = testRender(probe, {width: 10, height: 1})

      t.sendMouse('mouse.button.down', {x: 1, y: 0})
      // drag into the part of the view only the listener registered for
      t.sendMouse('mouse.button.down', {x: 6, y: 0})
      expect(names(probe.mouse)).toEqual([
        'mouse.button.down',
        'mouse.button.exit',
      ])
      expect(names(listener.mock.calls.map(c => c[0]))).toEqual([
        'mouse.button.down',
        'mouse.button.dragInside',
      ])

      t.sendMouse('mouse.button.up', {x: 6, y: 0})
      expect(probe.mouseNames.at(-1)).toBe('mouse.button.cancel')
      expect(listener.mock.calls.at(-1)![0].name).toBe('mouse.button.up')
    })

    it('keeps native pressed state independent of the listener', () => {
      const probe = new Probe({
        mouse: ['mouse.button.left'],
        mouseRect: new Rect(Point.zero, new Size(3, 1)),
      })
      probe.addMouseListener(() => {}, {events: ['mouse.button.left']})
      const t = testRender(probe, {width: 10, height: 1})

      t.sendMouse('mouse.button.down', {x: 1, y: 0})
      expect(probe.isPressed).toBe(true)
      t.sendMouse('mouse.button.down', {x: 6, y: 0})
      expect(probe.isPressed).toBe(false)
      t.sendMouse('mouse.button.up', {x: 6, y: 0})
    })
  })

  describe('precedence between views', () => {
    it('a child that registered for the same pixels takes button events from a parent listener', () => {
      const child = new Probe({mouse: ['mouse.button.left']}, {height: 1})
      const sibling = new Probe({}, {height: 1})
      const stack = Stack.down([child, sibling])
      const listener = vi.fn()
      stack.addMouseListener(listener, {events: ['mouse.button.left']})
      const t = testRender(stack, {width: 10, height: 2})

      t.sendMouse('mouse.button.down', {x: 1, y: 0})
      t.sendMouse('mouse.button.up', {x: 1, y: 0})
      expect(names(child.mouse)).toEqual([
        'mouse.button.down',
        'mouse.button.up',
      ])
      expect(listener).not.toHaveBeenCalled()

      t.sendMouse('mouse.button.down', {x: 1, y: 1})
      t.sendMouse('mouse.button.up', {x: 1, y: 1})
      expect(names(listener.mock.calls.map(c => c[0]))).toEqual([
        'mouse.button.down',
        'mouse.button.up',
      ])
      expect(child.mouse).toHaveLength(2)
    })

    it('every view that claimed mouse.move receives it, as before', () => {
      const child = new Probe({}, {height: 1})
      const stack = Stack.down([child])
      const parentListener = vi.fn()
      const childListener = vi.fn()
      stack.addMouseListener(parentListener, {events: ['mouse.move']})
      child.addMouseListener(childListener, {events: ['mouse.move']})
      const t = testRender(stack, {width: 10, height: 1})

      t.sendMouse('mouse.move.in', {x: 1, y: 0})

      expect(names(childListener.mock.calls.map(c => c[0]))).toEqual([
        'mouse.move.enter',
        'mouse.move.in',
      ])
      // the parent is not the topmost view
      expect(names(parentListener.mock.calls.map(c => c[0]))).toEqual([
        'mouse.move.enter',
        'mouse.move.below',
      ])
    })

    it('both destinations of the topmost view receive `in`', () => {
      const probe = new Probe({mouse: ['mouse.move']})
      const listener = vi.fn()
      probe.addMouseListener(listener, {events: ['mouse.move']})
      const t = testRender(probe, {width: 10, height: 1})

      t.sendMouse('mouse.move.in', {x: 1, y: 0})

      expect(probe.mouseNames).toContain('mouse.move.in')
      expect(probe.mouseNames).not.toContain('mouse.move.below')
      expect(names(listener.mock.calls.map(c => c[0]))).toContain(
        'mouse.move.in',
      )
    })
  })

  describe('lifecycle', () => {
    it('returns a function that removes the listener', () => {
      const probe = new Probe()
      const listener = vi.fn()
      const remove = probe.addMouseListener(listener, {
        events: ['mouse.move'],
      })
      const t = testRender(probe, {width: 10, height: 1})

      t.sendMouse('mouse.move.in', {x: 1, y: 0})
      expect(listener).toHaveBeenCalled()

      remove()
      listener.mockClear()
      t.sendMouse('mouse.move.in', {x: 2, y: 0})
      t.sendMouse('mouse.move.in', {x: 20, y: 0})
      expect(listener).not.toHaveBeenCalled()
    })

    it('removal is idempotent', () => {
      const probe = new Probe()
      const remove = probe.addMouseListener(() => {}, {events: true})
      testRender(probe, {width: 10, height: 1})

      remove()
      expect(() => remove()).not.toThrow()
    })

    it('removing a piggy-backing listener stops its calls', () => {
      const probe = new Probe({mouse: ['mouse.move']})
      const listener = vi.fn()
      const remove = probe.addMouseListener(listener)
      const t = testRender(probe, {width: 10, height: 1})

      t.sendMouse('mouse.move.in', {x: 1, y: 0})
      const count = listener.mock.calls.length
      expect(count).toBeGreaterThan(0)

      remove()
      t.sendMouse('mouse.move.in', {x: 2, y: 0})
      t.sendMouse('mouse.move.in', {x: 20, y: 0})
      expect(listener).toHaveBeenCalledTimes(count)
    })

    it('removing a listener while hovering does not notify it of the exit', () => {
      const probe = new Probe()
      const listener = vi.fn()
      const remove = probe.addMouseListener(listener, {
        events: ['mouse.move'],
      })
      const t = testRender(probe, {width: 10, height: 1})
      t.sendMouse('mouse.move.in', {x: 1, y: 0})
      const count = listener.mock.calls.length

      remove()
      t.render()
      t.sendMouse('mouse.move.in', {x: 30, y: 0})

      expect(listener).toHaveBeenCalledTimes(count)
    })

    it('a listener added after the first render starts receiving events after the next render', () => {
      const probe = new Probe()
      const t = testRender(probe, {width: 10, height: 1})
      const listener = vi.fn()

      probe.addMouseListener(listener, {events: ['mouse.move']})
      t.sendMouse('mouse.move.in', {x: 1, y: 0})

      expect(listener).toHaveBeenCalled()
    })

    it('a listener added while the mouse is over the view is told it has entered', () => {
      const probe = new Probe()
      const first = vi.fn()
      probe.addMouseListener(first, {events: ['mouse.move']})
      const t = testRender(probe, {width: 10, height: 1})
      t.sendMouse('mouse.move.in', {x: 1, y: 0})

      const second = vi.fn()
      probe.addMouseListener(second, {events: ['mouse.move']})
      t.render()

      expect(names(second.mock.calls.map(c => c[0]))).toEqual([
        'mouse.move.enter',
        'mouse.move.in',
      ])
      // and the first listener is not told it entered again
      expect(names(first.mock.calls.map(c => c[0]))).toEqual([
        'mouse.move.enter',
        'mouse.move.in',
        'mouse.move.in',
      ])
    })

    it('repeated renders do not accumulate registrations', () => {
      const probe = new Probe({mouse: ['mouse.button.left']})
      const explicit = vi.fn()
      const piggyBack = vi.fn()
      probe.addMouseListener(explicit, {events: ['mouse.button.left']})
      probe.addMouseListener(piggyBack)
      const t = testRender(probe, {width: 10, height: 1})
      t.render()
      t.render()
      t.render()

      t.sendMouse('mouse.button.down', {x: 1, y: 0})
      t.sendMouse('mouse.button.up', {x: 1, y: 0})

      expect(probe.mouse).toHaveLength(2)
      expect(explicit).toHaveBeenCalledTimes(2)
      expect(piggyBack).toHaveBeenCalledTimes(2)
    })

    it('can remove itself from within the callback', () => {
      const probe = new Probe()
      const listener = vi.fn(() => remove())
      const remove = probe.addMouseListener(listener, {
        events: ['mouse.move'],
      })
      const t = testRender(probe, {width: 10, height: 1})

      t.sendMouse('mouse.move.in', {x: 1, y: 0})
      t.sendMouse('mouse.move.in', {x: 2, y: 0})

      expect(listener).toHaveBeenCalledOnce()
    })

    it('a listener added during a notification is not part of that notification', () => {
      const probe = new Probe({mouse: ['mouse.move']})
      const added = vi.fn()
      let didAdd = false
      probe.addMouseListener(() => {
        if (!didAdd) {
          didAdd = true
          probe.addMouseListener(added)
        }
      })
      const t = testRender(probe, {width: 10, height: 1})

      t.sendMouse('mouse.move.in', {x: 1, y: 0})

      // the first notification was 'enter', the added listener starts at 'in'
      expect(names(added.mock.calls.map(c => c[0]))).toEqual(['mouse.move.in'])
    })

    it('a listener removed during a notification is not called afterwards', () => {
      const probe = new Probe({mouse: ['mouse.move']})
      const removed = vi.fn()
      probe.addMouseListener(() => removeSecond())
      const removeSecond = probe.addMouseListener(removed)
      const t = testRender(probe, {width: 10, height: 1})

      t.sendMouse('mouse.move.in', {x: 1, y: 0})

      expect(removed).not.toHaveBeenCalled()
    })

    it('supports listeners on views that are not subclass-friendly (no super calls)', () => {
      // Probe never calls `super.receiveMouse`, yet hover/pressed still work
      const probe = new Probe({mouse: ['mouse.move', 'mouse.button.left']})
      const t = testRender(probe, {width: 10, height: 1})

      t.sendMouse('mouse.move.in', {x: 1, y: 0})
      expect(probe.isHover).toBe(true)
      t.sendMouse('mouse.button.down', {x: 1, y: 0})
      expect(probe.isPressed).toBe(true)
      t.sendMouse('mouse.button.up', {x: 1, y: 0})
      expect(probe.isPressed).toBe(false)
    })
  })
})
