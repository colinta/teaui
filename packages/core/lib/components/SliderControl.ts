import type {Viewport} from '../Viewport.js'
import {View} from '../View.js'
import {Point, Size, interpolate} from '../geometry.js'
import {type MouseEvent, isMousePressEnd} from '../events/index.js'
import type {Style} from '../Style.js'
import type {Orientation} from '../types.js'

/**
 * How much of a frame the control draws around the bar:
 * - 'none': just the bar
 * - 'rails': the two long edges (the Slider's buttons provide the end caps)
 * - 'box': the long edges, plus the end caps and corners
 */
export type Frame = 'none' | 'rails' | 'box'

export interface SliderControlState {
  direction: Orientation
  frame: Frame
  range: [number, number]
  value: number
  step: number
  /** The Slider has keyboard focus (it isn't focusable itself) */
  hasFocus: boolean
}

/**
 * The interactive track of a Slider, for choosing a value by clicking or
 * dragging. Internal; not publicly exported.
 */
export class SliderControl extends View {
  #state: SliderControlState = {
    direction: 'horizontal',
    frame: 'none',
    range: [0, 1],
    value: 0,
    step: 1,
    hasFocus: false,
  }
  #isTracking = false
  #onChange: (value: number) => void

  constructor(onChange: (value: number) => void) {
    super()
    this.#onChange = onChange
  }

  /**
   * Called by Slider while it renders, so it doesn't invalidate anything.
   */
  sync(state: SliderControlState) {
    this.#state = state
  }

  naturalSize(available: Size): Size {
    return available
  }

  receiveMouse(event: MouseEvent) {
    if (event.name === 'mouse.button.down') {
      this.#isTracking = true
    } else if (isMousePressEnd(event)) {
      this.#isTracking = false
      return
    }

    // down, dragInside, dragOutside, enter, exit: the value follows the mouse,
    // even outside of the control (it is clamped to the range).
    if (this.#isTracking && event.name.startsWith('mouse.button.')) {
      this.#setValue(
        this.#valueAt(this.#isHorizontal ? event.position.x : event.position.y),
      )
    }
  }

  get #isHorizontal() {
    return this.#state.direction === 'horizontal'
  }

  /**
   * The bar doesn't fill the main axis when the control draws end caps.
   */
  get #inset() {
    return this.#state.frame === 'box' ? 1 : 0
  }

  #valueAt(pos: number): number {
    const {range, step} = this.#state
    const length = this.#isHorizontal
      ? this.contentSize.width
      : this.contentSize.height
    let value = interpolate(
      pos,
      [this.#inset, length - 1 - this.#inset],
      range,
      true,
    )
    if (~~step === step) {
      value = range[0] + Math.round((value - range[0]) / step) * step
    }
    return value
  }

  #setValue(value: number) {
    const {range} = this.#state
    value = Math.min(range[1], Math.max(range[0], value))
    if (value !== this.#state.value) {
      this.#state = {...this.#state, value}
      this.#onChange(value)
    }
  }

  render(viewport: Viewport) {
    if (viewport.isEmpty) {
      return
    }

    viewport.registerMouse(['mouse.move', 'mouse.button.left'])

    const style = this.purpose.ui({
      variant: 'raised',
      isHover: this.isHover || this.#isTracking,
      hasFocus: this.#state.hasFocus,
    })

    if (this.#isHorizontal) {
      this.#renderHorizontal(viewport, style)
    } else {
      this.#renderVertical(viewport, style)
    }
  }

  /**
   * The position of the scrubber, in the bar's coordinates (the main axis,
   * excluding the inset)
   */
  #scrubberPosition(length: number): number {
    const inset = this.#inset
    return Math.round(
      interpolate(
        this.#state.value,
        this.#state.range,
        [inset, length - inset - 1],
        true,
      ),
    )
  }

  #renderHorizontal(viewport: Viewport, style: Style) {
    const {width} = viewport.contentSize
    const {frame, hasFocus} = this.#state
    const border = hasFocus ? BORDER_FOCUS : BORDER_DEFAULT
    const inset = this.#inset
    const barY = frame === 'none' ? 0 : 1

    if (frame !== 'none') {
      const bottomY = 2
      const rails = border.horiz.repeat(Math.max(0, width - 2 * inset))
      viewport.write(rails, new Point(inset, 0), style)
      viewport.write(rails, new Point(inset, bottomY), style)
    }

    if (frame === 'box') {
      viewport.write(border.topLeft, new Point(0, 0), style)
      viewport.write(border.vert, new Point(0, 1), style)
      viewport.write(border.bottomLeft, new Point(0, 2), style)
      viewport.write(border.topRight, new Point(width - 1, 0), style)
      viewport.write(border.vert, new Point(width - 1, 1), style)
      viewport.write(border.bottomRight, new Point(width - 1, 2), style)
    }

    const position = this.#scrubberPosition(width)
    let bar = ''
    for (let x = inset; x < width - inset; x++) {
      bar +=
        x === position
          ? BAR.fill
          : x === position + 1
            ? BAR.right
            : x === position - 1
              ? BAR.left
              : BAR.horiz
    }
    viewport.write(bar, new Point(inset, barY), style)
  }

  #renderVertical(viewport: Viewport, style: Style) {
    const {height} = viewport.contentSize
    const {frame, hasFocus} = this.#state
    const border = hasFocus ? BORDER_FOCUS : BORDER_DEFAULT
    const inset = this.#inset
    const barX = frame === 'none' ? 0 : 1

    if (frame !== 'none') {
      const rightX = 2
      for (let y = inset; y < height - inset; y++) {
        viewport.write(border.vert, new Point(0, y), style)
        viewport.write(border.vert, new Point(rightX, y), style)
      }
    }

    if (frame === 'box') {
      viewport.write(
        `${border.topLeft}${border.horiz}${border.topRight}`,
        new Point(0, 0),
        style,
      )
      viewport.write(
        `${border.bottomLeft}${border.horiz}${border.bottomRight}`,
        new Point(0, height - 1),
        style,
      )
    }

    const position = this.#scrubberPosition(height)
    for (let y = inset; y < height - inset; y++) {
      const char =
        y === position
          ? BAR.fill
          : y === position + 1
            ? BAR.vertBelow
            : y === position - 1
              ? BAR.vertAbove
              : BAR.vert
      viewport.write(char, new Point(barX, y), style)
    }
  }
}

const BAR = {
  left: '╴',
  right: '╶',
  horiz: '─',
  fill: '█',
  vert: '│',
  vertAbove: '╵',
  vertBelow: '╷',
} as const

interface Border {
  topLeft: string
  topRight: string
  bottomLeft: string
  bottomRight: string
  horiz: string
  vert: string
}

const BORDER_DEFAULT: Border = {
  topLeft: '╭',
  topRight: '╮',
  bottomLeft: '╰',
  bottomRight: '╯',
  horiz: '─',
  vert: '│',
}

const BORDER_FOCUS: Border = {
  topLeft: '╔',
  topRight: '╗',
  bottomLeft: '╚',
  bottomRight: '╝',
  horiz: '═',
  vert: '║',
}
