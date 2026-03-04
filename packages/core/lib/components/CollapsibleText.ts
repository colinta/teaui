import * as unicode from '@teaui/term'

import type {Viewport} from '../Viewport.js'
import {View, type Props as ViewProps} from '../View.js'
import {Style} from '../Style.js'
import {Point, Size} from '../geometry.js'
import {type MouseEvent, isMouseClicked} from '../events/index.js'
import {System} from '../System.js'

interface Props extends ViewProps {
  text: string
  style?: Style
}

export class CollapsibleText extends View {
  #lines: string[] = []
  #style: Props['style']
  #isCollapsed = true

  constructor(props: Props) {
    super(props)
    this.#update(props)
  }

  update(props: Props) {
    this.#update(props)
    super.update(props)
  }

  #update({text, style}: Props) {
    this.#style = style
    this.#lines = text.split('\n')
  }

  get text(): string {
    return this.#lines.join('\n')
  }
  set text(value: string) {
    this.#lines = value.split('\n')
    this.invalidateSize()
  }

  naturalSize(available: Size): Size {
    if (this.#lines.length === 0) {
      return Size.zero
    }

    if (this.#lines.length === 1) {
      const {width: lineWidth, height: lineHeight} = unicode.stringSize(
        this.#lines,
        available.width,
      )
      if (lineWidth <= available.width && lineHeight === 1) {
        return new Size(lineWidth, 1)
      }

      if (this.#isCollapsed) {
        return new Size(lineWidth + 2, 1)
      }

      return new Size(lineWidth + 2, lineHeight)
    }

    if (this.#isCollapsed) {
      const lineWidth = unicode.lineWidth(this.#lines[0])
      return new Size(lineWidth + 2, 1)
    }

    return new Size(unicode.stringSize(this.#lines, available.width)).grow(2, 0)
  }

  receiveMouse(event: MouseEvent, system: System) {
    super.receiveMouse(event, system)

    if (isMouseClicked(event)) {
      this.#isCollapsed = !this.#isCollapsed
      this.invalidateSize()
    }
  }

  render(viewport: Viewport) {
    if (viewport.isEmpty) {
      return
    }

    const lines = this.#lines
    if (!lines.length) {
      return
    }

    const startingStyle = Style.NONE
    viewport.usingPen(this.#style, pen => {
      const {width, height} = unicode.stringSize(
        lines,
        viewport.contentSize.width,
      )
      const point = new Point(0, 0).mutableCopy()
      let offsetX = 0
      if (viewport.contentSize.width < width || height > 1) {
        viewport.registerMouse('mouse.button.left')
        viewport.write(
          this.#isCollapsed ? '► ' : '▼ ',
          Point.zero,
          this.theme.text({isPressed: this.isPressed}),
        )
        offsetX = 2
      }
      point.x = offsetX

      for (const line of this.#lines) {
        let didWrap = false

        for (const char of unicode.printableChars(line)) {
          const width = unicode.charWidth(char)
          if (width === 0) {
            pen.mergePen(Style.fromSGR(char, startingStyle))
            continue
          }

          if (!this.#isCollapsed && point.x >= viewport.contentSize.width) {
            didWrap = true
            point.x = offsetX
            point.y += 1
          }

          // don't print preceding whitespace after line wrap
          if (didWrap && char.match(/\s/)) {
            continue
          }
          didWrap = false

          if (
            point.x >= viewport.visibleRect.minX() &&
            point.x + width - 1 < viewport.visibleRect.maxX() &&
            point.y >= viewport.visibleRect.minY()
          ) {
            viewport.write(char, point)
          }

          point.x += width
        }

        point.y += 1
        if (point.y >= viewport.visibleRect.maxY()) {
          break
        }
        point.x = offsetX
      }
    })
  }
}
