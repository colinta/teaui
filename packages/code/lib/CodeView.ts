import * as unicode from '@teaui/term'

import type {Viewport} from '@teaui/core'
import {View, Style, Point, Size} from '@teaui/core'
import type {ViewProps} from '@teaui/core'
import {highlight} from './highlight.js'

interface CodeProps {
  code: string
  language?: string
  showLineNumbers?: boolean
  highlightLines?: number[]
  wrap?: boolean
}

export type Props = CodeProps & ViewProps

/**
 * A view that renders syntax-highlighted code. Uses cli-highlight (highlight.js)
 * for colorization and renders the ANSI output using the core text rendering
 * pipeline.
 */
export class CodeView extends View {
  #code: string = ''
  #language: string | undefined
  #showLineNumbers: boolean = false
  #highlightLines: Set<number> = new Set()
  #wrap: boolean = false

  /**
   * Cached highlighted lines: [ansiLine, printableWidth][]
   */
  #lines: [string, number][] = []
  #gutterWidth: number = 0

  constructor(props: Props) {
    super(props)
    this.#update(props)
  }

  update(props: Props) {
    this.#update(props)
    super.update(props)
  }

  #update({code, language, showLineNumbers, highlightLines, wrap}: CodeProps) {
    const codeChanged = code !== this.#code || language !== this.#language
    this.#code = code ?? ''
    this.#language = language
    this.#showLineNumbers = showLineNumbers ?? false
    this.#highlightLines = new Set(highlightLines ?? [])
    this.#wrap = wrap ?? false

    if (codeChanged) {
      this.#highlight()
    }
  }

  #highlight() {
    if (!this.#code) {
      this.#lines = []
      this.#gutterWidth = 0
      return
    }

    let highlighted: string
    try {
      highlighted = highlight(this.#code, {
        language: this.#language,
        ignoreIllegals: true,
      })
    } catch {
      // Fall back to unhighlighted code if language detection fails
      highlighted = this.#code
    }

    const rawLines = highlighted.split('\n')
    this.#lines = rawLines.map(line => {
      const width = unicode.lineWidth(line)
      return [line, width]
    })

    this.#gutterWidth = this.#showLineNumbers
      ? String(this.#lines.length).length + 1
      : 0
  }

  naturalSize(available: Size): Size {
    if (this.#lines.length === 0) {
      return Size.zero
    }

    const gutter = this.#gutterWidth
    const contentWidth = available.width - gutter

    return this.#lines.reduce((size, [, width]) => {
      const lineWidth = width + gutter
      if (this.#wrap && contentWidth > 0) {
        const lineHeight = Math.ceil(width / contentWidth)
        size.width = Math.max(size.width, Math.min(lineWidth, available.width))
        size.height += lineHeight
      } else {
        size.width = Math.max(size.width, lineWidth)
        size.height += 1
      }
      return size
    }, Size.zero.mutableCopy())
  }

  render(viewport: Viewport) {
    if (viewport.isEmpty) {
      return
    }

    const gutter = this.#gutterWidth
    const point = new Point(0, 0).mutableCopy()

    for (let lineIndex = 0; lineIndex < this.#lines.length; lineIndex++) {
      if (point.y >= viewport.contentSize.height) {
        break
      }

      const [line] = this.#lines[lineIndex]
      const lineNumber = lineIndex + 1
      const isHighlighted = this.#highlightLines.has(lineNumber)

      // Draw highlight background for the entire line
      if (isHighlighted) {
        for (let x = 0; x < viewport.contentSize.width; x++) {
          viewport.write(' ', new Point(x, point.y), HIGHLIGHT_STYLE)
        }
      }

      // Draw line number gutter
      if (this.#showLineNumbers) {
        const numStr = String(lineNumber).padStart(gutter - 1)
        const gutterStyle = isHighlighted
          ? HIGHLIGHT_GUTTER_STYLE
          : GUTTER_STYLE
        for (let i = 0; i < numStr.length; i++) {
          viewport.write(numStr[i], new Point(i, point.y), gutterStyle)
        }
        viewport.write(GUTTER_SEP, new Point(gutter - 1, point.y), gutterStyle)
      }

      // Draw code content
      const startingStyle = isHighlighted ? HIGHLIGHT_STYLE : Style.NONE
      viewport.usingPen(startingStyle, pen => {
        let x = gutter
        for (const char of unicode.printableChars(line)) {
          const charWidth = unicode.charWidth(char)
          if (charWidth === 0) {
            pen.mergePen(Style.fromSGR(char, startingStyle))
            continue
          }

          if (this.#wrap && x >= viewport.contentSize.width) {
            x = gutter
            point.y += 1
            if (point.y >= viewport.contentSize.height) {
              return
            }
          }

          if (
            x >= viewport.visibleRect.minX() &&
            x + charWidth - 1 < viewport.visibleRect.maxX()
          ) {
            viewport.write(char, new Point(x, point.y))
          }

          x += charWidth
        }
      })

      point.y += 1
    }
  }
}

const GUTTER_SEP = '│'
const GUTTER_STYLE = new Style({dim: true})
const HIGHLIGHT_STYLE = new Style({background: 'gray'})
const HIGHLIGHT_GUTTER_STYLE = new Style({dim: true, background: 'gray'})
