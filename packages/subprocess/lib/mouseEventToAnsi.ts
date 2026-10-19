import type {MouseEvent} from '@teaui/core'

/**
 * The mouse reporting mode requested by the child (DECSET 9/1000/1002/1003),
 * as reported by xterm's `terminal.modes.mouseTrackingMode`.
 */
export type MouseTrackingMode = 'none' | 'x10' | 'vt200' | 'drag' | 'any'

/**
 * Whether a mouse event should be reported to a child that requested the given
 * tracking mode. Children that haven't enabled mouse tracking (e.g. a shell)
 * would otherwise echo the escape sequences as text.
 *
 * - x10: button presses only
 * - vt200 (1000): presses, releases, and wheel
 * - drag (1002): …plus motion while a button is held
 * - any (1003): …plus all motion
 */
export function shouldReportMouse(
  event: MouseEvent,
  mode: MouseTrackingMode,
): boolean {
  const name = event.name
  switch (mode) {
    case 'none':
      return false
    case 'x10':
      return name === 'mouse.button.down'
  }

  if (name.startsWith('mouse.move.')) {
    // 'enter', 'exit' and 'below' duplicate the position of a 'mouse.move.in'
    return mode === 'any' && name === 'mouse.move.in'
  }

  if (DRAG_EVENTS.has(name)) {
    return mode === 'drag' || mode === 'any'
  }

  return true
}

/**
 * Convert a TeaUI MouseEvent to an SGR mouse escape sequence
 * for forwarding to a child PTY.
 *
 * SGR format: ESC [ < button ; x ; y M (press) or m (release)
 * x and y are 1-based.
 *
 * Button encoding:
 *   0 = left, 1 = middle, 2 = right
 *   +4 = shift, +8 = meta/alt, +16 = ctrl
 *   +32 = motion
 *   64 = scroll up, 65 = scroll down
 */
export function mouseEventToAnsi(event: MouseEvent): string {
  const name = event.name
  // x,y come from TeaUI as 0-based; SGR uses 1-based
  const x = event.position.x + 1
  const y = event.position.y + 1

  let button = 0
  let final = 'M' // press/motion

  // Determine button base value
  // In SGR encoding: 0=left, 1=middle, 2=right, 3=no button (release/move)
  switch (event.button) {
    case 'left':
      button = 0
      break
    case 'middle':
      button = 1
      break
    case 'right':
      button = 2
      break
    default:
      button = 3
      break
  }

  // Scroll wheel events
  if (name.startsWith('mouse.wheel.')) {
    if (name === 'mouse.wheel.up') {
      button = 64
    } else if (name === 'mouse.wheel.down') {
      button = 65
    } else if (name === 'mouse.wheel.left') {
      button = 66
    } else if (name === 'mouse.wheel.right') {
      button = 67
    }
    final = 'M'
  } else if (name === 'mouse.button.up' || name === 'mouse.button.cancel') {
    // Release
    final = 'm'
  } else if (
    name === 'mouse.button.dragInside' ||
    name === 'mouse.button.dragOutside'
  ) {
    // Drag events — button is held, use the actual button value
    button += 32
    final = 'M'
  } else if (
    name === 'mouse.move.in' ||
    name === 'mouse.move.enter' ||
    name === 'mouse.move.exit' ||
    name === 'mouse.move.below'
  ) {
    // Pure hover/move events — no button held
    // Base button 3 = no button in SGR encoding
    button = 3 + 32
    final = 'M'
  } else {
    // Press (down, enter while dragging)
    final = 'M'
  }

  // Add modifier bits
  if (event.shift) {
    button += 4
  }
  if (event.alt) {
    button += 8
  }
  if (event.ctrl) {
    button += 16
  }

  return `\x1b[<${button};${x};${y}${final}`
}

// Pointer motion while a button is held
const DRAG_EVENTS: ReadonlySet<MouseEvent['name']> = new Set([
  'mouse.button.dragInside',
  'mouse.button.dragOutside',
  'mouse.button.enter',
  'mouse.button.exit',
])
