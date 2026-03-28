import {Viewport} from '../Viewport.js'
import {type Props as ViewProps, View} from '../View.js'
import {Point, Size, interpolate} from '../geometry.js'
import {Style} from '../Style.js'
import {type Orientation} from '../types.js'

type PercentLocation = 'left' | 'center' | 'right'

interface Props extends ViewProps {
  direction?: Orientation
  min?: number
  max?: number
  value?: number
  showPercent?: boolean
  /**
   * Where to display the percent text.
   * - 'left': left-aligned inside the bar
   * - 'center' (default): centered inside the bar
   * - 'right': to the right of the bar, outside it
   */
  location?: PercentLocation
}

export class Progress extends View {
  #direction: Orientation = 'horizontal'
  #range: [number, number] = [0, 100]
  #value: number = 0
  #showPercent: boolean = false
  #location: PercentLocation = 'center'

  constructor(props: Props) {
    super(props)
    this.#update(props)
  }

  update(props: Props) {
    this.#update(props)
    super.update(props)
  }

  #update({direction, min, max, value, showPercent, location}: Props) {
    this.#direction = direction ?? 'horizontal'
    this.#range = [min ?? 0, max ?? 100]
    this.#showPercent = showPercent ?? false
    this.#location = location ?? 'center'
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

  naturalSize(available: Size) {
    return new Size(available.width, 1)
  }

  /**
   * The label reserve is the total chars consumed by the percent label and its
   * space separator when placed outside the bar (left or right). The label is
   * always padded to the width of "100%" (4 chars) plus 1 space = 5 chars.
   */
  static readonly LABEL_WIDTH = 4 // width of "100%"
  static readonly LABEL_RESERVE = 5 // space + LABEL_WIDTH

  render(viewport: Viewport) {
    if (viewport.isEmpty) {
      return
    }

    let percent: string = ''
    if (this.#showPercent) {
      const percentNum = interpolate(this.#value, this.#range, [0, 100], true)
      percent = `${Math.round(percentNum)}%`
    }

    // For left/right the bar shrinks to make room for the external label
    const isExternal =
      this.#showPercent &&
      (this.#location === 'left' || this.#location === 'right')
    const barWidth = isExternal
      ? Math.max(1, viewport.contentSize.width - Progress.LABEL_RESERVE)
      : viewport.contentSize.width

    // Pad the percent to LABEL_WIDTH so numbers are right-justified
    const paddedPercent = isExternal
      ? percent.padStart(Progress.LABEL_WIDTH)
      : percent

    let percentStartX: number
    let barStartX: number
    switch (this.#location) {
      case 'left':
        // " 50% ████..."  — label then space then bar
        percentStartX = 0
        barStartX = Progress.LABEL_RESERVE
        break
      case 'right':
        // "████...╴  50%" — bar then space then label
        percentStartX = barWidth + 1
        barStartX = 0
        break
      case 'center':
      default:
        percentStartX = ~~((barWidth - percent.length) / 2)
        barStartX = 0
        break
    }

    const percentStartPoint = new Point(
      percentStartX,
      viewport.contentSize.height <= 1 ? 0 : 1,
    )

    const textStyle = this.theme.text()
    const controlStyle = this.theme.ui({isHover: true}).invert().merge({
      background: textStyle.background,
    })
    const altTextStyle = new Style({
      foreground: textStyle.foreground,
      background: controlStyle.foreground,
    })
    if (this.#direction === 'horizontal') {
      this.#renderHorizontal(
        viewport,
        barWidth,
        barStartX,
        paddedPercent,
        percentStartPoint,
        textStyle,
        controlStyle,
        altTextStyle,
      )
    } else {
      this.#renderVertical(
        viewport,
        percent,
        percentStartPoint,
        textStyle,
        controlStyle,
        altTextStyle,
      )
    }
  }

