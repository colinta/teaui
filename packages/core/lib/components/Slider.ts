import {Viewport} from '../Viewport.js'
import {type Props as ViewProps} from '../View.js'
import {ComposedView} from '../ComposedView.js'
import {Rect, Size} from '../geometry.js'
import {type KeyEvent} from '../events/index.js'
import {type Orientation, type LegendItem} from '../types.js'
import {Box, type BorderChars} from './Box.js'
import {Pressable} from './Pressable.js'
import {Text} from './Text.js'
import {ZStack} from './ZStack.js'
import {type Frame, SliderControl} from './SliderControl.js'

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

/**
 * Lets users choose a numeric value within a range without typing it. Useful
 * for bounded settings where the position between a minimum and maximum matters.
 *
 * Click or drag to adjust the value, or use arrow keys while focused. Optional
 * buttons provide stepwise adjustment. Supports horizontal and vertical layouts;
 * `onChange` reports user changes.
 */
export class Slider extends ComposedView {
  // styles
  #direction: Orientation = 'horizontal'
  #border: boolean = false
  #buttons: boolean = false

  // position of slider
  #range: [number, number] = [0, 0]
  #value: number = 0
  #step: number = 1
  #onChange?: (value: number) => void

  // subviews
  #control: SliderControl
  #decrease: SliderButton
  #increase: SliderButton

