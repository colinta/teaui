import {describe, it, expect} from 'vitest'
import {parseInput} from '../src/input.js'
import type {KeyEvent, MouseEvent, PasteEvent} from '../src/types.js'

function key(
  key: string,
  mods: Partial<Pick<KeyEvent, 'ctrl' | 'alt' | 'shift' | 'meta'>> = {},
): KeyEvent {
  return {
    type: 'key',
    key,
    ctrl: false,
    alt: false,
    shift: false,
    meta: false,
    ...mods,
  }
}

describe('parseInput', () => {
  describe('printable characters', () => {
    it('parses single printable char', () => {
      const events = parseInput(Buffer.from('a'))
      expect(events).toEqual([key('a')])
    })

    it('parses multiple printable chars as separate events', () => {
      const events = parseInput(Buffer.from('abc'))
      expect(events).toEqual([key('a'), key('b'), key('c')])
    })

    it('parses space', () => {
      const events = parseInput(Buffer.from(' '))
      expect(events).toEqual([key('space')])
    })

    it('parses emoji as single key event', () => {
      const events = parseInput(Buffer.from('🙂'))
      expect(events).toEqual([key('🙂')])
    })

    it('parses emoji mixed with ASCII', () => {
      const events = parseInput(Buffer.from('a🙂b'))
      expect(events).toEqual([key('a'), key('🙂'), key('b')])
    })

    it('parses multi-codepoint emoji', () => {
      const events = parseInput(Buffer.from('👍'))
      expect(events).toEqual([key('👍')])
    })
  })

  describe('control characters', () => {
    it('parses ctrl+c', () => {
      const events = parseInput(Buffer.from([0x03]))
      expect(events).toEqual([key('c', {ctrl: true})])
    })

    it('parses ctrl+a', () => {
      const events = parseInput(Buffer.from([0x01]))
      expect(events).toEqual([key('a', {ctrl: true})])
    })

    it('parses ctrl+z', () => {
      const events = parseInput(Buffer.from([0x1a]))
      expect(events).toEqual([key('z', {ctrl: true})])
    })

    it('parses enter (CR)', () => {
      const events = parseInput(Buffer.from([0x0d]))
      expect(events).toEqual([key('return')])
    })

    it('parses tab', () => {
      const events = parseInput(Buffer.from([0x09]))
      expect(events).toEqual([key('tab')])
    })

    it('parses shift+tab (backtab CSI Z)', () => {
      const events = parseInput(Buffer.from('\x1b[Z'))
      expect(events).toEqual([key('tab', {shift: true})])
    })

    it('parses backspace', () => {
      const events = parseInput(Buffer.from([0x7f]))
      expect(events).toEqual([key('backspace')])
    })

    it('parses escape key (standalone ESC)', () => {
      const events = parseInput(Buffer.from([0x1b]))
      expect(events).toEqual([key('escape')])
    })
  })

  describe('arrow keys', () => {
    it('parses arrow up', () => {
      const events = parseInput(Buffer.from('\x1b[A'))
      expect(events).toEqual([key('up')])
    })

    it('parses arrow down', () => {
      const events = parseInput(Buffer.from('\x1b[B'))
      expect(events).toEqual([key('down')])
    })

    it('parses arrow right', () => {
      const events = parseInput(Buffer.from('\x1b[C'))
      expect(events).toEqual([key('right')])
    })

    it('parses arrow left', () => {
      const events = parseInput(Buffer.from('\x1b[D'))
      expect(events).toEqual([key('left')])
    })

    it('parses shift+arrow up', () => {
      const events = parseInput(Buffer.from('\x1b[1;2A'))
      expect(events).toEqual([key('up', {shift: true})])
    })

    it('parses ctrl+arrow right', () => {
      const events = parseInput(Buffer.from('\x1b[1;5C'))
      expect(events).toEqual([key('right', {ctrl: true})])
    })

    it('parses alt+arrow left', () => {
      const events = parseInput(Buffer.from('\x1b[1;3D'))
      expect(events).toEqual([key('left', {alt: true})])
    })
  })

  describe('special keys', () => {
    it('parses home', () => {
      const events = parseInput(Buffer.from('\x1b[H'))
      expect(events).toEqual([key('home')])
    })

    it('parses end', () => {
      const events = parseInput(Buffer.from('\x1b[F'))
      expect(events).toEqual([key('end')])
    })

    it('parses insert', () => {
      const events = parseInput(Buffer.from('\x1b[2~'))
      expect(events).toEqual([key('insert')])
    })

    it('parses delete', () => {
      const events = parseInput(Buffer.from('\x1b[3~'))
      expect(events).toEqual([key('delete')])
    })

    it('parses page up', () => {
      const events = parseInput(Buffer.from('\x1b[5~'))
      expect(events).toEqual([key('pageUp')])
    })

    it('parses page down', () => {
      const events = parseInput(Buffer.from('\x1b[6~'))
      expect(events).toEqual([key('pageDown')])
    })
  })

  describe('function keys', () => {
    it('parses F1', () => {
      const events = parseInput(Buffer.from('\x1bOP'))
      expect(events).toEqual([key('f1')])
    })

    it('parses F2', () => {
      const events = parseInput(Buffer.from('\x1bOQ'))
      expect(events).toEqual([key('f2')])
    })

    it('parses F3', () => {
      const events = parseInput(Buffer.from('\x1bOR'))
      expect(events).toEqual([key('f3')])
    })

    it('parses F4', () => {
      const events = parseInput(Buffer.from('\x1bOS'))
      expect(events).toEqual([key('f4')])
    })

    it('parses F5', () => {
      const events = parseInput(Buffer.from('\x1b[15~'))
      expect(events).toEqual([key('f5')])
    })

    it('parses F6', () => {
      const events = parseInput(Buffer.from('\x1b[17~'))
      expect(events).toEqual([key('f6')])
    })

    it('parses F7', () => {
      const events = parseInput(Buffer.from('\x1b[18~'))
      expect(events).toEqual([key('f7')])
    })

    it('parses F8', () => {
      const events = parseInput(Buffer.from('\x1b[19~'))
      expect(events).toEqual([key('f8')])
    })

    it('parses F9', () => {
      const events = parseInput(Buffer.from('\x1b[20~'))
      expect(events).toEqual([key('f9')])
    })

    it('parses F10', () => {
      const events = parseInput(Buffer.from('\x1b[21~'))
      expect(events).toEqual([key('f10')])
    })

    it('parses F11', () => {
      const events = parseInput(Buffer.from('\x1b[23~'))
      expect(events).toEqual([key('f11')])
    })

    it('parses F12', () => {
      const events = parseInput(Buffer.from('\x1b[24~'))
      expect(events).toEqual([key('f12')])
    })
  })

  describe('modifier keys on special keys', () => {
    it('parses shift+delete (CSI 3;2~)', () => {
      const events = parseInput(Buffer.from('\x1b[3;2~'))
      expect(events).toEqual([key('delete', {shift: true})])
    })

    it('parses ctrl+pageUp (CSI 5;5~)', () => {
      const events = parseInput(Buffer.from('\x1b[5;5~'))
      expect(events).toEqual([key('pageUp', {ctrl: true})])
    })

    it('parses ctrl+shift+end (CSI 1;6F)', () => {
      const events = parseInput(Buffer.from('\x1b[1;6F'))
      expect(events).toEqual([key('end', {ctrl: true, shift: true})])
    })

    it('parses shift+F1 (CSI 1;2P)', () => {
      const events = parseInput(Buffer.from('\x1b[1;2P'))
      expect(events).toEqual([key('f1', {shift: true})])
    })

    it('parses ctrl+F3 (CSI 1;5R)', () => {
      const events = parseInput(Buffer.from('\x1b[1;5R'))
      expect(events).toEqual([key('f3', {ctrl: true})])
    })

    it('parses alt+shift+F5 (CSI 15;4~)', () => {
      const events = parseInput(Buffer.from('\x1b[15;4~'))
      expect(events).toEqual([key('f5', {alt: true, shift: true})])
    })
  })

  describe('alt key combos', () => {
    it('parses alt+a (ESC a)', () => {
      const events = parseInput(Buffer.from('\x1ba'))
      expect(events).toEqual([key('a', {alt: true})])
    })

    it('parses alt+z', () => {
      const events = parseInput(Buffer.from('\x1bz'))
      expect(events).toEqual([key('z', {alt: true})])
    })
  })

  describe('ctrl+alt key combos', () => {
    it('parses ctrl+alt+a (ESC followed by 0x01)', () => {
      const events = parseInput(Buffer.from('\x1b\x01'))
      expect(events).toEqual([key('a', {ctrl: true, alt: true})])
    })

    it('parses ctrl+alt+d (ESC followed by 0x04)', () => {
      const events = parseInput(Buffer.from('\x1b\x04'))
      expect(events).toEqual([key('d', {ctrl: true, alt: true})])
    })

    it('parses ctrl+alt+z (ESC followed by 0x1a)', () => {
      const events = parseInput(Buffer.from('\x1b\x1a'))
      expect(events).toEqual([key('z', {ctrl: true, alt: true})])
    })

    it('parses alt+return (ESC followed by 0x0d)', () => {
      const events = parseInput(Buffer.from('\x1b\x0d'))
      expect(events).toEqual([key('return', {alt: true})])
    })

    it('parses alt+tab (ESC followed by 0x09)', () => {
      const events = parseInput(Buffer.from('\x1b\x09'))
      expect(events).toEqual([key('tab', {alt: true})])
    })
  })

  describe('SGR mouse events', () => {
    it('parses mouse press (left button at 10,20)', () => {
      // SGR: CSI < button ; x ; y M (press) or m (release)
      const events = parseInput(Buffer.from('\x1b[<0;10;20M'))
      expect(events).toEqual([
        {
          type: 'mouse',
          action: 'press',
          button: 'left',
          x: 9,
          y: 19,
          ctrl: false,
          alt: false,
          shift: false,
        } satisfies MouseEvent,
      ])
    })

    it('parses mouse release (left button)', () => {
      const events = parseInput(Buffer.from('\x1b[<0;5;5m'))
      expect(events).toEqual([
        {
          type: 'mouse',
          action: 'release',
          button: 'left',
          x: 4,
          y: 4,
          ctrl: false,
          alt: false,
          shift: false,
        } satisfies MouseEvent,
      ])
    })

    it('parses right click', () => {
      const events = parseInput(Buffer.from('\x1b[<2;15;25M'))
      expect(events).toEqual([
        {
          type: 'mouse',
          action: 'press',
          button: 'right',
          x: 14,
          y: 24,
          ctrl: false,
          alt: false,
          shift: false,
        } satisfies MouseEvent,
      ])
    })

    it('parses middle click', () => {
      const events = parseInput(Buffer.from('\x1b[<1;1;1M'))
      expect(events).toEqual([
        {
          type: 'mouse',
          action: 'press',
          button: 'middle',
          x: 0,
          y: 0,
          ctrl: false,
          alt: false,
          shift: false,
        } satisfies MouseEvent,
      ])
    })

    it('parses scroll up', () => {
      const events = parseInput(Buffer.from('\x1b[<64;10;10M'))
      expect(events).toEqual([
        {
          type: 'mouse',
          action: 'scrollUp',
          button: 'none',
          x: 9,
          y: 9,
          ctrl: false,
          alt: false,
          shift: false,
        } satisfies MouseEvent,
      ])
    })

    it('parses scroll down', () => {
      const events = parseInput(Buffer.from('\x1b[<65;10;10M'))
      expect(events).toEqual([
        {
          type: 'mouse',
          action: 'scrollDown',
          button: 'none',
          x: 9,
          y: 9,
          ctrl: false,
          alt: false,
          shift: false,
        } satisfies MouseEvent,
      ])
    })

    it('parses mouse move with no button held (button=35: motion+3)', () => {
      // button=35 = 32 (motion) + 3 (no button) — pure mouse movement
      const events = parseInput(Buffer.from('\x1b[<35;50;100M'))
      expect(events).toEqual([
        {
          type: 'mouse',
          action: 'move',
          button: 'none',
          x: 49,
          y: 99,
          ctrl: false,
          alt: false,
          shift: false,
        } satisfies MouseEvent,
      ])
    })

    it('parses left button drag (button=32: motion+0)', () => {
      // button=32 = 32 (motion) + 0 (left) — dragging with left button held
      const events = parseInput(Buffer.from('\x1b[<32;10;20M'))
      expect(events).toEqual([
        {
          type: 'mouse',
          action: 'drag',
          button: 'left',
          x: 9,
          y: 19,
          ctrl: false,
          alt: false,
          shift: false,
        } satisfies MouseEvent,
      ])
    })

    it('parses middle button drag (button=33: motion+1)', () => {
      const events = parseInput(Buffer.from('\x1b[<33;10;20M'))
      expect(events).toEqual([
        {
          type: 'mouse',
          action: 'drag',
          button: 'middle',
          x: 9,
          y: 19,
          ctrl: false,
          alt: false,
          shift: false,
        } satisfies MouseEvent,
      ])
    })

    it('parses right button drag (button=34: motion+2)', () => {
      const events = parseInput(Buffer.from('\x1b[<34;10;20M'))
      expect(events).toEqual([
        {
          type: 'mouse',
          action: 'drag',
          button: 'right',
          x: 9,
          y: 19,
          ctrl: false,
          alt: false,
          shift: false,
        } satisfies MouseEvent,
      ])
    })

    it('parses drag with ctrl modifier', () => {
      // button=48 = 32 (motion) + 16 (ctrl) + 0 (left)
      const events = parseInput(Buffer.from('\x1b[<48;5;5M'))
      expect(events).toEqual([
        {
          type: 'mouse',
          action: 'drag',
          button: 'left',
          x: 4,
          y: 4,
          ctrl: true,
          alt: false,
          shift: false,
        } satisfies MouseEvent,
      ])
    })

    it('parses mouse with shift modifier', () => {
      const events = parseInput(Buffer.from('\x1b[<4;10;10M'))
      expect(events).toEqual([
        {
          type: 'mouse',
          action: 'press',
          button: 'left',
          x: 9,
          y: 9,
          ctrl: false,
          alt: false,
          shift: true,
        } satisfies MouseEvent,
      ])
    })

    it('parses mouse with ctrl modifier', () => {
      const events = parseInput(Buffer.from('\x1b[<16;10;10M'))
      expect(events).toEqual([
        {
          type: 'mouse',
          action: 'press',
          button: 'left',
          x: 9,
          y: 9,
          ctrl: true,
          alt: false,
          shift: false,
        } satisfies MouseEvent,
      ])
    })

    it('parses mouse with alt modifier', () => {
      const events = parseInput(Buffer.from('\x1b[<8;10;10M'))
      expect(events).toEqual([
        {
          type: 'mouse',
          action: 'press',
          button: 'left',
          x: 9,
          y: 9,
          ctrl: false,
          alt: true,
          shift: false,
        } satisfies MouseEvent,
      ])
    })
  })

  describe('CSI u (keyboard enhancement)', () => {
    it('parses enter (CSI 13 u)', () => {
      const events = parseInput(Buffer.from('\x1b[13u'))
      expect(events).toEqual([key('return')])
    })

    it('parses shift+enter (CSI 13;2 u)', () => {
      const events = parseInput(Buffer.from('\x1b[13;2u'))
      expect(events).toEqual([key('return', {shift: true})])
    })

    it('parses alt+enter (CSI 13;3 u)', () => {
      const events = parseInput(Buffer.from('\x1b[13;3u'))
      expect(events).toEqual([key('return', {alt: true})])
    })

    it('parses ctrl+shift+enter (CSI 13;6 u)', () => {
      const events = parseInput(Buffer.from('\x1b[13;6u'))
      expect(events).toEqual([key('return', {ctrl: true, shift: true})])
    })

    it('parses escape (CSI 27 u)', () => {
      const events = parseInput(Buffer.from('\x1b[27u'))
      expect(events).toEqual([key('escape')])
    })

    it('parses tab (CSI 9 u)', () => {
      const events = parseInput(Buffer.from('\x1b[9u'))
      expect(events).toEqual([key('tab')])
    })

    it('parses shift+tab (CSI 9;2 u)', () => {
      const events = parseInput(Buffer.from('\x1b[9;2u'))
      expect(events).toEqual([key('tab', {shift: true})])
    })

    it('parses space (CSI 32 u)', () => {
      const events = parseInput(Buffer.from('\x1b[32u'))
      expect(events).toEqual([key('space')])
    })

    it('parses backspace (CSI 127 u)', () => {
      const events = parseInput(Buffer.from('\x1b[127u'))
      expect(events).toEqual([key('backspace')])
    })

    it('parses ctrl+backspace (CSI 127;5 u)', () => {
      const events = parseInput(Buffer.from('\x1b[127;5u'))
      expect(events).toEqual([key('backspace', {ctrl: true})])
    })

    it('parses letter a (CSI 97 u)', () => {
      const events = parseInput(Buffer.from('\x1b[97u'))
      expect(events).toEqual([key('a')])
    })

    it('parses shift+a (CSI 97;2 u)', () => {
      const events = parseInput(Buffer.from('\x1b[97;2u'))
      expect(events).toEqual([key('a', {shift: true})])
    })

    it('parses ctrl+a (CSI 97;5 u)', () => {
      const events = parseInput(Buffer.from('\x1b[97;5u'))
      expect(events).toEqual([key('a', {ctrl: true})])
    })

    it('parses ctrl+alt+a (CSI 97;7 u)', () => {
      const events = parseInput(Buffer.from('\x1b[97;7u'))
      expect(events).toEqual([key('a', {ctrl: true, alt: true})])
    })

    it('parses ctrl+letter via codepoint 1-26 (CSI 1 u = ctrl+a)', () => {
      const events = parseInput(Buffer.from('\x1b[1u'))
      expect(events).toEqual([key('a', {ctrl: true})])
    })

    it('parses meta modifier (CSI 97;9 u)', () => {
      const events = parseInput(Buffer.from('\x1b[97;9u'))
      expect(events).toEqual([key('a', {meta: true})])
    })
  })

  describe('bracketed paste', () => {
    it('parses paste events', () => {
      const events = parseInput(Buffer.from('\x1b[200~hello world\x1b[201~'))
      expect(events).toEqual([
        {
          type: 'paste',
          text: 'hello world',
        } satisfies PasteEvent,
      ])
    })

    it('parses paste with special characters', () => {
      const events = parseInput(Buffer.from('\x1b[200~line1\nline2\x1b[201~'))
      expect(events).toEqual([
        {
          type: 'paste',
          text: 'line1\nline2',
        } satisfies PasteEvent,
      ])
    })
  })
})
