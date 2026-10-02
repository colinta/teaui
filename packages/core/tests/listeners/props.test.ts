import {describe, expect, it, vi} from 'vitest'
import {testRender} from '../../lib/TestScreen.js'
import {Button} from '../../lib/components/Button.js'
import {Text} from '../../lib/components/Text.js'
import type {MouseEvent} from '../../lib/events/index.js'
import {Probe} from './Probe.js'

const names = (calls: unknown[][]) =>
  calls.map(call => (call[0] as MouseEvent).name)

describe('listener props', () => {
  describe('mouseListener', () => {
    it("a function piggy-backs on the view's own events", () => {
      const listener = vi.fn()
      const onClick = vi.fn()
      const button = new Button({title: 'OK', onClick, mouseListener: listener})
      const t = testRender(button, {width: 10, height: 3})

      t.sendMouse('mouse.button.down', {x: 2, y: 1})
      t.sendMouse('mouse.button.up', {x: 2, y: 1})

      expect(onClick).toHaveBeenCalledOnce()
      expect(
        names(listener.mock.calls).filter(name =>
          name.startsWith('mouse.button'),
        ),
      ).toEqual(['mouse.button.down', 'mouse.button.up'])
    })

    it('a function on a view that registers nothing is never called', () => {
      const listener = vi.fn()
      const text = new Text({text: 'hello', mouseListener: listener})
      const t = testRender(text, {width: 10, height: 1})

      t.sendMouse('mouse.move.in', {x: 1, y: 0})

      expect(listener).not.toHaveBeenCalled()
    })

    it('an object registers for its events', () => {
      const listener = vi.fn()
      const probe = new Probe(
        {},
        {mouseListener: {listener, events: ['mouse.move']}},
      )
      const t = testRender(probe, {width: 10, height: 1})

      t.sendMouse('mouse.move.in', {x: 1, y: 0})

      expect(names(listener.mock.calls)).toEqual([
        'mouse.move.enter',
        'mouse.move.in',
      ])
      expect(probe.mouse).toEqual([])
    })

    it('an object without events piggy-backs', () => {
      const listener = vi.fn()
      const probe = new Probe({}, {mouseListener: {listener}})
      const t = testRender(probe, {width: 10, height: 1})

      t.sendMouse('mouse.move.in', {x: 1, y: 0})

      expect(listener).not.toHaveBeenCalled()
    })

    it('`events: true` registers for everything', () => {
      const listener = vi.fn()
      const probe = new Probe({}, {mouseListener: {listener, events: true}})
      const t = testRender(probe, {width: 10, height: 1})

      t.sendMouse('mouse.wheel.down', {x: 1, y: 0})

      expect(names(listener.mock.calls)).toEqual(['mouse.wheel.down'])
    })

    it('update() adds, replaces, and removes the listener', () => {
      const first = vi.fn()
      const second = vi.fn()
      const probe = new Probe({})
      const t = testRender(probe, {width: 10, height: 1})

      probe.update({mouseListener: {listener: first, events: ['mouse.wheel']}})
      t.render()
      t.sendMouse('mouse.wheel.down', {x: 1, y: 0})
      expect(first).toHaveBeenCalledOnce()

      probe.update({mouseListener: {listener: second, events: ['mouse.wheel']}})
      t.render()
      t.sendMouse('mouse.wheel.down', {x: 1, y: 0})
      expect(first).toHaveBeenCalledOnce()
      expect(second).toHaveBeenCalledOnce()

      probe.update({})
      t.render()
      t.sendMouse('mouse.wheel.down', {x: 1, y: 0})
      expect(second).toHaveBeenCalledOnce()
    })

    it('a new function with the same events keeps the subscription (hover is not reset)', () => {
      const first = vi.fn()
      const second = vi.fn()
      const probe = new Probe({})
      const t = testRender(probe, {width: 10, height: 1})
      probe.update({mouseListener: {listener: first, events: ['mouse.move']}})
      t.render()
      t.sendMouse('mouse.move.in', {x: 1, y: 0})
      expect(names(first.mock.calls)).toEqual([
        'mouse.move.enter',
        'mouse.move.in',
      ])

      probe.update({mouseListener: {listener: second, events: ['mouse.move']}})
      t.render()
      t.sendMouse('mouse.move.in', {x: 2, y: 0})

      // no second 'enter' for the new function, and the old one is not called
      expect(names(second.mock.calls)).toEqual(['mouse.move.in'])
      expect(first).toHaveBeenCalledTimes(2)
    })

    it('changing the events re-subscribes', () => {
      const listener = vi.fn()
      const probe = new Probe({})
      const t = testRender(probe, {width: 10, height: 1})
      probe.update({mouseListener: {listener, events: ['mouse.wheel']}})
      t.render()
      t.sendMouse('mouse.move.in', {x: 1, y: 0})
      expect(listener).not.toHaveBeenCalled()

      probe.update({mouseListener: {listener, events: ['mouse.move']}})
      t.render()
      t.sendMouse('mouse.move.in', {x: 2, y: 0})
      t.sendMouse('mouse.wheel.down', {x: 2, y: 0})

      // (the new subscription enters when the view re-renders under the pointer)
      expect(names(listener.mock.calls)).toEqual([
        'mouse.move.enter',
        'mouse.move.in',
        'mouse.move.in',
      ])
    })

    it('does not remove listeners added with addMouseListener', () => {
      const imperative = vi.fn()
      const probe = new Probe(
        {},
        {
          mouseListener: {listener: () => {}, events: ['mouse.wheel']},
        },
      )
      probe.addMouseListener(imperative, {events: ['mouse.wheel']})
      const t = testRender(probe, {width: 10, height: 1})

      probe.update({})
      t.render()
      t.sendMouse('mouse.wheel.down', {x: 1, y: 0})

      expect(imperative).toHaveBeenCalledOnce()
    })
  })

  describe('keyboardListener', () => {
    it('an object registers hotkeys', () => {
      const listener = vi.fn()
      const text = new Text({
        text: 'hello',
        keyboardListener: {listener, events: ['ctrl+s']},
      })
      const t = testRender(text, {width: 10, height: 1})

      t.sendKey('s', {ctrl: true})
      t.sendKey('s')

      expect(listener).toHaveBeenCalledOnce()
    })

    it('a function piggy-backs', () => {
      const listener = vi.fn()
      const probe = new Probe({hotKeys: ['x']}, {keyboardListener: listener})
      const t = testRender(probe, {width: 10, height: 1})

      t.sendKey('x')
      t.sendKey('y')

      expect(listener).toHaveBeenCalledOnce()
    })

    it('update() replaces the function without re-subscribing, and removes it', () => {
      const first = vi.fn()
      const second = vi.fn()
      const text = new Text({
        text: 'hello',
        keyboardListener: {listener: first, events: true},
      })
      const t = testRender(text, {width: 10, height: 1})

      text.update({
        text: 'hello',
        keyboardListener: {listener: second, events: true},
      })
      t.render()
      t.sendKey('a')
      expect(first).not.toHaveBeenCalled()
      expect(second).toHaveBeenCalledOnce()

      text.update({text: 'hello'})
      t.render()
      t.sendKey('a')
      expect(second).toHaveBeenCalledOnce()
    })
  })

  describe('focusListener', () => {
    it('an object makes the view focusable', () => {
      const listener = vi.fn()
      const text = new Text({
        text: 'hello',
        focusListener: {listener, events: true},
      })
      const t = testRender(text, {width: 10, height: 1})

      t.sendKey('tab')
      t.sendKey('tab')

      expect(listener.mock.calls).toEqual([[true], [false]])
    })

    it('a function piggy-backs', () => {
      const listener = vi.fn()
      const text = new Text({text: 'hello', focusListener: listener})
      const t = testRender(text, {width: 10, height: 1})

      t.sendKey('tab')

      expect(listener).not.toHaveBeenCalled()
      expect(text.hasFocus).toBe(false)
    })

    it('isDefault is passed through', () => {
      const listener = vi.fn()
      const text = new Text({
        text: 'hello',
        focusListener: {listener, events: true, isDefault: true},
      })
      testRender(text, {width: 10, height: 1})

      expect(listener.mock.calls).toEqual([[true]])
    })

    it('update() removes the listener and the view stops being focusable', () => {
      const listener = vi.fn()
      const text = new Text({
        text: 'hello',
        focusListener: {listener, events: true},
      })
      const t = testRender(text, {width: 10, height: 1})

      text.update({text: 'hello'})
      t.render()
      t.sendKey('tab')

      expect(listener).not.toHaveBeenCalled()
      expect(text.hasFocus).toBe(false)
    })
  })
})
