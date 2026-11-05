import type {Viewport} from '../Viewport.js'
import {Style} from '../Style.js'
import {Text} from './Text.js'

type TextProps = Exclude<ConstructorParameters<typeof Text>[0], string>

export type Props = TextProps & {
  /**
   * The `formName` of the input this label describes. The nearest `Form`
   * ancestor marks the label invalid when that input has errors.
   */
  for: string
}

/**
 * Text that describes a form input, drawn in bold. When the input named by
 * `for` has errors, the label is drawn in red bold italics.
 */
export class Label extends Text {
  #for: string
  #isValid = true

  constructor({for: htmlFor, ...props}: Props) {
    super(props)
    this.#for = htmlFor
  }

  update({for: htmlFor, ...props}: Props) {
    this.#for = htmlFor
    super.update(props)
  }

  get for() {
    return this.#for
  }
  set for(value: string) {
    this.#for = value
  }

  get isValid() {
    return this.#isValid
  }
  set isValid(value: boolean) {
    if (value === this.#isValid) {
      return
    }

    this.#isValid = value
    this.invalidateRender()
  }

  render(viewport: Viewport) {
    super.render(viewport)
    viewport.restyle(this.#labelStyle(), undefined, {merge: true})
  }

  #labelStyle(): Style {
    if (this.#isValid) {
      return new Style({bold: true})
    }

    return this.#errorStyle()
  }

  #errorStyle(): Style {
    return new Style({foreground: 'red', bold: true, italic: true})
  }
}
