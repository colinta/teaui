import type {Viewport} from '../Viewport.js'
import type {View} from '../View.js'
import {type Props as ContainerProps, Container} from '../Container.js'
import {Style} from '../Style.js'
import {Point, Rect, Size} from '../geometry.js'
import {Box} from './Box.js'
import {Button, type Props as ButtonProps} from './Button.js'
import {Label} from './Label.js'
import {Spinner} from './Spinner.js'
import {Stack} from './Stack.js'
import {Text} from './Text.js'
import {ZStack} from './ZStack.js'

export type FormField =
  | {name: string; type: 'string'; value: string}
  | {name: string; type: 'number'; value: number}
  | {name: string; type: 'boolean'; value: boolean}
  | {name: string; type: 'date'; value: Date}
  | {name: string; type: 'string[]'; value: string[]}
  | {name: string; type: 'number[]'; value: number[]}
  | {name: string; type: 'boolean[]'; value: boolean[]}
  | {name: string; type: 'date[]'; value: Date[]}
  | {name: string; type: 'dateRange'; value: [Date, Date]}
  | {name: string; type: 'unknown'; value: unknown}

export interface FormError {
  name: string
  message: string
}

export type FormErrors = FormError[]

/**
 * Implemented by views that take part in a `Form`. Inputs with an empty
 * `formName` are not part of the form.
 */
export interface FormInput {
  formName: string
  isEnabled: boolean
  formData(): FormField[]
  setIsFormValid(isValid: boolean): void
  setIsFormSubmitting(isSubmitting: boolean): void
}

export interface Props extends ContainerProps {
  /**
   * Called with the form data when the form is submitted. Returns the errors,
   * or `[]` if the data is valid. If there are errors, `onSubmit` is not called.
   */
  onValidate?: (formData: FormField[]) => FormErrors
  /**
   * Called with the (valid) form data. Returns the errors to show, or
   * `undefined` on success. While a returned Promise is pending, the form is
   * 'submitting': its inputs are disabled, and a spinner is shown.
   */
  onSubmit?: (
    formData: FormField[],
  ) => Promise<FormErrors | undefined> | FormErrors | undefined
}

/**
 * Collects the data of its `FormInput` descendants, validates it, and submits
 * it. Error messages are shown at the top of the form, invalid inputs are
 * marked with an arrow, and `Label`s for invalid inputs are drawn in red.
 *
 * Submit the form with a `FormSubmitButton`, `form.submit()`, or an `Input`
 * whose `multiline` mode is `submit` or `mixed`.
 */
export class Form extends Container {
  #onValidate: Props['onValidate']
  #onSubmit: Props['onSubmit']
  #errors: FormErrors = []
  #isSubmitting = false

  #stack: Stack
  #errorsStack: Stack
  #errorsBox: Box
  #spinner: Spinner

  constructor({child, children, ...props}: Props = {}) {
    super(props)

    this.#errorsStack = Stack.down()
    this.#errorsBox = new Box({
      border: 'none',
      padding: 1,
      isVisible: false,
      child: this.#errorsStack,
    })
    this.#stack = Stack.down([this.#errorsBox])
    this.#spinner = new Spinner({isVisible: false})
    super.add(new ZStack({children: [this.#stack, this.#spinner]}))

    if (child) {
      this.add(child)
    }
    for (const view of children ?? []) {
      this.add(view)
    }

    this.#update(props)
  }

  update(props: Props) {
    this.#update(props)
    super.update(props)
  }

  #update({onValidate, onSubmit}: Props) {
    this.#onValidate = onValidate
    this.#onSubmit = onSubmit
  }

  get errors(): FormErrors {
    return this.#errors
  }

  get isSubmitting() {
    return this.#isSubmitting
  }

  get children(): readonly View[] {
    return this.#stack.children.slice(1)
  }

  add(child: View, at?: number) {
    // the errors box is always first
    this.#stack.add(child, at === undefined ? undefined : at + 1)
  }

  removeChild(child: View) {
    if (child === this.#errorsBox) {
      return
    }
    this.#stack.removeChild(child)
  }

  removeAllChildren() {
    for (const child of this.children) {
      this.#stack.removeChild(child)
    }
  }

  /**
   * Validates the form data with `onValidate`, and if it is valid, calls
   * `onSubmit`. The errors from either replace the current error messages.
   * Errors thrown by `onValidate` or `onSubmit` are not caught.
   */
  async submit(): Promise<void> {
    if (this.#isSubmitting) {
      return
    }

    const formData = this.#formInputs().flatMap(input => input.formData())
    const errors = this.#onValidate?.(formData) ?? []
    this.#setErrors(errors)
    if (errors.length) {
      return
    }

    const result = this.#onSubmit?.(formData)
    if (!(result instanceof Promise)) {
      this.#setErrors(result ?? [])
      return
    }

    this.#setIsSubmitting(true)
    try {
      this.#setErrors((await result) ?? [])
    } finally {
      this.#setIsSubmitting(false)
    }
  }

  render(viewport: Viewport) {
    // inputs may have been added since the last change
    this.#sync()
    super.render(viewport)
  }

  #formInputs(): (View & FormInput)[] {
    return this.findDescendants(isFormInput).filter(input => input.formName)
  }

  #setErrors(errors: FormErrors) {
    this.#errors = errors
    this.#errorsStack.removeAllChildren()
    for (const {message} of errors) {
      this.#errorsStack.add(
        new Text({text: message, style: this.#errorStyle()}),
      )
    }
    this.#errorsBox.isVisible = errors.length > 0
    this.#sync()
  }

  #setIsSubmitting(isSubmitting: boolean) {
    this.#isSubmitting = isSubmitting
    this.#spinner.isVisible = isSubmitting
    this.#sync()
  }

  /**
   * Pushes the validity and submitting state to the inputs, labels, and submit
   * buttons.
   */
  #sync() {
    const invalidNames = new Set(this.#errors.map(({name}) => name))
    for (const input of this.#formInputs()) {
      input.setIsFormValid(!invalidNames.has(input.formName))
      input.setIsFormSubmitting(this.#isSubmitting)
    }

    for (const label of this.findDescendants(isLabel)) {
      label.isValid = !invalidNames.has(label.for)
    }

    for (const button of this.findDescendants(isFormSubmitButton)) {
      button.setIsFormSubmitting(this.#isSubmitting)
    }
  }

  #errorStyle(): Style {
    return new Style({foreground: ERROR_COLOR})
  }
}

