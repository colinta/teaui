import {describe, it, expect} from 'vitest'
import {keyEventToAnsi} from '../lib/keyEventToAnsi.js'
import type {KeyEvent} from '@teaui/core'

function key(
  name: string,
  opts: {char?: string; ctrl?: boolean; meta?: boolean; shift?: boolean} = {},
): KeyEvent {
  const char = opts.char ?? (name.length === 1 ? name : '')
  const ctrl = opts.ctrl ?? false
  const meta = opts.meta ?? false
  const shift = opts.shift ?? false
  let full = ''
  if (ctrl) full += 'C-'
  if (meta) full += 'M-'
  if (shift) full += 'S-'
  full += name
  return {type: 'key', name, char, ctrl, meta, shift, full}
}

describe('keyEventToAnsi', () => {
  describe('printable characters', () => {
    it('single letter', () => {
      expect(keyEventToAnsi(key('a'))).toBe('a')
    })

    it('uppercase letter', () => {
      expect(keyEventToAnsi(key('A', {char: 'A'}))).toBe('A')
    })

    it('number', () => {
      expect(keyEventToAnsi(key('5', {char: '5'}))).toBe('5')
    })

    it('symbol', () => {
      expect(keyEventToAnsi(key('!', {char: '!'}))).toBe('!')
    })

    it('unicode character', () => {
      expect(keyEventToAnsi(key('é', {char: 'é'}))).toBe('é')
    })
  })

  describe('simple named keys', () => {
    it('return/enter → \\r', () => {
      expect(keyEventToAnsi(key('return', {char: ''}))).toBe('\r')
      expect(keyEventToAnsi(key('enter', {char: ''}))).toBe('\r')
    })

    it('backspace → \\x7f', () => {
      expect(keyEventToAnsi(key('backspace', {char: ''}))).toBe('\x7f')
    })

    it('tab → \\t', () => {
      expect(keyEventToAnsi(key('tab', {char: ''}))).toBe('\t')
    })

    it('shift+tab → CSI Z', () => {
      expect(keyEventToAnsi(key('tab', {char: '', shift: true}))).toBe(
        '\x1b[Z',
      )
    })

    it('escape → \\x1b', () => {
      expect(keyEventToAnsi(key('escape', {char: ''}))).toBe('\x1b')
    })

    it('space → " "', () => {
      expect(keyEventToAnsi(key('space', {char: ' '}))).toBe(' ')
    })
  })

  describe('ctrl+letter', () => {
    it('ctrl+a → 0x01', () => {
      expect(keyEventToAnsi(key('a', {char: 'a', ctrl: true}))).toBe('\x01')
    })

    it('ctrl+c → 0x03', () => {
      expect(keyEventToAnsi(key('c', {char: 'c', ctrl: true}))).toBe('\x03')
    })

    it('ctrl+z → 0x1a', () => {
      expect(keyEventToAnsi(key('z', {char: 'z', ctrl: true}))).toBe('\x1a')
    })
  })

  describe('meta+key', () => {
    it('meta+f → ESC f', () => {
      expect(keyEventToAnsi(key('f', {char: 'f', meta: true}))).toBe('\x1bf')
    })

    it('meta+b → ESC b', () => {
      expect(keyEventToAnsi(key('b', {char: 'b', meta: true}))).toBe('\x1bb')
    })

    it('meta+space → ESC space', () => {
      expect(keyEventToAnsi(key('space', {char: ' ', meta: true}))).toBe(
        '\x1b ',
      )
    })
  })

  describe('arrow keys', () => {
    it('up → CSI A', () => {
      expect(keyEventToAnsi(key('up', {char: ''}))).toBe('\x1b[A')
    })

    it('down → CSI B', () => {
      expect(keyEventToAnsi(key('down', {char: ''}))).toBe('\x1b[B')
    })

    it('right → CSI C', () => {
      expect(keyEventToAnsi(key('right', {char: ''}))).toBe('\x1b[C')
    })

    it('left → CSI D', () => {
      expect(keyEventToAnsi(key('left', {char: ''}))).toBe('\x1b[D')
    })

    it('shift+up → CSI 1;2 A', () => {
      expect(keyEventToAnsi(key('up', {char: '', shift: true}))).toBe(
        '\x1b[1;2A',
      )
    })

    it('ctrl+up → CSI 1;5 A', () => {
      expect(keyEventToAnsi(key('up', {char: '', ctrl: true}))).toBe(
        '\x1b[1;5A',
      )
    })

    it('meta+up → CSI 1;3 A', () => {
      expect(keyEventToAnsi(key('up', {char: '', meta: true}))).toBe(
        '\x1b[1;3A',
      )
    })

    it('ctrl+shift+right → CSI 1;6 C', () => {
      expect(
        keyEventToAnsi(key('right', {char: '', ctrl: true, shift: true})),
      ).toBe('\x1b[1;6C')
    })
  })

  describe('navigation keys', () => {
    it('home → CSI H', () => {
      expect(keyEventToAnsi(key('home', {char: ''}))).toBe('\x1b[H')
    })

    it('end → CSI F', () => {
      expect(keyEventToAnsi(key('end', {char: ''}))).toBe('\x1b[F')
    })

    it('insert → CSI 2~', () => {
      expect(keyEventToAnsi(key('insert', {char: ''}))).toBe('\x1b[2~')
    })

    it('delete → CSI 3~', () => {
      expect(keyEventToAnsi(key('delete', {char: ''}))).toBe('\x1b[3~')
    })

    it('pageup → CSI 5~', () => {
      expect(keyEventToAnsi(key('pageup', {char: ''}))).toBe('\x1b[5~')
    })

    it('pageUp → CSI 5~', () => {
      expect(keyEventToAnsi(key('pageUp', {char: ''}))).toBe('\x1b[5~')
    })

    it('pagedown → CSI 6~', () => {
      expect(keyEventToAnsi(key('pagedown', {char: ''}))).toBe('\x1b[6~')
    })
  })

  describe('function keys', () => {
    it('f1 → SS3 P', () => {
      expect(keyEventToAnsi(key('f1', {char: ''}))).toBe('\x1bOP')
    })

    it('f2 → SS3 Q', () => {
      expect(keyEventToAnsi(key('f2', {char: ''}))).toBe('\x1bOQ')
    })

    it('f3 → SS3 R', () => {
      expect(keyEventToAnsi(key('f3', {char: ''}))).toBe('\x1bOR')
    })

    it('f4 → SS3 S', () => {
      expect(keyEventToAnsi(key('f4', {char: ''}))).toBe('\x1bOS')
    })

    it('f5 → CSI 15~', () => {
      expect(keyEventToAnsi(key('f5', {char: ''}))).toBe('\x1b[15~')
    })

    it('f6 → CSI 17~', () => {
      expect(keyEventToAnsi(key('f6', {char: ''}))).toBe('\x1b[17~')
    })

    it('f7 → CSI 18~', () => {
      expect(keyEventToAnsi(key('f7', {char: ''}))).toBe('\x1b[18~')
    })

    it('f8 → CSI 19~', () => {
      expect(keyEventToAnsi(key('f8', {char: ''}))).toBe('\x1b[19~')
    })

    it('f9 → CSI 20~', () => {
      expect(keyEventToAnsi(key('f9', {char: ''}))).toBe('\x1b[20~')
    })

    it('f10 → CSI 21~', () => {
      expect(keyEventToAnsi(key('f10', {char: ''}))).toBe('\x1b[21~')
    })

    it('f11 → CSI 23~', () => {
      expect(keyEventToAnsi(key('f11', {char: ''}))).toBe('\x1b[23~')
    })

    it('f12 → CSI 24~', () => {
      expect(keyEventToAnsi(key('f12', {char: ''}))).toBe('\x1b[24~')
    })

    it('shift+f1 → CSI 1;2 P', () => {
      expect(keyEventToAnsi(key('f1', {char: '', shift: true}))).toBe(
        '\x1b[1;2P',
      )
    })

    it('ctrl+f5 → CSI 15;5~', () => {
      expect(keyEventToAnsi(key('f5', {char: '', ctrl: true}))).toBe(
        '\x1b[15;5~',
      )
    })
  })

  describe('round-trip with input parser', () => {
    // These verify that keyEventToAnsi produces the same bytes
    // that input.ts would parse back to the same key name
    it('all ctrl letters produce correct byte', () => {
      for (let i = 0; i < 26; i++) {
        const letter = String.fromCharCode(97 + i)
        const result = keyEventToAnsi(key(letter, {char: letter, ctrl: true}))
        expect(result.charCodeAt(0)).toBe(i + 1)
        expect(result.length).toBe(1)
      }
    })
  })
})
