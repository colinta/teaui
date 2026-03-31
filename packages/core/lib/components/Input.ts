import * as unicode from '@teaui/term'

import type {KeyEvent, MouseEvent} from '../events/index.js'
import {isKeyPrintable} from '../events/index.js'
import type {Viewport} from '../Viewport.js'
import type {Props as ViewProps} from '../View.js'
import {View} from '../View.js'
import {Style} from '../Style.js'
import {Point, Size} from '../geometry.js'
import {System} from '../System.js'
import type {FontFamily} from '../types.js'
import {FONTS} from './fonts.js'

interface TextProps {
  placeholder?: string
  onChange?: (text: string) => void
  onSubmit?: (text: string) => void
}

interface StyleProps {
  value?: string
  wrap?: boolean
  multiline?: boolean
  font?: FontFamily
  format?: (text: string) => string
}

interface Cursor {
  start: number
  end: number
}

export type Props = StyleProps & TextProps & ViewProps

const NL_SIGIL = '⤦'
const TAB_SIGIL = '⭾ '

/**
 * Text input. Supports selection, word movement via alt+←→, single and multiline
 * input, and wrapped lines.
 */
export class Input extends View {
  /**
   * Array of graphemes, with pre-calculated length
   */
  #placeholder: [string[], number][] = []
  #printableLines: [string[], number][] = []
  /**
   * Cached after assignment - this is converted to #chars and #lines
   */
  #value: string = ''
  /**
   * For easy edit operations. Gets converted to #lines for printing.
   */
  #chars: string[] = []
  #wrappedLines: [string[], number][] = []

  // formatting options
  #wrap: boolean = false
  #multiline: boolean = false
  #font: FontFamily = 'default'
  #format?: (text: string) => string
  #formatStyles: Style[] = []
  #onChange?: (value: string) => void
  #onSubmit?: (value: string) => void

  // Printable width
  #maxLineWidth: number = 0
  #cursor: Cursor = {start: 0, end: 0}
  #visibleWidth = 0

  constructor(props: Props = {}) {
    super(props)
    this.#update(props)
    this.#cursor = {start: this.#chars.length, end: this.#chars.length}
  }

  update(props: Props) {
    this.#update(props)
    super.update(props)
  }