  constructor(props: Props) {
    super(props)

    this.#control = new SliderControl(value => this.#changeValue(value))
    this.#decrease = new SliderButton(() => this.#nudge(-1))
    this.#increase = new SliderButton(() => this.#nudge(1))
    this.add(this.#control)

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
    if (value === this.#border) {
      return
    }
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

    this.#decrease.sync(this.#direction, 'start', this.#border, false)
    this.#increase.sync(this.#direction, 'end', this.#border, false)
    if (this.#buttons) {
      this.add(this.#decrease, 0)
      this.add(this.#increase)
    } else {
      this.removeChild(this.#decrease)
      this.removeChild(this.#increase)
    }
  }

  get value() {
    return this.#value
  }
  set value(value: number) {
    if (value !== this.#value) {
      this.#value = value
      this.invalidateRender()
    }
  }

  /**
   * The value changed because of the keyboard, a button, or dragging
   */
  #changeValue(value: number) {
    value = Math.min(this.#range[1], Math.max(this.#range[0], value))
    if (value !== this.#value) {
      this.#value = value
      this.invalidateRender()
      this.#onChange?.(value)
    }
  }

  /**
   * A button was pressed: -1 for decrease, 1 for increase
   */
  #nudge(direction: -1 | 1) {
    const prev = this.#value
    this.#changeValue(
      prev > this.#range[1] ? this.#range[1] : prev + direction * this.#step,
    )
  }

  naturalSize(_available: Size) {
    // try to have enough room for every value
    const min = Math.max(
      MIN,
      Math.ceil((this.#range[1] - this.#range[0]) / this.#step),
    )
    if (this.#direction === 'horizontal') {
      const minWidth = min + 2 * (this.#buttons ? 3 : this.#border ? 1 : 0)
      // [◃]  or  ╭─┬──
      // █╶─      │◃│█╶
      //          ╰─┴──
      return new Size(minWidth, this.#border ? 3 : 1)
    } else {
      const minHeight =
        min +
        2 *
          (this.#buttons && this.#border
            ? 3
            : this.#buttons || this.#border
              ? 1
              : 0)
      // ▵       ╭─╮
      // █       │▵│
      // ╷       ├─┤
      return new Size(this.#border ? 3 : 1, minHeight)
    }
  }

  legendItems(): LegendItem[] {
    return [
      {
        key:
          this.#direction === 'horizontal' ? ['left', 'right'] : ['up', 'down'],
        label: 'Adjust',
      },
      {key: 'home', label: 'Min'},
      {key: 'end', label: 'Max'},
    ]
  }

  receiveKey(event: KeyEvent) {
    switch (event.name) {
      case 'right':
      case 'down':
        this.#changeValue(this.#value + this.#step)
        break
      case 'left':
      case 'up':
        this.#changeValue(this.#value - this.#step)
        break
      case 'home':
        this.#changeValue(this.#range[0])
        break
      case 'end':
        this.#changeValue(this.#range[1])
        break
    }
  }

  render(viewport: Viewport) {
    const hasFocus = viewport.registerFocus({isDefault: false})
    if (viewport.isEmpty) {
      return super.render(viewport)
    }

    const isHorizontal = this.#direction === 'horizontal'
    const {width, height} = viewport.contentSize
    // The border needs 3 rows (or columns) to be drawn
    const hasBorder = this.#border && (isHorizontal ? height : width) >= 3
    const cross = hasBorder ? 3 : 1
    const buttonLength = !this.#buttons ? 0 : isHorizontal || hasBorder ? 3 : 1
    const length = isHorizontal ? width : height

    let frame: Frame = 'none'
    if (hasBorder) {
      frame = this.#buttons ? 'rails' : 'box'
    }
    this.#control.sync({
      direction: this.#direction,
      frame,
      range: this.#range,
      value: this.#value,
      step: this.#step,
      hasFocus,
    })
    this.#decrease.sync(this.#direction, 'start', hasBorder, hasFocus)
    this.#increase.sync(this.#direction, 'end', hasBorder, hasFocus)

    const rect = (start: number, size: number) =>
      isHorizontal
        ? new Rect([start, 0], [size, cross])
        : new Rect([0, start], [cross, size])

    if (this.#buttons) {
      viewport.clipped(rect(0, buttonLength), inside => {
        this.#decrease.render(inside)
      })
      viewport.clipped(rect(length - buttonLength, buttonLength), inside => {
        this.#increase.render(inside)
      })
    }
    viewport.clipped(
      rect(buttonLength, Math.max(0, length - 2 * buttonLength)),
      inside => {
        this.#control.render(inside)
      },
    )
  }
}

/**
 * Provides stepwise value adjustment at either end of a Slider.
 */
class SliderButton extends Pressable {
  #arrow: Text
  #box: Box
  #borderChars?: BorderChars
  // The border's *size* depends on these two (focus only swaps characters)
  #sizeKey?: string
  #direction: Orientation = 'horizontal'
  #side: 'start' | 'end' = 'start'

  constructor(onClick: () => void) {
    const arrow = new Text()
    const box = new Box({
      child: new ZStack({location: 'center', child: arrow}),
    })
    super({onClick, focusable: false, child: box})

    this.#arrow = arrow
    this.#box = box
    this.#syncArrow()

    // Piggy-backs on the events the Pressable registers for itself, to show the
    // 'hover' arrow
    this.addMouseListener(() => this.#syncArrow())
  }

  /**
   * Called by the Slider when it updates, and again while it renders (focus
   * changes the characters, but not the size, of the border - so rendering
   * invalidates only if the border's size could have changed).
   */
  sync(
    direction: Orientation,
    side: 'start' | 'end',
    hasBorder: boolean,
    hasFocus: boolean,
  ) {
    this.#direction = direction
    this.#side = side
    const chars = buttonBorder(direction, side, hasBorder, hasFocus)
    if (chars !== this.#borderChars) {
      this.#borderChars = chars
      this.#box.border = chars

      const sizeKey = `${direction} ${hasBorder}`
      if (sizeKey !== this.#sizeKey) {
        this.#sizeKey = sizeKey
        this.#box.invalidateSize()
      }
    }
    this.#syncArrow()
  }

  #syncArrow() {
    const arrows = this.isHover ? ARROWS_HOVER : ARROWS_DEFAULT
    const horizontal = this.#direction === 'horizontal'
    this.#arrow.text = horizontal
      ? this.#side === 'start'
        ? arrows.left
        : arrows.right
      : this.#side === 'start'
        ? arrows.up
        : arrows.down
  }
}

function buttonBorder(
  direction: Orientation,
  side: 'start' | 'end',
  hasBorder: boolean,
  hasFocus: boolean,
): BorderChars {
  if (!hasBorder) {
    // [◃]  or just ▵
    if (direction === 'horizontal') {
      return hasFocus ? BRACKETS_FOCUS : BRACKETS_DEFAULT
    }
    return NO_BORDER
  }

  const chars = hasFocus ? BOX_FOCUS : BOX_DEFAULT
  return chars[direction][side]
}

interface Arrows {
  up: string
  down: string
  left: string
  right: string
}

// hover => the 'filled' arrows
const ARROWS_DEFAULT: Arrows = {up: '▵', down: '▿', left: '◃', right: '▹'}
const ARROWS_HOVER: Arrows = {up: '▴', down: '▾', left: '◂', right: '▸'}

// top, left, top-left, top-right, bottom-left, bottom-right, bottom, right
const NO_BORDER: BorderChars = ['', '', '', '', '', '', '', '']
const BRACKETS_DEFAULT: BorderChars = ['', '[', '', '', '', '', '', ']']
const BRACKETS_FOCUS: BorderChars = ['', '⟦', '', '', '', '', '', '⟧']

// The buttons' corners (┬ ┴ ├ ┤) join the control's rails.
type ButtonBorders = Record<Orientation, Record<'start' | 'end', BorderChars>>
// top & bottom, left & right, top-left, top-right, bottom-left, bottom-right
const BOX_DEFAULT: ButtonBorders = {
  horizontal: {
    start: ['─', '│', '╭', '┬', '╰', '┴'],
    end: ['─', '│', '┬', '╮', '┴', '╯'],
  },
  vertical: {
    start: ['─', '│', '╭', '╮', '├', '┤'],
    end: ['─', '│', '├', '┤', '╰', '╯'],
  },
}
const BOX_FOCUS: ButtonBorders = {
  horizontal: {
    start: ['═', '║', '╔', '╦', '╚', '╩'],
    end: ['═', '║', '╦', '╗', '╩', '╝'],
  },
  vertical: {
    start: ['═', '║', '╔', '╗', '╠', '╣'],
    end: ['═', '║', '╠', '╣', '╚', '╝'],
  },
}
