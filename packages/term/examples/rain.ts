/**
 * Matrix rain — a classic digital rain effect rendered at max speed.
 *
 * Each column has a falling "stream" of random characters.
 * Demonstrates raw ANSI output performance with truecolor gradients.
 *
 * Press 'q' or ctrl+c to exit.
 */

import {
  Terminal,
  syncStart,
  syncEnd,
  isKeyEvent,
  cursorTo,
  fgColor,
  eraseChars,
  resetAll,
  textAttr,
  setTitle,
} from '../src/index.js'

const term = new Terminal()
const {columns: cols, rows} = term.size
const stdout = process.stdout

let running = true
let frame = 0
let lastFpsTime = performance.now()
let lastFpsFrame = 0
let fps = 0

// Katakana-inspired chars + digits
const glyphs =
  'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'

// Per-column state
interface Stream {
  y: number // head position
  speed: number // cells per frame
  length: number // trail length
  accum: number // sub-cell accumulator
}

const streams: Stream[] = []
for (let x = 0; x < cols; x++) {
  streams.push(newStream())
}

function newStream(): Stream {
  return {
    y: -Math.floor(Math.random() * rows),
    speed: 0.3 + Math.random() * 1.2,
    length: 5 + Math.floor(Math.random() * (rows * 0.6)),
    accum: 0,
  }
}

// Pre-build the screen buffer as a 2D grid
const grid: string[][] = Array.from({length: rows}, () =>
  Array.from({length: cols}, () => ' '),
)
const brightness: number[][] = Array.from({length: rows}, () =>
  Array.from({length: cols}, () => 0),
)

function renderFrame() {
  // Update streams
  for (let x = 0; x < cols; x++) {
    const s = streams[x]
    s.accum += s.speed
    while (s.accum >= 1) {
      s.y++
      s.accum -= 1
    }

    // Reset if fully off screen
    if (s.y - s.length > rows) {
      streams[x] = newStream()
      streams[x].y = -Math.floor(Math.random() * 10)
    }

    // Write into grid
    for (let y = 0; y < rows; y++) {
      const dist = s.y - y
      if (dist >= 0 && dist < s.length) {
        const intensity = 1 - dist / s.length
        brightness[y][x] = intensity
        if (dist === 0 || Math.random() < 0.03) {
          // New glyph at head or random flicker
          grid[y][x] = glyphs[Math.floor(Math.random() * glyphs.length)]
        }
      } else {
        brightness[y][x] = Math.max(0, brightness[y][x] - 0.08)
      }
    }
  }

  // Render
  const buf: string[] = [syncStart()]

  for (let y = 0; y < rows; y++) {
    buf.push(cursorTo(0, y))
    for (let x = 0; x < cols; x++) {
      const b = brightness[y][x]
      if (b < 0.01) {
        buf.push(eraseChars(1) + ' ')
      } else {
        const g = Math.round(b * 255)
        const r = Math.round(b * 40)
        const bl = Math.round(b * 20)
        // Head of stream is white-green
        const s = streams[x]
        if (s.y === y) {
          buf.push(fgColor({r: 220, g: 255, b: 220}) + grid[y][x])
        } else {
          buf.push(fgColor({r, g, b: bl}) + grid[y][x])
        }
      }
    }
  }

  // FPS
  buf.push(
    resetAll() +
      cursorTo(0, 0) +
      textAttr('inverse') +
      ` FPS: ${fps} ` +
      resetAll(),
  )
  buf.push(syncEnd())

  stdout.write(buf.join(''))
}

// Enter fullscreen
term.enterFullscreen({hideCursor: true})
stdout.write(setTitle('Matrix Rain'))

term.onInput(event => {
  if (
    isKeyEvent(event) &&
    (event.key === 'q' || (event.key === 'c' && event.ctrl))
  ) {
    running = false
  }
})

function loop() {
  if (!running) {
    term.exitFullscreen()
    console.info(`Rendered ${frame} frames. Final FPS: ${fps}`)
    process.exit(0)
  }

  renderFrame()
  frame++

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
