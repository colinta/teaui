import * as unicode from '@teaui/term'

import type {Viewport} from '../Viewport.js'
import type {Props as ViewProps} from '../View.js'
import {View} from '../View.js'
import {Style} from '../Style.js'
import {Point, Size} from '../geometry.js'
import {type TextAlignment, FontFamily} from '../types.js'
import {FONTS} from './fonts.js'
import {define, wrap} from '../util.js'

interface TextProps {
  text?: string
  lines?: undefined
}

interface LinesProps {
  text?: undefined
  lines: string[]
}

interface StyleProps {
  style?: Style
  alignment: TextAlignment
  wrap: boolean
  /**
   * When a line is wider than the content (and `wrap` is false), end it with
   * an ellipsis instead of clipping it.
   */
  ellipsis: boolean
  font?: FontFamily
}

type Props = Partial<StyleProps> & (TextProps | LinesProps) & ViewProps

const DEFAULTS = {
  alignment: 'left',
  wrap: false,
  ellipsis: false,
  font: 'default',
} as const

interface ParsedChar {
  char: string
  width: number
  style: Style | undefined
}

interface RenderCache {
  width: number | undefined
  lines: [string, number][]
  style?: Style
  parsedLines?: ParsedChar[][]
}

export class Text extends View {
  #style: StyleProps['style']
  #text: string = ''
  #lines: [string, number][] = []
  #alignment: StyleProps['alignment'] = DEFAULTS.alignment
  #wrap: StyleProps['wrap'] = DEFAULTS.wrap
  #ellipsis: StyleProps['ellipsis'] = DEFAULTS.ellipsis
  #font: FontFamily = DEFAULTS.font
  // One render layout per view, not a growing cache of past text or widths.
  #renderCache?: RenderCache

  constructor(propsOrString: string | Props = {}) {
    let props: Props
    if (typeof propsOrString === 'string') {
      props = {text: propsOrString}
    } else {
      props = propsOrString
    }

    super(props)

    this.#update(props)

    define(this, 'text', {enumerable: true})
    define(this, 'font', {enumerable: true})
  }

  get text() {
    return this.#text
  }
  set text(value: string) {
    if (this.#text === value) {
      return
    }

    this.#updateLines(value, value.split('\n'), this.#font)
  }

  get font() {
    return this.#font
  }
  set font(value: FontFamily) {
    if (this.#font === value) {
      return
    }

    this.#updateLines(this.#text, undefined, value)
  }

  get ellipsis() {
    return this.#ellipsis
  }
  set ellipsis(value: boolean) {
    if (this.#ellipsis === value) {
      return
    }

    this.#ellipsis = value
    this.invalidateRender()
  }

  get style() {
    return this.#style
  }

  set style(value: Style | undefined) {
    if (this.#style === value) {
      return
    }

    this.#style = value
    this.invalidateRender()
  }

  update(props: Props) {
    this.#update(props)
    super.update(props)
  }

