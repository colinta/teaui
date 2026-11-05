import type {Viewport} from '../Viewport.js'
import {type Props as ViewProps, type View} from '../View.js'
import {type Props as ContainerProps, Container} from '../Container.js'
import {ComposedView} from '../ComposedView.js'
import {Text} from './Text.js'
import {Style} from '../Style.js'
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
import {
  type FormField,
  type FormInput,
  formErrorSize,
  renderFormError,
  toFormField,
} from './Form.js'

export interface RadioGroupProps<T> extends ContainerProps {
  value?: T
  onChange?: (value: T) => void
  /**
   * The name of this group's value in its `Form`.
   */
  formName?: string
  /**
   * When false, all of the group's radios are drawn dimmed and can't be
   * selected. Defaults to true.
   */
  isEnabled?: boolean
}

/**
 * A layout-transparent container that manages the selected value for all Radio
 * descendants. Radios may be nested inside layout containers; the nearest
 * RadioGroup ancestor owns their selection.
 *
 * In a `Form`, the group is the input: its radios show its validity and
 * submitting state.
 */
export class RadioGroup<T = unknown> extends Container implements FormInput {
  #value: T | undefined
  #onChange: RadioGroupProps<T>['onChange']
  #formName = ''
  #isEnabled = true
  #isFormValid = true
  #isFormSubmitting = false

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

  #update({value, onChange, formName, isEnabled}: RadioGroupProps<T>) {
    this.#value = value
    this.#onChange = onChange
    this.#formName = formName ?? ''
    this.isEnabled = isEnabled ?? true
  }

  get formName() {
    return this.#formName
  }
  set formName(value: string) {
    this.#formName = value
  }

  get isEnabled() {
    return this.#isEnabled
  }
  set isEnabled(value: boolean) {
    if (value === this.#isEnabled) {
      return
    }

    this.#isEnabled = value
    this.invalidateRender()
  }

  get isFormValid() {
    return this.#isFormValid
  }

  get isFormSubmitting() {
    return this.#isFormSubmitting
  }

  formData(): FormField[] {
    if (this.#value === undefined) {
      return []
    }

    return [toFormField(this.#formName, this.#value)]
  }

  setIsFormValid(isValid: boolean) {
    if (isValid === this.#isFormValid) {
      return
    }

    this.#isFormValid = isValid
    // every radio draws (or removes) the error arrow
    for (const radio of this.findDescendants(isRadio)) {
      radio.invalidateSize()
    }
  }

  setIsFormSubmitting(isSubmitting: boolean) {
    if (isSubmitting === this.#isFormSubmitting) {
      return
    }

    this.#isFormSubmitting = isSubmitting
    this.invalidateRender()
  }
}

export interface RadioProps<T> extends ViewProps {
  title?: string
  value: T
  hotKey?: HotKey
  /**
   * When false, the radio is drawn dimmed and can't be selected. Defaults to
   * true.
   */
  isEnabled?: boolean
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
  #isEnabled = true

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

  #update({title, hotKey, value, isEnabled}: RadioProps<T>) {
    const styledText = hotKey ? styleTextForHotKey(title ?? '', hotKey) : title
    this.#textView.text = styledText ?? ''
    this.#value = value
    this.#hotKey = hotKey
    this.isEnabled = isEnabled ?? true
  }

  get isEnabled() {
    return this.#isEnabled
  }
  set isEnabled(value: boolean) {
    if (value === this.#isEnabled) {
      return
    }

    this.#isEnabled = value
    this.invalidateRender()
  }

  get #isFormValid() {
    return this.#radioGroup()?.isFormValid ?? true
  }

  /**
   * This radio and its group are enabled, and the group's form isn't
   * submitting.
   */
  get #isInteractive() {
    const group = this.#radioGroup()
    return (
      this.#isEnabled &&
      (!group || (group.isEnabled && !group.isFormSubmitting))
    )
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
    return formErrorSize(available, this.#isFormValid, available =>
      super.naturalSize(available).grow(RADIO_WIDTH, 0).minHeight(1),
    )
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
    if (!this.#isInteractive) {
      return
    }

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

    renderFormError(
      viewport,
      this.#isFormValid,
      // a disabled radio keeps its focus, but doesn't draw the focus style
      inside => this.#renderRadio(inside, hasFocus && this.#isInteractive),
      contentSize => this.#layout(contentSize).offset.y,
    )
  }

  /**
   * The size and location of the title, next to the radio button.
   */
  #layout(contentSize: Size): {offset: Point; naturalSize: Size} {
    const naturalSize = super
      .naturalSize(contentSize.shrink(RADIO_WIDTH, 0))
      .minHeight(1)
    const offset = new Point(
      RADIO_WIDTH,
      Math.round((contentSize.height - naturalSize.height) / 2),
    )
    return {offset, naturalSize}
  }

  #renderRadio(viewport: Viewport, hasFocus: boolean) {
    const isInteractive = this.#isInteractive
    const uiStyle = this.purpose.ui({
      variant: 'raised',
      isPressed: isInteractive && this.isPressed,
      isHover: isInteractive && this.isHover,
      hasFocus,
    })

    viewport.paint(uiStyle)

    const {offset, naturalSize} = this.#layout(viewport.contentSize)

    const isSelected = this.#radioGroup()?.isSelected(this.#value) ?? false
    const box = BOX[isSelected ? 'selected' : 'unselected']
    const textStyle = hasFocus ? uiStyle.merge({underline: true}) : uiStyle
    viewport.write(box, new Point(0, offset.y), textStyle)
    viewport.clipped(new Rect(offset, naturalSize), textStyle, inside => {
      super.render(inside)
    })

    if (!isInteractive) {
      viewport.restyle(this.#disabledStyle(), undefined, {merge: true})
    }
  }

  #disabledStyle(): Style {
    return new Style({dim: true})
  }
}

function isRadio(view: View): view is Radio {
  return view instanceof Radio
}

const BOX: Record<'unselected' | 'selected', string> = {
  unselected: '◯ ',
  selected: '⦿ ',
}

const RADIO_WIDTH = 2
