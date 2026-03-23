import type {
  KeyEvent as TermKeyEvent,
  MouseEvent as TermMouseEvent,
} from '@teaui/term'

import type {
  FullKeyName,
  KeyEvent,
  MouseButton,
  SystemMouseEvent,
  SystemMouseEventName,
} from './index.js'

export function translateTermKeyEvent(event: TermKeyEvent): KeyEvent {
  const name = event.key
  const ctrl = event.ctrl
  const alt = event.alt
  const meta = event.meta
  const shift = event.shift
  // Named keys (return, backspace, escape, etc.) have length > 1 and are all ASCII.
  // Single characters may have length > 1 due to surrogate pairs (emoji) or
  // combining marks — detect them by checking if it's a single code point.
  const isSingleCodePoint =
    event.key.length > 0 &&
    String.fromCodePoint(event.key.codePointAt(0)!).length === event.key.length
  const char = event.key === 'space' ? ' ' : isSingleCodePoint ? event.key : ''

  // Build "full" string: "C-A-M-S-x"
  let full = ''
  if (ctrl) full += 'C-'
  if (alt) full += 'A-'
  if (meta) full += 'M-'
  if (shift) full += 'S-'
  full += name

  return {
    type: 'key',
    char,
    name,
    ctrl,
    alt,
    meta,
    shift,
    full: full as FullKeyName,
  }
}

export function translateTermMouseEvent(
  event: TermMouseEvent,
): SystemMouseEvent | undefined {
  let name: SystemMouseEventName
  let button: MouseButton

  switch (event.action) {
    case 'press':
      name = 'mouse.button.down'
      break
    case 'release':
      name = 'mouse.button.up'
      break
    case 'move':
      name = 'mouse.move.in'
      break
    case 'drag':
      name = 'mouse.button.down'
      break
    case 'scrollUp':
      name = 'mouse.wheel.up'
      break
    case 'scrollDown':
      name = 'mouse.wheel.down'
      break
    case 'scrollLeft':
      name = 'mouse.wheel.left'
      break
    case 'scrollRight':
      name = 'mouse.wheel.right'
      break
    default:
      return undefined
  }

  switch (event.button) {
    case 'left':
      button = 'left'
      break
    case 'middle':
      button = 'middle'
      break
    case 'right':
      button = 'right'
      break
    case 'none':
      button = event.action.startsWith('scroll') ? 'wheel' : 'unknown'
      break
    default:
      button = 'unknown'
  }

  if (button === 'unknown' && name !== 'mouse.move.in') {
    return undefined
  }

  return {
    type: 'mouse',
    name,
    x: event.x,
    y: event.y,
    ctrl: event.ctrl,
    alt: event.alt,
    meta: false,
    shift: event.shift,
    button,
  }
}
