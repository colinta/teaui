import {describe, it, expect, vi} from 'vitest'
import {testRender} from '../../lib/TestScreen.js'
import {Pressable} from '../../lib/components/Pressable.js'
import {Button} from '../../lib/components/Button.js'
import {Stack} from '../../lib/components/Stack.js'
import {Text} from '../../lib/components/Text.js'
import {Palette} from '../../lib/Palette.js'

const palette = Palette.plain
// The terminal reports colors as [r, g, b]; the palette uses '#rrggbb(sgr)'
const rgb = (color: unknown): unknown => {
  if (typeof color === 'string') {
    const hex = /^#([0-9a-f]{6})/i.exec(color)?.[1]
    if (hex) {
      return [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16))
    }
  }
  return color
}
const raised = (
  state: {isHover?: boolean; isPressed?: boolean; hasFocus?: boolean} = {},
) => palette.ui({variant: 'raised', ...state})

describe('Pressable', () => {
  describe('rendering', () => {
    it('draws its children over its full area', () => {
      const pressable = new Pressable({child: new Text({text: 'hello'})})
      const t = testRender(pressable, {width: 10, height: 1})
      expect(t.terminal.textContent()).toBe('hello')
    })

    it('paints the palette background behind its children', () => {
      const pressable = new Pressable({child: new Text({text: 'hi'})})
      const t = testRender(pressable, {width: 6, height: 1})
      expect(t.terminal.styleAt(0, 0).background).toEqual(
        rgb(raised().background),
      )
      // including where there is no child content
      expect(t.terminal.styleAt(5, 0).background).toEqual(
        rgb(raised().background),
      )
    })

    it.each([1, 2, 3, 4])(
      'has no title, border, or edges of its own (height %i)',
      height => {
        const t = testRender(new Pressable(), {width: 4, height})
        expect(t.terminal.textContent()).toBe('')
      },
    )

    it('fills the same surface as a Button', () => {
      const pressable = testRender(new Pressable(), {width: 8, height: 1})
      const button = testRender(new Button({border: 'none'}), {
        width: 8,
        height: 1,
      })
      for (let x = 0; x < 8; x++) {
        expect(pressable.terminal.charAt(x, 0)).toBe(
          button.terminal.charAt(x, 0),
        )
        expect(pressable.terminal.styleAt(x, 0)).toEqual(
          button.terminal.styleAt(x, 0),
        )
      }
    })

    it('Button adds the top and bottom edges to tall buttons', () => {
      const t = testRender(new Button({border: 'none'}), {width: 4, height: 4})
      expect(t.terminal.textContent()).toBe('▔▔▔▔\n\n\n▁▁▁▁')

      const short = testRender(new Button({border: 'none'}), {
        width: 4,
        height: 2,
      })
      expect(short.terminal.textContent()).toBe('')
    })

    it('merges foreground', () => {
      const pressable = new Pressable({
        foreground: 'red',
        child: new Text({text: 'hi'}),
      })
      const t = testRender(pressable, {width: 6, height: 1})
      expect(t.terminal.styleAt(5, 0).foreground).toBe('red')
    })

    it('merges background when not hovered or focused', () => {
      const pressable = new Pressable({background: 'blue'})
      const t = testRender(pressable, {width: 6, height: 1})
      expect(t.terminal.styleAt(0, 0).background).toBe('blue')

      t.sendMouse('mouse.move.in', {x: 1, y: 0})
      expect(t.terminal.styleAt(0, 0).background).toEqual(
        rgb(raised({isHover: true}).background),
      )
    })
  })

  describe('state', () => {
    it('tracks hover', () => {
      const pressable = new Pressable()
      const t = testRender(pressable, {width: 6, height: 1})
      expect(pressable.isHover).toBe(false)
      expect(t.terminal.styleAt(0, 0).background).toEqual(
        rgb(raised().background),
      )

      t.sendMouse('mouse.move.in', {x: 1, y: 0})
      expect(pressable.isHover).toBe(true)
      expect(t.terminal.styleAt(0, 0).background).toEqual(
        rgb(raised({isHover: true}).background),
      )

      t.sendMouse('mouse.move.in', {x: 10, y: 0})
      expect(pressable.isHover).toBe(false)
      expect(t.terminal.styleAt(0, 0).background).toEqual(
        rgb(raised().background),
      )
    })

    it('tracks pressed', () => {
      const pressable = new Pressable()
      const t = testRender(pressable, {width: 6, height: 1})

      t.sendMouse('mouse.button.down', {x: 1, y: 0})
      expect(pressable.isPressed).toBe(true)
      expect(t.terminal.styleAt(0, 0).background).toEqual(
        rgb(raised({isPressed: true}).background),
      )

      t.sendMouse('mouse.button.up', {x: 1, y: 0})
      expect(pressable.isPressed).toBe(false)
    })

    it('is no longer pressed when the mouse is dragged out', () => {
      const pressable = new Pressable()
      const t = testRender(pressable, {width: 6, height: 1})

      t.sendMouse('mouse.button.down', {x: 1, y: 0})
      t.sendMouse('mouse.button.down', {x: 20, y: 0})
      expect(pressable.isPressed).toBe(false)

      // and pressed again when dragged back in
      t.sendMouse('mouse.button.down', {x: 2, y: 0})
      expect(pressable.isPressed).toBe(true)
    })

    it('gives its children a palette that matches its state', () => {
      const child = new Text({text: 'hi'})
      const pressable = new Pressable({child})
      const t = testRender(pressable, {width: 6, height: 1})
      expect(child.purpose.flatBackgroundColor).toEqual(raised().background)

      t.sendMouse('mouse.move.in', {x: 1, y: 0})
      expect(child.purpose.flatBackgroundColor).toEqual(
        raised({isHover: true}).background,
      )

      t.sendMouse('mouse.button.down', {x: 1, y: 0})
      expect(child.purpose.flatBackgroundColor).toEqual(
        raised({isPressed: true}).background,
      )
    })
  })

  describe('onClick', () => {
    it('is called when clicked', () => {
      const onClick = vi.fn()
      const t = testRender(new Pressable({onClick}), {width: 6, height: 1})

      t.sendMouse('mouse.button.down', {x: 1, y: 0})
      expect(onClick).not.toHaveBeenCalled()
      t.sendMouse('mouse.button.up', {x: 1, y: 0})
      expect(onClick).toHaveBeenCalledOnce()
    })

    it('is not called when the mouse is released outside', () => {
      const onClick = vi.fn()
      const t = testRender(new Pressable({onClick}), {width: 6, height: 1})

      t.sendMouse('mouse.button.down', {x: 1, y: 0})
      t.sendMouse('mouse.button.up', {x: 20, y: 0})
      expect(onClick).not.toHaveBeenCalled()
    })

    it('is called on Return when focused', () => {
      const onClick = vi.fn()
      const t = testRender(new Pressable({onClick}), {width: 6, height: 1})

      t.sendKey('return')
      expect(onClick).not.toHaveBeenCalled()

      t.sendKey('tab')
      t.sendKey('return')
      expect(onClick).toHaveBeenCalledOnce()
    })

    it('can be replaced with update()', () => {
      const first = vi.fn()
      const second = vi.fn()
      const pressable = new Pressable({onClick: first})
      const t = testRender(pressable, {width: 6, height: 1})

      pressable.update({onClick: second})
      t.sendMouse('mouse.button.down', {x: 1, y: 0})
      t.sendMouse('mouse.button.up', {x: 1, y: 0})
      expect(first).not.toHaveBeenCalled()
      expect(second).toHaveBeenCalledOnce()
    })
  })

  describe('focus', () => {
    it('does not receive focus by default, but can with tab', () => {
      const pressable = new Pressable()
      const t = testRender(pressable, {width: 6, height: 1})
      expect(pressable.hasFocus).toBe(false)

      t.sendKey('tab')
      expect(pressable.hasFocus).toBe(true)
      expect(t.terminal.styleAt(0, 0).background).toEqual(
        rgb(raised({hasFocus: true}).background),
      )
    })

    it('is skipped by tab with focusable: false', () => {
      const skipped = new Pressable({focusable: false, height: 1})
      const focusable = new Pressable({height: 1})
      const t = testRender(Stack.down([skipped, focusable]), {
        width: 6,
        height: 2,
      })

      t.sendKey('tab')
      expect(skipped.hasFocus).toBe(false)
      expect(focusable.hasFocus).toBe(true)
    })

    it('ignores Return with focusable: false', () => {
      const onClick = vi.fn()
      const t = testRender(new Pressable({focusable: false, onClick}), {
        width: 6,
        height: 1,
      })

      t.sendKey('tab')
      t.sendKey('return')
      expect(onClick).not.toHaveBeenCalled()
    })

    it('still responds to the mouse with focusable: false', () => {
      const onClick = vi.fn()
      const t = testRender(new Pressable({focusable: false, onClick}), {
        width: 6,
        height: 1,
      })

      t.sendMouse('mouse.button.down', {x: 1, y: 0})
      t.sendMouse('mouse.button.up', {x: 1, y: 0})
      expect(onClick).toHaveBeenCalledOnce()
    })
  })

  describe('Button', () => {
    it('is a Pressable', () => {
      expect(new Button({title: 'OK'})).toBeInstanceOf(Pressable)
    })
  })
})
