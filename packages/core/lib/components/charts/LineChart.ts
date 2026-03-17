import type {Viewport} from '../../Viewport.js'
import type {Props as ViewProps} from '../../View.js'
import {Style} from '../../Style.js'
import {interpolate} from '../../geometry.js'
import {Canvas} from '../Canvas.js'
import {Chart, type ChartRange, type ChartLayout} from './Chart.js'

export interface LineChartProps<T> extends ViewProps {
  /** Extract [x, y] numeric values from each data row */
  extract: (row: T) => [number, number]
  /** Generate x-axis label from a data row */
  xLabels?: (row: T) => string
  /** Generate y-axis label from a numeric value */
  yLabels?: (value: number) => string
  /** Style for the line */
  style?: Style
}

export class LineChart<T> extends Chart<T> {
  #extract: (row: T) => [number, number]
  #xLabelsFn: ((row: T) => string) | undefined
  #yLabelsFn: ((value: number) => string) | undefined
  #canvas: Canvas = new Canvas()

  constructor(data: T[], props: LineChartProps<T>) {
    const {extract, xLabels, yLabels, ...rest} = props
    super(data, rest)
    this.#extract = extract
    this.#xLabelsFn = xLabels
    this.#yLabelsFn = yLabels
  }

  getXRange(): ChartRange {
    if (this.data.length === 0) return {min: 0, max: 1}
    let min = Infinity
    let max = -Infinity
    for (const row of this.data) {
      const [x] = this.#extract(row)
      if (x < min) min = x
      if (x > max) max = x
    }
    if (min === max) return {min: min - 1, max: max + 1}
    return {min, max}
  }

  getYRange(): ChartRange {
    if (this.data.length === 0) return {min: 0, max: 1}
    let min = Infinity
    let max = -Infinity
    for (const row of this.data) {
      const [, y] = this.#extract(row)
      if (y < min) min = y
      if (y > max) max = y
    }
    if (min === max) return {min: min - 1, max: max + 1}
    return {min, max}
  }

  getXLabels(): string[] {
    if (!this.#xLabelsFn) return []
    return this.data.map(this.#xLabelsFn)
  }

  getYLabels(count: number): string[] {
    if (!this.#yLabelsFn) {
      return defaultYLabels(this.getYRange(), count)
    }
    const range = this.getYRange()
    const labels: string[] = []
    for (let i = 0; i < count; i++) {
      const value = interpolate(i, [0, count - 1], [range.max, range.min])
      labels.push(this.#yLabelsFn(value))
    }
    return labels
  }

  renderChart(viewport: Viewport, layout: ChartLayout): void {
    if (viewport.isEmpty || this.data.length === 0) return

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

    this.#canvas.render(viewport)
  }
}

function defaultYLabels(range: ChartRange, count: number): string[] {
  const labels: string[] = []
  for (let i = 0; i < count; i++) {
    const value = interpolate(i, [0, count - 1], [range.max, range.min])
    labels.push(formatNumber(value))
  }
  return labels
}

function formatNumber(n: number): string {
  if (Number.isInteger(n)) return String(n)
  if (Math.abs(n) >= 100) return String(Math.round(n))
  if (Math.abs(n) >= 10) return n.toFixed(1)
  return n.toFixed(2)
}
