import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/testing.js'
import {Checkbox} from '../../lib/components/Checkbox.js'

describe('Checkbox', () => {
  describe('rendering', () => {
    it('renders unchecked box', () => {
      const t = testRender(
        new Checkbox({text: 'Option', value: false}),
        {width: 20, height: 1},
      )
      expect(t.terminal.textContent()).toContain('☐')
    })

    it('renders checked box', () => {
      const t = testRender(
        new Checkbox({text: 'Option', value: true}),
        {width: 20, height: 1},
      )
      const content = t.terminal.textContent()
      expect(content).toMatch(/[☑◼]/)
    })

    it('renders without text', () => {
      const t = testRender(
        new Checkbox({value: false}),
        {width: 5, height: 1},
      )
      expect(t.terminal.textContent()).toContain('☐')
    })
  })

  describe('mouse interaction', () => {
    it('toggles on click', () => {
      let checked = false
      const cb = new Checkbox({
        text: 'Option',
        value: false,
        onChange(value) { checked = value },
      })
      const t = testRender(cb, {width: 20, height: 1})
      t.sendMouse('mouse.button.down', {x: 0, y: 0})
      t.sendMouse('mouse.button.up', {x: 0, y: 0})
      expect(checked).toBe(true)
    })

    it('toggles off on second click', () => {
      let checked = true
      const cb = new Checkbox({
        text: 'Option',
        value: true,
        onChange(value) { checked = value },
      })
      const t = testRender(cb, {width: 20, height: 1})
      t.sendMouse('mouse.button.down', {x: 0, y: 0})
      t.sendMouse('mouse.button.up', {x: 0, y: 0})
      expect(checked).toBe(false)
    })
  })
})
