import type {Viewport} from '../../Viewport.js'
import type {Props as ViewProps} from '../../View.js'
import {Style} from '../../Style.js'
import {interpolate} from '../../geometry.js'
import {Canvas} from '../Canvas.js'
import {
  Chart,
  type ChartLabel,
  type ChartRange,
  type ChartXLabel,
  type ChartLayout,
} from './Chart.js'

export interface LineChartProps<T> extends ViewProps {
  /** Extract [x, y] numeric values from each data row */
  extract: (row: T) => [number, number]
  /** Generate x-axis label from a data row, or skip it */
  xLabels?: (row: T, index: number) => ChartLabel
  /** @deprecated Configure yLabels on Plot instead. */
  yLabels?: (value: number) => ChartLabel
  /** Style for the line */
  style?: Style
}

export class LineChart<T> extends Chart<T> {
  #extract: (row: T) => [number, number]
  #xLabelsFn: ((row: T, index: number) => ChartLabel) | undefined
  #yLabelsFn: ((value: number) => ChartLabel) | undefined
  #canvas: Canvas = new Canvas()

  constructor(data: T[], props: LineChartProps<T>) {
    const {extract, xLabels, yLabels, ...rest} = props
    super(data, rest)
    this.#extract = extract
    this.#xLabelsFn = xLabels
    this.#yLabelsFn = yLabels
  }

  update(props: Partial<LineChartProps<T>> & {data?: T[]}) {
    this.#extract = props.extract ?? this.#extract
    this.#xLabelsFn = props.xLabels
    this.#yLabelsFn = props.yLabels
    super.update(props)
  }

  getXRange(): ChartRange {
    if (this.data.length === 0) {
      return {min: 0, max: 1}
    }
    let min = Infinity
    let max = -Infinity
    for (const row of this.data) {
      const [x] = this.#extract(row)
      if (x < min) {
        min = x
      }
      if (x > max) {
        max = x
      }
    }
    if (min === max) {
      return {min: min - 1, max: max + 1}
    }
    return {min, max}
  }

  getYRange(): ChartRange {
    if (this.data.length === 0) {
      return {min: 0, max: 1}
    }
    let min = Infinity
    let max = -Infinity
    for (const row of this.data) {
      const [, y] = this.#extract(row)
      if (y < min) {
        min = y
      }
      if (y > max) {
        max = y
      }
    }
    if (min === max) {
      return {min: min - 1, max: max + 1}
    }
    return {min, max}
  }

  getXLabels(): ChartLabel[] {
    if (!this.#xLabelsFn) {
      return []
    }
    return this.data.map(this.#xLabelsFn)
  }

  getXLabelEntries(): ChartXLabel[] {
    const xLabels = this.#xLabelsFn
    if (!xLabels) {
      return []
    }
    return this.data.map((row, index) => ({
      value: this.#extract(row)[0],
      label: xLabels(row, index),
    }))
  }

  formatYLabel(value: number): ChartLabel {
    if (!this.#yLabelsFn) {
      return super.formatYLabel(value)
    }
    return this.#yLabelsFn(value)
  }

  renderChart(viewport: Viewport, layout: ChartLayout): void {
    if (viewport.isEmpty || this.data.length === 0) {
      return
    }

    const extract = this.#extract

    this.#canvas.withContext(layout.width, layout.height, canvas => {
      const pixelW = canvas.pixelWidth
      const pixelH = canvas.pixelHeight

      let prevPx: number | undefined
      let prevPy: number | undefined

      for (const row of this.data) {
        const [x, y] = extract(row)
        const px = Math.round(
          interpolate(
            x,
            [layout.xRange.min, layout.xRange.max],
            [0, pixelW - 1],
            true,
          ),
        )
        // Y is inverted: top of screen = min pixel Y = max data Y
        const py = Math.round(
          interpolate(
            y,
            [layout.yRange.min, layout.yRange.max],
            [pixelH - 1, 0],
            true,
          ),
        )

        if (prevPx !== undefined && prevPy !== undefined) {
          canvas.line(prevPx, prevPy, px, py)
        } else {
          canvas.set(px, py)
        }

        prevPx = px
        prevPy = py
      }
    })

    if (layout.transparent) {
      this.#canvas.renderTransparent(viewport)
    } else {
      this.#canvas.render(viewport)
    }
  }
}
