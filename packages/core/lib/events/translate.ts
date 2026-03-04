import type {
  KeyEvent as TermKeyEvent,
  MouseEvent as TermMouseEvent,
} from '@teaui/term'

import type {
  KeyEvent,
  MouseButton,
  SystemMouseEvent,
  SystemMouseEventName,
} from './index.js'

export function translateTermKeyEvent(event: TermKeyEvent): KeyEvent {
  const name = event.key
  const ctrl = event.ctrl
  const meta = event.alt || event.meta
  const shift = event.shift
  const char = event.key.length === 1 ? event.key : ''

  // Build "full" string like blessed: "C-M-S-x"
  let full = ''
  if (ctrl) full += 'C-'
  if (meta) full += 'M-'
  if (shift) full += 'S-'
  full += name

  return {type: 'key', char, name, ctrl, meta, shift, full}
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
    meta: event.alt || false,
    shift: event.shift,
    button,
  }
}