  #renderHorizontal(
    viewport: Viewport,
    barWidth: number,
    barStartX: number,
    percent: string,
    percentStartPoint: Point,
    textStyle: Style,
    controlStyle: Style,
    altTextStyle: Style,
  ) {
    const barEndX = barStartX + barWidth
    const progressX =
      barStartX +
      Math.round(interpolate(this.#value, this.#range, [0, barWidth - 1], true))

    viewport.contentRect.forEachPoint(pt => {
      let char: string,
        style = textStyle

      // Percent text (rendered at percentStartPoint for all locations)
      if (
        this.#showPercent &&
        pt.x >= percentStartPoint.x &&
        pt.x - percentStartPoint.x < percent.length &&
        pt.y === percentStartPoint.y
      ) {
        char = percent[pt.x - percentStartPoint.x]
        if (this.#location === 'center' && pt.x <= progressX) {
          style = altTextStyle
        } else {
          style = textStyle
        }
      } else if (pt.x < barStartX || pt.x >= barEndX) {
        // Outside the bar area (left/right label region, space separator)
        char = ' '
        style = textStyle
      } else {
        const barX = pt.x - barStartX // position within the bar (0-based)
        const min = Math.min(...this.#range)

        if (pt.x <= progressX && this.#value > min) {
          if (pt.y === 0 && viewport.contentSize.height > 1) {
            char = '▄'
          } else if (
            pt.y === viewport.contentSize.height - 1 &&
            viewport.contentSize.height > 1
          ) {
            char = '▀'
          } else {
            char = '█'
          }
          style = controlStyle
        } else if (viewport.contentSize.height === 1) {
          if (barX === 0) {
            char = '╶'
          } else if (barX === barWidth - 1) {
            char = '╴'
          } else {
            char = '─'
          }
        } else if (pt.y === 0) {
          if (barX === 0) {
            char = '╭'
          } else if (barX === barWidth - 1) {
            char = '╮'
          } else {
            char = '─'
          }
        } else if (pt.y === viewport.contentSize.height - 1) {
          if (barX === 0) {
            char = '╰'
          } else if (barX === barWidth - 1) {
            char = '╯'
          } else {
            char = '─'
          }
        } else if (barX === 0 || barX === barWidth - 1) {
          char = '│'
        } else {
          char = ' '
        }
      }

      viewport.write(char, pt, style)
    })
  }

  #renderVertical(
    viewport: Viewport,
    _percent: string,
    _percentStartPoint: Point,
    textStyle: Style,
    controlStyle: Style,
    _altTextStyle: Style,
  ) {
    const progressY = Math.round(
      interpolate(
        this.#value,
        this.#range,
        [viewport.contentSize.height - 1, 0],
        true,
      ),
    )
    viewport.contentRect.forEachPoint(pt => {
      let char: string,
        style = textStyle
      if (pt.y >= progressY) {
        if (pt.x === 0 && viewport.contentSize.width > 1) {
          char = '▐'
        } else if (
          pt.x === viewport.contentSize.width - 1 &&
          viewport.contentSize.width > 1
        ) {
          char = '▌'
        } else {
          char = '█'
        }
        style = controlStyle
      } else if (viewport.contentSize.width === 1) {
        if (pt.y === 0) {
          char = '╷'
        } else if (pt.y === viewport.contentSize.height - 1) {
          char = '╵'
        } else {
          char = '│'
        }
      } else if (pt.x === 0) {
        if (pt.y === 0) {
          char = '╭'
        } else if (pt.y === viewport.contentSize.height - 1) {
          char = '╰'
        } else {
          char = '│'
        }
      } else if (pt.x === viewport.contentSize.width - 1) {
        if (pt.y === 0) {
          char = '╮'
        } else if (pt.y === viewport.contentSize.height - 1) {
          char = '╯'
        } else {
          char = '│'
        }
      } else if (pt.y === 0 || pt.y === viewport.contentSize.height - 1) {
        char = '─'
      } else {
        char = ' '
      }

      viewport.write(char, pt, style)
    })
  }
}