  #update({
    value,
    wrap,
    multiline,
    font,
    format,
    placeholder,
    onChange,
    onSubmit,
  }: Props) {
    this.#onChange = onChange
    this.#onSubmit = onSubmit
    this.#wrap = wrap ?? false
    this.#multiline = multiline ?? false
    this.#format = format
    this.#updatePlaceholderLines(placeholder ?? '')
    this.#updateLines(unicode.printableChars(value ?? ''), font ?? 'default')
  }

  #updatePlaceholderLines(placeholder: string) {
    const placeholderLines =
      placeholder === ''
        ? []
        : placeholder.split('\n').map(line => unicode.printableChars(line))
    this.#placeholder = placeholderLines.map(line => [
      line,
      line.reduce((w, c) => w + unicode.charWidth(c), 0),
    ])
  }

  #updateLines(_chars: string[] | undefined, font: FontFamily | undefined) {
    let chars = _chars ?? this.#chars
    if (font === undefined) {
      font = this.#font
    } else {
      this.#font = font
    }

    const startIsAtEnd = this.#cursor.start === this.#chars.length
    const endIsAtEnd = this.#cursor.end === this.#chars.length
    if (chars.length > 0) {
      if (!this.#multiline) {
        chars = chars.map(char => (char === '\n' ? ' ' : char))
      }

      this.#value = chars.filter(char => !isAccentChar(char)).join('')
      this.#chars = chars
      const [charLines] = this.#chars.reduce(
        ([lines, line], char, index) => {
          if (char === '\n') {
            lines.push(line)
            if (index === this.#chars.length - 1) {
              lines.push([])
            }
            return [lines, []]
          }

          line.push(char)
          if (index === this.#chars.length - 1) {
            lines.push(line)
            return [lines, []]
          }

          return [lines, line]
        },
        [[], []] as [string[][], string[]],
      )
      this.#printableLines = charLines.map((printableLine, index, all) => {
        const displayLine = printableLine
        // every line needs a ' ' or NL_SIGIL at the end, for the EOL cursor
        return [
          displayLine.concat(index === all.length - 1 ? ' ' : NL_SIGIL),
          displayLine.reduce(
            (width, char) => width + unicode.charWidth(char),
            0,
          ) + 1,
        ]
      })
    } else {
      this.#value = ''
      this.#printableLines = this.#placeholder.map(([line, width]) => {
        return [line.concat(' '), width]
      })
    }
    this.#visibleWidth = 0

    if (endIsAtEnd) {
      this.#cursor.end = this.#chars.length
    } else {
      this.#cursor.end = Math.min(this.#cursor.end, this.#chars.length)
    }

    if (startIsAtEnd) {
      this.#cursor.start = this.#chars.length
    } else {
      this.#cursor.start = Math.min(this.#cursor.start, this.#chars.length)
    }

    this.#maxLineWidth = this.#printableLines.reduce((maxWidth, [, width]) => {
      // the _printable_ width, not the number of characters
      return Math.max(maxWidth, width)
    }, 0)

    this.#updateFormatStyles()
    this.invalidateSize()
  }

  /**
   * Run the format function on the current value and parse the ANSI output into
   * a flat Style[] array with one entry per character in #chars.
   */
  #updateFormatStyles() {
    if (!this.#format || !this.#chars.length) {
      this.#formatStyles = []
      return
    }

    let formatted: string
    try {
      formatted = this.#format(this.#value)
    } catch {
      this.#formatStyles = []
      return
    }

    // Parse the ANSI output to extract a style per character.
    // Walk through the formatted string, tracking ANSI state.
    const styles: Style[] = []
    let currentStyle = Style.NONE
    for (const token of unicode.printableChars(formatted)) {
      const charWidth = unicode.charWidth(token)
      if (charWidth === 0) {
        // ANSI escape sequence — update current style.
        // Full resets (ESC[0m) clear back to no styling.
        if (RESET_RE.test(token)) {
          currentStyle = Style.NONE
        } else {
          currentStyle = currentStyle.merge(Style.fromSGR(token, Style.NONE))
        }
      } else {
        styles.push(currentStyle)
      }
    }

    this.#formatStyles = styles
  }

  get value() {
    return this.#value
  }
  set value(value: string) {
    if (value !== this.#value) {
      this.#updateLines(unicode.printableChars(value), undefined)
    }
  }

  get placeholder() {
    return this.#placeholder.map(([chars]) => chars.join('')).join('\n')
  }

  set placeholder(placeholder: string | undefined) {
    this.#updatePlaceholderLines(placeholder ?? '')
  }

  get font() {
    return this.#font
  }
  set font(font: FontFamily) {
    if (font !== this.#font) {
      this.#updateLines(undefined, font)
    }
  }

  get wrap() {
    return this.#wrap
  }

  set wrap(wrap: boolean) {
    if (wrap !== this.#wrap) {
      this.#wrap = wrap
      this.#updateLines(undefined, undefined)
    }
  }

  get multiline() {
    return this.#multiline
  }

  set multiline(multiline: boolean) {
    if (multiline !== this.#multiline) {
      this.#multiline = multiline
      this.#updateLines(undefined, undefined)
    }
  }

  naturalSize(available: Size): Size {
    let lines: [string[], number][] = this.#printableLines

    if (!lines.length || !available.width) {
      return Size.one
    }

    let height: number = 0
    if (this.#wrap) {
      for (const [, width] of lines) {
        // width + 1 because there should always be room for the cursor to be _after_
        // the last character.
        height += Math.ceil((width + 1) / available.width)
      }
    } else {
      height = lines.length
    }

    return new Size(this.#maxLineWidth, height)
  }

  minSelected() {
    return Math.min(this.#cursor.start, this.#cursor.end)
  }

  maxSelected() {
    return isEmptySelection(this.#cursor)
      ? this.#cursor.start + 1
      : Math.max(this.#cursor.start, this.#cursor.end)
  }

  receiveKey(event: KeyEvent) {
    const prevChars = this.#chars
    const prevText = this.#value
    let removeAccent = true

    if (event.name === 'enter' || event.name === 'return') {
      if (this.#multiline) {
        if (event.shift || event.alt) {
          // Shift+Enter or Alt+Enter: plain newline without indentation
          this.#receiveChar('\n', true)
        } else {
          // Enter: newline + preserve current line's indentation
          this.#receiveEnterWithIndent()
        }
      } else {
        this.#onSubmit?.(this.#value)
        return
      }
    } else if (event.full === 'C-]') {
      this.#receiveIndent()
    } else if (event.full === 'C-[') {
      this.#receiveDedent()
    } else if (event.name === 'tab' && event.alt) {
      this.#receiveChar('\t', true)
    } else if (event.full === 'C-a') {
      this.#receiveGotoStart()
    } else if (event.full === 'C-e') {
      this.#receiveGotoEnd()
    } else if (event.name === 'up') {
      this.#receiveKeyUpArrow(event)
    } else if (event.name === 'down') {
      this.#receiveKeyDownArrow(event)
    } else if (event.name === 'home') {
      this.#receiveHome(event)
    } else if (event.name === 'end') {
      this.#receiveEnd(event)
    } else if (event.name === 'left') {
      this.#receiveKeyLeftArrow(event)
    } else if (event.name === 'right') {
      this.#receiveKeyRightArrow(event)
    } else if (event.full === 'backspace') {
      this.#receiveKeyBackspace()
    } else if (event.name === 'delete') {
      this.#receiveKeyDelete()
    } else if (event.full === 'A-backspace' || event.full === 'C-w') {
      this.#receiveKeyDeleteWord()
    } else if (isKeyAccent(event)) {
      this.#receiveKeyAccent(event)
      removeAccent = false
    } else if (isKeyPrintable(event)) {
      this.#receiveKeyPrintable(event)
    }

    if (removeAccent) {
      this.#chars = this.#chars.filter(char => !isAccentChar(char))
    }

    if (prevChars !== this.#chars) {
      this.#updateLines(this.#chars, undefined)
    }

    if (prevText !== this.#value) {
      this.#onChange?.(this.#value)
    }
  }

  receivePaste(text: string) {
    const pasteChars = unicode.printableChars(
      this.#multiline ? text : text.replaceAll('\n', ''),
    )
    if (pasteChars.length === 0) return

    const prevText = this.#value

    if (isEmptySelection(this.#cursor)) {
      this.#chars = this.#chars
        .slice(0, this.#cursor.start)
        .concat(pasteChars, this.#chars.slice(this.#cursor.start))
      this.#cursor.start = this.#cursor.end =
        this.#cursor.start + pasteChars.length
    } else {
      this.#chars = this.#chars
        .slice(0, this.minSelected())
        .concat(pasteChars, this.#chars.slice(this.maxSelected()))
      this.#cursor.start = this.#cursor.end =
        this.minSelected() + pasteChars.length
    }

    this.#updateLines(this.#chars, undefined)

    if (prevText !== this.#value) {
      this.#onChange?.(this.#value)
    }
  }

  receiveMouse(event: MouseEvent, system: System) {
    if (event.name === 'mouse.button.down') {
      system.requestFocus()
    }
  }

  render(viewport: Viewport) {
    // Register focus before the isEmpty check — Input should participate in the
    // focus ring even when clipped to zero size (e.g. inside a Scrollable that
    // hasn't scrolled to it). Skipping registration would silently drop it from
    // the ring, causing focus to jump unexpectedly when the user tabs through.
    const hasFocus = viewport.registerFocus({isDefault: true})
    if (viewport.isEmpty) {
      return
    }

    const visibleSize = viewport.contentSize

    if (hasFocus) {
      viewport.registerTick()
    }
    viewport.registerMouse('mouse.button.left')

    // cursorEnd: the location of the cursor relative to the text
    // (ie if the text had been drawn at 0,0, cursorEnd is the screen location of
    // the cursor)
    // cursorPosition: the location of the cursor relative to the viewport
    const [cursorEnd, cursorPosition] = this.#cursorPosition(visibleSize)
    const cursorMin = this.#toPosition(this.minSelected(), visibleSize.width)
    const cursorMax = this.#toPosition(this.maxSelected(), visibleSize.width)

    // cursorVisible: the text location of the first line & char to draw
    const cursorVisible = new Point(
      cursorEnd.x - cursorPosition.x,
      cursorEnd.y - cursorPosition.y,
    )

    let lines: [string[], number][] = this.#printableLines

    if (
      visibleSize.width !== this.#visibleWidth ||
      this.#wrappedLines.length === 0
    ) {
      if (this.#wrap) {
        lines = lines.flatMap(line => {
          const wrappedLines: [string[], number][] = []
          let currentLine: string[] = []
          let currentWidth = 0
          for (const char of line[0]) {
            const charWidth = unicode.charWidth(char)
            currentLine.push(char)
            currentWidth += charWidth

            if (currentWidth >= visibleSize.width) {
              wrappedLines.push([currentLine, currentWidth])
              currentLine = []
              currentWidth = 0
            }
          }

          if (currentLine.length) {
            wrappedLines.push([currentLine, currentWidth])
          }

          return wrappedLines
        })
      }

      this.#wrappedLines = lines
      this.#visibleWidth = visibleSize.width
    } else {
      lines = this.#wrappedLines
    }

    let isPlaceholder = !Boolean(this.#chars.length)
    let currentStyle = Style.NONE
    const plainStyle = this.theme.text({
      isPlaceholder,
      hasFocus,
    })
    const selectedStyle = this.theme.text({
      isSelected: true,
      hasFocus,
    })
    const cursorStyle = plainStyle.merge({underline: true})

    const nlStyle = this.theme.text({isPlaceholder: true})

    const fontMap = this.#font && FONTS[this.#font]

    const hasFormatStyles = this.#formatStyles.length > 0

    viewport.usingPen(pen => {
      let style: Style = plainStyle

      const visibleLines = lines.slice(cursorVisible.y)
      if (visibleLines.length === 0) {
        visibleLines.push([[' '], 0])
      }

      // Compute the character offset into the format styles array at the start
      // of visible lines. Each line's chars (excluding the trailing sigil) map
      // 1:1 to format style entries. Newlines do NOT have entries in the styles
      // array (charWidth('\n') === 0, so they're skipped during parsing).
      let formatOffset = 0
      if (hasFormatStyles) {
        for (let i = 0; i < cursorVisible.y && i < lines.length; i++) {
          formatOffset += lines[i][0].length - 1
        }
      }

      // is the viewport tall/wide enough to show ellipses …
      const isTallEnough = viewport.contentSize.height > 4
      const isWideEnough = viewport.contentSize.width > 9
      // do we need to show vertical ellipses
      const isTooTall = visibleLines.length > visibleSize.height

      // firstPoint is top-left corner of the viewport
      const firstPoint = new Point(0, cursorVisible.y)
      // lastPoint is bottom-right corner of the viewport
      const lastPoint = new Point(
        visibleSize.width + cursorVisible.x - 1,
        cursorVisible.y + visibleSize.height - 1,
      )

      let scanTextPosition = firstPoint.mutableCopy()
      for (const [line, width] of visibleLines) {
        // used to determine whether to draw a final …
        const isTooWide = this.#wrap
          ? false
          : width - cursorVisible.x > viewport.contentSize.width

        // set to true if any character is skipped
        let drawInitialEllipses = false
        scanTextPosition.x = 0
        let charIndex = 0
        for (let char of line) {
          char = fontMap?.get(char) ?? char

          const charWidth = unicode.charWidth(char)
          const isSigil = charIndex === line.length - 1
          if (scanTextPosition.x >= cursorVisible.x) {
            const inSelection = isInSelection(
              cursorMin,
              cursorMax,
              scanTextPosition,
            )
            const inCursor =
              scanTextPosition.x === cursorEnd.x &&
              scanTextPosition.y === cursorEnd.y
            const inNewline =
              char === NL_SIGIL && scanTextPosition.x + charWidth === width
            const inTab = isTabSigil(char)
            const isDimSigil = inNewline || inTab

            // Look up the format style for this character.
            const formatStyle =
              hasFormatStyles && !isSigil && !inTab
                ? this.#formatStyles[formatOffset + charIndex]
                : undefined
            const baseStyle = formatStyle
              ? plainStyle.merge(formatStyle)
              : plainStyle

            if (isEmptySelection(this.#cursor)) {
              if (isAccentChar(char)) {
                style = baseStyle.merge({underline: true, inverse: true})
              } else if (hasFocus && inCursor) {
                style = isDimSigil
                  ? nlStyle.merge({underline: true})
                  : baseStyle.merge({underline: true})
              } else if (isDimSigil) {
                style = nlStyle
              } else {
                style = baseStyle
              }
            } else {
              if (inSelection) {
                style = isDimSigil
                  ? selectedStyle.merge({foreground: nlStyle.foreground})
                  : selectedStyle.merge({underline: inCursor})
              } else if (isDimSigil) {
                style = nlStyle
              } else {
                style = baseStyle
              }
            }

            if (!currentStyle.isEqual(style)) {
              pen.replacePen(style)
              currentStyle = style
            }

            let drawEllipses: boolean = false

            if (cursorVisible.y > 0 && scanTextPosition.isEqual(firstPoint)) {
              drawEllipses = isTallEnough
            } else if (isTooTall && scanTextPosition.isEqual(lastPoint)) {
              drawEllipses = isTallEnough
            } else if (isWideEnough) {
              if (drawInitialEllipses) {
                drawEllipses = true
              } else if (
                isTooWide &&
                scanTextPosition.x - cursorVisible.x + charWidth >=
                  viewport.contentSize.width
              ) {
                drawEllipses = true
              }
            }

            if (!drawEllipses && char === '\t') {
              // Render tab as two-char sigil
              const offset = scanTextPosition.offset(
                -cursorVisible.x,
                -cursorVisible.y,
              )
              viewport.write(TAB_SIGIL[0], offset)
              viewport.write(TAB_SIGIL[1], offset.offset(1, 0))
            } else {
              viewport.write(
                drawEllipses ? '…' : char,
                scanTextPosition.offset(-cursorVisible.x, -cursorVisible.y),
              )
            }
            drawInitialEllipses = false
          } else {
            drawInitialEllipses = true
          }

          scanTextPosition.x += charWidth
          charIndex++
          if (
            scanTextPosition.x - cursorVisible.x >=
            viewport.contentSize.width
          ) {
            break
          }
        }

        // Advance formatOffset past this line's chars (excluding the trailing sigil).
        if (hasFormatStyles) {
          formatOffset += line.length - 1
        }

        scanTextPosition.y += 1
        if (
          scanTextPosition.y - cursorVisible.y >=
          viewport.contentSize.height
        ) {
          break
        }
      }
    })
  }

  /**
   * The position of the character that is at the desired cursor offset, taking
   * character widths into account, relative to the text (as if the text were drawn
   * at 0,0), and 'wrap' setting.
   */
  #toPosition(offset: number, visibleWidth: number): Point {
    if (this.#wrap) {
      let y = 0,
        index = 0
      let x = 0
      // immediately after a line wrap, we don't want to also increase y by 1
      let isFirst = true
      for (const [chars] of this.#printableLines) {
        if (!isFirst) {
          y += 1
        }
        isFirst = false

        x = 0
        for (const char of chars) {
          if (index === offset) {
            if (x === visibleWidth) {
              x = 0
              y += 1
            }
            return new Point(x, y)
          }

          const charWidth = unicode.charWidth(char)
          if (x + charWidth > visibleWidth) {
            x = charWidth
            y += 1
          } else {
            x += charWidth
          }

          index += 1
        }
      }

      return new Point(x, y)
    }

    let y = 0,
      index = 0
    for (const [chars] of this.#printableLines) {
      if (index + chars.length > offset) {
        let x = 0
        for (const char of chars.slice(0, offset - index)) {
          x += unicode.charWidth(char)
        }
        return new Point({x, y})
      }
      index += chars.length
      y += 1
    }

    return new Point(0, y)
  }

  /**
   * Returns the cursor offset that points to the character at the desired screen
   * position, taking into account character widths.
   */
  #toOffset(position: Point, visibleWidth: number): number {
    if (this.#wrap) {
      let y = 0,
        index = 0
      let x = 0
      for (const [chars] of this.#printableLines) {
        if (y) {
          y += 1
        }
        x = 0
        for (const char of chars) {
          if (position.isEqual(x, y)) {
            return index
          }

          const charWidth = unicode.charWidth(char)
          if (x + charWidth >= visibleWidth) {
            x = 0
            y += 1
            index += 1
          } else {
            x += charWidth
            index += 1
          }
        }
      }

      return index
    } else {
      if (position.y >= this.#printableLines.length) {
        return this.#chars.length
      }

      let y = 0,
        index = 0
      for (const [chars, width] of this.#printableLines) {
        if (y === position.y) {
          let x = 0
          for (const char of chars) {
            x += unicode.charWidth(char)
            if (x > position.x) {
              return index
            }
            index += 1
          }
          return index
        }
        y += 1
        index += chars.length + 1
      }

      return this.#chars.length
    }
  }

  /**
   * Determine the position of the cursor, relative to the viewport, based on the
   * text and viewport sizes.
   *
   * The cursor is placed so that it will appear at the start or end of the viewport
   * when it is near the start or end of the line, otherwise it tries to be centered.
   */
  #cursorPosition(visibleSize: Size): [Point, Point] {
    const halfWidth = Math.floor(visibleSize.width / 2)
    const halfHeight = Math.floor(visibleSize.height / 2)

    // the cursor, relative to the start of text (as if all text was visible),
    // ie in the "coordinate system" of the text.
    let cursorEnd = this.#toPosition(this.#cursor.end, visibleSize.width)

    let currentLineWidth: number, totalHeight: number
    if (!this.#printableLines.length) {
      return [cursorEnd, new Point(0, 0)]
    }

    if (this.#wrap) {
      // run through the lines until we get to our desired cursorEnd.y
      // but also add all the heights to calculate currentHeight
      let h = 0
      currentLineWidth = -1
      totalHeight = 0
      for (const [, width] of this.#printableLines) {
        const dh = Math.ceil(width / visibleSize.width)
        totalHeight += dh

        if (currentLineWidth === -1 && dh >= cursorEnd.y) {
          if (cursorEnd.y - h === dh) {
            // the cursor is on the last wrapped line, use modulo divide to calculate the
            // last line width, add 1 for the EOL cursor
            currentLineWidth = (visibleSize.width % width) + 1
          } else {
            currentLineWidth = visibleSize.width
          }
          break
        }
      }

      currentLineWidth = Math.max(0, currentLineWidth)
    } else {
      currentLineWidth = this.#printableLines[cursorEnd.y]?.[1] ?? 0
      totalHeight = this.#printableLines.length
    }

    // Calculate the viewport location where the cursor will be drawn
    // x location:
    let cursorX: number
    if (currentLineWidth <= visibleSize.width) {
      // If the viewport can accommodate the entire line
      // draw the cursor at its natural location.
      cursorX = cursorEnd.x
    } else if (cursorEnd.x < halfWidth) {
      // If the cursor is at the start of the line
      // place the cursor at the start of the viewport
      cursorX = cursorEnd.x
    } else if (cursorEnd.x > currentLineWidth - halfWidth) {
      // or if the cursor is at the end of the line
      // draw it at the end of the viewport
      cursorX = visibleSize.width - currentLineWidth + cursorEnd.x
    } else {
      // otherwise place it in the middle.
      cursorX = halfWidth
    }

    // y location:
    let cursorY: number
    if (totalHeight <= visibleSize.height) {
      // If the viewport can accommodate the entire height
      // draw the cursor at its natural location.
      cursorY = cursorEnd.y
    } else if (cursorEnd.y < halfHeight) {
      // If the cursor is at the start of the text
      // place the cursor at the start of the viewport
      cursorY = cursorEnd.y
    } else if (cursorEnd.y >= totalHeight - halfHeight) {
      // or if the cursor is at the end of the text
      // draw it at the end of the viewport
      cursorY = visibleSize.height - totalHeight + cursorEnd.y
    } else {
      // otherwise place it in the middle.
      cursorY = halfHeight
    }

    // The viewport location where the cursor will be drawn
    return [cursorEnd, new Point(cursorX, cursorY)]
  }

  #receiveKeyAccent(event: KeyEvent) {
    this.#chars = this.#chars.filter(char => !isAccentChar(char))

    let char = ACCENT_KEYS[event.full]
    if (!char) {
      return
    }

    this.#receiveChar(char, false)
  }

  #receiveKeyPrintable({char}: KeyEvent) {
    if (
      this.#cursor.start === this.#cursor.end &&
      isAccentChar(this.#chars[this.#cursor.start])
    ) {
      // if character under cursor is an accent, replace it.
      const accented = accentChar(this.#chars[this.#cursor.start], char)
      this.#receiveChar(accented, true)
      return
    }

    this.#receiveChar(char, true)
  }

  #receiveChar(char: string, advance: boolean) {
    if (isEmptySelection(this.#cursor)) {
      this.#chars = this.#chars
        .slice(0, this.#cursor.start)
        .concat(char, this.#chars.slice(this.#cursor.start))
      this.#cursor.start = this.#cursor.end =
        this.#cursor.start + (advance ? 1 : 0)
    } else {
      this.#chars = this.#chars
        .slice(0, this.minSelected())
        .concat(char, this.#chars.slice(this.maxSelected()))
      this.#cursor.start = this.#cursor.end =
        this.minSelected() + (advance ? 1 : 0)
    }
  }

  #receiveGotoStart() {
    this.#cursor = {start: 0, end: 0}
  }

  #receiveGotoEnd() {
    this.#cursor = {start: this.#chars.length, end: this.#chars.length}
  }

  #receiveHome({shift}: KeyEvent) {
    let dest = 0
    // move the cursor to the previous line, moving the cursor until it is at the
    // same X position.
    let cursorPosition = this.#toPosition(
      this.#cursor.end,
      this.#visibleWidth,
    ).mutableCopy()
    if (cursorPosition.y === 0) {
      dest = 0
    } else {
      const [targetChars, targetWidth] = this.#wrappedLines[cursorPosition.y]
      dest = this.#wrappedLines
        .slice(0, cursorPosition.y)
        .reduce((dest, [chars]) => {
          return dest + chars.length
        }, 0)
    }

    if (shift) {
      this.#cursor.end = dest
    } else {
      this.#cursor = {start: dest, end: dest}
    }
  }

  #receiveEnd({shift}: KeyEvent) {
    let dest = 0
    // move the cursor to the next line, moving the cursor until it is at the
    // same X position.
    let cursorPosition = this.#toPosition(
      this.#cursor.end,
      this.#visibleWidth,
    ).mutableCopy()
    if (cursorPosition.y === this.#wrappedLines.length - 1) {
      dest = this.#chars.length
    } else {
      const [targetChars, targetWidth] =
        this.#wrappedLines[cursorPosition.y + 1]
      dest =
        this.#wrappedLines
          .slice(0, cursorPosition.y + 1)
          .reduce((dest, [chars]) => {
            return dest + chars.length
          }, 0) - 1
    }

    if (shift) {
      this.#cursor.end = dest
    } else {
      this.#cursor = {start: dest, end: dest}
    }
  }

  #receiveKeyUpArrow({shift}: KeyEvent) {
    let dest = 0
    // move the cursor to the previous line, moving the cursor until it is at the
    // same X position.
    let cursorPosition = this.#toPosition(
      this.#cursor.end,
      this.#visibleWidth,
    ).mutableCopy()
    if (cursorPosition.y === 0) {
      dest = 0
    } else if (cursorPosition.y <= this.#wrappedLines.length) {
      const [targetChars, targetWidth] =
        this.#wrappedLines[cursorPosition.y - 1]
      dest = this.#wrappedLines
        .slice(0, cursorPosition.y - 1)
        .reduce((dest, [chars]) => {
          return dest + chars.length
        }, 0)

      if (targetWidth <= cursorPosition.x) {
        dest += targetChars.length - 1
      } else {
        let displayX = 0
        let destOffset = 0
        for (const char of targetChars) {
          const charWidth = unicode.charWidth(char)
          if (displayX + charWidth > cursorPosition.x) {
            break
          }
          displayX += charWidth
          destOffset += 1
        }
        dest += destOffset
      }
    }

    if (shift) {
      this.#cursor.end = dest
    } else {
      this.#cursor = {start: dest, end: dest}
    }
  }

  #receiveKeyDownArrow({shift}: KeyEvent) {
    let dest = 0
    // move the cursor to the next line, moving the cursor until it is at the
    // same X position.
    let cursorPosition = this.#toPosition(
      this.#cursor.end,
      this.#visibleWidth,
    ).mutableCopy()
    if (
      cursorPosition.y === this.#wrappedLines.length - 1 ||
      this.#wrappedLines.length === 0
    ) {
      dest = this.#chars.length
    } else {
      const [targetChars, targetWidth] =
        this.#wrappedLines[cursorPosition.y + 1]
      dest = this.#wrappedLines
        .slice(0, cursorPosition.y + 1)
        .reduce((dest, [chars]) => {
          return dest + chars.length
        }, 0)

      if (targetWidth <= cursorPosition.x) {
        dest += targetChars.length - 1
      } else {
        let displayX = 0
        let destOffset = 0
        for (const char of targetChars) {
          const charWidth = unicode.charWidth(char)
          if (displayX + charWidth > cursorPosition.x) {
            break
          }
          displayX += charWidth
          destOffset += 1
        }
        dest += destOffset
      }
    }

    if (shift) {
      this.#cursor.end = dest
    } else {
      this.#cursor = {start: dest, end: dest}
    }
  }

  #prevWordOffset(shift: boolean): number {
    let cursor: number
    if (shift) {
      cursor = this.#cursor.end
    } else if (isEmptySelection(this.#cursor)) {
      cursor = this.#cursor.start
    } else {
      cursor = this.minSelected()
    }

    let prevWordOffset: number = 0
    for (const [chars, offset] of unicode.words(this.#chars)) {
      prevWordOffset = offset
      if (cursor <= offset + chars.length) {
        break
      }
    }

    return prevWordOffset
  }

  #nextWordOffset(shift: boolean): number {
    let cursor: number
    if (shift) {
      cursor = this.#cursor.end
    } else if (isEmptySelection(this.#cursor)) {
      cursor = this.#cursor.start
    } else {
      cursor = this.maxSelected()
    }

    let nextWordOffset: number = 0
    for (const [chars, offset] of unicode.words(this.#chars)) {
      nextWordOffset = offset + chars.length
      if (cursor < offset + chars.length) {
        break
      }
    }

    return nextWordOffset
  }

  #receiveKeyLeftArrow({shift, alt}: KeyEvent) {
    if (alt) {
      const prevWordOffset = this.#prevWordOffset(shift)
      if (shift) {
        this.#cursor.end = prevWordOffset
      } else {
        this.#cursor.start = this.#cursor.end = prevWordOffset
      }
    } else if (shift) {
      this.#cursor.end = Math.max(0, this.#cursor.end - 1)
    } else if (isEmptySelection(this.#cursor)) {
      this.#cursor.start = this.#cursor.end = Math.max(
        0,
        this.#cursor.start - 1,
      )
    } else {
      this.#cursor.start = this.#cursor.end = this.minSelected()
    }
  }

  #receiveKeyRightArrow({shift, alt}: KeyEvent) {
    if (alt) {
      const nextWordOffset = this.#nextWordOffset(shift)
      if (shift) {
        this.#cursor.end = nextWordOffset
      } else {
        this.#cursor.start = this.#cursor.end = nextWordOffset
      }
    } else if (shift) {
      this.#cursor.end = Math.min(this.#chars.length, this.#cursor.end + 1)
    } else if (isEmptySelection(this.#cursor)) {
      this.#cursor.start = this.#cursor.end = Math.min(
        this.#chars.length,
        this.#cursor.start + 1,
      )
    } else {
      this.#cursor.start = this.#cursor.end = this.maxSelected()
    }
  }

  #updateWidth() {
    this.#maxLineWidth = this.#chars
      .map(unicode.charWidth)
      .reduce((a, b) => a + b, 0 as number)
  }

  #deleteSelection() {
    this.#chars = this.#chars
      .slice(0, this.minSelected())
      .concat(this.#chars.slice(this.maxSelected()))
    this.#cursor.start = this.#cursor.end = this.minSelected()
    this.#updateWidth()
  }

  #receiveKeyBackspace() {
    if (isEmptySelection(this.#cursor)) {
      if (this.#cursor.start === 0) {
        return
      }
      this.#chars = this.#chars
        .slice(0, this.#cursor.start - 1)
        .concat(this.#chars.slice(this.#cursor.start))
      this.#cursor.start = this.#cursor.end = this.#cursor.start - 1
    } else {
      this.#deleteSelection()
    }
  }

  #receiveKeyDelete() {
    if (isEmptySelection(this.#cursor)) {
      if (this.#cursor.start > this.#chars.length - 1) {
        return
      }
      this.#maxLineWidth -= unicode.charWidth(this.#chars[this.#cursor.start])
      this.#chars = this.#chars
        .slice(0, this.#cursor.start)
        .concat(this.#chars.slice(this.#cursor.start + 1))
    } else {
      this.#deleteSelection()
    }
  }

  #receiveKeyDeleteWord() {
    if (!isEmptySelection(this.#cursor)) {
      return this.#deleteSelection()
    }

    if (this.#cursor.start === 0) {
      return
    }

    const offset = this.#prevWordOffset(false)
    this.#chars = this.#chars
      .slice(0, offset)
      .concat(this.#chars.slice(this.#cursor.start))
    this.#cursor.start = this.#cursor.end = offset
    this.#updateWidth()
  }

  /**
   * Insert a newline followed by the current line's leading whitespace.
   */
  #receiveEnterWithIndent() {
    const indent = this.#currentLineIndent()
    const chars = ['\n', ...indent]
    if (isEmptySelection(this.#cursor)) {
      this.#chars = this.#chars
        .slice(0, this.#cursor.start)
        .concat(chars, this.#chars.slice(this.#cursor.start))
      this.#cursor.start = this.#cursor.end = this.#cursor.start + chars.length
    } else {
      this.#chars = this.#chars
        .slice(0, this.minSelected())
        .concat(chars, this.#chars.slice(this.maxSelected()))
      this.#cursor.start = this.#cursor.end = this.minSelected() + chars.length
    }
  }

  /**
   * Indent the current line. Uses tabs if any line starts with a tab,
   * otherwise uses two spaces.
   */
  #receiveIndent() {
    const indent = this.#useTabs() ? ['\t'] : [' ', ' ']
    const lineStart = this.#currentLineStart()
    this.#chars = this.#chars
      .slice(0, lineStart)
      .concat(indent, this.#chars.slice(lineStart))
    this.#cursor.start += indent.length
    this.#cursor.end += indent.length
  }

  /**
   * Remove one level of indentation from the current line.
   */
  #receiveDedent() {
    const lineStart = this.#currentLineStart()
    if (this.#chars[lineStart] === '\t') {
      this.#chars = this.#chars
        .slice(0, lineStart)
        .concat(this.#chars.slice(lineStart + 1))
      this.#cursor.start = Math.max(lineStart, this.#cursor.start - 1)
      this.#cursor.end = Math.max(lineStart, this.#cursor.end - 1)
    } else if (
      this.#chars[lineStart] === ' ' &&
      this.#chars[lineStart + 1] === ' '
    ) {
      this.#chars = this.#chars
        .slice(0, lineStart)
        .concat(this.#chars.slice(lineStart + 2))
      this.#cursor.start = Math.max(lineStart, this.#cursor.start - 2)
      this.#cursor.end = Math.max(lineStart, this.#cursor.end - 2)
    }
  }

  /**
   * Returns the leading whitespace characters of the current line.
   */
  #currentLineIndent(): string[] {
    const lineStart = this.#currentLineStart()
    const indent: string[] = []
    for (let i = lineStart; i < this.#chars.length; i++) {
      if (this.#chars[i] === ' ' || this.#chars[i] === '\t') {
        indent.push(this.#chars[i])
      } else {
        break
      }
    }
    return indent
  }

  /**
   * Returns the index in #chars where the current line starts.
   */
  #currentLineStart(): number {
    const pos = Math.min(this.#cursor.end, this.#chars.length)
    for (let i = pos - 1; i >= 0; i--) {
      if (this.#chars[i] === '\n') {
        return i + 1
      }
    }
    return 0
  }

  /**
   * Returns true if any line in the current text starts with a tab character.
   */
  #useTabs(): boolean {
    for (let i = 0; i < this.#chars.length; i++) {
      if (this.#chars[i] === '\t' && (i === 0 || this.#chars[i - 1] === '\n')) {
        return true
      }
    }
    return false
  }
}

function isEmptySelection(cursor: Cursor) {
  return cursor.start === cursor.end
}

function isInSelection(
  cursorMin: Point,
  cursorMax: Point,
  scanTextPosition: Point,
) {
  if (scanTextPosition.y < cursorMin.y || scanTextPosition.y > cursorMax.y) {
    return false
  }

  if (scanTextPosition.y === cursorMin.y) {
    if (scanTextPosition.x < cursorMin.x) {
      return false
    }
  }

  if (scanTextPosition.y === cursorMax.y) {
    if (scanTextPosition.x >= cursorMax.x) {
      return false
    }
  }

  return true
}

function isAccentChar(char: string) {
  return ACCENTS[char] !== undefined
}

const ACCENTS: {[T in string]?: {[U in string]?: string}} = {
  '‵': {
    A: 'À',
    E: 'È',
    I: 'Ì',
    O: 'Ò',
    U: 'Ù',
    N: 'Ǹ',
    a: 'à',
    e: 'è',
    i: 'ì',
    o: 'ò',
    u: 'ù',
    n: 'ǹ',
  },
  '¸': {
    C: 'Ç',
    D: 'Ḑ',
    E: 'Ȩ',
    G: 'Ģ',
    H: 'Ḩ',
    K: 'Ķ',
    L: 'Ļ',
    N: 'Ņ',
    R: 'Ŗ',
    S: 'Ş',
    T: 'Ţ',
    c: 'ç',
    d: 'ḑ',
    e: 'ȩ',
    g: 'ģ',
    h: 'ḩ',
    k: 'ķ',
    l: 'ļ',
    n: 'ņ',
    r: 'ŗ',
    s: 'ş',
    t: 'ţ',
  },
  '´': {
    A: 'Á',
    C: 'Ć',
    E: 'É',
    G: 'Ǵ',
    I: 'Í',
    K: 'Ḱ',
    L: 'Ĺ',
    M: 'Ḿ',
    N: 'Ń',
    O: 'Ó',
    P: 'Ṕ',
    R: 'Ŕ',
    S: 'Ś',
    U: 'Ú',
    W: 'Ẃ',
    Y: 'Ý',
    a: 'á',
    c: 'ć',
    e: 'é',
    g: 'ǵ',
    i: 'í',
    k: 'ḱ',
    l: 'ĺ',
    m: 'ḿ',
    n: 'ń',
    o: 'ó',
    p: 'ṕ',
    r: 'ŕ',
    s: 'ś',
    u: 'ú',
    w: 'ẃ',
    y: 'ý',
  },
  ˆ: {
    A: 'Â',
    C: 'Ĉ',
    E: 'Ê',
    G: 'Ĝ',
    H: 'Ĥ',
    I: 'Î',
    J: 'Ĵ',
    O: 'Ô',
    S: 'Ŝ',
    U: 'Û',
    W: 'Ŵ',
    Y: 'Ŷ',
    a: 'â',
    c: 'ĉ',
    e: 'ê',
    g: 'ĝ',
    h: 'ĥ',
    i: 'î',
    j: 'ĵ',
    o: 'ô',
    s: 'ŝ',
    u: 'û',
    w: 'ŵ',
    y: 'ŷ',
  },
  '˜': {
    A: 'Ã',
    I: 'Ĩ',
    N: 'Ñ',
    O: 'Õ',
    U: 'Ũ',
    Y: 'Ỹ',
    a: 'ã',
    i: 'ĩ',
    n: 'ñ',
    o: 'õ',
    u: 'ũ',
    y: 'ỹ',
  },
  '¯': {
    A: 'Ā',
    E: 'Ē',
    I: 'Ī',
    O: 'Ō',
    U: 'Ū',
    Y: 'Ȳ',
    a: 'ā',
    e: 'ē',
    i: 'ī',
    o: 'ō',
    u: 'ū',
    y: 'ȳ',
  },
  '¨': {
    A: 'Ä',
    E: 'Ë',
    I: 'Ï',
    O: 'Ö',
    U: 'Ü',
    W: 'Ẅ',
    X: 'Ẍ',
    Y: 'Ÿ',
    a: 'ä',
    e: 'ë',
    i: 'ï',
    o: 'ö',
    u: 'ü',
    w: 'ẅ',
    x: 'ẍ',
    y: 'ÿ',
  },
}
const ACCENT_KEYS: {[T in string]: string} = {
  'A-a': '‵',
  'A-c': '¸',
  'A-e': '´',
  'A-i': 'ˆ',
  'A-n': '˜',
  'A-o': '¯',
  'A-s': '¸',
  'A-u': '¨',
}
function accentChar(accent: string, char: string) {
  return ACCENTS[accent]?.[char] ?? char
}

function isKeyAccent(event: KeyEvent) {
  if (!event.alt || event.ctrl) {
    return false
  }

  return ACCENT_KEYS[event.full] !== undefined
}

const RESET_RE = /^\x1b\[0?m$/

function isTabSigil(char: string) {
  return char === '\t'
}
