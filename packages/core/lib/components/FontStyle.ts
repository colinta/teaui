import {bold, italic, strikeout, underline} from '../ansi.js'
import {type Props as ViewProps} from '../View.js'
import {ComposedView} from '../ComposedView.js'
import {ToggleGroup} from './ToggleGroup.js'
import {type FormField, type FormInput, toFormField} from './Form.js'

export interface FontStyleValue {
  bold: boolean
  italic: boolean
  underline: boolean
  strikethrough: boolean
}

export interface FontStyleProps extends ViewProps {
  value: FontStyleValue
  onChange?: (value: FontStyleValue) => void
  /**
   * The name of this input's value in its `Form`.
   */
  formName?: string
  /**
   * When false, the toggles are drawn dimmed and can't be changed. Defaults to
   * true.
   */
  isEnabled?: boolean
}

/**
 * Lets users choose text formatting: bold, italic, underline, and strikethrough.
 * Each style can be toggled independently, so users can combine them.
 *
 * Built from a ToggleGroup, which draws the toggles (and the form error arrow).
 */
export class FontStyle extends ComposedView implements FormInput {
  readonly toggleGroup: ToggleGroup

  #value: FontStyleValue
  #onChange?: (value: FontStyleValue) => void
  #formName: string
  #isEnabled: boolean

  constructor(props: FontStyleProps) {
    super(props)

    this.#value = props.value
    this.#onChange = props.onChange
    this.#formName = props.formName ?? ''
    this.#isEnabled = props.isEnabled ?? true
    this.toggleGroup = new ToggleGroup({
      titles: LABELS,
      selected: selectedIndices(props.value),
      multiple: true,
      isEnabled: this.#isEnabled,
      onChange: this.#selectionDidChange,
    })
    this.add(this.toggleGroup)
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
    this.toggleGroup.isEnabled = value
  }

  formData(): FormField[] {
    return [toFormField(this.#formName, {...this.#value})]
  }

  /**
   * The toggle group draws the error arrow. (It has no formName, so its form
   * doesn't update it directly.)
   */
  setIsFormValid(isValid: boolean) {
    this.toggleGroup.setIsFormValid(isValid)
  }

  setIsFormSubmitting(isSubmitting: boolean) {
    this.toggleGroup.setIsFormSubmitting(isSubmitting)
  }

  get value(): FontStyleValue {
    return this.#value
  }

  set value(value: FontStyleValue) {
    this.#value = value
    this.#updateToggleGroup()
  }

  update(props: FontStyleProps) {
    this.#value = props.value
    this.#onChange = props.onChange
    this.#formName = props.formName ?? ''
    this.#isEnabled = props.isEnabled ?? true
    this.#updateToggleGroup()
    super.update(props)
  }

  #selectionDidChange = (_changed: number, selected: number[]) => {
    const value = valueFromSelected(selected)
    this.#value = value
    this.#onChange?.(value)
  }

  #updateToggleGroup() {
    this.toggleGroup.update({
      titles: LABELS,
      selected: selectedIndices(this.#value),
      multiple: true,
      isEnabled: this.#isEnabled,
      onChange: this.#selectionDidChange,
    })
  }
}

function selectedIndices(value: FontStyleValue): number[] {
  const selected: number[] = []
  KEYS.forEach((key, index) => {
    if (value[key]) {
      selected.push(index)
    }
  })
  return selected
}

function valueFromSelected(selected: number[]): FontStyleValue {
  const value: FontStyleValue = {
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
  }
  for (const index of selected) {
    value[KEYS[index]] = true
  }
  return value
}

const LABELS = [bold('B'), italic('I'), underline('U'), strikeout('S')]
const KEYS: (keyof FontStyleValue)[] = [
  'bold',
  'italic',
  'underline',
  'strikethrough',
]
