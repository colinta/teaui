import type {Viewport} from '../Viewport.js'
import {type Props as ViewProps, type View} from '../View.js'
import {ComposedView} from '../ComposedView.js'
import {Text} from './Text.js'
import {Rect, Point, Size} from '../geometry.js'
import {
  type HotKey,
  type MouseEvent,
  isMouseClicked,
  styleTextForHotKey,
  hotKeyToString,
} from '../events/index.js'
import {type LegendItem} from '../types.js'
import {childPalette} from '../UI.js'

interface StyleProps {
  title?: string
  value: boolean
  onChange?: (value: boolean) => void
  hotKey?: HotKey
}

type Props = StyleProps & ViewProps

export class Checkbox extends ComposedView {
  #value: boolean = false
  #hotKey?: HotKey
  #onChange: StyleProps['onChange']
  #textView: Text
  #hasFocus: boolean = false

  constructor(props: Props) {
    super(props)

    this.#textView = new Text({alignment: 'center'})
    this.add(this.#textView)

    this.#update(props)
  }

  get value() {
    return this.#value
  }
  set value(value: boolean) {
    if (value === this.#value) {
      return
    }
    this.#value = value
    this.invalidateRender()
  }

  childPalette(view: View) {
    return childPalette(
      super.childPalette(view),
      this.isPressed,
      this.isHover || this.#hasFocus,
    )
  }

  update(props: Props) {
    this.#update(props)
    super.update(props)
  }

  #update({title, hotKey, value, onChange}: Props) {
    const styledText = hotKey ? styleTextForHotKey(title ?? '', hotKey) : title
    this.#textView.text = styledText ?? ''
    this.#value = value
    this.#hotKey = hotKey
    this.#onChange = onChange
  }

  get title() {
    return this.#textView?.text
  }

  set title(value: string | undefined) {
    const styledText = this.#hotKey
      ? styleTextForHotKey(value ?? '', this.#hotKey)
      : value
    this.#textView.text = styledText ?? ''
    this.invalidateSize()
  }

  legendItems(): LegendItem[] {
    if (!this.#hotKey) {
      return []
    }
    return [{key: hotKeyToString(this.#hotKey), label: this.title ?? ''}]
  }

  naturalSize(available: Size): Size {
    return super.naturalSize(available).grow(CHECKBOX_WIDTH, 0).minHeight(1)
  }

  receiveMouse(event: MouseEvent) {
    if (isMouseClicked(event)) {
      this.#value = !this.#value
      this.#onChange?.(this.#value)
    }
  }

  receiveKey(_: import('../events/index.js').KeyEvent) {
    this.#value = !this.#value
    this.#onChange?.(this.#value)
  }

  render(viewport: Viewport) {
    const hasFocus = viewport.registerFocus({isDefault: false})
    this.#hasFocus = hasFocus
    if (viewport.isEmpty) {
      return super.render(viewport)
    }

    viewport.registerMouse(['mouse.button.left', 'mouse.move'])

    const boxWidth = CHECKBOX_WIDTH
    const naturalSize = super
      .naturalSize(viewport.contentSize.shrink(boxWidth, 0))
      .minHeight(1)
    const offset = new Point(
      boxWidth,
      Math.round((viewport.contentSize.height - naturalSize.height) / 2),
    )

    if (
      viewport.visibleRect.isEmpty &&
      this.children.length === 1 &&
      this.children[0] === this.#textView
    ) {
      // Keep the label's geometry/listeners up to date, even though neither
      // its glyphs nor the checkbox can be drawn. Focus registration stays above.
      // Custom children added by subclasses retain their inherited drawing pen.
      viewport.clipped(new Rect(offset, naturalSize), inside =>
        super.render(inside),
      )
      return
    }

    const uiStyle = this.purpose.ui({
      variant: 'raised',
      isPressed: this.isPressed,
      isHover: this.isHover,
      hasFocus,
    })
    viewport.paint(uiStyle)

    const box = BOX[this.#value ? 'checked' : 'unchecked']
    const textStyle = hasFocus ? uiStyle.merge({underline: true}) : uiStyle
    viewport.write(box, new Point(0, offset.y), textStyle)
    viewport.clipped(new Rect(offset, naturalSize), textStyle, inside => {
      super.render(inside)
    })
  }
}

const BOX: Record<'unchecked' | 'checked', string> = {
  unchecked: '☐ ',
  checked: '◼︎ ',
}

const CHECKBOX_WIDTH = 2
