import {describe, expect, it, vi} from 'vitest'
import {testRender} from '../../lib/TestScreen.js'
import {Button} from '../../lib/components/Button.js'
import {Input} from '../../lib/components/Input.js'
import {Keyboard} from '../../lib/components/Keyboard.js'
import {Stack} from '../../lib/components/Stack.js'
import {Text} from '../../lib/components/Text.js'
import {Size} from '../../lib/geometry.js'
import {normalizeHotKey, toHotKeyDef} from '../../lib/events/index.js'
import {Probe} from './Probe.js'

const fulls = (calls: unknown[][]) =>
  calls.map(call => (call[0] as {full: string}).full)

describe('normalizeHotKey', () => {
  it.each([
    ['ctrl+a', 'C-a'],
    ['Ctrl+A', 'C-A'],
    ['control+a', 'C-a'],
    ['alt+a', 'A-a'],
    ['option+a', 'A-a'],
    ['cmd+a', 'G-a'],
    ['command+a', 'G-a'],
    ['gui+a', 'G-a'],
    ['meta+a', 'G-a'],
    ['shift+a', 'S-a'],
    ['ctrl+shift+up', 'C-S-up'],
    // modifiers are always ordered C A G S
    ['shift+ctrl+up', 'C-S-up'],
    ['shift+cmd+alt+ctrl+x', 'C-A-G-S-x'],
    ['ctrl++', 'C-+'],
  ])('%s -> %s', (input, expected) => {
    expect(normalizeHotKey(input)).toBe(expected)
  })

  it.each(['a', 'C-a', '+', 'escape', 'ctrl+', 'nonsense+a', '+a'])(
    'leaves %s alone',
    input => {
      expect(normalizeHotKey(input)).toBe(input)
    },
  )

  it('leaves HotKeyDef objects alone', () => {
    const def = {char: 'a', ctrl: true}
    expect(normalizeHotKey(def)).toBe(def)
  })

  it('produces something toHotKeyDef understands', () => {
    expect(toHotKeyDef(normalizeHotKey('ctrl+shift+x'))).toEqual({
      char: 'x',
      ctrl: true,
      alt: false,
      gui: false,
      shift: true,
    })
  })
})

