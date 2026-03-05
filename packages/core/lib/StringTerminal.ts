import * as unicode from '@teaui/term'

import type {SGRTerminal} from './terminal.js'

interface Cell {
  char: string
  sgr: string
}

/**
 * A headless SGRTerminal that captures all output as an ANSI string.
 * Uses a 2D grid internally so cursor positioning is handled correctly —
 * the output contains only SGR escape codes and visible characters
 * (no cursor positioning sequences), making it compatible with ansi-to-html.
 */
export class StringTerminal implements SGRTerminal {
  cols: number
  rows: number
  #grid: Cell[][]
  #cursorX = 0
  #cursorY = 0
  #pendingSgr = ''

  constructor({cols, rows}: {cols: number; rows: number}) {
    this.cols = cols
    this.rows = rows
    this.#grid = this.#createGrid()
  }

  #createGrid(): Cell[][] {
    const grid: Cell[][] = []
    for (let y = 0; y < this.rows; y++) {
      const row: Cell[] = []
      for (let x = 0; x < this.cols; x++) {
        row.push({char: ' ', sgr: ''})
      }
      grid.push(row)
    }
    return grid
  }

  move(x: number, y: number): void {
    this.#cursorX = x
    this.#cursorY = y
  }

  write(str: string): void {
    // Parse the string: separate ANSI escape sequences from visible characters
    let i = 0
    while (i < str.length) {
      if (str[i] === '\x1b' && i + 1 < str.length && str[i + 1] === '[') {
        // ANSI escape sequence — find the end (letter character)
        let j = i + 2
        while (j < str.length && !isAnsiTerminator(str[j])) {
          j++
        }
        if (j < str.length) {
          j++ // include the terminator
        }
        this.#pendingSgr += str.slice(i, j)
        i = j
      } else {
        // Visible character — may be multi-code-unit (emoji, CJK)
        const codePoint = str.codePointAt(i)!
        const char = String.fromCodePoint(codePoint)
        const width = unicode.charWidth(char)
        if (
          this.#cursorY >= 0 &&
          this.#cursorY < this.rows &&
          this.#cursorX >= 0 &&
          this.#cursorX < this.cols
        ) {
          this.#grid[this.#cursorY][this.#cursorX] = {
            char,
            sgr: this.#pendingSgr,
          }
          this.#pendingSgr = ''
          // Wide characters occupy 2 cells — blank out the second cell
          if (width === 2 && this.#cursorX + 1 < this.cols) {
            this.#grid[this.#cursorY][this.#cursorX + 1] = {char: '', sgr: ''}
          }
        }
        this.#cursorX += Math.max(width, 1)
        i += char.length
      }
    }
  }

  flush(): void {}

  get output(): string {
    const lines: string[] = []
    for (let y = 0; y < this.rows; y++) {
      let line = ''
      for (let x = 0; x < this.cols; x++) {
        const cell = this.#grid[y][x]
        line += cell.sgr + cell.char
      }
      lines.push(line)
    }
    return lines.join('\n') + '\x1b[0m'
  }

  reset(): void {
    this.#grid = this.#createGrid()
    this.#cursorX = 0
    this.#cursorY = 0
    this.#pendingSgr = ''
  }
}

function isAnsiTerminator(ch: string): boolean {
  const code = ch.charCodeAt(0)
  // ANSI sequence terminators are letters (A-Z, a-z)
  return (code >= 65 && code <= 90) || (code >= 97 && code <= 122)
}