  #update({text, lines, style, alignment, wrap, ellipsis, font}: Props) {
    this.#style = style
    this.#alignment = alignment ?? DEFAULTS.alignment
    this.#wrap = wrap ?? DEFAULTS.wrap
    this.#ellipsis = ellipsis ?? DEFAULTS.ellipsis
    this.#updateLines(text, lines, font)
  }

  #updateLines(
    text: string | undefined,
    lines: string[] | undefined,
    font: FontFamily | undefined,
  ) {
    this.#font = font ?? DEFAULTS.font
    const fontMap = font && FONTS[font]

    if (text !== undefined) {
      this.#text = text
      lines = text === '' ? [] : text.split('\n')
    } else if (lines !== undefined) {
      this.#text = lines.join('\n')
    } else {
      this.#text = ''
      lines = []
    }

    this.#lines = lines.map(line => {
      if (fontMap) {
        // printableChars keeps each ANSI sequence whole, so only visible
        // characters are mapped
        line = unicode
          .printableChars(line)
          .map(c => fontMap.get(c) ?? c)
          .join('')
      }

      return [line, unicode.lineWidth(line)]
    })
    this.#renderCache = undefined

    this.invalidateSize()
  }

  naturalSize(available: Size): Size {
    if (this.#lines.length === 0) {
      return Size.zero
    }

    if (this.#wrap) {
      // The height comes from the same word-wrapping that `render` uses; the
      // width is the widest line, up to the available width.
      const cache = this.#renderCache
      const lines =
        cache?.width === available.width
          ? cache.lines
          : wrap(this.#lines, available.width)
      const width = this.#lines.reduce(
        (width, [, lineWidth]) =>
          Math.max(width, Math.min(lineWidth, available.width)),
        0,
      )
      return new Size(width, lines.length)
    }

    return this.#lines.reduce((size, [, width]) => {
      size.width = Math.max(size.width, width)
      size.height += 1
      return size
    }, Size.zero.mutableCopy())
  }

  render(viewport: Viewport) {
    if (viewport.isEmpty || viewport.visibleRect.isEmpty) {
      return
    }

    const width = this.#wrap ? viewport.contentSize.width : undefined
    let cache = this.#renderCache
    if (!cache || cache.width !== width) {
      cache = this.#renderCache = {
        width,
        lines: width === undefined ? this.#lines : wrap(this.#lines, width),
      }
    }
    const lines = cache.lines

    const startingStyle: Style = this.#style ?? Style.NONE
    if (!cache.style?.isEqual(startingStyle)) {
      // Copy primitive attributes to detect in-place Style mutations too.
      cache.style = new Style(startingStyle)
      cache.parsedLines = []
    }
    const parsedLines = cache.parsedLines!
    viewport.usingPen(startingStyle, pen => {
      const point = new Point(0, 0).mutableCopy()
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        let [line, lineWidth] = lines[lineIndex]
        if (!line.length) {
          point.y += 1
          continue
        }

        let didWrap = false
        let parsedIndex = lineIndex
        if (this.#wrap) {
          lineWidth = Math.min(lineWidth, viewport.contentSize.width)
        } else if (this.#ellipsis && lineWidth > viewport.contentSize.width) {
          line = truncate(line, viewport.contentSize.width)
          lineWidth = viewport.contentSize.width
          // the truncated line isn't cached with the full lines
          parsedIndex = -1
        }
        const offsetX =
          this.#alignment === 'left'
            ? 0
            : this.#alignment === 'center'
              ? ~~((viewport.contentSize.width - lineWidth) / 2)
              : viewport.contentSize.width - lineWidth
        point.x = offsetX
        if (!this.#wrap && !line.includes('\u001b')) {
          viewport.write(line, point)
          point.y += 1
          continue
        }

        let parsed = parsedIndex === -1 ? undefined : parsedLines[parsedIndex]
        if (!parsed) {
          parsed = []
          for (const char of unicode.printableChars(line)) {
            const width = unicode.charWidth(char)
            parsed.push({
              char,
              width,
              style:
                width === 0 ? Style.fromSGR(char, startingStyle) : undefined,
            })
          }
          if (parsedIndex !== -1) {
            parsedLines[parsedIndex] = parsed
          }
        }
        for (const {char, width: charWidth, style} of parsed) {
          if (charWidth === 0) {
            // Replay deltas against the current pen; inherited viewport styles
            // can change between renders even when text and layout do not.
            pen.mergePen(style!)
            continue
          }

          if (this.#wrap && point.x >= viewport.contentSize.width) {
            didWrap = true
            point.x = 0
            point.y += 1
          }

          if (didWrap && char.match(/\s/)) {
            continue
          }
          didWrap = false

          if (
            point.x >= viewport.visibleRect.minX() &&
            point.x + charWidth - 1 < viewport.visibleRect.maxX()
          ) {
            viewport.write(char, point)
          }

          point.x += charWidth
          // ANSI style changes may carry into later lines, so styled text must
          // continue parsing after the visible range.
        }

        point.y += 1
      }
    })
  }
}

/**
 * Shortens `line` to `width` columns, ending in an ellipsis. ANSI sequences are
 * kept, so styles still apply (and are reset) correctly.
 */
function truncate(line: string, width: number): string {
  if (width <= 0) {
    return ''
  }

  let result = ''
  let lineWidth = 0
  let didTruncate = false
  for (const char of unicode.printableChars(line)) {
    const charWidth = unicode.charWidth(char)
    if (charWidth === 0) {
      result += char
      continue
    }

    if (didTruncate) {
      continue
    }

    if (lineWidth + charWidth > width - ELLIPSIS_WIDTH) {
      result += ELLIPSIS
      didTruncate = true
      continue
    }

    result += char
    lineWidth += charWidth
  }
  return result
}

const ELLIPSIS = '…'
const ELLIPSIS_WIDTH = 1
