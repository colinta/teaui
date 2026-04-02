import * as unicode from '@teaui/term'

import type {SGRTerminal} from './terminal.js'
import {Style} from './Style.js'

interface Cell {
  char: string
  style: Style
}

/**
 * A headless SGRTerminal for testing. Stores characters and parsed Style objects
 * in a 2D grid, providing readable query methods for assertions:
 *
 *   expect(term.charAt(0, 0)).toBe('H')
 *   expect(term.styleAt(0, 0).bold).toBe(true)
 *   expect(term.textAt(0, 0, 5)).toBe('Hello')
 *   expect(term.textContent()).toContain('Hello')
 */
export class TestTerminal implements SGRTerminal {
  cols: number
  rows: number
  #grid: Cell[][]
  #cursorX = 0
  #cursorY = 0
  #pendingSgr = ''
  #currentStyle = Style.NONE

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
        row.push({char: ' ', style: Style.NONE})
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
    for (const char of unicode.printableChars(str)) {
      const width = unicode.charWidth(char)

      if (width === 0) {
        // ANSI escape sequence
        this.#pendingSgr += char
      } else {
        // Apply any pending SGR to current style
        if (this.#pendingSgr) {
          this.#currentStyle = this.#parseAccumulatedSGR(this.#pendingSgr)
          this.#pendingSgr = ''
        }

        if (
          this.#cursorY >= 0 &&
          this.#cursorY < this.rows &&
          this.#cursorX >= 0 &&
          this.#cursorX < this.cols
        ) {
          this.#grid[this.#cursorY][this.#cursorX] = {
            char,
            style: this.#currentStyle,
          }
          // Wide characters occupy 2 cells
          if (width === 2 && this.#cursorX + 1 < this.cols) {
            this.#grid[this.#cursorY][this.#cursorX + 1] = {
              char: '',
              style: this.#currentStyle,
            }
          }
        }
        this.#cursorX += Math.max(width, 1)
      }
    }
  }

  flush(): void {}

  /**
   * Parse accumulated SGR sequences into a Style.
   * Multiple SGR codes may have been concatenated (e.g. "\x1b[1m\x1b[38;5;196m").
   * A reset (\x1b[0m) clears everything.
   *
   * Note: Style.fromSGR's prevStyle param is used as the "reset target" — e.g.
   * code 22 (!bold) resets to prevStyle.bold. We pass Style.NONE so resets
   * correctly turn attributes off rather than copying the current state.
   */
  #parseAccumulatedSGR(sgr: string): Style {
    const sequences = sgr.match(/\x1b\[[\d;]*m/g) ?? []
    let style = this.#currentStyle
    for (const seq of sequences) {
      if (seq === '\x1b[0m' || seq === '\x1b[m') {
        style = Style.NONE
      } else {
        style = style.merge(Style.fromSGR(seq, Style.NONE))
      }
    }
    return style
  }

  // --- Query API for tests ---

  /**
   * Get the character at (x, y). Returns ' ' for empty cells.
   */
  charAt(x: number, y: number): string {
    if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return ''
    return this.#grid[y][x].char
  }

  /**
   * Get the Style at (x, y).
   */
  styleAt(x: number, y: number): Style {
    if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return Style.NONE
    return this.#grid[y][x].style
  }

  /**
   * Read `length` characters starting at (x, y) on the same row.
   * Skips empty cells from wide characters.
   */
  textAt(x: number, y: number, length: number): string {
    let result = ''
    let count = 0
    for (let cx = x; cx < this.cols && count < length; cx++) {
      const char = this.#grid[y]?.[cx]?.char ?? ''
      if (char === '') continue // skip wide char continuation cells
      result += char
      count++
    }
    return result
  }

  /**
   * Get all text on a row (trimmed of trailing spaces).
   */
  textAtRow(y: number): string {
    if (y < 0 || y >= this.rows) return ''
    let line = ''
    for (let x = 0; x < this.cols; x++) {
      const char = this.#grid[y][x].char
      if (char === '') continue // skip wide char continuation cells
      line += char
    }
    return line.trimEnd() // + '␤'
  }

  /**
   * Get all visible text content (rows joined by newlines, trailing spaces trimmed).
   */
  textContent(): string {
    const lines: string[] = []
    for (let y = 0; y < this.rows; y++) {
      lines.push(this.textAtRow(y))
    }
    // Trim trailing empty lines
    while (lines.length > 0 && lines[lines.length - 1] === '') {
      lines.pop()
    }
    return lines.join('\n')
  }

  /**
   * Find the first position of a substring on the screen.
   * Returns {x, y} or null if not found.
   */
  find(text: string): {x: number; y: number} | null {
    for (let y = 0; y < this.rows; y++) {
      const row = this.textAtRow(y)
      const x = row.indexOf(text)
      if (x !== -1) {
        return {x, y}
      }
    }
    return null
  }

  /**
   * Get the Style of the first character of a found substring.
   * Useful for asserting styles on specific text.
   */
  styleOf(text: string): Style | null {
    const pos = this.find(text)
    if (!pos) return null
    return this.styleAt(pos.x, pos.y)
  }

  /**
   * Get a row as a string, optionally sliced. NOT trimmed.
   * Wide char continuation cells are skipped.
   */
  getRow(y: number, from?: number, to?: number): string {
    if (y < 0 || y >= this.rows) return ''
    from ??= 0
    to ??= this.cols
    let line = ''
    for (let x = from; x < to && x < this.cols; x++) {
      const char = this.#grid[y][x].char
      if (char === '') continue
      line += char
    }
    return line
  }

  /**
   * Extract a rectangular region as a multi-line string (lines joined by \n).
   * Trailing spaces on each line are preserved. Use for exact grid assertions:
   *
   *   expect(term.textRect(0, 0, 5, 3)).toBe(
   *     '┌───┐\n' +
   *     '│   │\n' +
   *     '└───┘'
   *   )
   */
  textRect(x: number, y: number, width: number, height: number): string {
    const lines: string[] = []
    for (let row = y; row < y + height && row < this.rows; row++) {
      lines.push(this.getRow(row, x, x + width))
    }
    return lines.join('\n')
  }

  /**
   * Assert that all cells in a range satisfy a style predicate.
   * Returns true if every cell in the range matches.
   *
   *   term.stylesMatch(0, 0, 5, style => style.bold === true)
   */
  stylesMatch(
    x: number,
    y: number,
    width: number,
    predicate: (style: Style) => boolean,
    height: number = 1,
  ): boolean {
    for (let row = y; row < y + height && row < this.rows; row++) {
      for (let col = x; col < x + width && col < this.cols; col++) {
        if (!predicate(this.#grid[row][col].style)) {
          return false
        }
      }
    }
    return true
  }

  /**
   * Compare full screen content against a template string. Each line
   * of the expected string is compared against the corresponding row.
   * Trailing spaces in the template are significant — use '·' for
   * explicit space if needed.
   * Trailing empty lines in the template are not required to match.
   */
  contentEquals(expected: string): boolean {
    const expectedLines = expected.split('\n')
    for (let y = 0; y < expectedLines.length; y++) {
      const expectedLine = expectedLines[y]
      const actual = this.getRow(y, 0, expectedLine.length)
      if (actual !== expectedLine) {
        return false
      }
    }
    return true
  }

  /**
   * Like contentEquals but returns a diff-friendly string for assertion messages.
   * Use with expect().toBe() for readable failures:
   *
   *   expect(term.frameContent()).toBe(
   *     '┌───┐\n' +
   *     '│Hi │\n' +
   *     '└───┘'
   *   )
   */
  frameContent(): string {
    return this.textContent()
  }

  reset(): void {
    this.#grid = this.#createGrid()
    this.#cursorX = 0
    this.#cursorY = 0
    this.#pendingSgr = ''
    this.#currentStyle = Style.NONE
  }
}
