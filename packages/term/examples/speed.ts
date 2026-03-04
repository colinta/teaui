/**
 * Speed test — renders full-screen frames as fast as possible.
 *
 * Fills every cell with a character, cycling colors each frame.
 * Displays FPS counter in top-left corner.
 *
 * Press 'q' or ctrl+c to exit.
 * Press 's' to toggle synchronized output.
 * Press 'c' to toggle color mode (mono / named / rgb).
 */

import {
  Terminal,
  syncStart,
  syncEnd,
  isKeyEvent,
  cursorTo,
  fgColor,
  resetAll,
  textAttr,
} from '../src/index.js'

const term = new Terminal()
const { columns: cols, rows } = term.size

let running = true
let useSync = true
let colorMode: 'mono' | 'named' | 'rgb' = 'rgb'
let frame = 0
let lastFpsTime = performance.now()
let lastFpsFrame = 0
let fps = 0

const stdout = process.stdout

// Pre-allocate a buffer we reuse each frame
const chars = '░▒▓█▀▄▌▐●◆◇○◎★☆'

function renderFrame() {
  const buf: string[] = []

  if (useSync) buf.push(syncStart())

  const namedColors = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'] as const

  for (let y = 0; y < rows; y++) {
    // Move cursor to start of row
    buf.push(cursorTo(0, y))

    for (let x = 0; x < cols; x++) {
      const ci = (x + y + frame) % chars.length
      const ch = chars[ci]

      if (colorMode === 'rgb') {
        // Cycle hue across the screen
        const hue = ((x + y + frame) * 3) % 360
        buf.push(fgColor({h: hue, s: 80, l: 50}) + ch)
      } else if (colorMode === 'named') {
        const color = namedColors[(x + y + frame) % 7]
        buf.push(fgColor(color) + ch)
      } else {
        buf.push(ch)
      }
    }
  }

  // Reset color
  buf.push(resetAll())

  // FPS overlay in top-left
  const fpsText = ` FPS: ${fps} | frame: ${frame} | sync: ${useSync ? 'ON' : 'OFF'} | color: ${colorMode} | q=quit s=sync c=color `
  buf.push(cursorTo(0, 0) + textAttr('inverse') + fpsText + resetAll())

  if (useSync) buf.push(syncEnd())

  stdout.write(buf.join(''))
}

// Enter fullscreen
term.enterFullscreen({ hideCursor: true, mouse: false })

// Handle input
const unsub = term.onInput((event) => {
  if (!isKeyEvent(event)) return
  if (event.key === 'q' || (event.key === 'c' && event.ctrl)) {
    running = false
  } else if (event.key === 's') {
    useSync = !useSync
  } else if (event.key === 'c') {
    if (colorMode === 'mono') colorMode = 'named'
    else if (colorMode === 'named') colorMode = 'rgb'
    else colorMode = 'mono'
  }
})

function loop() {
  if (!running) {
    unsub()
    term.exitFullscreen()
    console.log(`Rendered ${frame} frames. Final FPS: ${fps}`)
    process.exit(0)
  }

  renderFrame()
  frame++

  // Calculate FPS every second
  const now = performance.now()
  const elapsed = now - lastFpsTime
  if (elapsed >= 1000) {
    fps = Math.round(((frame - lastFpsFrame) / elapsed) * 1000)
    lastFpsFrame = frame
    lastFpsTime = now
  }

  setImmediate(loop)
}

loop()
