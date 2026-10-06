import * as unicode from '@teaui/term'

import type {Viewport} from '../Viewport.js'
import {
  type Props as PressableProps,
  type PressableStyles,
  Pressable,
} from './Pressable.js'
import {Text} from './Text.js'
import {Rect, Point, Size} from '../geometry.js'
import type {Style} from '../Style.js'
import {
  HotKey,
  KeyEvent,
  styleTextForHotKey,
  toHotKeyDef,
  hotKeyToString,
  match,
} from '../events/index.js'
import type {View} from '../View.js'
import {type TextAlignment, type LegendItem} from '../types.js'

type Border = 'default' | 'arrows' | 'none'
type BorderChars = [string, string]

export interface Props extends PressableProps {
  title?: string
  align?: TextAlignment
  border?: Border
  hotKey?: HotKey
}

export class Button extends Pressable {
  #align: TextAlignment = 'center'
  #border: Border = 'default'
  #hotKey?: HotKey
  #textView: Text

  constructor(props: Props) {
    super(props)

    this.#textView = new Text({alignment: 'center'})
    this.add(this.#textView)

    this.#update(props)
  }

  update(props: Props) {
    this.#update(props)
    super.update(props)
  }

  #hasCustomChildren() {
    return this.children.length !== 1 || this.children.at(0) !== this.#textView
  }

  #update({title, align, border, hotKey}: Props) {
    const styledText = hotKey ? styleTextForHotKey(title ?? '', hotKey) : title
    this.#textView.text = styledText ?? ''
    this.#align = align ?? 'center'
    this.#border = border ?? 'default'
    this.#hotKey = hotKey
  }

  naturalSize(available: Size): Size {
    const [left, right] = this.#borderSize(false)
    return super
      .naturalSize(available.shrink(left + right, 0))
      .grow(left + right, 0)
  }

  get title() {
    return this.#textView.text
  }
  set title(value: string | undefined) {
    const styledText = this.#hotKey
      ? styleTextForHotKey(value ?? '', this.#hotKey)
      : (value ?? '')
    this.#textView.text = styledText
    this.invalidateSize()
  }

  legendItems(): LegendItem[] {
    if (!this.#hotKey) {
      return []
    }
    return [{key: hotKeyToString(this.#hotKey), label: this.title ?? ''}]
  }

  #borderSize(hasFocus: boolean): [number, number] {
    const borders = hasFocus ? BORDERS_FOCUS : BORDERS
    const [left, right] = borders[this.#border]
    return [unicode.lineWidth(left), unicode.lineWidth(right)]
  }

  receiveKey(event: KeyEvent) {
    if (this.#hotKey && match(toHotKeyDef(this.#hotKey), event)) {
      this.click()
    } else {
      super.receiveKey(event)
    }
  }

  render(viewport: Viewport) {
    if (this.#hotKey) {
      viewport.registerHotKey(toHotKeyDef(this.#hotKey))
    }
    super.render(viewport)
  }

  protected renderContent(
    viewport: Viewport,
    {text: textStyle, ornament, hasFocus}: PressableStyles,
  ) {
    this.#renderEdges(viewport, ornament)

    const borders = hasFocus ? BORDERS_FOCUS : BORDERS
    let [left, right] = borders[this.#border]
    let [leftWidth, rightWidth] = this.#borderSize(hasFocus)

    if (this.#hasCustomChildren() && this.#hotKey) {
      const hotKey = styleTextForHotKey('', this.#hotKey) + ' '
      left += hotKey
      leftWidth += unicode.lineWidth(hotKey)
    }

    const naturalSize = super.naturalSize(
      viewport.contentSize.shrink(leftWidth + rightWidth, 0),
    )
    const offsetLeft =
        this.#align === 'center'
          ? Math.round((viewport.contentSize.width - naturalSize.width) / 2)
          : this.#align === 'left'
            ? 1
            : viewport.contentSize.width - naturalSize.width - 1,
      offset = new Point(
        offsetLeft,
        Math.round((viewport.contentSize.height - naturalSize.height) / 2),
      )

    let leftX = offset.x - leftWidth,
      rightX = offset.x + naturalSize.width
    for (let y = 0; y < naturalSize.height; y++) {
      viewport.write(left, new Point(leftX, offset.y + y), textStyle)
      viewport.write(right, new Point(rightX, offset.y + y), textStyle)
    }
    viewport.clipped(new Rect(offset, naturalSize), textStyle, inside => {
      this.renderChildren(inside)
    })
  }

  /**
   * Tall buttons (with an emoji palette) get a thin edge along the top and bottom
   */
  #renderEdges(viewport: Viewport, ornament: Style) {
    const {height} = viewport.contentSize
    if (!this.purpose.emoji || height <= 2) {
      return
    }

    viewport.visibleRect.forEachPoint(pt => {
      if (pt.y === 0) {
        viewport.write(BUTTON_TOP, pt, ornament)
      } else if (pt.y === height - 1) {
        viewport.write(BUTTON_BOTTOM, pt, ornament)
      }
    })
  }

  add(child: View, at?: number) {
    super.add(child, at)
    if (this.#hasCustomChildren()) {
      this.#textView.removeFromParent()
    }
  }
}

const BUTTON_TOP = '▔'
const BUTTON_BOTTOM = '▁'

const BORDERS: Record<Border, BorderChars> = {
  default: ['[ ', ' ]'],
  // arrows: [' ', ' '],
  arrows: ['\uE0B3', '\uE0B1'],
  none: [' ', ' '],
}

const BORDERS_FOCUS: Record<Border, BorderChars> = {
  default: ['⟦ ', ' ⟧'],
  // arrows: [' ', ' '],
  arrows: ['\uE0B2', '\uE0B0'],
  none: [' ', ' '],
}

// E0A0 \uE0A0\uE0A1\uE0A2          
// E0B0 \uE0B0\uE0B1\uE0B2\uE0B3     
