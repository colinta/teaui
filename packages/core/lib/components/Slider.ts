import {Viewport} from '../Viewport.js'
import {type Props as ViewProps, View} from '../View.js'
import {Point, Rect, Size, interpolate} from '../geometry.js'
import {
  type KeyEvent,
  type MouseEvent,
  isMouseDragging,
  isMouseExit,
  isMouseClicked,
  isMousePressStart,
  isMousePressExit,
  isMousePressEnd,
} from '../events/index.js'
import type {Style} from '../Style.js'
import {type Orientation} from '../types.js'
import type {LegendItem} from './Legend.js'

const MIN = 5

type ButtonProps =
  | {
      /**
       * Whether to show ◃, ▹ buttons on either side of the slider.
       * Default: false
       */
      buttons?: false
      /**
       * If provided, values will be in fit the equation `min(range) + N * step`. Also
       * applies to the buttons, if they are visible.
       */
      step?: number
    }
  | {
      /**
       * Whether to show ◃, ▹ buttons on either side of the slider.
       * Default: false
       */
      buttons: true
      /**
       * If provided, values will be in fit the equation `min(range) + N * step`. Also
       * applies to the buttons, if they are visible.
       */
      step: number
    }

type Props = ViewProps &
  ButtonProps & {
    /**
     * What direction to draw the slider.
     * Default: 'horizontal'
     */
    direction?: Orientation
    /**
     * Whether to show a border around the slider.
     * Default: false
     */
    border?: boolean
    /**
     * Minimum and maximum values - inclusive.
     */
    range?: [number, number]
    /**
     * Current position of the slider, should be within the range
     */
    value?: number
    onChange?: (value: number) => void
  }

export class Slider extends View {
  // styles
  #direction: Orientation = 'horizontal'
  #border: boolean = false
  #buttons: boolean = false

  // position of slider
  #range: [number, number] = [0, 0]
  #value: number = 0
  #step: number = 1

  // focus
  #hasFocus: boolean = false

  // mouse information
  #contentSize?: Size = Size.zero
  #isPressingDecrease = false
  #isPressingIncrease = false
  #buttonTracking: 'off' | 'pressing' | 'dragging' = 'off'
  #isHoverSlider = false
  #isHoverDecrease = false
  #isHoverIncrease = false
  #onChange?: (value: number) => void

  constructor(props: Props) {
    super(props)
    this.#update(props)
  }

  update(props: Props) {
    this.#update(props)
    super.update(props)
  }

  get border() {
    return this.#border
  }
  set border(value: boolean) {
    if (value === this.#border) return
    this.#border = value
    this.invalidateSize()
  }

  #update({direction, border, buttons, range, value, step, onChange}: Props) {
    this.#direction = direction ?? 'horizontal'
    this.#border = border ?? false
    this.#buttons = buttons ?? false
    this.#range = range ?? [0, 1]
    this.#step = step ? Math.max(step, 1) : 1
    this.#onChange = onChange
    this.#value = value ?? this.#range[0]
  }

  get value() {
    return this.#value
  }
  set value(value: number) {
    this.#value = value
    if (value !== this.#value) {
      this.#value = value
      this.invalidateRender()
    }
  }

