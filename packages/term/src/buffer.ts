import {cursorTo, resetAll} from './ansi.js'
import {syncStart, syncEnd} from './modern.js'
import {charWidth, isAnnoyingWidth, printableChars} from './unicode.js'

export interface Cell {
  char: string
  width: 1 | 2
  style: string
}

const EMPTY_CHAR = ' '
const EMPTY_STYLE = ''

export class ScreenBuffer {
  private width: number
  private height: number
  private front: Cell[][]
  private back: Cell[][]
  private _cursorX: number = 0
  private _cursorY: number = 0

  get cursorX(): number {
    return this._cursorX
  }

  get cursorY(): number {
    return this._cursorY
  }

  constructor(width: number, height: number) {
    this.width = width
    this.height = height
    this.front = this.createGrid()
    this.back = this.createGrid()
  }

  private createGrid(): Cell[][] {
    return Array.from({length: this.height}, () =>
      Array.from({length: this.width}, () => ({
        char: EMPTY_CHAR,
        width: 1,
        style: EMPTY_STYLE,
      })),
    )
  }

  moveTo(x: number, y: number): void {
    this._cursorX = x
    this._cursorY = y
  }

  write(text: string, style: string): void {
    for (const char of printableChars(text)) {
      if (char === '\n') {
        this._cursorX = 0
        this._cursorY++
        continue
      }

      const width = charWidth(char)
      if (width === 0) {
        continue
      }

      if (
        this._cursorX >= 0 &&
        this._cursorX < this.width &&
        this._cursorY >= 0 &&
        this._cursorY < this.height
      ) {
        this.back[this._cursorY][this._cursorX] = {char, width, style}
        if (width === 2 && this._cursorX + 1 < this.width) {
          this.back[this._cursorY][this._cursorX + 1] = {
            char: '',
            width: 1,
            style,
          }
        }
      }
      this._cursorX += width
    }
  }

  clear(): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.back[y][x] = {char: EMPTY_CHAR, width: 1, style: EMPTY_STYLE}
      }
    }
    this._cursorX = 0
    this._cursorY = 0
  }

  resize(width: number, height: number): void {
    this.width = width
    this.height = height
    this.front = this.createGrid()
    this.back = this.createGrid()
    this._cursorX = 0
    this._cursorY = 0
  }

  /**
   * Diff the back buffer against the front buffer and write only
   * the changed cells to output. Uses synchronized output to prevent
   * tearing. After flush, the front buffer matches the back buffer.
   */
  flush(output: (s: string) => void): void {
    const parts: string[] = []
    let currentStyle: string | null = null

    for (let y = 0; y < this.height; y++) {
      let consecutive = false

      for (let x = 0; x < this.width; x++) {
        const f = this.front[y][x]
        const b = this.back[y][x]

        if (f.char === b.char && f.width === b.width && f.style === b.style) {
          consecutive = false
          continue
        }

        // Dirty cell — position cursor if not consecutive
        if (!consecutive) {
          parts.push(cursorTo(x, y))
        }
        consecutive = true

        // Emit style change if needed
        if (b.style !== currentStyle) {
          if (currentStyle !== null && currentStyle !== EMPTY_STYLE) {
            parts.push(resetAll())
          }
          if (b.style !== EMPTY_STYLE) {
            parts.push(b.style)
          }
          currentStyle = b.style
        }

        parts.push(b.char)
        if (isAnnoyingWidth(b.char) && x + b.width < this.width) {
          parts.push(cursorTo(x + b.width, y))
        }

        // Sync front to back
        this.front[y][x] = {char: b.char, width: b.width, style: b.style}
      }
    }

    if (parts.length > 0) {
      if (currentStyle !== null && currentStyle !== EMPTY_STYLE) {
        parts.push(resetAll())
      }
      output(syncStart() + parts.join('') + syncEnd())
    }
  }
}
