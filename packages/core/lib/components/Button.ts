import * as unicode from '@teaui/term'

import type {Viewport} from '../Viewport.js'
import {type Props as ContainerProps, Container} from '../Container.js'
import {Text} from './Text.js'
import {Rect, Point, Size} from '../geometry.js'
import {
  type MouseEvent,
  isMouseClicked,
  HotKey,
  KeyEvent,
  styleTextForHotKey,
  toHotKeyDef,
} from '../events/index.js'
import {childTheme} from '../UI.js'
import type {View} from '../View.js'
import {Alignment} from './types.js'
import {System} from '../System.js'

type Border = 'default' | 'arrows' | 'none'
type BorderChars = [string, string]

export interface Props extends ContainerProps {
  title?: string
  align?: Alignment
  border?: Border
  onClick?: () => void
  hotKey?: HotKey
}

export class Button extends Container {
  #hotKey?: HotKey
  #onClick?: Props['onClick']
  #textView: Text
  #border: Border = 'default'
  #align: Alignment = 'center'
  #hasFocus: boolean = false

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

  childTheme(view: View) {
    return childTheme(
      super.childTheme(view),
      this.isPressed,
      this.isHover || this.#hasFocus,
    )
  }

  #hasCustomChildren() {
    return this.children.length !== 1 || this.children.at(0) !== this.#textView
  }

  #update({title, border, align, hotKey, onClick}: Props) {
    const styledText = hotKey ? styleTextForHotKey(title ?? '', hotKey) : title
    this.#textView.text = styledText ?? ''
    this.#align = align ?? 'center'
    this.#border = border ?? 'default'
    this.#hotKey = hotKey
    this.#onClick = onClick
  }

  naturalSize(available: Size): Size {
    const [left, right] = this.#borderSize(false)
    return super.naturalSize(available).grow(left + right, 0)
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

  #borderSize(hasFocus: boolean): [number, number] {
    const borders = hasFocus ? BORDERS_FOCUS : BORDERS
    const [left, right] = borders[this.#border]
    return [unicode.lineWidth(left), unicode.lineWidth(right)]
  }

  receiveMouse(event: MouseEvent, system: System) {
    super.receiveMouse(event, system)

    if (isMouseClicked(event)) {
      this.#onClick?.()
    }
  }

  receiveKey(event: KeyEvent) {
    switch (event.name) {
      case 'return':
        this.#onClick?.()
        break
    }
  }

  render(viewport: Viewport) {
    const hasFocus = viewport.registerFocus()
    this.#hasFocus = hasFocus
    if (viewport.isEmpty) {
      return super.render(viewport)
    }

    viewport.registerMouse(['mouse.button.left', 'mouse.move'])

    if (this.#hotKey) {
      viewport.registerHotKey(toHotKeyDef(this.#hotKey))
    }

    const textStyle = this.theme.ui({
      isPressed: this.isPressed,
      isHover: this.isHover || hasFocus,
    })
    const topsStyle = this.theme.ui({
      isPressed: this.isPressed,
      isHover: this.isHover || hasFocus,
      isOrnament: true,
    })

    const useEmoji = this.theme.emoji
    viewport.visibleRect.forEachPoint(pt => {
      if (useEmoji && pt.y === 0 && viewport.contentSize.height > 2) {
        viewport.write(BUTTON_TOP, pt, topsStyle)
      } else if (
        useEmoji &&
        pt.y === viewport.contentSize.height - 1 &&
        viewport.contentSize.height > 2
      ) {
        viewport.write(BUTTON_BOTTOM, pt, topsStyle)
      } else {
        viewport.write(' ', pt, textStyle)
      }
    })

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
      super.render(inside)
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
