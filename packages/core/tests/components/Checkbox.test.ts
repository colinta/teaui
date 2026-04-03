import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/TestScreen.js'
import {Checkbox} from '../../lib/components/Checkbox.js'

describe('Checkbox', () => {
  describe('rendering', () => {
    it('renders unchecked when focused', () => {
      const t = testRender(new Checkbox({title: 'Option', value: false}), {
        width: 20,
        height: 1,
      })
      t.sendKey('tab')
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders checked when focused', () => {
      const t = testRender(new Checkbox({title: 'Option', value: true}), {
        width: 20,
        height: 1,
      })
      t.sendKey('tab')
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders with short title', () => {
      const t = testRender(new Checkbox({title: 'OK', value: false}), {
        width: 10,
        height: 1,
      })
      t.sendKey('tab')
      expect(t.terminal.textContent()).toMatchSnapshot()
    })
  })

  describe('mouse interaction', () => {
    it('toggles on click', () => {
      let checked = false
      const cb = new Checkbox({
        title: 'Option',
        value: false,
        onChange(value) {
          checked = value
        },
      })
      const t = testRender(cb, {width: 20, height: 1})
      t.sendMouse('mouse.button.down', {x: 0, y: 0})
      t.sendMouse('mouse.button.up', {x: 0, y: 0})
      expect(checked).toBe(true)
    })

    it('toggles off on second click', () => {
      let checked = true
      const cb = new Checkbox({
        title: 'Option',
        value: true,
        onChange(value) {
          checked = value
        },
      })
      const t = testRender(cb, {width: 20, height: 1})
      t.sendMouse('mouse.button.down', {x: 0, y: 0})
      t.sendMouse('mouse.button.up', {x: 0, y: 0})
      expect(checked).toBe(false)
    })
  })

  describe('keyboard interaction', () => {
    it('toggles on key press when focused', () => {
      let checked = false
      const cb = new Checkbox({
        title: 'Option',
        value: false,
        onChange(value) {
          checked = value
        },
      })
      const t = testRender(cb, {width: 20, height: 1})
      t.sendKey('tab')
      t.sendKey('return')
      expect(checked).toBe(true)
    })
  })
})
