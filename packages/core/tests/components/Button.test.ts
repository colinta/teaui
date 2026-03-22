import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/testing.js'
import {Button} from '../../lib/components/Button.js'

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
