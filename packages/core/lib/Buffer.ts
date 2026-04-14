import * as unicode from '@teaui/term'

import type {Terminal, SGRTerminal} from './terminal.js'
import type {Color} from './Color.js'
import {BG_DRAW} from './ansi.js'
import {Style} from './Style.js'
import {Size} from './geometry.js'

type Char = {char: string; width: 1 | 2; style: Style; hiding?: Char}
type PaintRect = {
  style: Style
  cell: Char
  minX: number
  minY: number
  maxX: number
  maxY: number
}

const EMPTY_CELL: Char = {char: ' ', style: Style.NONE, width: 1}

export class Buffer implements Terminal {
  size: Size = Size.zero

  #meta: string = ''
  #canvas: Map<number, Map<number, Char>> = new Map()
  #prev: Map<number, Map<number, Char>> = new Map()
  #paintRects: PaintRect[] = []
  #prevPaintRects: PaintRect[] = []
  #dirtyRows: Set<number> = new Set()
  #prevDirtyRows: Set<number> = new Set()
  #mergeCache: Map<Style, Map<Style, Style>> = new Map()

  setForeground(fg: Color): void {}
  setBackground(bg: Color): void {}

  resize(size: Size) {
    if (size.width !== this.size.width || size.height !== this.size.height) {
      this.#prev = new Map()
    }

    this.size = size
  }

  /**
   * Invalidates the diff cache so the next flush writes all cells.
   * Used by test harnesses that reset the terminal between renders.
   */
  invalidate() {
    this.#prev = new Map()
  }

  /**
   * Writes the string at the cursor from left to write. Exits on newline (no default
   * wrapping behavior).
   */
  writeChar(char: string, x: number, y: number, style: Style) {
    x = ~~x
    y = ~~y
    if (char === '\n') {
      return
    }

    const width = unicode.charWidth(char)
    if (width === 0) {
      return
    }

    if (x < 0 || x >= this.size.width || y < 0 || y >= this.size.height) {
      return
    }

    this.#dirtyRows.add(y)
    let line = this.#canvas.get(y)
    if (line) {
      const prev = line.get(x)
      if (prev?.char === BG_DRAW) {
        style = this.#mergeBackgroundStyle(style, prev.style)
      } else if (!prev) {
        const paintStyle = this.#paintStyleAt(x, y)
        if (paintStyle) {
          style = this.#mergeBackgroundStyle(style, paintStyle)
        }
      }

      const leftChar = line.get(x - 1)
      if (leftChar && leftChar.width === 2) {
        // hides a 2-width character that this character is overlapping
        line.set(x - 1, {char: ' ', width: 1, style: leftChar.style})

        // actually writes the character, and records the hidden character
        line.set(x, {char, width, style, hiding: leftChar})
        if (width === 2) {
          line.delete(x + 1)
        }

        const hiding = leftChar.hiding
        if (hiding) {
          line.set(x - 2, hiding)
        }
      } else {
        // actually writes the character
        line.set(x, {char, width, style})
        if (width === 2) {
          line.delete(x + 1)
        }

        const next = line.get(x + 1)
        if (next && next.hiding) {
          // the next character can no longer be "hiding" the previous character (this
          // character)
          line.set(x + 1, {...next, hiding: undefined})
        }
      }
    } else {
      const paintStyle = this.#paintStyleAt(x, y)
      if (paintStyle) {
        style = this.#mergeBackgroundStyle(style, paintStyle)
      }
      line = new Map([[x, {char, width, style}]])
      this.#canvas.set(y, line)
    }
  }

  /**
   * Merges foreground/background from a background style into a text style,
   * only when the text style is missing those properties. Single merge call.
   */
  #mergeBackgroundStyle(style: Style, bgStyle: Style): Style {
    const needsFg =
      style.foreground === undefined && bgStyle.foreground !== undefined
    const needsBg =
      style.background === undefined && bgStyle.background !== undefined
    if (!needsFg && !needsBg) {
      return style
    }

    // Check cache
    let bgCache = this.#mergeCache.get(bgStyle)
    if (bgCache) {
      const cached = bgCache.get(style)
      if (cached) return cached
    } else {
      bgCache = new Map()
      this.#mergeCache.set(bgStyle, bgCache)
    }

