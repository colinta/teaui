import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/testing.js'
import {Button} from '../../lib/components/Button.js'
import {Stack} from '../../lib/components/Stack.js'

describe('Button', () => {
  describe('rendering', () => {
    it('renders with top and bottom border decorations', () => {
      const t = testRender(new Button({text: 'OK'}), {width: 10, height: 3})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders at height 1', () => {
      const t = testRender(new Button({text: 'Test'}), {width: 12, height: 1})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders at height 5', () => {
      const t = testRender(new Button({text: 'Test'}), {width: 12, height: 5})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })
  })

  describe('focus', () => {
    it('buttons do not receive focus by default', () => {
      const buttons = [
        new Button({text: 'One', height: 3}),
        new Button({text: 'Two', height: 3}),
        new Button({text: 'Three', height: 3}),
      ]
      const view = Stack.down(buttons)
      testRender(view, {width: 14, height: 9})
      expect(buttons[0].hasFocus).toBe(false)
      expect(buttons[1].hasFocus).toBe(false)
      expect(buttons[2].hasFocus).toBe(false)
    })

    it('tab cycles through buttons', () => {
      const buttons = [
        new Button({text: 'One', height: 3}),
        new Button({text: 'Two', height: 3}),
        new Button({text: 'Three', height: 3}),
      ]
      const view = Stack.down(buttons)
      const t = testRender(view, {width: 14, height: 9})

      // First tab: focus moves to the first button
      t.sendKey('tab')
      expect(buttons[0].hasFocus).toBe(true)
      expect(buttons[1].hasFocus).toBe(false)
      expect(buttons[2].hasFocus).toBe(false)

      // Second tab: focus moves to the second button
      t.sendKey('tab')
      expect(buttons[0].hasFocus).toBe(false)
      expect(buttons[1].hasFocus).toBe(true)
      expect(buttons[2].hasFocus).toBe(false)

      // Third tab: focus moves to the third button
      t.sendKey('tab')
      expect(buttons[0].hasFocus).toBe(false)
      expect(buttons[1].hasFocus).toBe(false)
      expect(buttons[2].hasFocus).toBe(true)

      // Fourth tab: unfocus (past the last item)
      t.sendKey('tab')
      expect(buttons[0].hasFocus).toBe(false)
      expect(buttons[1].hasFocus).toBe(false)
      expect(buttons[2].hasFocus).toBe(false)

      // Fifth tab: back to the first button
      t.sendKey('tab')
      expect(buttons[0].hasFocus).toBe(true)
      expect(buttons[1].hasFocus).toBe(false)
      expect(buttons[2].hasFocus).toBe(false)
    })

    it('shift-tab cycles in reverse with unfocus at start', () => {
      const buttons = [
        new Button({text: 'One', height: 3}),
        new Button({text: 'Two', height: 3}),
        new Button({text: 'Three', height: 3}),
      ]
      const view = Stack.down(buttons)
      const t = testRender(view, {width: 14, height: 9})

      // Shift-tab from unfocused: focus the last button
      t.sendKey('tab', {shift: true})
      expect(buttons[0].hasFocus).toBe(false)
      expect(buttons[1].hasFocus).toBe(false)
      expect(buttons[2].hasFocus).toBe(true)

      // Shift-tab: move to second
      t.sendKey('tab', {shift: true})
      expect(buttons[1].hasFocus).toBe(true)

      // Shift-tab: move to first
      t.sendKey('tab', {shift: true})
      expect(buttons[0].hasFocus).toBe(true)

      // Shift-tab: unfocus (past the first item)
      t.sendKey('tab', {shift: true})
      expect(buttons[0].hasFocus).toBe(false)
      expect(buttons[1].hasFocus).toBe(false)
      expect(buttons[2].hasFocus).toBe(false)
    })
  })

  describe('mouse interaction', () => {
    it('fires onClick on mouse click', () => {
      let clicked = false
      const btn = new Button({
        text: 'Click Me',
        onClick() {
          clicked = true
        },
      })
      const t = testRender(btn, {width: 14, height: 3})
      t.sendMouse('mouse.button.down', {x: 5, y: 1})
      t.sendMouse('mouse.button.up', {x: 5, y: 1})
      expect(clicked).toBe(true)
    })

    it('does not fire onClick if mouse released outside', () => {
      let clicked = false
      const btn = new Button({
        text: 'Click Me',
        onClick() {
          clicked = true
        },
      })
      const t = testRender(btn, {width: 14, height: 3})
      t.sendMouse('mouse.button.down', {x: 5, y: 1})
      t.sendMouse('mouse.button.up', {x: 50, y: 50})
      expect(clicked).toBe(false)
    })
  })
})
