import type {KeyEvent} from '@teaui/core'

/**
 * Modifier parameter for CSI sequences: 1 + bitmask
 * bit 0 = shift, bit 1 = meta/alt, bit 2 = ctrl
 */
function modifierParam(event: KeyEvent): number {
  let bits = 0
  if (event.shift) bits |= 1
  if (event.meta) bits |= 2
  if (event.ctrl) bits |= 4
  return bits === 0 ? 0 : 1 + bits
}

function csiKey(letter: string, event: KeyEvent): string {
  const mod = modifierParam(event)
  if (mod === 0) return `\x1b[${letter}`
  return `\x1b[1;${mod}${letter}`
}

function tildeKey(code: number, event: KeyEvent): string {
  const mod = modifierParam(event)
  if (mod === 0) return `\x1b[${code}~`
  return `\x1b[${code};${mod}~`
}

function ss3Key(letter: string, event: KeyEvent): string {
  const mod = modifierParam(event)
  if (mod === 0) return `\x1bO${letter}`
  // Modified F1-F4 use CSI format
  return `\x1b[1;${mod}${letter}`
}

const SPECIAL_KEYS: Record<string, (event: KeyEvent) => string> = {
  up: e => csiKey('A', e),
  down: e => csiKey('B', e),
  right: e => csiKey('C', e),
  left: e => csiKey('D', e),
  home: e => csiKey('H', e),
  end: e => csiKey('F', e),

  insert: e => tildeKey(2, e),
  delete: e => tildeKey(3, e),
  pageup: e => tildeKey(5, e),
  pageUp: e => tildeKey(5, e),
  pagedown: e => tildeKey(6, e),
  pageDown: e => tildeKey(6, e),

  f1: e => ss3Key('P', e),
  f2: e => ss3Key('Q', e),
  f3: e => ss3Key('R', e),
  f4: e => ss3Key('S', e),
  f5: e => tildeKey(15, e),
  f6: e => tildeKey(17, e),
  f7: e => tildeKey(18, e),
  f8: e => tildeKey(19, e),
  f9: e => tildeKey(20, e),
  f10: e => tildeKey(21, e),
  f11: e => tildeKey(23, e),
  f12: e => tildeKey(24, e),
}

/**
 * Convert a TeaUI KeyEvent back to the raw bytes / escape sequence
 * that a terminal would send.
 */
export function keyEventToAnsi(event: KeyEvent): string {
  // Check special keys first
  const specialHandler = SPECIAL_KEYS[event.name]
  if (specialHandler) {
    return specialHandler(event)
  }

  // Simple named keys
  switch (event.name) {
    case 'return':
    case 'enter':
      return '\r'
    case 'backspace':
      return '\x7f'
    case 'tab':
      if (event.shift) return '\x1b[Z'
      return '\t'
    case 'escape':
      return '\x1b'
    case 'space':
      if (event.ctrl) return '\x00'
      if (event.meta) return '\x1b '
      return ' '
  }

  // Ctrl+letter: a=0x01 .. z=0x1a
  if (event.ctrl && event.name.length === 1) {
    const code = event.name.toLowerCase().charCodeAt(0)
    if (code >= 0x61 && code <= 0x7a) {
      return String.fromCharCode(code - 0x60)
    }
  }

  // Meta+char: ESC prefix
  if (event.meta && event.char.length > 0) {
    return '\x1b' + event.char
  }

  // Printable character
  if (event.char.length > 0) {
    return event.char
  }

  // Fallback — try to use name as-is for single chars
  if (event.name.length === 1) {
    return event.name
  }

  return ''
}
