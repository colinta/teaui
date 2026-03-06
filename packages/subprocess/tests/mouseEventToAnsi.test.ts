import {describe, it, expect} from 'vitest'
import {mouseEventToAnsi} from '../lib/mouseEventToAnsi.js'
import type {MouseEvent as TeaMouseEvent} from '@teaui/core'
import {Point} from '@teaui/core'

function mouseEvent(
  name: TeaMouseEvent['name'],
  x: number,
  y: number,
  opts: {
    button?: TeaMouseEvent['button']
    ctrl?: boolean
    meta?: boolean
    shift?: boolean
  } = {},
): TeaMouseEvent {
  return {
    type: 'mouse',
    name,
    position: new Point(x, y),
    button: opts.button ?? 'left',
    ctrl: opts.ctrl ?? false,
    meta: opts.meta ?? false,
    shift: opts.shift ?? false,
  }
}

describe('mouseEventToAnsi', () => {
  describe('button press', () => {
    it('left button down at (5, 10) → SGR press', () => {
      const result = mouseEventToAnsi(
        mouseEvent('mouse.button.down', 5, 10, {button: 'left'}),
      )
      // button=0, x=6 (1-based), y=11 (1-based), M=press
      expect(result).toBe('\x1b[<0;6;11M')
    })

    it('middle button down at (0, 0)', () => {
      const result = mouseEventToAnsi(
        mouseEvent('mouse.button.down', 0, 0, {button: 'middle'}),
      )
      expect(result).toBe('\x1b[<1;1;1M')
    })

    it('right button down', () => {
      const result = mouseEventToAnsi(
        mouseEvent('mouse.button.down', 3, 7, {button: 'right'}),
      )
      expect(result).toBe('\x1b[<2;4;8M')
    })
  })

  describe('button release', () => {
    it('left button up → lowercase m', () => {
      const result = mouseEventToAnsi(
        mouseEvent('mouse.button.up', 5, 10, {button: 'left'}),
      )
      expect(result).toBe('\x1b[<0;6;11m')
    })

    it('cancel → lowercase m', () => {
      const result = mouseEventToAnsi(
        mouseEvent('mouse.button.cancel', 5, 10, {button: 'left'}),
      )
      expect(result).toBe('\x1b[<0;6;11m')
    })
  })

  describe('scroll wheel', () => {
    it('wheel up', () => {
      const result = mouseEventToAnsi(
        mouseEvent('mouse.wheel.up', 10, 20, {button: 'wheel'}),
      )
      expect(result).toBe('\x1b[<64;11;21M')
    })

    it('wheel down', () => {
      const result = mouseEventToAnsi(
        mouseEvent('mouse.wheel.down', 10, 20, {button: 'wheel'}),
      )
      expect(result).toBe('\x1b[<65;11;21M')
    })
  })

  describe('motion events', () => {
    it('drag inside adds motion bit', () => {
      const result = mouseEventToAnsi(
        mouseEvent('mouse.button.dragInside', 5, 5, {button: 'left'}),
      )
      // button=0+32=32
      expect(result).toBe('\x1b[<32;6;6M')
    })

    it('move inside adds motion bit', () => {
      const result = mouseEventToAnsi(
        mouseEvent('mouse.move.in', 5, 5, {button: 'left'}),
      )
      expect(result).toBe('\x1b[<32;6;6M')
    })
  })

  describe('modifiers', () => {
    it('shift adds +4', () => {
      const result = mouseEventToAnsi(
        mouseEvent('mouse.button.down', 0, 0, {button: 'left', shift: true}),
      )
      // button=0+4=4
      expect(result).toBe('\x1b[<4;1;1M')
    })

    it('meta adds +8', () => {
      const result = mouseEventToAnsi(
        mouseEvent('mouse.button.down', 0, 0, {button: 'left', meta: true}),
      )
      expect(result).toBe('\x1b[<8;1;1M')
    })

    it('ctrl adds +16', () => {
      const result = mouseEventToAnsi(
        mouseEvent('mouse.button.down', 0, 0, {button: 'left', ctrl: true}),
      )
      expect(result).toBe('\x1b[<16;1;1M')
    })

    it('all modifiers combined', () => {
      const result = mouseEventToAnsi(
        mouseEvent('mouse.button.down', 0, 0, {
          button: 'right',
          shift: true,
          meta: true,
          ctrl: true,
        }),
      )
      // button=2+4+8+16=30
      expect(result).toBe('\x1b[<30;1;1M')
    })
  })
})
