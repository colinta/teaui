import type {Viewport} from '../Viewport.js'
import {type Props as ViewProps, type View} from '../View.js'
import {type Props as ContainerProps, Container} from '../Container.js'
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

export interface RadioGroupProps<T> extends ContainerProps {
  value?: T
  onChange?: (value: T) => void
}

/**
 * A layout-transparent container that manages the selected value for all Radio
 * descendants. Radios may be nested inside layout containers; the nearest
 * RadioGroup ancestor owns their selection.
 */
export class RadioGroup<T = unknown> extends Container {
  #value: T | undefined
  #onChange: RadioGroupProps<T>['onChange']

  constructor(props: RadioGroupProps<T> = {}) {
    super(props)
    this.#update(props)
  }

  get value(): T | undefined {
    return this.#value
  }

  set value(value: T | undefined) {
    if (Object.is(value, this.#value)) {
      return
    }
    this.#value = value
    this.invalidateRender()
  }

  update(props: RadioGroupProps<T>) {
    this.#update(props)
    super.update(props)
  }

  isSelected(value: T): boolean {
    return Object.is(this.#value, value)
  }

  select(value: T) {
    if (this.isSelected(value)) {
      return
    }

    this.#value = value
    this.invalidateRender()
    this.#onChange?.(value)
  }

  #update({value, onChange}: RadioGroupProps<T>) {
    this.#value = value
    this.#onChange = onChange
  }
}

export interface RadioProps<T> extends ViewProps {
  title?: string
  value: T
  hotKey?: HotKey
}

/**
 * A radio option whose selected state and changes are managed by its nearest
 * RadioGroup ancestor. A Radio outside a RadioGroup has no meaningful selected
 * state and activating it has no effect.
 */
export class Radio<T = unknown> extends ComposedView {
  #value: T
  #hotKey?: HotKey
  #textView: Text
  #hasFocus: boolean = false

  constructor(props: RadioProps<T>) {
    super(props)

    this.#value = props.value
    this.#textView = new Text({alignment: 'center'})
    this.add(this.#textView)

    this.#update(props)
  }

  get value(): T {
    return this.#value
  }

  set value(value: T) {
    if (Object.is(value, this.#value)) {
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

  update(props: RadioProps<T>) {
    this.#update(props)
    super.update(props)
  }

  #update({title, hotKey, value}: RadioProps<T>) {
    const styledText = hotKey ? styleTextForHotKey(title ?? '', hotKey) : title
    this.#textView.text = styledText ?? ''
    this.#value = value
    this.#hotKey = hotKey
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
    return super.naturalSize(available).grow(RADIO_WIDTH, 0).minHeight(1)
  }

  receiveMouse(event: MouseEvent) {
    if (isMouseClicked(event)) {
      this.#select()
    }
  }

  receiveKey(_: import('../events/index.js').KeyEvent) {
    this.#select()
  }

  #select() {
    this.#radioGroup()?.select(this.#value)
  }

  #radioGroup(): RadioGroup<T> | undefined {
    let ancestor = this.parent
    while (ancestor) {
      if (ancestor instanceof RadioGroup) {
        return ancestor as RadioGroup<T>
      }
      ancestor = ancestor.parent
    }
    return undefined
  }

  render(viewport: Viewport) {
    const hasFocus = viewport.registerFocus({isDefault: false})
    this.#hasFocus = hasFocus
    if (viewport.isEmpty) {
      return super.render(viewport)
    }

    viewport.registerMouse(['mouse.button.left', 'mouse.move'])

    const uiStyle = this.purpose.ui({
      variant: 'raised',
      isPressed: this.isPressed,
      isHover: this.isHover,
      hasFocus,
    })

    viewport.paint(uiStyle)

    const naturalSize = super
      .naturalSize(viewport.contentSize.shrink(RADIO_WIDTH, 0))
      .minHeight(1)
    const offset = new Point(
      RADIO_WIDTH,
      Math.round((viewport.contentSize.height - naturalSize.height) / 2),
    )

    const isSelected = this.#radioGroup()?.isSelected(this.#value) ?? false
    const box = BOX[isSelected ? 'selected' : 'unselected']
    const textStyle = hasFocus ? uiStyle.merge({underline: true}) : uiStyle
    viewport.write(box, new Point(0, offset.y), textStyle)
    viewport.clipped(new Rect(offset, naturalSize), textStyle, inside => {
      super.render(inside)
    })
  }
}

const BOX: Record<'unselected' | 'selected', string> = {
  unselected: '◯ ',
  selected: '⦿ ',
}

const RADIO_WIDTH = 2
