import type {MouseButton, SystemEvent, SystemMouseEventName} from '@teaui/core'

const MOUSE_NAMES = new Set<SystemMouseEventName>([
  'mouse.move.in',
  'mouse.button.down',
  'mouse.button.up',
  'mouse.wheel.up',
  'mouse.wheel.down',
  'mouse.wheel.left',
  'mouse.wheel.right',
])
const MOUSE_BUTTONS = new Set<MouseButton>([
  'left',
  'middle',
  'right',
  'wheel',
  'unknown',
])
const MODIFIERS = ['ctrl', 'alt', 'gui', 'shift'] as const

/** Validate untrusted JSON before passing it to Screen.dispatch(). */
export function isSystemEvent(value: unknown): value is SystemEvent {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }
  const event = value as Record<string, unknown>

  switch (event.type) {
    case 'resize':
    case 'focus':
    case 'blur':
      return true
    case 'paste':
      return typeof event.text === 'string'
    case 'key':
      return (
        MODIFIERS.every(mod => typeof event[mod] === 'boolean') &&
        typeof event.char === 'string' &&
        typeof event.name === 'string' &&
        event.name.length > 0 &&
        typeof event.full === 'string' &&
        event.full.length > 0
      )
    case 'mouse':
      return (
        MODIFIERS.every(mod => typeof event[mod] === 'boolean') &&
        MOUSE_NAMES.has(event.name as SystemMouseEventName) &&
        MOUSE_BUTTONS.has(event.button as MouseButton) &&
        Number.isSafeInteger(event.x) &&
        Number.isSafeInteger(event.y)
      )
    default:
      return false
  }
}
