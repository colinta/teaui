/**
 * Mouse tracking example using the terminal library.
 *
 * Enters fullscreen, enables SGR mouse tracking, and draws a cursor
 * character wherever the mouse moves. All mouse events are logged to
 * mouse-events.log so you can inspect them in another terminal:
 *
 *   tail -f mouse-events.log
 *
 * Press 'q' or ctrl+c to exit.
 */

import * as fs from 'node:fs'
import {
  Terminal,
  isMouseEvent,
  isKeyEvent,
  cursorTo,
  fgColor,
  bgColor,
  resetAll,
} from '../src/index.js'

import type {MouseEvent, Color} from '../src/index.js'

// --- Log file (truncated on startup) ---
fs.writeFileSync('mouse-events.log', '')
const logFd = fs.openSync('mouse-events.log', 'w')

function log(msg: string) {
  fs.writeSync(logFd, msg + '\n')
}

// --- Terminal ---
const term = new Terminal()
const {columns: cols, rows} = term.size

// --- State ---
let prevX = -1
let prevY = -1

// Trail: store recent positions for a fading trail effect
const trail: Array<{x: number; y: number; age: number}> = []
const MAX_TRAIL = 30

// --- Enter fullscreen with mouse ---
term.enterFullscreen({mouse: true, hideCursor: true})

log(`Terminal size: ${cols}x${rows}`)
log(`Mouse tracking enabled (SGR mode)`)
log(`---`)

// Draw initial help text
function drawHelp() {
  const help =
    'Move mouse around · Click to stamp · Drag to paint · Press q to quit'
  const hx = Math.max(0, Math.floor((cols - help.length) / 2))
  term.moveTo(hx, 0).fg('brightBlack').write(help)
}

drawHelp()

// --- Drawing ---
function drawCursor(x: number, y: number, action: MouseEvent['action']) {
  if (x < 0 || y < 1 || x >= cols || y >= rows) return

  if (action === 'press' || action === 'drag') {
    // Bright stamp when clicking or dragging
    term.moveTo(x, y).bg({r: 255, g: 100, b: 50}).fg('brightWhite').write('█')
  } else {
    // Crosshair-style cursor
    term.moveTo(x, y).fg({r: 0, g: 255, b: 180}).write('╋')
  }
}

function clearCell(x: number, y: number) {
  if (x < 0 || y < 0 || x >= cols || y >= rows) return
  // Don't clear the help line
  if (y === 0) return
  term.moveTo(x, y).write(' ')
}

function drawTrail() {
  for (let i = trail.length - 1; i >= 0; i--) {
    const t = trail[i]
    t.age++
    if (t.age > MAX_TRAIL) {
      clearCell(t.x, t.y)
      trail.splice(i, 1)
      continue
    }
    // Fade from bright to dim
    const fade = 1 - t.age / MAX_TRAIL
    const g = Math.round(fade * 180)
    const b = Math.round(fade * 120)
    if (t.y > 0) {
      term.moveTo(t.x, t.y).fg({r: 0, g, b}).write('·')
    }
  }
}

// --- Input handling ---
term.onInput(event => {
  if (isMouseEvent(event)) {
    log(
      `mouse: action=${event.action} button=${event.button} pos=(${event.x},${event.y}) shift=${event.shift} alt=${event.alt} ctrl=${event.ctrl}`,
    )

    // Erase old cursor position
    if (prevX >= 0 && prevY >= 0 && (prevX !== event.x || prevY !== event.y)) {
      // Add to trail if moved
      trail.push({x: prevX, y: prevY, age: 0})
    }

    // Draw trail
    drawTrail()

    // Draw cursor at new position
    drawCursor(event.x, event.y, event.action)

    // Show coordinates and modifiers in bottom-left
    const mods: string[] = []
    if (event.ctrl) mods.push('ctrl')
    if (event.alt) mods.push('alt')
    if (event.gui) mods.push('gui')
    if (event.shift) mods.push('shift')
    const modStr = mods.length > 0 ? mods.join('+') : 'none'
    const status = `pos: (${event.x}, ${event.y})  action: ${event.action.padEnd(7)}  button: ${event.button.padEnd(6)}  mods: ${modStr.padEnd(20)}`
    term
      .moveTo(0, rows - 1)
      .fg('brightBlack')
      .write(status)

    prevX = event.x
    prevY = event.y
  }

  if (isKeyEvent(event)) {
    if (event.key === 'q' || (event.key === 'c' && event.ctrl)) {
      log('Exit')
      term.exitFullscreen()
      fs.closeSync(logFd)
      process.exit(0)
    }
  }
})

// Periodically age the trail even when not moving
setInterval(() => {
  if (trail.length > 0) {
    drawTrail()
  }
}, 50)

log('Waiting for input...')
