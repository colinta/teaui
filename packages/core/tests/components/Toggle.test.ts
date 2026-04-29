import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/TestScreen.js'
import {Size} from '../../lib/geometry.js'
import {Toggle} from '../../lib/components/Toggle.js'

describe('Toggle', () => {
  describe('rendering', () => {
    it('has an iOS-style natural size', () => {
      const toggle = new Toggle()
      expect(toggle.naturalSize(Size.zero)).toEqual(new Size(6, 2))
    })

    it('renders off with the slider on the left', () => {
      const t = testRender(new Toggle({value: false}), {width: 6, height: 2})
      expect(t.terminal.textRect(0, 0, 6, 2)).toMatchSnapshot()
      expect(t.terminal.styleAt(3, 0).foreground).toEqual([128, 128, 128])
    })

    it('renders on with the slider on the right', () => {
      const t = testRender(new Toggle({value: true}), {width: 6, height: 2})
      expect(t.terminal.textRect(0, 0, 6, 2)).toMatchSnapshot()
      expect(t.terminal.styleAt(0, 0).foreground).toEqual([52, 199, 89])
    })

    it('supports a height of 1 when off', () => {
      const t = testRender(new Toggle({value: false}), {width: 6, height: 1})
      expect(t.terminal.textRect(0, 0, 6, 1)).toMatchSnapshot()
    })

    it('supports a height of 1 when on', () => {
      const t = testRender(new Toggle({value: true}), {width: 6, height: 1})
      expect(t.terminal.textRect(0, 0, 6, 1)).toMatchSnapshot()
    })
  })

  describe('interaction', () => {
    it('toggles on click and animates the slider', () => {
      let value = false
      const toggle = new Toggle({
        value: false,
        onChange(nextValue) {
          value = nextValue
        },
      })
      const t = testRender(toggle, {width: 6, height: 2})

      t.sendMouse('mouse.button.down', {x: 2, y: 1})
      t.sendMouse('mouse.button.up', {x: 2, y: 1})
      expect(value).toBe(true)
      expect(t.terminal.charAt(0, 0)).toBe('▗')

      t.tick(60)
      expect(t.terminal.charAt(2, 0)).toBe('▗')

      t.tick(60)
      expect(t.terminal.charAt(3, 0)).toBe('▗')
    })

    it('toggles from the keyboard when focused', () => {
      let value = false
      const toggle = new Toggle({
        value: false,
        onChange(nextValue) {
          value = nextValue
        },
      })
      const t = testRender(toggle, {width: 6, height: 1})

      t.sendKey('tab')
      t.sendKey('space')
      expect(value).toBe(true)
    })
  })
})
