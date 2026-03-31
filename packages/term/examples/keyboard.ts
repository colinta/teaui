/**
 * Keyboard event example using the terminal library.
 *
 * Enters fullscreen and displays:
 * - The most recent key event at the top of the screen
 * - A scrolling log of all key events below
 *
 * Press ctrl+c to exit.
 */

import {Terminal, isKeyEvent, isPasteEvent, isFocusEvent} from '../src/index.js'

import type {KeyEvent} from '../src/index.js'

// --- Constants ---

const HEADER_HEIGHT = 3
const SEPARATOR = '─'
const ELLIPSIS = '…'

// --- Terminal ---

const term = new Terminal()
let {columns: cols, rows} = term.size

term.onResize(size => {
  cols = size.columns
  rows = size.rows
  redraw()
})

// --- State ---

let currentKey: KeyEvent | null = null
const log: string[] = []

// --- Formatting ---

function formatKey(event: KeyEvent): string {
  const mods: string[] = []
  if (event.ctrl) mods.push('ctrl')
  if (event.alt) mods.push('alt')
  if (event.shift) mods.push('shift')
  if (event.gui) mods.push('gui')

  const keyName = event.key === ' ' ? 'space' : event.key
  if (mods.length > 0) {
    return mods.join('+') + '+' + keyName
  }
  return keyName
}

function formatKeyDetailed(event: KeyEvent): string {
  const parts = [formatKey(event)]
  const details: string[] = []
  if (event.ctrl) details.push('ctrl')
  if (event.alt) details.push('alt')
  if (event.shift) details.push('shift')
  if (event.gui) details.push('gui')
  if (details.length > 0) {
    parts.push(`[${details.join(', ')}]`)
  }
  return parts.join(' ')
}

// --- Drawing ---

function drawHeader() {
  for (let y = 0; y < HEADER_HEIGHT; y++) {
    term.moveTo(0, y).write(' '.repeat(cols))
  }

  term
    .moveTo(0, HEADER_HEIGHT - 1)
    .fg('brightBlack')
    .write(SEPARATOR.repeat(cols))

  if (currentKey) {
    const keyStr = formatKey(currentKey)
    const x = Math.max(0, Math.floor((cols - keyStr.length) / 2))
    term.moveTo(x, 0).fg('brightWhite').bold().write(keyStr)

    const detail = `key: ${JSON.stringify(currentKey.key)}  ctrl: ${currentKey.ctrl}  alt: ${currentKey.alt}  shift: ${currentKey.shift}  gui: ${currentKey.gui}`
    const dx = Math.max(0, Math.floor((cols - detail.length) / 2))
    term.moveTo(dx, 1).fg('brightBlack').write(detail)
  } else {
    const msg = 'Press any key...'
    const x = Math.max(0, Math.floor((cols - msg.length) / 2))
    term.moveTo(x, 0).fg('brightBlack').italic().write(msg)
  }
}

function drawLog() {
  const logStart = HEADER_HEIGHT
  const logHeight = rows - logStart - 1
  const visibleLines = log.slice(-logHeight)

  for (let i = 0; i < logHeight; i++) {
    term.moveTo(0, logStart + i)
    if (i < visibleLines.length) {
      const line = visibleLines[i].slice(0, cols)
      term.fg('white').write(line)
      if (line.length < cols) {
        term.write(' '.repeat(cols - line.length))
      }
    } else {
      term.write(' '.repeat(cols))
    }
  }
}

function drawFooter() {
  const footer = ' Press ctrl+c to exit '
  const x = Math.max(0, Math.floor((cols - footer.length) / 2))
  term.moveTo(0, rows - 1).write(' '.repeat(cols))
  term
    .moveTo(x, rows - 1)
    .fg('brightBlack')
    .write(footer)
}

function redraw() {
  term.clear()
  drawHeader()
  drawLog()
  drawFooter()
}

// --- Enter fullscreen ---

term.enterFullscreen({mouse: true, hideCursor: true})
term.keyboardEnhance()
redraw()

// --- Input handling ---

term.onInput(event => {
  if (isKeyEvent(event)) {
    if (event.key === 'c' && event.ctrl) {
      term.keyboardEnhanceDisable()
      term.exitFullscreen()
      process.exit(0)
    }

    currentKey = event
    log.push(formatKeyDetailed(event))
    drawHeader()
    drawLog()
  } else if (isPasteEvent(event)) {
    const preview =
      event.text.length > 40 ? event.text.slice(0, 40) + ELLIPSIS : event.text
    log.push(`paste: ${JSON.stringify(preview)}`)
    drawLog()
  } else if (isFocusEvent(event)) {
    log.push(`focus: ${event.focused ? 'gained' : 'lost'}`)
    drawLog()
  }
})
