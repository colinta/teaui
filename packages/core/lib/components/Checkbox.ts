import * as unicode from '@teaui/term'

import type {Viewport} from '../Viewport.js'
import {type View} from '../View.js'
import {type Props as ContainerProps, Container} from '../Container.js'
import {Text} from './Text.js'
import {Rect, Point, Size} from '../geometry.js'
import {
  type HotKey,
  type MouseEvent,
  isMouseClicked,
  styleTextForHotKey,
} from '../events/index.js'
import {childTheme} from '../UI.js'
import {Style} from '../Style.js'
import {System} from '../System.js'

interface StyleProps {
  title?: string
  value: boolean
  onChange?: (value: boolean) => void
  hotKey?: HotKey
}

type Props = StyleProps & ContainerProps

export class Checkbox extends Container {
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

  childTheme(view: View) {
    return childTheme(
      super.childTheme(view),
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

  naturalSize(available: Size): Size {
    return super.naturalSize(available).grow(CHECKBOX_WIDTH, 0)
  }

  receiveMouse(event: MouseEvent, system: System) {
    super.receiveMouse(event, system)

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

    const uiStyle = this.theme.ui({
      isPressed: this.isPressed,
      isHover: this.isHover || hasFocus,
    })

    viewport.paint(uiStyle)

    const boxWidth = CHECKBOX_WIDTH
    const naturalSize = super.naturalSize(
      viewport.contentSize.shrink(boxWidth, 0),
    )
    const offset = new Point(
      boxWidth,
      Math.round((viewport.contentSize.height - naturalSize.height) / 2),
    )

    const chars = hasFocus ? BOX_FOCUS : BOX
    const box = chars[this.boxStyle()][this.#value ? 'checked' : 'unchecked']
    const textStyle = hasFocus
      ? uiStyle.merge(new Style({bold: true}))
      : uiStyle
    viewport.write(box, new Point(0, offset.y), textStyle)
    viewport.clipped(new Rect(offset, naturalSize), textStyle, inside => {
      super.render(inside)
    })
  }

  boxStyle(): 'checkbox' | 'radio' {
    return 'checkbox'
  }
}

export class Radio extends Checkbox {
  boxStyle(): 'checkbox' | 'radio' {
    return 'radio'
  }
}

const BOX: Record<
  'checkbox' | 'radio',
  Record<'unchecked' | 'checked', string>
> = {
  checkbox: {
    unchecked: '☐ ',
    checked: '◼︎ ',
  },
  radio: {
    unchecked: '◯ ',
    checked: '⦿ ',
  },
}

const BOX_FOCUS: Record<
  'checkbox' | 'radio',
  Record<'unchecked' | 'checked', string>
> = {
  checkbox: {
    unchecked: '🞐 ',
    checked: '🞕 ',
  },
  radio: {
    unchecked: '◎ ',
    checked: '🞋 ',
  },
}

const CHECKBOX_WIDTH = 2