    const merged = style.merge({
      foreground: needsFg ? bgStyle.foreground : undefined,
      background: needsBg ? bgStyle.background : undefined,
    })
    bgCache.set(style, merged)
    return merged
  }

  /**
   * Fills a rectangular region with BG_DRAW cells lazily.
   * The cells are materialized during flush or when overwritten by writeChar.
   */
  paintRect(
    style: Style,
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
  ) {
    this.#paintRects.push({
      style,
      cell: {char: BG_DRAW, width: 1, style},
      minX: Math.max(0, ~~minX),
      minY: Math.max(0, ~~minY),
      maxX: Math.min(this.size.width, ~~maxX),
      maxY: Math.min(this.size.height, ~~maxY),
    })
  }

  /**
   * Returns the paint style for coordinates that fall within a paint rect,
   * checking most recent rects first.
   */
  #paintStyleAt(x: number, y: number): Style | undefined {
    for (let i = this.#paintRects.length - 1; i >= 0; i--) {
      const r = this.#paintRects[i]
      if (x >= r.minX && x < r.maxX && y >= r.minY && y < r.maxY) {
        return r.style
      }
    }
    return undefined
  }

  /**
   * Returns a pre-allocated Char for coordinates in a paint rect.
   */
  #paintCellAt(x: number, y: number): Char | undefined {
    for (let i = this.#paintRects.length - 1; i >= 0; i--) {
      const r = this.#paintRects[i]
      if (x >= r.minX && x < r.maxX && y >= r.minY && y < r.maxY) {
        return r.cell
      }
    }
    return undefined
  }

  /**
   * Replaces the style of an existing cell without changing its character.
   * If no cell exists at (x, y), writes a space with the given style.
   */
  restyleChar(x: number, y: number, style: Style) {
    x = ~~x
    y = ~~y
    if (x < 0 || x >= this.size.width || y < 0 || y >= this.size.height) {
      return
    }

    this.#dirtyRows.add(y)
    let line = this.#canvas.get(y)
    if (!line) {
      line = new Map()
      this.#canvas.set(y, line)
    }

    const existing = line.get(x)
    if (existing) {
      line.set(x, {...existing, style})
    } else {
      line.set(x, {char: ' ', width: 1, style})
    }
  }

  /**
   * For ANSI sequences that aren't related to any specific character.
   */
  writeMeta(str: string) {
    this.#meta += str
  }

  flush(terminal: SGRTerminal) {
    if (this.#meta) {
      terminal.write(this.#meta)
    }

    // Check if paint rects changed since last flush
    const paintRectsChanged = !this.#paintRectsEqual(
      this.#paintRects,
      this.#prevPaintRects,
    )

    let prevStyle = Style.NONE
    for (let y = 0; y < this.size.height; y++) {
      // Skip rows with no canvas writes (now or previously) and unchanged paint rects
      if (
        !this.#dirtyRows.has(y) &&
        !this.#prevDirtyRows.has(y) &&
        !paintRectsChanged &&
        this.#prev.has(y)
      ) {
        continue
      }

      const line = this.#canvas.get(y) ?? new Map<number, Char>()
      const prevLine = this.#prev.get(y) ?? new Map<number, Char>()
      this.#prev.set(y, prevLine)

      // Pre-compute paint rects applicable to this row
      let rowPaintCell: Char | undefined
      let rowPaintMinX = 0
      let rowPaintMaxX = 0
      for (let i = this.#paintRects.length - 1; i >= 0; i--) {
        const r = this.#paintRects[i]
        if (y >= r.minY && y < r.maxY) {
          rowPaintCell = r.cell
          rowPaintMinX = r.minX
          rowPaintMaxX = r.maxX
          break
        }
      }

      let didWrite = false
      let dx = 1
      for (let x = 0; x < this.size.width; x += dx) {
        const chrInfo =
          line.get(x) ??
          (rowPaintCell && x >= rowPaintMinX && x < rowPaintMaxX
            ? rowPaintCell
            : EMPTY_CELL)
        const prevInfo = prevLine.get(x)
        dx = chrInfo.width

        if (prevInfo && isCharEqual(chrInfo, prevInfo)) {
          didWrite = false
          continue
        }

        if (!didWrite) {
          didWrite = true
          terminal.move(x, y)
        }

        let {char, style} = chrInfo
        if (char === BG_DRAW) {
          char = ' '
        }

        if (!prevStyle.isEqual(style)) {
          terminal.write(style.toSGR(prevStyle))
          prevStyle = style
        }
        terminal.write(char)
        prevLine.set(x, chrInfo)
        if (chrInfo.width === 2) {
          prevLine.delete(x + 1)
        }
      }
    }

    if (prevStyle !== Style.NONE) {
      terminal.write('\x1b[0m')
    }
    terminal.flush()

    this.#canvas = new Map()
    this.#prevDirtyRows = this.#dirtyRows
    this.#dirtyRows = new Set()
    this.#prevPaintRects = this.#paintRects
    this.#paintRects = []
  }

  #paintRectsEqual(a: PaintRect[], b: PaintRect[]): boolean {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      const ra = a[i]
      const rb = b[i]
      if (
        ra.minX !== rb.minX ||
        ra.minY !== rb.minY ||
        ra.maxX !== rb.maxX ||
        ra.maxY !== rb.maxY ||
        !ra.style.isEqual(rb.style)
      ) {
        return false
      }
    }
    return true
  }
}

function isCharEqual(lhs: Char, rhs: Char) {
  return (
    lhs.char === rhs.char &&
    lhs.width === rhs.width &&
    lhs.style.isEqual(rhs.style)
  )
}
