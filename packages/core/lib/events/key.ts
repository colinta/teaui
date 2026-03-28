import {underline} from '../ansi.js'
import type {KeyName, NamedKey, Printable} from '@teaui/term'

/**
 * Modifier prefix combinations, always in the order C- A- M- S-.
 */
type ModifierPrefix =
  | ''
  | 'C-'
  | 'A-'
  | 'M-'
  | 'S-'
  | 'C-A-'
  | 'C-M-'
  | 'C-S-'
  | 'A-M-'
  | 'A-S-'
  | 'M-S-'
  | 'C-A-M-'
  | 'C-A-S-'
  | 'C-M-S-'
  | 'A-M-S-'
  | 'C-A-M-S-'

/**
 * A key name with optional modifier prefixes, e.g. "C-a", "M-backspace", "C-M-S-up".
 * Provides autocomplete for known key+modifier combos while accepting any string.
 */
export type FullKeyName =
  | `${ModifierPrefix}${NamedKey | Printable}`
  | (string & {})

export interface KeyEvent {
  type: 'key'
  /**
   * "Probably" the letter (a-z, etc) that was pressed. Blank (or nonsensical) for meta characters (escape, arrow keys, etc)
   */
  char: string
  /**
   * Named key, like "enter", "a", "escape", etc, or the printable character
   */
  name: KeyName
  ctrl: boolean
  alt: boolean
  meta: boolean
  shift: boolean
  /**
   * The letter that was pressed, *plus* the modifiers (C-M-S- for control- meta- shift, always in that order)
   */
  full: FullKeyName
}
export type HotKeyDef = {
  char: string
  ctrl?: boolean
  alt?: boolean
  meta?: boolean
  shift?: boolean
}
export type HotKey = FullKeyName | HotKeyDef

export function toHotKeyDef(hotKey: HotKey) {
  if (typeof hotKey !== 'string') {
    return hotKey
  }

  // hotkey string supports:
  // C- control
  // A- alt
  // M- meta
  // S- shift
  const ctrl = hotKey.includes('C-')
  const alt = hotKey.includes('A-')
  const meta = hotKey.includes('M-')
  const shift = hotKey.includes('S-')
  const char = mapKey(hotKey.replace(/^([CAMS]-)*/, '').toLowerCase())
  return {char, ctrl, alt, meta, shift}
}

/**
 * Maps a key name to its sigil representation.
 */
const KEY_SIGILS: Record<string, string> = {
  enter: '⤦',
  return: '⤦',
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
  cmd: '⌘',
  command: '⌘',
  ctrl: '⌃',
  control: '⌃',
  alt: '⌥',
  option: '⌥',
  opt: '⌥',
  shift: '⇧',
  escape: '␛',
  esc: '␛',
  tab: '⇥',
  space: '␣',
  backspace: '⌫',
  delete: '⌦',
}

export function mapKey(key: string): string {
  return KEY_SIGILS[key.toLowerCase()] ?? key
}

export function isKeyPrintable(event: KeyEvent) {
  switch (event.name) {
    case 'up':
    case 'down':
    case 'left':
    case 'right':
    case 'pageup':
    case 'pagedown':
    case 'home':
    case 'end':
    case 'insert':
    case 'clear':
    case 'enter':
    case 'return':
    case 'escape':
    case 'tab':
    case 'delete':
    case 'backspace':
    case 'f1':
    case 'f2':
    case 'f3':
    case 'f4':
    case 'f5':
    case 'f6':
    case 'f7':
    case 'f8':
    case 'f9':
    case 'f10':
    case 'f11':
    case 'f12':
      return false
  }
  if ((event.char.codePointAt(0) ?? 0) < 32) {
    return false
  }
  return true
}

export const match = (key: HotKeyDef, event: KeyEvent) => {
  if ((key.ctrl ?? false) !== event.ctrl) {
    return false
  }
  if ((key.alt ?? false) !== event.alt) {
    return false
  }
  if ((key.meta ?? false) !== event.meta) {
    return false
  }
  if ((key.shift ?? false) !== event.shift) {
    return false
  }

  return key.char === event.name
}

export function styleTextForHotKey(text: string, key_: HotKey) {
  const key = toHotKeyDef(key_)
  const alt = '⌥'
  const shift = '⇧'
  const ctrl = '⌃'
  let mod = ''

  if (key.ctrl) {
    mod += ctrl
  }

  if (key.alt) {
    mod += alt
  }

  if (key.meta) {
    mod += '⌘'
  }

  if (key.shift) {
    mod += shift
  }

  if (!mod && text) {
    return text
  }

  mod = underline(mod + key.char)

  if (!text) {
    return mod
  }

  return `${text} ${mod}`
}