  naturalSize() {
    // try to have enough room for every value
    const min = Math.max(
      MIN,
      Math.ceil((this.#range[1] - this.#range[0]) / this.#step),
    )
    if (this.#direction === 'horizontal') {
      const minWidth = min + 2 * (this.#buttons ? 3 : this.#border ? 1 : 0)
      if (this.#border) {
        //╭─┬──
        //│◃│█╶
        //╰─┴──
        // ╭──
        // │█╶
        // ╰──
        return new Size(minWidth, 3)
      } else {
        // [◃]
        // █╶─
        return new Size(minWidth, 1)
      }
    } else {
      const minHeight =
        min +
        2 *
          (this.#buttons && this.#border
            ? 3
            : this.#buttons || this.#border
              ? 1
              : 0)
      if (this.#border) {
        // ╭─╮
        // │▵│
        // ├─┤ ╭─╮
        // │█│ │█│
        // │╷│ │╷│
        return new Size(3, minHeight)
      } else {
        // ▵
        // █   █
        // ╷   ╷
        return new Size(1, minHeight)
      }
    }
  }

  legendItems(): LegendItem[] {
    return [
      {key: ['left', 'right'], label: 'Adjust'},
      {key: 'home', label: 'Min'},
      {key: 'end', label: 'Max'},
    ]
  }

  receiveKey(event: KeyEvent) {
    const prev = this.#value
    switch (event.name) {
      case 'right':
      case 'down':
        this.#value = Math.min(this.#range[1], this.#value + this.#step)
        break
      case 'left':
      case 'up':
        this.#value = Math.max(this.#range[0], this.#value - this.#step)
        break
      case 'home':
        this.#value = this.#range[0]
        break
      case 'end':
        this.#value = this.#range[1]
        break
    }

    if (this.#value !== prev) {
      this.#onChange?.(this.#value)
    }
  }

  receiveMouse(event: MouseEvent) {
    if (this.#contentSize === undefined) {
      return
    }

    const prev = this.#value
    let pos: number,
      // the beginning of the slider area
      minSlider = 0,
      // the smaller dimension, ie the height of the horizontal slider
      // the bigger dimension, ie the width of the horizontal slider
      bigSize: number,
      // the end of the slider area
      maxSlider: number

    if (this.#direction === 'horizontal') {
      pos = event.position.x
      bigSize = this.#contentSize.width
    } else {
      pos = event.position.y
      bigSize = this.#contentSize.height
    }

    maxSlider = bigSize - 1

    if (this.#buttons) {
      if (this.#direction === 'horizontal') {
        //╭─┬
        //│◃│ or [◃]
        //╰─┴
        minSlider += 3
        maxSlider -= 3
      } else if (this.#border) {
        // ╭─╮
        // │▵│
        // ├─┤
        minSlider += 3
        maxSlider -= 3
      } else {
        // ▵
        minSlider += 1
        maxSlider -= 1
      }
    } else if (this.#border) {
      //╭
      //│ or ╭─╮
      //╰
      minSlider += 1
      maxSlider -= 1
    }

    const isHoverDecrease = pos >= 0 && pos < minSlider
    const isHoverIncrease = pos > maxSlider && pos < bigSize
    const isMouseDown =
      event.name === 'mouse.button.down' || this.#buttonTracking === 'pressing'
    const isDragging =
      (!isMouseDown && isMouseDragging(event)) ||
      this.#buttonTracking === 'dragging'
    let shouldUpdate = false

    if (isDragging) {
      this.#isHoverSlider = true
      this.#isHoverDecrease = false
      this.#isHoverIncrease = false
    } else if (isMouseExit(event)) {
      this.#isHoverSlider = false
      this.#isHoverDecrease = false
      this.#isHoverIncrease = false
    } else {
      this.#isHoverSlider = pos >= minSlider && pos <= maxSlider
      this.#isHoverDecrease = isHoverDecrease
      this.#isHoverIncrease = isHoverIncrease
    }

    if (isMouseDown && pos < minSlider) {
      if (isMousePressStart(event)) {
        this.#isPressingDecrease = true
        this.#buttonTracking = 'pressing'
      } else if (isMousePressExit(event)) {
        this.#isPressingDecrease = false
      }

      if (isMouseClicked(event) && pos < minSlider) {
        this.#value = prev > this.#range[1] ? this.#range[1] : prev - this.#step
        this.#buttonTracking = 'off'
        shouldUpdate = true
      }
    } else if (isMouseDown && pos > maxSlider) {
      if (isMousePressStart(event)) {
        this.#isPressingIncrease = true
        this.#buttonTracking = 'pressing'
      } else if (isMousePressExit(event)) {
        this.#isPressingIncrease = false
      }

      if (isMouseClicked(event) && pos > maxSlider) {
        this.#value = prev > this.#range[1] ? this.#range[1] : prev + this.#step
        this.#buttonTracking = 'off'
        shouldUpdate = true
      }
    } else if (isMousePressEnd(event)) {
      this.#buttonTracking = 'off'
    } else if (isMouseDown || isDragging) {
      this.#buttonTracking = 'dragging'
      this.#value = interpolate(pos, [minSlider, maxSlider], this.#range, true)
      shouldUpdate = true

      if (~~this.#step === this.#step) {
        this.#value =
          this.#range[0] +
          Math.round((this.#value - this.#range[0]) / this.#step) * this.#step
      }
    }

    if (shouldUpdate) {
      this.#value = Math.min(
        this.#range[1],
        Math.max(this.#range[0], this.#value),
      )

      if (this.#value !== prev) {
        this.#onChange?.(this.#value)
      }
    }
  }

  #borderChars(hasFocus: boolean): typeof BORDER_DEFAULT {
    return hasFocus ? BORDER_FOCUS : BORDER_DEFAULT
  }

  #arrowChars(): typeof ARROWS_DEFAULT {
    return {
      up: this.#isHoverDecrease ? ARROWS_HOVER.up : ARROWS_DEFAULT.up,
      down: this.#isHoverIncrease ? ARROWS_HOVER.down : ARROWS_DEFAULT.down,
      left: this.#isHoverDecrease ? ARROWS_HOVER.left : ARROWS_DEFAULT.left,
      right: this.#isHoverIncrease ? ARROWS_HOVER.right : ARROWS_DEFAULT.right,
    }
  }

  #renderHorizontal(
    viewport: Viewport,
    sliderStyle: Style,
    decreaseButtonStyle: Style,
    increaseButtonStyle: Style,
  ) {
    const hasFocus = this.#hasFocus
    const hasBorder = this.#border && viewport.contentSize.height >= 3
    const height = hasBorder ? 3 : 1
    const marginX = this.#buttons ? 3 : hasBorder ? 1 : 0
    const outerRect = new Rect([0, 0], [viewport.contentSize.width, height])
    const innerRect = new Rect(
      [marginX, 0],
      [viewport.contentSize.width - 2 * marginX, height],
    )
    viewport.registerMouse(['mouse.move', 'mouse.button.left'], outerRect)

    const border = this.#borderChars(hasFocus)

    if (this.#buttons) {
      const arrows = this.#arrowChars()

      if (hasBorder) {
        viewport.write(
          `${border.topLeft}${border.horiz}${border.horizSepTop}`,
          Point.zero,
          decreaseButtonStyle,
        )
        viewport.write(
          `${border.vert}${arrows.left}${border.vert}`,
          Point.zero.offset(0, 1),
          decreaseButtonStyle,
        )
        viewport.write(
          `${border.bottomLeft}${border.horiz}${border.horizSepBottom}`,
          Point.zero.offset(0, 2),
          decreaseButtonStyle,
        )

        const rx = viewport.contentSize.width - 3
        viewport.write(
          `${border.horizSepTop}${border.horiz}${border.topRight}`,
          Point.zero.offset(rx, 0),
          increaseButtonStyle,
        )
        viewport.write(
          `${border.vert}${arrows.right}${border.vert}`,
          Point.zero.offset(rx, 1),
          increaseButtonStyle,
        )
        viewport.write(
          `${border.horizSepBottom}${border.horiz}${border.bottomRight}`,
          Point.zero.offset(rx, 2),
          increaseButtonStyle,
        )
      } else {
        const [bl, br] = hasFocus ? BRACKETS_FOCUS : BRACKETS_DEFAULT
        viewport.write(
          `${bl}${arrows.left}${br}`,
          Point.zero,
          decreaseButtonStyle,
        )
        viewport.write(
          `${bl}${arrows.right}${br}`,
          Point.zero.offset(viewport.contentSize.width - 3, 0),
          increaseButtonStyle,
        )
      }
    } else if (hasBorder) {
      viewport.write(border.topLeft, Point.zero.offset(0, 0), sliderStyle)
      viewport.write(border.vert, Point.zero.offset(0, 1), sliderStyle)
      viewport.write(border.bottomLeft, Point.zero.offset(0, 2), sliderStyle)

      const rx = viewport.contentSize.width - 1
      viewport.write(border.topRight, Point.zero.offset(rx, 0), sliderStyle)
      viewport.write(border.vert, Point.zero.offset(rx, 1), sliderStyle)
      viewport.write(border.bottomRight, Point.zero.offset(rx, 2), sliderStyle)
    }

    if (hasBorder) {
      // Draw the top and bottom border rails
      for (let x = innerRect.minX(); x < innerRect.maxX(); x++) {
        viewport.write(border.horiz, Point.zero.offset(x, 0), sliderStyle)
        viewport.write(border.horiz, Point.zero.offset(x, 2), sliderStyle)
      }
    }

    const min = innerRect.minX(),
      max = innerRect.maxX()
    const position = Math.round(
      interpolate(this.#value, this.#range, [min, max - 1], true),
    )

    innerRect.forEachPoint(pt => {
      let char: string
      if (height === 1 || pt.y === 1) {
        if (pt.x === position) {
          char = BAR.fill
        } else if (pt.x === position + 1) {
          char = BAR.right
        } else if (pt.x === position - 1) {
          char = BAR.left
        } else {
          char = BAR.horiz
        }
      } else {
        // top/bottom border rows already drawn above
        return
      }

      viewport.write(char, pt, sliderStyle)
    })
  }

  #renderVertical(
    viewport: Viewport,
    sliderStyle: Style,
    decreaseButtonStyle: Style,
    increaseButtonStyle: Style,
  ) {
    const hasFocus = this.#hasFocus
    const hasBorder = this.#border && viewport.contentSize.width >= 3
    const width = hasBorder ? 3 : 1
    const marginY =
      this.#buttons && hasBorder ? 3 : this.#buttons || hasBorder ? 1 : 0
    const outerRect = new Rect([0, 0], [width, viewport.contentSize.height])
    const innerRect = new Rect(
      [0, marginY],
      [width, viewport.contentSize.height - 2 * marginY],
    )
    viewport.registerMouse(['mouse.move', 'mouse.button.left'], outerRect)

    const border = this.#borderChars(hasFocus)

    if (this.#buttons) {
      const arrows = this.#arrowChars()

      if (hasBorder) {
        viewport.write(
          `${border.topLeft}${border.horiz}${border.topRight}`,
          Point.zero,
          decreaseButtonStyle,
        )
        viewport.write(
          `${border.vert}${arrows.up}${border.vert}`,
          Point.zero.offset(0, 1),
          decreaseButtonStyle,
        )
        viewport.write(
          `${border.vertSepLeft}${border.horiz}${border.vertSepRight}`,
          Point.zero.offset(0, 2),
          decreaseButtonStyle,
        )

        const by = viewport.contentSize.height - 1
        viewport.write(
          `${border.bottomLeft}${border.horiz}${border.bottomRight}`,
          Point.zero.offset(0, by),
          increaseButtonStyle,
        )
        viewport.write(
          `${border.vert}${arrows.down}${border.vert}`,
          Point.zero.offset(0, by - 1),
          increaseButtonStyle,
        )
        viewport.write(
          `${border.vertSepLeft}${border.horiz}${border.vertSepRight}`,
          Point.zero.offset(0, by - 2),
          increaseButtonStyle,
        )
      } else {
        viewport.write(arrows.up, Point.zero, decreaseButtonStyle)
        viewport.write(
          arrows.down,
          Point.zero.offset(0, viewport.contentSize.height - 1),
          increaseButtonStyle,
        )
      }
    } else if (hasBorder) {
      viewport.write(
        `${border.topLeft}${border.horiz}${border.topRight}`,
        Point.zero,
        sliderStyle,
      )
      viewport.write(
        `${border.bottomLeft}${border.horiz}${border.bottomRight}`,
        Point.zero.offset(0, viewport.contentSize.height - 1),
        sliderStyle,
      )
    }

    if (hasBorder) {
      // Draw the left and right border rails
      for (let y = innerRect.minY(); y < innerRect.maxY(); y++) {
        viewport.write(border.vert, Point.zero.offset(0, y), sliderStyle)
        viewport.write(border.vert, Point.zero.offset(2, y), sliderStyle)
      }
    }

    const min = innerRect.minY(),
      max = innerRect.maxY()
    const position = Math.round(
      interpolate(this.#value, this.#range, [min, max - 1], true),
    )

    innerRect.forEachPoint(pt => {
      let char: string
      if (width === 1 || pt.x === 1) {
        if (pt.y === position) {
          char = BAR.fill
        } else if (pt.y === position + 1) {
          char = BAR.vertBelow
        } else if (pt.y === position - 1) {
          char = BAR.vertAbove
        } else {
          char = BAR.vert
        }
      } else {
        // left/right border rails already drawn above
        return
      }

      viewport.write(char, pt, sliderStyle)
    })
  }

  render(viewport: Viewport) {
    if (viewport.isEmpty) {
      return
    }

    const hasFocus = viewport.registerFocus({isDefault: false})
    this.#hasFocus = hasFocus
    this.#contentSize = viewport.contentSize

    const sliderStyle = this.theme.ui({
      isHover: this.#isHoverSlider || hasFocus,
    })
    const decreaseButtonStyle = this.theme.ui({
      isPressed: this.#isPressingDecrease,
      isHover: this.#isHoverDecrease,
    })
    const increaseButtonStyle = this.theme.ui({
      isPressed: this.#isPressingIncrease,
      isHover: this.#isHoverIncrease,
    })

    if (this.#direction === 'horizontal') {
      this.#renderHorizontal(
        viewport,
        sliderStyle,
        decreaseButtonStyle,
        increaseButtonStyle,
      )
    } else {
      this.#renderVertical(
        viewport,
        sliderStyle,
        decreaseButtonStyle,
        increaseButtonStyle,
      )
    }
  }
}

interface Arrows {
  up: string
  down: string
  left: string
  right: string
}

interface Border {
  topLeft: string
  topRight: string
  bottomLeft: string
  bottomRight: string
  horiz: string
  vert: string
  vertSepLeft: string
  vertSepRight: string
  horizSepTop: string
  horizSepBottom: string
}

const BRACKETS_DEFAULT = ['[', ']'] as const
const BRACKETS_FOCUS = ['⟦', '⟧'] as const

// true => hover, false => default
const ARROWS_DEFAULT: Arrows = {up: '▵', down: '▿', left: '◃', right: '▹'}
const ARROWS_HOVER: Arrows = {up: '▴', down: '▾', left: '◂', right: '▸'}

const BAR = {
  left: '╴',
  right: '╶',
  horiz: '─',
  fill: '█',
  vert: '│',
  vertAbove: '╵',
  vertBelow: '╷',
} as const

// true => focus, false => default
const BORDER_DEFAULT: Border = {
  topLeft: '╭',
  topRight: '╮',
  bottomLeft: '╰',
  bottomRight: '╯',
  horiz: '─',
  vert: '│',
  vertSepLeft: '├',
  vertSepRight: '┤',
  horizSepTop: '┬',
  horizSepBottom: '┴',
}

const BORDER_FOCUS: Border = {
  topLeft: '╔',
  topRight: '╗',
  bottomLeft: '╚',
  bottomRight: '╝',
  horiz: '═',
  vert: '║',
  vertSepLeft: '╠',
  vertSepRight: '╣',
  horizSepTop: '╦',
  horizSepBottom: '╩',
}
