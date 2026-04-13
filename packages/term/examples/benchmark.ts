/**
 * Buffer benchmark — compares direct-write vs buffered rendering.
 *
 * Draws a grid of 5×5 character blocks that stay the same each frame.
 * First runs without buffering (rewrites everything every frame),
 * then with buffering (flush diffs and skips unchanged cells).
 *
 * The buffered pass should be significantly faster since the content
 * is static and the diff produces almost no output after the first frame.
 */

import {
  Terminal,
  cursorTo,
  fgColor,
  resetAll,
  syncStart,
  syncEnd,
} from '../src/index.js'

const stdout = process.stdout
const BLOCK_SIZE = 5
const FRAMES = 500

// Colors for the blocks (cycling palette)
const palette = [
  {r: 220, g: 50, b: 50},
  {r: 50, g: 180, b: 50},
  {r: 50, g: 100, b: 220},
  {r: 220, g: 180, b: 30},
  {r: 180, g: 50, b: 200},
  {r: 50, g: 200, b: 200},
]

function runDirect(cols: number, rows: number): number {
  const blocksX = Math.floor(cols / BLOCK_SIZE)
  const blocksY = Math.floor(rows / BLOCK_SIZE)

  const start = performance.now()

  for (let frame = 0; frame < FRAMES; frame++) {
    const buf: string[] = [syncStart()]

    for (let by = 0; by < blocksY; by++) {
      for (let bx = 0; bx < blocksX; bx++) {
        const colorIdx = (bx + by) % palette.length
        const c = palette[colorIdx]
        const style = fgColor(c)

        for (let dy = 0; dy < BLOCK_SIZE; dy++) {
          const y = by * BLOCK_SIZE + dy
          const x = bx * BLOCK_SIZE
          buf.push(cursorTo(x, y) + style + '█'.repeat(BLOCK_SIZE))
        }
      }
    }

    buf.push(resetAll() + syncEnd())
    stdout.write(buf.join(''))
  }

  return performance.now() - start
}

function runBuffered(cols: number, rows: number): number {
  const term = new Terminal({buffer: true})
  const blocksX = Math.floor(cols / BLOCK_SIZE)
  const blocksY = Math.floor(rows / BLOCK_SIZE)

  const start = performance.now()

  for (let frame = 0; frame < FRAMES; frame++) {
    // Draw the same blocks every frame — buffer diffing should skip
    // everything after the first frame.
    for (let by = 0; by < blocksY; by++) {
      for (let bx = 0; bx < blocksX; bx++) {
        const colorIdx = (bx + by) % palette.length
        const c = palette[colorIdx]

        for (let dy = 0; dy < BLOCK_SIZE; dy++) {
          const y = by * BLOCK_SIZE + dy
          const x = bx * BLOCK_SIZE
          term.moveTo(x, y).fg(c).write('█'.repeat(BLOCK_SIZE))
        }
      }
    }

    term.flush()
  }

  return performance.now() - start
}

// --- Main ---

const directTerm = new Terminal()
directTerm.enterFullscreen({hideCursor: true})

const {columns: cols, rows} = directTerm.size

// Warm up
stdout.write(syncStart() + syncEnd())

// Run direct
const directMs = runDirect(cols, rows)

// Clear screen between runs
stdout.write(syncStart() + cursorTo(0, 0))
for (let y = 0; y < rows; y++) {
  stdout.write(cursorTo(0, y) + ' '.repeat(cols))
}
stdout.write(syncEnd())

// Small pause to let terminal settle, then run buffered
setTimeout(() => {
  const bufferedMs = runBuffered(cols, rows)

  directTerm.exitFullscreen()

  // --- Results ---
  const directFps = Math.round((FRAMES / directMs) * 1000)
  const bufferedFps = Math.round((FRAMES / bufferedMs) * 1000)
  const speedup = (directMs / bufferedMs).toFixed(1)

  console.info(
    `\nBuffer Benchmark — ${FRAMES} frames, ${cols}×${rows} terminal`,
  )
  console.info(`${'─'.repeat(50)}`)
  console.info(`  Block size:  ${BLOCK_SIZE}×${BLOCK_SIZE}`)
  console.info(
    `  Grid:        ${Math.floor(cols / BLOCK_SIZE)}×${Math.floor(rows / BLOCK_SIZE)} blocks`,
  )
  console.info(`  Cells/frame: ${cols * rows}`)
  console.info()
  console.info(`  Direct:      ${directMs.toFixed(1)}ms  (${directFps} fps)`)
  console.info(
    `  Buffered:    ${bufferedMs.toFixed(1)}ms  (${bufferedFps} fps)`,
  )
  console.info(`  Speedup:     ${speedup}×`)
  console.info()
}, 100)
