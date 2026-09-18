import * as unicode from '@teaui/term'

import type {SGRTerminal} from './terminal.js'
import {Style} from './Style.js'
import {LINK_CLOSE} from './ansi.js'

interface Cell {
  char: string
  sgr: string
  linkStyle: Style
}

/**
 * A headless SGRTerminal that captures all output as an ANSI string.
 * Uses a 2D grid internally so cursor positioning is handled correctly —
 * the output contains text-style escape codes (SGR and OSC 8) and visible
 * characters, without cursor positioning sequences.
 */
export class StringTerminal implements SGRTerminal {
  cols: number
  rows: number
  #grid: Cell[][]
  #cursorX = 0
  #cursorY = 0
  #pendingSgr = ''
  #linkStyle = Style.NONE

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
        row.push({char: ' ', sgr: '', linkStyle: Style.NONE})
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
        if (char.startsWith('\x1b]8;') || char.startsWith('\x9d8;')) {
          const delta = Style.fromSGR(char, Style.NONE)
          // Keep links on every cell so overwriting the first character does
          // not erase the opening sequence for the remaining linked cells.
          this.#linkStyle = new Style({
            link: delta.link,
            linkParams: delta.linkParams,
          })
        } else {
          this.#pendingSgr += char
        }
      } else {
        if (
          this.#cursorY >= 0 &&
          this.#cursorY < this.rows &&
          this.#cursorX >= 0 &&
          this.#cursorX < this.cols
        ) {
          this.#grid[this.#cursorY][this.#cursorX] = {
            char,
            sgr: this.#pendingSgr,
            linkStyle: this.#linkStyle,
          }
          this.#pendingSgr = ''
          // Wide characters occupy 2 cells — blank out the second cell
          if (width === 2 && this.#cursorX + 1 < this.cols) {
            this.#grid[this.#cursorY][this.#cursorX + 1] = {
              char: '',
              sgr: '',
              linkStyle: this.#linkStyle,
            }
          }
        }
        this.#cursorX += Math.max(width, 1)
      }
    }
  }

  flush(): void {}

  get output(): string {
    const lines: string[] = []
    for (let y = 0; y < this.rows; y++) {
      let line = ''
      let linkStyle = Style.NONE
      for (let x = 0; x < this.cols; x++) {
        const cell = this.#grid[y][x]
        if (!cell.linkStyle.isEqual(linkStyle)) {
          line += cell.linkStyle.toSGR(linkStyle)
          linkStyle = cell.linkStyle
        }
        line += cell.sgr + cell.char
      }
      if (linkStyle.link) {
        line += LINK_CLOSE
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
    this.#linkStyle = Style.NONE
  }
}