describe('addKeyboardListener', () => {
  describe('piggy-backing (no events option)', () => {
    it('is called for keys that reach the focused view', () => {
      const onClick = vi.fn()
      const button = new Button({title: 'OK', onClick})
      const listener = vi.fn()
      button.addKeyboardListener(listener)
      const t = testRender(button, {width: 10, height: 3})
      t.sendKey('tab')

      t.sendKey('return')

      expect(onClick).toHaveBeenCalledOnce()
      expect(fulls(listener.mock.calls)).toEqual(['return'])
    })

    it('is called for the native hotkeys of the view', () => {
      const probe = new Probe({hotKeys: ['C-x']})
      const listener = vi.fn()
      probe.addKeyboardListener(listener)
      const t = testRender(probe, {width: 10, height: 1})

      t.sendKey('x', {ctrl: true})
      t.sendKey('x')

      expect(fulls(listener.mock.calls)).toEqual(['C-x'])
      expect(probe.keys.map(key => key.full)).toEqual(['C-x'])
    })

    it('is called for the keys delivered to a keyboard fallback', () => {
      const listener = vi.fn()
      const keyboard = new Keyboard({})
      keyboard.addKeyboardListener(listener)
      const t = testRender(Stack.down([keyboard, new Text({text: 'hello'})]), {
        width: 10,
        height: 1,
      })

      t.sendKey('q')

      expect(fulls(listener.mock.calls)).toEqual(['q'])
    })

    it('never registers: a view that did not register is never called', () => {
      const text = new Text({text: 'hello'})
      const listener = vi.fn()
      text.addKeyboardListener(listener)
      const t = testRender(text, {width: 10, height: 1})

      t.sendKey('a')
      t.sendKey('tab')
      t.sendKey('x', {ctrl: true})

      expect(listener).not.toHaveBeenCalled()
    })

    it('is called after receiveKey', () => {
      const probe = new Probe({hotKeys: ['x']})
      const order: string[] = []
      const receive = probe.receiveKey.bind(probe)
      probe.receiveKey = event => {
        order.push('receiveKey')
        receive(event)
      }
      probe.addKeyboardListener(() => order.push('listener'))
      const t = testRender(probe, {width: 10, height: 1})

      t.sendKey('x')

      expect(order).toEqual(['receiveKey', 'listener'])
    })

    it('is not called for explicit hotkeys of other listeners', () => {
      const probe = new Probe({hotKeys: ['x']})
      const piggyBack = vi.fn()
      probe.addKeyboardListener(piggyBack)
      probe.addKeyboardListener(() => {}, {events: ['y']})
      const t = testRender(probe, {width: 10, height: 1})

      t.sendKey('y')

      expect(piggyBack).not.toHaveBeenCalled()
      expect(probe.keys).toEqual([])
    })

    it('receives the contentSize of the view', () => {
      const probe = new Probe({hotKeys: ['x']}, {padding: 1})
      const listener = vi.fn()
      probe.addKeyboardListener(listener)
      const t = testRender(probe, {width: 12, height: 5})

      t.sendKey('x')

      expect(listener.mock.calls[0][1]).toEqual(new Size(10, 3))
    })
  })

  describe('explicit events', () => {
    it('registers a hotkey, without calling receiveKey', () => {
      const probe = new Probe()
      const listener = vi.fn()
      probe.addKeyboardListener(listener, {events: ['C-a']})
      const t = testRender(probe, {width: 10, height: 2})

      t.sendKey('a', {ctrl: true})

      expect(fulls(listener.mock.calls)).toEqual(['C-a'])
      expect(probe.keys).toEqual([])
    })

    it('only calls the listener for the listed hotkeys', () => {
      const probe = new Probe()
      const listener = vi.fn()
      probe.addKeyboardListener(listener, {events: ['C-a']})
      const t = testRender(probe, {width: 10, height: 2})

      t.sendKey('a')
      t.sendKey('b', {ctrl: true})
      t.sendKey('a', {ctrl: true, shift: true})
      t.sendKey('a', {alt: true})

      expect(listener).not.toHaveBeenCalled()
    })

    it.each([
      ['C-a (FullKeyName)', 'C-a'],
      ['ctrl+a (spelled out)', 'ctrl+a'],
      ['control+a', 'control+a'],
      ['HotKeyDef', {char: 'a', ctrl: true}],
    ])('accepts %s', (_name, hotKey) => {
      const text = new Text({text: 'hello'})
      const listener = vi.fn()
      text.addKeyboardListener(listener, {events: [hotKey]})
      const t = testRender(text, {width: 10, height: 1})

      t.sendKey('a', {ctrl: true})

      expect(listener).toHaveBeenCalledOnce()
    })

    it.each([
      ['escape', 'escape', {}],
      ['return', 'return', {}],
      ['ctrl+return', 'return', {ctrl: true}],
      ['up', 'up', {}],
      ['space', 'space', {}],
      ['f5', 'f5', {}],
      ['pagedown', 'pagedown', {}],
    ])('matches the named key %s', (hotKey, key, mods) => {
      const text = new Text({text: 'hello'})
      const listener = vi.fn()
      text.addKeyboardListener(listener, {events: [hotKey]})
      const t = testRender(text, {width: 10, height: 1})

      t.sendKey(key as 'up', mods)

      expect(listener).toHaveBeenCalledOnce()
    })

    it('supports several hotkeys, and modifier combinations', () => {
      const text = new Text({text: 'hello'})
      const listener = vi.fn()
      text.addKeyboardListener(listener, {
        events: ['x', 'cmd+shift+up', 'alt+ctrl+j'],
      })
      const t = testRender(text, {width: 10, height: 1})

      t.sendKey('x')
      t.sendKey('up', {gui: true, shift: true})
      t.sendKey('j', {ctrl: true, alt: true})
      t.sendKey('y')

      expect(fulls(listener.mock.calls)).toEqual(['x', 'G-S-up', 'C-A-j'])
    })

    it('does not need the view to be focused', () => {
      const probe = new Probe({focus: {isDefault: false}})
      const listener = vi.fn()
      probe.addKeyboardListener(listener, {events: ['x']})
      const t = testRender(probe, {width: 10, height: 1})
      expect(probe.hasFocus).toBe(false)

      t.sendKey('x')

      expect(listener).toHaveBeenCalledOnce()
      expect(probe.keys).toEqual([])
    })

    it('`events: true` is called for every key', () => {
      const text = new Text({text: 'hello'})
      const listener = vi.fn()
      text.addKeyboardListener(listener, {events: true})
      const t = testRender(text, {width: 10, height: 1})

      t.sendKey('a')
      t.sendKey('b', {ctrl: true})
      t.sendKey('tab')
      t.sendKey('escape')
      t.sendKey('up', {shift: true})

      expect(fulls(listener.mock.calls)).toEqual([
        'a',
        'C-b',
        'tab',
        'escape',
        'S-up',
      ])
    })

    it('`events: []` registers nothing', () => {
      const text = new Text({text: 'hello'})
      const listener = vi.fn()
      text.addKeyboardListener(listener, {events: []})
      const t = testRender(text, {width: 10, height: 1})

      t.sendKey('a')

      expect(listener).not.toHaveBeenCalled()
    })

    it('is called with the contentSize of the view', () => {
      const probe = new Probe({}, {padding: 1})
      const listener = vi.fn()
      probe.addKeyboardListener(listener, {events: ['x']})
      const t = testRender(probe, {width: 12, height: 5})

      t.sendKey('x')

      expect(listener.mock.calls[0][1]).toEqual(new Size(10, 3))
    })

    it('is called for views inside a stack', () => {
      const text = new Text({text: 'one'})
      const listener = vi.fn()
      text.addKeyboardListener(listener, {events: ['x']})
      const t = testRender(Stack.down([new Text({text: 'zero'}), text]), {
        width: 10,
        height: 2,
      })

      t.sendKey('x')

      expect(listener).toHaveBeenCalledOnce()
    })
  })

  describe('explicit listeners only observe', () => {
    it('a native hotkey still reaches its view, and the listener sees it too', () => {
      const probe = new Probe({hotKeys: ['x']})
      const listener = vi.fn()
      probe.addKeyboardListener(listener, {events: ['x']})
      const t = testRender(probe, {width: 10, height: 1})

      t.sendKey('x')

      expect(probe.keys.map(key => key.full)).toEqual(['x'])
      expect(fulls(listener.mock.calls)).toEqual(['x'])
    })

    it('an explicit listener on another view does not take the hotkey from a native one', () => {
      const native = new Probe({hotKeys: ['x']}, {height: 1})
      const other = new Text({text: 'other'})
      const listener = vi.fn()
      other.addKeyboardListener(listener, {events: ['x']})
      const t = testRender(Stack.down([other, native]), {
        width: 10,
        height: 2,
      })

      t.sendKey('x')

      expect(native.keys).toHaveLength(1)
      expect(listener).toHaveBeenCalledOnce()
    })

    it('the focused view still receives its keys', () => {
      const input = new Input({value: ''})
      const observer = new Text({text: 'observer'})
      const listener = vi.fn()
      observer.addKeyboardListener(listener, {events: true})
      const t = testRender(Stack.down([input, observer]), {
        width: 20,
        height: 2,
      })

      t.sendKey('h')
      t.sendKey('i')

      expect(input.value).toBe('hi')
      expect(fulls(listener.mock.calls)).toEqual(['h', 'i'])
    })

    it('a focused view receiving the listed key is not called twice', () => {
      const probe = new Probe({focus: true})
      const listener = vi.fn()
      probe.addKeyboardListener(listener, {events: ['x']})
      probe.addKeyboardListener(listener)
      const t = testRender(probe, {width: 10, height: 1})

      t.sendKey('x')
      t.sendKey('y')

      expect(probe.keys.map(key => key.full)).toEqual(['x', 'y'])
      // 'x': the explicit listener + the piggy-backing listener
      // 'y': the piggy-backing listener only
      expect(fulls(listener.mock.calls)).toEqual(['x', 'x', 'y'])
    })

    it('does not change which view the keyboard fallback goes to', () => {
      const fallback = new Keyboard({})
      const fallbackListener = vi.fn()
      fallback.addKeyboardListener(fallbackListener)
      const observer = new Text({text: 'observer'})
      const observerListener = vi.fn()
      observer.addKeyboardListener(observerListener, {events: true})
      const t = testRender(Stack.down([fallback, observer]), {
        width: 10,
        height: 2,
      })

      t.sendKey('q')

      expect(fulls(fallbackListener.mock.calls)).toEqual(['q'])
      expect(fulls(observerListener.mock.calls)).toEqual(['q'])
    })

    it('tab still moves focus', () => {
      const first = new Probe({focus: {isDefault: false}}, {height: 1})
      const second = new Probe({focus: {isDefault: false}}, {height: 1})
      const listener = vi.fn()
      first.addKeyboardListener(listener, {events: true})
      const t = testRender(Stack.down([first, second]), {
        width: 10,
        height: 2,
      })

      t.sendKey('tab')
      expect(first.hasFocus).toBe(true)
      t.sendKey('tab')
      expect(second.hasFocus).toBe(true)
      expect(listener).toHaveBeenCalledTimes(2)
    })
  })

  describe('lifecycle', () => {
    it('returns a function that removes the listener', () => {
      const text = new Text({text: 'hello'})
      const listener = vi.fn()
      const remove = text.addKeyboardListener(listener, {events: ['x']})
      const t = testRender(text, {width: 10, height: 1})

      t.sendKey('x')
      expect(listener).toHaveBeenCalledOnce()

      remove()
      t.sendKey('x')
      expect(listener).toHaveBeenCalledOnce()
      expect(() => remove()).not.toThrow()
    })

    it('removing a piggy-backing listener stops its calls', () => {
      const probe = new Probe({hotKeys: ['x']})
      const listener = vi.fn()
      const remove = probe.addKeyboardListener(listener)
      const t = testRender(probe, {width: 10, height: 1})

      t.sendKey('x')
      remove()
      t.sendKey('x')

      expect(listener).toHaveBeenCalledOnce()
      expect(probe.keys).toHaveLength(2)
    })

    it('a listener added after the first render starts working on the next render', () => {
      const text = new Text({text: 'hello'})
      const t = testRender(text, {width: 10, height: 1})
      const listener = vi.fn()

      text.addKeyboardListener(listener, {events: ['x']})
      t.render()
      t.sendKey('x')

      expect(listener).toHaveBeenCalledOnce()
    })

    it('repeated renders do not accumulate registrations', () => {
      const text = new Text({text: 'hello'})
      const listener = vi.fn()
      text.addKeyboardListener(listener, {events: ['x']})
      const t = testRender(text, {width: 10, height: 1})
      t.render()
      t.render()
      t.render()

      t.sendKey('x')

      expect(listener).toHaveBeenCalledOnce()
    })

    it('can remove itself from within the callback', () => {
      const text = new Text({text: 'hello'})
      const listener = vi.fn(() => remove())
      const remove = text.addKeyboardListener(listener, {events: true})
      const t = testRender(text, {width: 10, height: 1})

      t.sendKey('x')
      t.sendKey('x')

      expect(listener).toHaveBeenCalledOnce()
    })

    it('multiple listeners are all called, in the order they were added', () => {
      const text = new Text({text: 'hello'})
      const order: number[] = []
      text.addKeyboardListener(() => order.push(1), {events: ['x']})
      text.addKeyboardListener(() => order.push(2), {events: ['x']})
      text.addKeyboardListener(() => order.push(3), {events: true})
      const t = testRender(text, {width: 10, height: 1})

      t.sendKey('x')

      expect(order).toEqual([1, 2, 3])
    })

    it('only listens while the view is rendered', () => {
      const text = new Text({text: 'hidden'})
      const listener = vi.fn()
      text.addKeyboardListener(listener, {events: ['x']})
      const stack = Stack.down([new Text({text: 'shown'}), text])
      const t = testRender(stack, {width: 10, height: 2})

      text.isVisible = false
      t.render()
      t.sendKey('x')
      expect(listener).not.toHaveBeenCalled()

      text.isVisible = true
      t.render()
      t.sendKey('x')
      expect(listener).toHaveBeenCalledOnce()
    })
  })
})
