import {describe, expect, it, vi} from 'vitest'
import {testRender} from '../../lib/TestScreen.js'
import {Button} from '../../lib/components/Button.js'
import {Keyboard} from '../../lib/components/Keyboard.js'
import {Stack} from '../../lib/components/Stack.js'
import {Text} from '../../lib/components/Text.js'
import {Probe} from './Probe.js'

describe('addFocusListener', () => {
  describe('piggy-backing (no events option)', () => {
    it('reports focus and blur of a view that registered for focus', () => {
      const button = new Button({title: 'OK'})
      const other = new Button({title: 'Other'})
      const listener = vi.fn()
      button.addFocusListener(listener)
      const t = testRender(Stack.down([button, other]), {width: 10, height: 6})

      t.sendKey('tab')
      expect(listener.mock.calls).toEqual([[true]])

      t.sendKey('tab')
      expect(listener.mock.calls).toEqual([[true], [false]])
    })

    it('does not make the view focusable', () => {
      const text = new Text({text: 'hello'})
      const listener = vi.fn()
      text.addFocusListener(listener)
      const t = testRender(text, {width: 10, height: 1})

      t.sendKey('tab')
      t.sendKey('tab')

      expect(listener).not.toHaveBeenCalled()
      expect(text.hasFocus).toBe(false)
    })

    it('is called after didFocus / didBlur', () => {
      const probe = new Probe({focus: true})
      const order: string[] = []
      const didFocus = probe.didFocus.bind(probe)
      const didBlur = probe.didBlur.bind(probe)
      probe.didFocus = () => {
        order.push('didFocus')
        didFocus()
      }
      probe.didBlur = () => {
        order.push('didBlur')
        didBlur()
      }
      probe.addFocusListener(isFocused => order.push(`listener ${isFocused}`))
      const other = new Probe({focus: {isDefault: false}}, {height: 1})
      const t = testRender(Stack.down([probe, other]), {width: 10, height: 2})

      t.sendKey('tab')

      expect(order).toEqual([
        'didFocus',
        'listener true',
        'didBlur',
        'listener false',
      ])
    })

    it('is not affected by the explicit listeners of the view', () => {
      const probe = new Probe({focus: {isDefault: false}})
      const piggyBack = vi.fn()
      probe.addFocusListener(piggyBack)
      probe.addFocusListener(() => {}, {events: ['focus.blur']})
      const t = testRender(probe, {width: 10, height: 1})

      t.sendKey('tab')

      expect(piggyBack.mock.calls).toEqual([[true]])
    })
  })

  describe('explicit events', () => {
    it('makes the view focusable', () => {
      const text = new Text({text: 'hello'})
      const listener = vi.fn()
      text.addFocusListener(listener, {events: true})
      const t = testRender(text, {width: 10, height: 1})
      expect(text.hasFocus).toBe(false)

      t.sendKey('tab')
      expect(text.hasFocus).toBe(true)
      expect(listener.mock.calls).toEqual([[true]])

      // a single focusable view: tab again leaves the focus ring
      t.sendKey('tab')
      expect(text.hasFocus).toBe(false)
      expect(listener.mock.calls).toEqual([[true], [false]])
    })

    it('`focus.focus` only reports focus', () => {
      const text = new Text({text: 'hello'})
      const listener = vi.fn()
      text.addFocusListener(listener, {events: ['focus.focus']})
      const t = testRender(text, {width: 10, height: 1})

      t.sendKey('tab')
      t.sendKey('tab')

      expect(listener.mock.calls).toEqual([[true]])
    })

    it('`focus.blur` only reports blur, and still makes the view focusable', () => {
      const text = new Text({text: 'hello'})
      const listener = vi.fn()
      text.addFocusListener(listener, {events: ['focus.blur']})
      const t = testRender(text, {width: 10, height: 1})

      t.sendKey('tab')
      expect(text.hasFocus).toBe(true)
      t.sendKey('tab')

      expect(listener.mock.calls).toEqual([[false]])
    })

    it('`events: []` does not make the view focusable', () => {
      const text = new Text({text: 'hello'})
      const listener = vi.fn()
      text.addFocusListener(listener, {events: []})
      const t = testRender(text, {width: 10, height: 1})

      t.sendKey('tab')

      expect(text.hasFocus).toBe(false)
      expect(listener).not.toHaveBeenCalled()
    })

    it('takes part in the focus ring, in render order', () => {
      const first = new Probe({}, {height: 1})
      const second = new Probe({focus: {isDefault: false}}, {height: 1})
      const third = new Probe({}, {height: 1})
      first.addFocusListener(() => {}, {events: true})
      third.addFocusListener(() => {}, {events: true})
      const t = testRender(Stack.down([first, second, third]), {
        width: 10,
        height: 3,
      })

      t.sendKey('tab')
      expect([first.hasFocus, second.hasFocus, third.hasFocus]).toEqual([
        true,
        false,
        false,
      ])
      t.sendKey('tab')
      expect([first.hasFocus, second.hasFocus, third.hasFocus]).toEqual([
        false,
        true,
        false,
      ])
      t.sendKey('tab')
      expect([first.hasFocus, second.hasFocus, third.hasFocus]).toEqual([
        false,
        false,
        true,
      ])
      t.sendKey('tab', {shift: true})
      expect(second.hasFocus).toBe(true)
    })

    it("does not take the view's native focus hooks or keys", () => {
      const probe = new Probe()
      probe.addFocusListener(() => {}, {events: true})
      const t = testRender(probe, {width: 10, height: 1})

      t.sendKey('tab')
      expect(probe.hasFocus).toBe(true)
      t.sendKey('x')
      t.sendKey('tab')

      expect(probe.focusLog).toEqual([])
      expect(probe.keys).toEqual([])
    })

    it('keys fall through to the keyboard fallback while an explicit-only view has focus', () => {
      const probe = new Probe({}, {height: 1})
      probe.addFocusListener(() => {}, {events: true})
      const keyboard = new Keyboard({})
      const onKey = vi.fn()
      keyboard.addKeyboardListener(onKey)
      const t = testRender(Stack.down([probe, keyboard]), {
        width: 10,
        height: 2,
      })

      t.sendKey('tab')
      expect(probe.hasFocus).toBe(true)
      t.sendKey('q')

      expect(onKey).toHaveBeenCalledOnce()
    })

    it('does not take initial focus by default', () => {
      const text = new Text({text: 'hello'})
      text.addFocusListener(() => {}, {events: true})
      testRender(text, {width: 10, height: 1})

      expect(text.hasFocus).toBe(false)
    })

    it('`isDefault: true` takes the initial focus', () => {
      const text = new Text({text: 'hello'})
      const listener = vi.fn()
      text.addFocusListener(listener, {events: true, isDefault: true})
      testRender(text, {width: 10, height: 1})

      expect(text.hasFocus).toBe(true)
      expect(listener.mock.calls).toEqual([[true]])
    })

    it('a view natively registered as not-default stays that way', () => {
      const probe = new Probe({focus: {isDefault: false}})
      probe.addFocusListener(() => {}, {events: true})
      testRender(probe, {width: 10, height: 1})

      expect(probe.hasFocus).toBe(false)
    })

    it('has focus when the view is clicked and requests focus', () => {
      const text = new Text({text: 'hello'})
      const listener = vi.fn()
      text.addFocusListener(listener, {events: true})
      text.addMouseListener((_event, _size, system) => system.requestFocus(), {
        events: ['mouse.button.left'],
      })
      const t = testRender(text, {width: 10, height: 1})

      t.sendMouse('mouse.button.down', {x: 1, y: 0})
      t.sendMouse('mouse.button.up', {x: 1, y: 0})

      expect(text.hasFocus).toBe(true)
      expect(listener.mock.calls).toEqual([[true]])
    })
  })

  describe("explicit events combined with the view's own focus", () => {
    it('the view appears in the focus ring once', () => {
      const probe = new Probe({focus: {isDefault: false}}, {height: 1})
      probe.addFocusListener(() => {}, {events: true})
      const other = new Probe({focus: {isDefault: false}}, {height: 1})
      const t = testRender(Stack.down([probe, other]), {width: 10, height: 2})

      t.sendKey('tab')
      expect(probe.hasFocus).toBe(true)
      t.sendKey('tab')
      expect(probe.hasFocus).toBe(false)
      expect(other.hasFocus).toBe(true)
    })

    it('calls the native hooks and the listener, once each', () => {
      const probe = new Probe({focus: {isDefault: false}}, {height: 1})
      const explicit = vi.fn()
      const piggyBack = vi.fn()
      probe.addFocusListener(explicit, {events: true})
      probe.addFocusListener(piggyBack)
      const other = new Probe({focus: {isDefault: false}}, {height: 1})
      const t = testRender(Stack.down([probe, other]), {width: 10, height: 2})

      t.sendKey('tab')
      t.sendKey('tab')

      expect(probe.focusLog).toEqual(['didFocus', 'didBlur'])
      expect(explicit.mock.calls).toEqual([[true], [false]])
      expect(piggyBack.mock.calls).toEqual([[true], [false]])
    })

    it('the focused view still receives its keys', () => {
      const probe = new Probe({focus: true})
      probe.addFocusListener(() => {}, {events: true})
      const t = testRender(probe, {width: 10, height: 1})

      t.sendKey('x')

      expect(probe.keys.map(key => key.full)).toEqual(['x'])
    })

    it('an explicit isDefault: true does not need the native registration to be default', () => {
      const probe = new Probe({focus: {isDefault: false}})
      probe.addFocusListener(() => {}, {events: true, isDefault: true})
      testRender(probe, {width: 10, height: 1})

      expect(probe.hasFocus).toBe(true)
      expect(probe.focusLog).toEqual(['didFocus'])
    })
  })

  describe('hasFocus', () => {
    it('is up to date inside the callbacks', () => {
      const probe = new Probe({focus: {isDefault: false}})
      const states: boolean[] = []
      probe.addFocusListener(() => states.push(probe.hasFocus))
      const t = testRender(probe, {width: 10, height: 1})

      t.sendKey('tab')
      t.sendKey('tab')

      expect(states).toEqual([true, false])
    })

    it('is maintained for views that override didFocus without calling super', () => {
      const probe = new Probe({focus: {isDefault: false}})
      const t = testRender(probe, {width: 10, height: 1})

      t.sendKey('tab')
      expect(probe.hasFocus).toBe(true)
      t.sendKey('tab')
      expect(probe.hasFocus).toBe(false)
    })
  })

  describe('lifecycle', () => {
    it('returns a function that removes the listener', () => {
      const text = new Text({text: 'hello'})
      const listener = vi.fn()
      const remove = text.addFocusListener(listener, {events: true})
      const t = testRender(text, {width: 10, height: 1})

      t.sendKey('tab')
      expect(listener.mock.calls).toEqual([[true]])

      remove()
      t.sendKey('tab')
      expect(listener.mock.calls).toEqual([[true]])
      expect(() => remove()).not.toThrow()
    })

    it('removing the last explicit listener removes the view from the focus ring', () => {
      const text = new Text({text: 'hello'})
      const other = new Probe({focus: {isDefault: false}}, {height: 1})
      const remove = text.addFocusListener(() => {}, {events: true})
      const t = testRender(Stack.down([text, other]), {width: 10, height: 2})

      remove()
      t.render()
      t.sendKey('tab')

      expect(text.hasFocus).toBe(false)
      expect(other.hasFocus).toBe(true)
    })

    it('a listener added after the first render makes the view focusable', () => {
      const text = new Text({text: 'hello'})
      const t = testRender(text, {width: 10, height: 1})
      const listener = vi.fn()

      text.addFocusListener(listener, {events: true})
      t.render()
      t.sendKey('tab')

      expect(listener.mock.calls).toEqual([[true]])
    })

    it('does not notify a removed listener when the view blurs', () => {
      const text = new Text({text: 'hello'})
      const listener = vi.fn()
      const remove = text.addFocusListener(listener, {events: true})
      const t = testRender(text, {width: 10, height: 1})

      t.sendKey('tab')
      remove()
      t.sendKey('tab')

      expect(listener.mock.calls).toEqual([[true]])
    })

    it('repeated renders do not report focus again', () => {
      const text = new Text({text: 'hello'})
      const listener = vi.fn()
      text.addFocusListener(listener, {events: true})
      const t = testRender(text, {width: 10, height: 1})
      t.sendKey('tab')
      t.render()
      t.render()

      expect(listener.mock.calls).toEqual([[true]])
    })
  })
})
