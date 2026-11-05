import {Point, Size} from '../geometry.js'
import {Style} from '../Style.js'
import {type Props as ViewProps, View} from '../View.js'
import {Viewport} from '../Viewport.js'
import {
  type KeyEvent,
  type MouseEvent,
  isMouseClicked,
} from '../events/index.js'
import {
  type FormField,
  type FormInput,
  formErrorSize,
  renderFormError,
} from './Form.js'

interface Props extends ViewProps {
  /**
   * Current toggle state.
   * @default false
   */
  value?: boolean
  onChange?: (value: boolean) => void
  /**
   * The name of this input's value in its `Form`.
   */
  formName?: string
  /**
   * When false, the toggle is drawn dimmed and can't be changed.
   * @default true
   */
  isEnabled?: boolean
}

export class Toggle extends View implements FormInput {
  #value = false
  #sliderLocation: number | undefined
  #onChange: Props['onChange']
  #formName = ''
  #isEnabled = true
  #isFormValid = true
  #isFormSubmitting = false

  constructor(props: Props = {}) {
    super(props)
    this.#update(props)
    this.#sliderLocation = this.#targetLocation()
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

  update(props: Props) {
    this.#update(props)
    super.update(props)
  }

  #update({value, onChange, formName, isEnabled}: Props) {
    if (value !== undefined) {
      this.#value = value
    }
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

  naturalSize(available: Size): Size {
    return formErrorSize(available, this.#isFormValid, () => TOGGLE_SIZE)
  }

  receiveKey(event: KeyEvent) {
    switch (event.name) {
      case 'return':
      case 'space':
        this.#toggle()
        break
    }
  }

  receiveMouse(event: MouseEvent) {
    if (isMouseClicked(event)) {
      this.#toggle()
    }
  }

  receiveTick(dt: number): boolean {
    const target = this.#targetLocation()
    this.#sliderLocation ??= target

    if (this.#sliderLocation === target) {
      return false
    }

    const dx = dt / ANIMATION_MS
    if (target > this.#sliderLocation) {
      this.#sliderLocation = Math.min(target, this.#sliderLocation + dx)
    } else {
      this.#sliderLocation = Math.max(target, this.#sliderLocation - dx)
    }

    return true
  }

  render(viewport: Viewport) {
    viewport.registerFocus({isDefault: false})
    viewport.registerMouse(['mouse.button.left', 'mouse.move'])
    viewport.registerTick()

    if (viewport.isEmpty) {
      return
    }

    renderFormError(viewport, this.#isFormValid, inside =>
      this.#renderToggle(inside),
    )
  }

  #renderToggle(viewport: Viewport) {
    const sliderX = this.#sliderX(viewport.contentSize.height)
    const trackStyle = this.#trackStyle()
    const sliderStyle = this.#sliderStyle()

    if (viewport.contentSize.height <= COMPACT_HEIGHT) {
      this.#renderCompact(viewport, sliderX, trackStyle, sliderStyle)
    } else {
      this.#renderNormal(viewport, sliderX, trackStyle, sliderStyle)
    }

    if (!this.#isInteractive) {
      viewport.restyle(this.#disabledStyle(), undefined, {merge: true})
    }
  }

  #toggle() {
    if (!this.#isInteractive) {
      return
    }

    this.value = !this.#value
    this.#onChange?.(this.#value)
  }

  #renderNormal(
    viewport: Viewport,
    sliderX: number,
    trackStyle: Style,
    sliderStyle: Style,
  ) {
    viewport.write(TRACK_TOP, Point.zero, trackStyle)
    viewport.write(TRACK_BOTTOM, new Point(0, 1), trackStyle)
    viewport.write(this.#sliderTop(), new Point(sliderX, 0), sliderStyle)
    viewport.write(this.#sliderBottom(), new Point(sliderX, 1), sliderStyle)
  }

  #renderCompact(
    viewport: Viewport,
    sliderX: number,
    trackStyle: Style,
    sliderStyle: Style,
  ) {
    if (sliderX <= COMPACT_SLIDER_RANGE[0]) {
      viewport.write(
        COMPACT_TRACK,
        new Point(COMPACT_TRACK_OFF_X, 0),
        trackStyle,
      )
    } else {
      viewport.write(COMPACT_TRACK, Point.zero, trackStyle)
    }
    viewport.write(this.#compactSlider(), new Point(sliderX, 0), sliderStyle)
  }

  #sliderX(height: number): number {
    const location = this.#sliderLocation ?? this.#targetLocation()
    const [left, right] =
      height <= COMPACT_HEIGHT ? COMPACT_SLIDER_RANGE : SLIDER_RANGE

    return Math.round(left + (right - left) * location)
  }

  #targetLocation(): number {
    return this.#value ? ON_LOCATION : OFF_LOCATION
  }

  #sliderTop(): string {
    return this.#value ? SLIDER_ON_TOP : SLIDER_OFF_TOP
  }

  #sliderBottom(): string {
    return this.#value ? SLIDER_ON_BOTTOM : SLIDER_OFF_BOTTOM
  }

  #compactSlider(): string {
    return this.#value ? COMPACT_SLIDER_ON : COMPACT_SLIDER_OFF
  }

  #trackStyle(): Style {
    return new Style({
      foreground: this.#value ? ON_TRACK_COLOR : OFF_TRACK_COLOR,
    })
  }

  #disabledStyle(): Style {
    return new Style({dim: true})
  }

  #sliderStyle(): Style {
    return new Style({
      foreground: SLIDER_COLOR,
      bold: true,
    })
  }
}

const TOGGLE_SIZE = new Size(6, 2)
const COMPACT_HEIGHT = 1

const TRACK_TOP = '┌────┐'
const TRACK_BOTTOM = '└────┘'
const SLIDER_OFF_TOP = '┏━┓'
const SLIDER_OFF_BOTTOM = '┗━┛'
const SLIDER_ON_TOP = '▗▄▖'
const SLIDER_ON_BOTTOM = '▝▀▘'
const COMPACT_TRACK = '╶──╴'
const COMPACT_SLIDER_OFF = '⬜︎'
const COMPACT_SLIDER_ON = '⬛︎'

const SLIDER_RANGE: [number, number] = [0, 3]
const COMPACT_SLIDER_RANGE: [number, number] = [0, 4]
const COMPACT_TRACK_OFF_X = 2
const OFF_LOCATION = 0
const ON_LOCATION = 1
const ANIMATION_MS = 120

const OFF_TRACK_COLOR = '#808080(244)'
const ON_TRACK_COLOR = '#34C759(40)'
const SLIDER_COLOR = '#FFFFFF(15)'
