import type {Viewport} from '../Viewport.js'
import {type Props as ViewProps, type View} from '../View.js'
import {ComposedView} from '../ComposedView.js'
import {Text} from './Text.js'
import {Style} from '../Style.js'
import {Rect, Point, Size} from '../geometry.js'
import {
  type HotKey,
  type HotKeyDef,
  type KeyEvent,
  type MouseEvent,
  isMouseClicked,
  match,
  styleTextForHotKey,
  hotKeyToString,
  toHotKeyDef,
} from '../events/index.js'
import {type LegendItem} from '../types.js'
import {childPalette} from '../UI.js'
import {
  type FormField,
  type FormInput,
  formErrorSize,
  renderFormError,
} from './Form.js'

interface StyleProps {
  title?: string
  value: boolean
  onChange?: (value: boolean) => void
  hotKey?: HotKey
  /**
   * The name of this input's value in its `Form`.
   */
  formName?: string
  /**
   * When false, the checkbox is drawn dimmed and can't be toggled.
   * Defaults to true.
   */
  isEnabled?: boolean
}

type Props = StyleProps & ViewProps

export class Checkbox extends ComposedView implements FormInput {
  #value: boolean = false
  #hotKey?: HotKey
  #onChange: StyleProps['onChange']
  #textView: Text
  #hasFocus: boolean = false
  #formName = ''
  #isEnabled = true
  #isFormValid = true
  #isFormSubmitting = false

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

  #update({title, hotKey, value, onChange, formName, isEnabled}: Props) {
    const styledText = hotKey ? styleTextForHotKey(title ?? '', hotKey) : title
    this.#textView.text = styledText ?? ''
    this.#value = value
    this.#hotKey = hotKey
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

  formData(): FormField[] {
    return [{name: this.#formName, type: 'boolean', value: this.#value}]
  }

  setIsFormValid(isValid: boolean) {
    if (isValid === this.#isFormValid) {
      return
    }

    this.#isFormValid = isValid
    this.invalidateSize()
  }

  setIsFormSubmitting(isSubmitting: boolean) {
    if (isSubmitting === this.#isFormSubmitting) {
      return
    }

    this.#isFormSubmitting = isSubmitting
    this.invalidateRender()
  }

  get #isInteractive() {
    return this.#isEnabled && !this.#isFormSubmitting
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
      super.naturalSize(available).grow(CHECKBOX_WIDTH, 0).minHeight(1),
    )
  }

  receiveMouse(event: MouseEvent) {
    if (isMouseClicked(event)) {
      this.#toggle()
    }
  }

  /**
   * Toggles on Enter/Space (while focused) or on the hotKey (from anywhere).
   */
  receiveKey(event: KeyEvent) {
    if (
      (this.#hotKey && match(toHotKeyDef(this.#hotKey), event)) ||
      TOGGLE_KEYS.some(key => match(key, event))
    ) {
      this.#toggle()
    }
  }

  #toggle() {
    if (!this.#isInteractive) {
      return
    }

    this.#value = !this.#value
    this.#onChange?.(this.#value)
  }

  render(viewport: Viewport) {
    if (this.#hotKey) {
      viewport.registerHotKey(toHotKeyDef(this.#hotKey))
    }
    const hasFocus = viewport.registerFocus({isDefault: false})
    this.#hasFocus = hasFocus
    if (viewport.isEmpty) {
      return super.render(viewport)
    }

    viewport.registerMouse(['mouse.button.left', 'mouse.move'])

    renderFormError(
      viewport,
      this.#isFormValid,
      // a disabled checkbox keeps its focus, but doesn't draw the focus style
      inside => this.#renderCheckbox(inside, hasFocus && this.#isInteractive),
      contentSize => this.#layout(contentSize).offset.y,
    )
  }

  /**
   * The size and location of the title, next to the box.
   */
  #layout(contentSize: Size): {offset: Point; naturalSize: Size} {
    const naturalSize = super
      .naturalSize(contentSize.shrink(CHECKBOX_WIDTH, 0))
      .minHeight(1)
    const offset = new Point(
      CHECKBOX_WIDTH,
      Math.round((contentSize.height - naturalSize.height) / 2),
    )
    return {offset, naturalSize}
  }

  #renderCheckbox(viewport: Viewport, hasFocus: boolean) {
    const {offset, naturalSize} = this.#layout(viewport.contentSize)

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

    const isInteractive = this.#isInteractive
    const uiStyle = this.purpose.ui({
      variant: 'raised',
      isPressed: isInteractive && this.isPressed,
      isHover: isInteractive && this.isHover,
      hasFocus,
    })
    viewport.paint(uiStyle)

    const box = BOX[this.#value ? 'checked' : 'unchecked']
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

const BOX: Record<'unchecked' | 'checked', string> = {
  unchecked: '☐ ',
  checked: '◼︎ ',
}

const CHECKBOX_WIDTH = 2
// unmodified Enter/Space only (HotKeyDef chars are matched against event.name)
const TOGGLE_KEYS: HotKeyDef[] = [{char: 'return'}, {char: 'space'}]
