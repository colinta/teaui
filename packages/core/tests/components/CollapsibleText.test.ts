import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/TestScreen.js'
import {CollapsibleText} from '../../lib/components/CollapsibleText.js'
import {Collapsible} from '../../lib/components/Collapsible.js'
import {Text} from '../../lib/components/Text.js'

const multiline = 'one\ntwo\nthree'

describe('CollapsibleText', () => {
  describe('rendering', () => {
    it('shows the preview when collapsed', () => {
      const t = testRender(new CollapsibleText({text: multiline}), {
        width: 10,
        height: 3,
      })
      expect(t.terminal.textContent()).toBe('► one')
    })

    it('shows everything when expanded by a click', () => {
      const t = testRender(new CollapsibleText({text: multiline}), {
        width: 10,
        height: 3,
      })
      t.sendMouse('mouse.button.down', {x: 0, y: 0})
      t.sendMouse('mouse.button.up', {x: 0, y: 0})
      expect(t.terminal.textContent()).toBe('▼ one\n  two\n  three')
    })

    it('text that fits on one line is plain', () => {
      const t = testRender(new CollapsibleText({text: 'hello'}), {
        width: 10,
        height: 1,
      })
      expect(t.terminal.textContent()).toBe('hello')
    })
  })

  describe('hover', () => {
    const background = (t: ReturnType<typeof testRender>, x: number, y = 0) =>
      t.terminal.styleAt(x, y).background

    it('highlights the whole area on hover, and clears on exit', () => {
      const view = new CollapsibleText({text: multiline})
      const t = testRender(view, {width: 10, height: 3})
      const normal = background(t, 0)

      t.sendMouse('mouse.move.in', {x: 3, y: 0})
      const hover = background(t, 0)
      expect(view.isHover).toBe(true)
      expect(hover).not.toEqual(normal)
      // the arrow, the text, and the space after the text
      expect(background(t, 1)).toEqual(hover)
      expect(background(t, 3)).toEqual(hover)
      expect(background(t, 9)).toEqual(hover)

      t.sendMouse('mouse.move.in', {x: 3, y: 2})
      expect(background(t, 0)).toEqual(hover)

      t.sendMouse('mouse.move.in', {x: 30, y: 0})
      expect(view.isHover).toBe(false)
      expect(background(t, 0)).toEqual(normal)
      expect(background(t, 3)).toEqual(normal)
    })

    it('highlights while expanded too', () => {
      const view = new CollapsibleText({text: multiline})
      const t = testRender(view, {width: 10, height: 3})
      const normal = background(t, 0, 2)
      t.sendMouse('mouse.button.down', {x: 0, y: 0})
      t.sendMouse('mouse.button.up', {x: 0, y: 0})

      t.sendMouse('mouse.move.in', {x: 3, y: 2})
      expect(background(t, 3, 2)).not.toEqual(normal)
    })

    it('highlights differently when pressed', () => {
      const t = testRender(new CollapsibleText({text: multiline}), {
        width: 10,
        height: 3,
      })
      t.sendMouse('mouse.move.in', {x: 3, y: 0})
      const hover = background(t, 0)

      t.sendMouse('mouse.button.down', {x: 3, y: 0})
      const pressed = background(t, 0)
      expect(pressed).not.toEqual(hover)
      t.sendMouse('mouse.button.up', {x: 3, y: 0})
    })

    it('highlights text that wraps', () => {
      const view = new CollapsibleText({text: 'a long line of text'})
      const t = testRender(view, {width: 8, height: 1})
      const normal = background(t, 0)

      t.sendMouse('mouse.move.in', {x: 3, y: 0})
      expect(background(t, 0)).not.toEqual(normal)
    })

    it('does not highlight text that is not collapsible', () => {
      const view = new CollapsibleText({text: 'hello'})
      const t = testRender(view, {width: 10, height: 1})
      const normal = background(t, 0)

      t.sendMouse('mouse.move.in', {x: 2, y: 0})
      expect(view.isHover).toBe(false)
      expect(background(t, 0)).toEqual(normal)
    })

    it('highlights the same way as Collapsible', () => {
      const collapsibleText = testRender(
        new CollapsibleText({text: multiline}),
        {width: 10, height: 3},
      )
      const collapsible = testRender(
        new Collapsible({collapsed: new Text({text: multiline})}),
        {width: 10, height: 3},
      )

      const normal = [
        background(collapsibleText, 0),
        background(collapsible, 0),
      ]
      expect(normal[0]).toEqual(normal[1])

      collapsibleText.sendMouse('mouse.move.in', {x: 3, y: 0})
      collapsible.sendMouse('mouse.move.in', {x: 3, y: 0})
      expect(background(collapsibleText, 0)).toEqual(background(collapsible, 0))
      expect(background(collapsibleText, 9)).toEqual(background(collapsible, 9))

      collapsibleText.sendMouse('mouse.button.down', {x: 3, y: 0})
      collapsible.sendMouse('mouse.button.down', {x: 3, y: 0})
      expect(background(collapsibleText, 0)).toEqual(background(collapsible, 0))
    })
  })
})
