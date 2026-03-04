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
    return childTheme(super.childTheme(view), this.isPressed, this.isHover)
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
    const [left, right] = this.#borderSize()
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

  #borderSize(): [number, number] {
    const [left, right] = BORDERS[this.#border]
    return [unicode.lineWidth(left), unicode.lineWidth(right)]
  }

  receiveMouse(event: MouseEvent, system: System) {
    super.receiveMouse(event, system)

    if (isMouseClicked(event)) {
      this.#onClick?.()
    }
  }

  receiveKey(_: KeyEvent) {
    this.#onClick?.()
  }

  render(viewport: Viewport) {
    if (viewport.isEmpty) {
      return super.render(viewport)
    }

    viewport.registerMouse(['mouse.button.left', 'mouse.move'])

    if (this.#hotKey) {
      viewport.registerHotKey(toHotKeyDef(this.#hotKey))
    }

    const textStyle = this.theme.ui({
      isPressed: this.isPressed,
      isHover: this.isHover,
    })
    const topsStyle = this.theme.ui({
      isPressed: this.isPressed,
      isHover: this.isHover,
      isOrnament: true,
    })

    viewport.visibleRect.forEachPoint(pt => {
      if (pt.y === 0 && viewport.contentSize.height > 2) {
        viewport.write('▔', pt, topsStyle)
      } else if (
        pt.y === viewport.contentSize.height - 1 &&
        viewport.contentSize.height > 2
      ) {
        viewport.write('▁', pt, topsStyle)
      } else {
        viewport.write(' ', pt, textStyle)
      }
    })

    const [leftWidth, rightWidth] = this.#borderSize()
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

    const [left, right] = BORDERS[this.#border],
      leftX = offset.x - leftWidth,
      rightX = offset.x + naturalSize.width

    for (let y = 0; y < naturalSize.height; y++) {
      viewport.write(left, new Point(leftX, offset.y + y), textStyle)
      viewport.write(right, new Point(rightX, offset.y + y), textStyle)
    }
    viewport.clipped(new Rect(offset, naturalSize), textStyle, inside => {
      super.render(inside)
    })
  }
}

const BORDERS: Record<Border, BorderChars> = {
  default: ['[ ', ' ]'],
  arrows: [' ', ' '],
  none: [' ', ' '],
}

// E0A0 
// E0B0 
