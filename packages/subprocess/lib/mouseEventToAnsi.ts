import type {MouseEvent} from '@teaui/core'

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
      button = 0
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
    name === 'mouse.button.dragOutside' ||
    name === 'mouse.move.in' ||
    name === 'mouse.move.enter' ||
    name === 'mouse.move.exit' ||
    name === 'mouse.move.below'
  ) {
    // Motion events
    button += 32
    final = 'M'
  } else {
    // Press (down, enter while dragging)
    final = 'M'
  }

  // Add modifier bits
  if (event.shift) button += 4
  if (event.meta) button += 8
  if (event.ctrl) button += 16

  return `\x1b[<${button};${x};${y}${final}`
}