export type FormSubmitButtonProps = Omit<ButtonProps, 'onClick'>

/**
 * A Button that submits its `Form` ancestor. It is disabled while the form is
 * submitting.
 */
export class FormSubmitButton extends Button {
  #isFormSubmitting = false

  constructor(props: FormSubmitButtonProps) {
    super(props)
  }

  update(props: FormSubmitButtonProps) {
    super.update(props)
  }

  setIsFormSubmitting(isSubmitting: boolean) {
    if (isSubmitting === this.#isFormSubmitting) {
      return
    }

    this.#isFormSubmitting = isSubmitting
    this.invalidateRender()
  }

  protected get isInteractive(): boolean {
    return super.isInteractive && !this.#isFormSubmitting
  }

  /**
   * Submits the form - there is no `onClick`.
   */
  protected click() {
    if (!this.isInteractive) {
      return
    }

    void formAncestor(this)?.submit()
  }
}

/**
 * Whether `view` implements `FormInput`.
 */
export function isFormInput(view: View): view is View & FormInput {
  const input = view as View & Partial<FormInput>
  return (
    typeof input.formName === 'string' &&
    typeof input.formData === 'function' &&
    typeof input.setIsFormValid === 'function' &&
    typeof input.setIsFormSubmitting === 'function'
  )
}

/**
 * The nearest `Form` ancestor of `view`.
 */
export function formAncestor(view: View): Form | undefined {
  let ancestor = view.parent
  while (ancestor) {
    if (ancestor instanceof Form) {
      return ancestor
    }
    ancestor = ancestor.parent
  }
  return undefined
}

/**
 * Converts an input's value to a FormField. Values that aren't strings,
 * numbers, booleans, Dates, or arrays of those have type 'unknown'.
 */
export function toFormField(name: string, value: unknown): FormField {
  if (Array.isArray(value)) {
    return toFormArrayField(name, value)
  }
  if (typeof value === 'string') {
    return {name, type: 'string', value}
  }
  if (typeof value === 'number') {
    return {name, type: 'number', value}
  }
  if (typeof value === 'boolean') {
    return {name, type: 'boolean', value}
  }
  if (value instanceof Date) {
    return {name, type: 'date', value}
  }
  return {name, type: 'unknown', value}
}

/**
 * Converts an array of values to a FormField. The type comes from `elements`,
 * which defaults to the values - pass all possible values (e.g. a Dropdown's
 * choices) so that an empty array still has the correct type.
 */
export function toFormArrayField(
  name: string,
  value: unknown[],
  elements: readonly unknown[] = value,
): FormField {
  if (elements.every(element => typeof element === 'string')) {
    return {name, type: 'string[]', value: value as string[]}
  }
  if (elements.every(element => typeof element === 'number')) {
    return {name, type: 'number[]', value: value as number[]}
  }
  if (elements.every(element => typeof element === 'boolean')) {
    return {name, type: 'boolean[]', value: value as boolean[]}
  }
  if (elements.every(element => element instanceof Date)) {
    return {name, type: 'date[]', value: value as Date[]}
  }
  return {name, type: 'unknown', value}
}

/**
 * The natural size of an input, with room for the error arrow when it is
 * invalid.
 */
export function formErrorSize(
  available: Size,
  isValid: boolean,
  naturalSize: (available: Size) => Size,
): Size {
  if (isValid) {
    return naturalSize(available)
  }

  return naturalSize(available.shrink(ERROR_ARROW_WIDTH, 0)).grow(
    ERROR_ARROW_WIDTH,
    0,
  )
}

/**
 * Draws an input: when it is invalid, the error arrow is drawn on the left, and
 * the input is drawn to its right.
 *
 * @param arrowY The row of the arrow, given the size the input is drawn in.
 */
export function renderFormError(
  viewport: Viewport,
  isValid: boolean,
  draw: (viewport: Viewport) => void,
  arrowY: (contentSize: Size) => number = () => 0,
) {
  if (isValid) {
    draw(viewport)
    return
  }

  const contentSize = viewport.contentSize.shrink(ERROR_ARROW_WIDTH, 0)
  viewport.write(
    ERROR_ARROW,
    new Point(0, arrowY(contentSize)),
    new Style({foreground: ERROR_COLOR}),
  )
  viewport.clipped(new Rect(new Point(ERROR_ARROW_WIDTH, 0), contentSize), draw)
}

function isLabel(view: View): view is Label {
  return view instanceof Label
}

function isFormSubmitButton(view: View): view is FormSubmitButton {
  return view instanceof FormSubmitButton
}

const ERROR_COLOR = 'red'
const ERROR_ARROW = '→ '
const ERROR_ARROW_WIDTH = 2
