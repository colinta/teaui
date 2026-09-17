import * as unicode from '@teaui/term'

import type {Viewport} from '../Viewport.js'
import type {Props as ViewProps} from '../View.js'
import {View} from '../View.js'
import {Style} from '../Style.js'
import {Point, Size} from '../geometry.js'
import {Alignment, FontFamily} from '../types.js'
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
  alignment: Alignment
  wrap: boolean
  font?: FontFamily
}

type Props = Partial<StyleProps> & (TextProps | LinesProps) & ViewProps

const DEFAULTS = {
  alignment: 'left',
  wrap: false,
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

  #update({text, lines, style, alignment, wrap, font}: Props) {
    this.#style = style
    this.#alignment = alignment ?? DEFAULTS.alignment
    this.#wrap = wrap ?? DEFAULTS.wrap
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
        line = [...line].map(c => fontMap.get(c) ?? c).join('')
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

    return this.#lines.reduce((size, [, width]) => {
      if (this.#wrap) {
        const lineHeight = Math.ceil(width / available.width)
        size.width = Math.max(size.width, Math.min(width, available.width))
        size.height += lineHeight
        return size
      }

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
        if (this.#wrap) {
          lineWidth = Math.min(lineWidth, viewport.contentSize.width)
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

        let parsed = parsedLines[lineIndex]
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
          parsedLines[lineIndex] = parsed
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
