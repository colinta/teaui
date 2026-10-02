import {bold, italic, strikeout, underline} from '../ansi.js'
import type {Screen} from '../Screen.js'
import type {Viewport} from '../Viewport.js'
import {type Props as ViewProps, View} from '../View.js'
import type {Size} from '../geometry.js'
import {ToggleGroup} from './ToggleGroup.js'

export interface FontStyleValue {
  bold: boolean
  italic: boolean
  underline: boolean
  strikethrough: boolean
}

export interface FontStyleProps extends ViewProps {
  value: FontStyleValue
  onChange?: (value: FontStyleValue) => void
}

/**
 * Lets users choose text formatting: bold, italic, underline, and strikethrough.
 * Each style can be toggled independently, so users can combine them.
 */
export class FontStyle extends View {
  readonly toggleGroup: ToggleGroup

  #value: FontStyleValue
  #onChange?: (value: FontStyleValue) => void

  constructor(props: FontStyleProps) {
    super(props)

    this.#value = props.value
    this.#onChange = props.onChange
    this.toggleGroup = new ToggleGroup({
      titles: LABELS,
      selected: selectedIndices(props.value),
      multiple: true,
      onChange: this.#selectionDidChange,
    })
  }

  get value(): FontStyleValue {
    return this.#value
  }

  set value(value: FontStyleValue) {
    this.#value = value
    this.#updateToggleGroup()
    this.invalidateRender()
  }

  update(props: FontStyleProps) {
    this.#value = props.value
    this.#onChange = props.onChange
    this.#updateToggleGroup()
    super.update(props)
  }

  naturalSize(available: Size): Size {
    return this.toggleGroup.naturalSize(available)
  }

  render(viewport: Viewport) {
    this.toggleGroup.purpose = this.purpose
    this.toggleGroup.render(viewport)
  }

  didMount(screen: Screen) {
    super.didMount(screen)
    this.toggleGroup.moveToScreen(screen)
  }

  didUnmount(screen: Screen) {
    this.toggleGroup.moveToScreen(undefined)
    super.didUnmount(screen)
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
