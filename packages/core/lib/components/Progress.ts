import {Viewport} from '../Viewport.js'
import {type Props as ViewProps, View} from '../View.js'
import {Point, Size, interpolate} from '../geometry.js'
import {Style} from '../Style.js'
import {type Orientation} from './types.js'

interface Props extends ViewProps {
  direction?: Orientation
  min?: number
  max?: number
  value?: number
  showPercent?: boolean
}

export class Progress extends View {
  #direction: Orientation = 'horizontal'
  #range: [number, number] = [0, 100]
  #value: number = 0
  #showPercent: boolean = false

  constructor(props: Props) {
    super(props)
    this.#update(props)
  }

  update(props: Props) {
    this.#update(props)
    super.update(props)
  }

  #update({direction, min, max, value, showPercent}: Props) {
    this.#direction = direction ?? 'horizontal'
    this.#range = [min ?? 0, max ?? 100]
    this.#showPercent = showPercent ?? false
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

  render(viewport: Viewport) {
    if (viewport.isEmpty) {
      return
    }

    const pt = Point.zero.mutableCopy()
    let percent: string = ''
    if (this.#showPercent) {
      const percentNum = interpolate(this.#value, this.#range, [0, 100], true)
      percent = `${Math.round(percentNum)}%`
    }
    const percentStartPoint = new Point(
      ~~((viewport.contentSize.width - percent.length) / 2),
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
        percent,
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
    percent: string,
    percentStartPoint: Point,
    textStyle: Style,
    controlStyle: Style,
    altTextStyle: Style,
  ) {
    const progressX = Math.round(
      interpolate(
        this.#value,
        this.#range,
        [0, viewport.contentSize.width - 1],
        true,
      ),
    )

    viewport.visibleRect.forEachPoint(pt => {
      let char: string,
        style = textStyle
      if (
        this.#showPercent &&
        pt.x >= percentStartPoint.x &&
        pt.x - percentStartPoint.x < percent.length &&
        pt.y === percentStartPoint.y
      ) {
        char = percent[pt.x - percentStartPoint.x]
        if (pt.x <= progressX) {
          style = altTextStyle
        } else {
          style = textStyle
        }
      } else {
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
          if (pt.x === 0) {
            char = '╶'
          } else if (pt.x === viewport.contentSize.width - 1) {
            char = '╴'
          } else {
            char = '─'
          }
        } else if (pt.y === 0) {
          if (pt.x === 0) {
            char = '╭'
          } else if (pt.x === viewport.contentSize.width - 1) {
            char = '╮'
          } else {
            char = '─'
          }
        } else if (pt.y === viewport.contentSize.height - 1) {
          if (pt.x === 0) {
            char = '╰'
          } else if (pt.x === viewport.contentSize.width - 1) {
            char = '╯'
          } else {
            char = '─'
          }
        } else if (pt.x === 0 || pt.x === viewport.contentSize.width - 1) {
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
    viewport.visibleRect.forEachPoint(pt => {
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
