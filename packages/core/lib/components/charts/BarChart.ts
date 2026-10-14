import type {Viewport} from '../../Viewport.js'
import type {Props as ViewProps} from '../../View.js'
import {Style} from '../../Style.js'
import {Point, interpolate} from '../../geometry.js'
import {
  Chart,
  type ChartLabel,
  type ChartRange,
  type ChartLayout,
  type ChartXLabel,
} from './Chart.js'

// Block characters for sub-cell height resolution (8 levels per row)
// Index 0 = empty, 1 = ▁ (1/8), 2 = ▂ (2/8), ... 8 = █ (full)
const BLOCKS = [' ', '▁', '▂', '▃', '▄', '▅', '▆', '▇', '█']

export type BarChartStyle<T> = Style | ((row: T, index: number) => Style)

export interface BarChartProps<T> extends ViewProps {
  /** Extract the [x, y] numeric values from each data row */
  extract: (row: T, index: number) => [number, number]
  /** Generate x-axis label for a data row, or skip it */
  xLabels?: (row: T, index: number) => ChartLabel
  /** @deprecated Configure yLabels on Plot instead. */
  yLabels?: (value: number) => ChartLabel
  /** Terminal columns per bar (default 1) */
  barWidth?: number
  /** Style for every bar, or a function that styles each bar */
  style?: BarChartStyle<T>
}

export class BarChart<T> extends Chart<T> {
  #extract: (row: T, index: number) => [number, number]
  #xLabelsFn: ((row: T, index: number) => ChartLabel) | undefined
  #yLabelsFn: ((value: number) => ChartLabel) | undefined
  #barStyle: BarChartStyle<T> | undefined
  #barWidth: number

  constructor(data: T[], props: BarChartProps<T>) {
    const {extract, xLabels, yLabels, style, barWidth, ...rest} = props
    super(data, {
      ...rest,
      style: typeof style === 'function' ? undefined : style,
    })
    this.#extract = extract
    this.#xLabelsFn = xLabels
    this.#yLabelsFn = yLabels
    this.#barStyle = style
    this.#barWidth = barWidth ?? 1
  }

  update(props: Partial<BarChartProps<T>> & {data?: T[]}) {
    const {style, ...rest} = props
    this.#extract = props.extract ?? this.#extract
    this.#xLabelsFn = props.xLabels
    this.#yLabelsFn = props.yLabels
    this.#barStyle = style
    this.#barWidth = props.barWidth ?? 1
    super.update({
      ...rest,
      style: typeof style === 'function' ? undefined : style,
    })
  }

  getXRange(): ChartRange {
    if (this.data.length === 0) {
      return {min: 0, max: 1}
    }
    const values = [
      ...new Set(this.data.map((row, index) => this.#extract(row, index)[0])),
    ].sort((a, b) => a - b)
    if (values.length === 1) {
      return {min: values[0] - 0.5, max: values[0] + 0.5}
    }
    const min = values[0]
    const max = values[values.length - 1]
    return {
      min: min - (values[1] - min) / 2,
      max: max + (max - values[values.length - 2]) / 2,
    }
  }

  getYRange(): ChartRange {
    if (this.data.length === 0) {
      return {min: 0, max: 1}
    }
    let min = 0 // bars always start from 0
    let max = -Infinity
    for (let index = 0; index < this.data.length; index++) {
      const [, y] = this.#extract(this.data[index], index)
      if (y > max) {
        max = y
      }
    }
    if (max <= 0) {
      max = 1
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
      value: this.#extract(row, index)[0],
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

    const chartStyle = this.#barStyle
    const defaultStyle = this.purpose.ui({isHover: true}).invert()
    const emptyStyle = this.purpose.text()

    const totalWidth = layout.width
    const totalHeight = layout.height

    // Each terminal row gives 8 sub-levels of height via block chars
    const maxSubRows = totalHeight * 8

    const pt = new Point(0, 0).mutableCopy()
    for (let i = 0; i < this.data.length; i++) {
      const row = this.data[i]
      const [xValue, value] = this.#extract(row, i)
      const style =
        typeof chartStyle === 'function'
          ? chartStyle(row, i)
          : (chartStyle ?? defaultStyle)
      const barSubHeight = Math.round(
        interpolate(
          value,
          [layout.yRange.min, layout.yRange.max],
          [0, maxSubRows],
          true,
        ),
      )

      const centerX = Math.round(
        interpolate(
          xValue,
          [layout.xRange.min, layout.xRange.max],
          [0, totalWidth - 1],
          true,
        ),
      )
      const barX = centerX - Math.floor(this.#barWidth / 2)

      // For each column of this bar
      for (let bx = 0; bx < this.#barWidth; bx++) {
        const x = barX + bx
        if (x < 0) {
          continue
        }
        if (x >= totalWidth) {
          break
        }

        // Fill from bottom to top
        // Number of completely full rows
        const fullRows = Math.floor(barSubHeight / 8)
        // Fractional part for the topmost partial row
        const partialEighths = barSubHeight % 8

        for (let row = 0; row < totalHeight; row++) {
          pt.x = x
          pt.y = row

          const rowFromBottom = totalHeight - 1 - row

          if (rowFromBottom < fullRows) {
            // Full block
            viewport.write(BLOCKS[8], pt, style)
          } else if (rowFromBottom === fullRows && partialEighths > 0) {
            // Partial block
            viewport.write(BLOCKS[partialEighths], pt, style)
          } else if (!layout.transparent) {
            // Empty
            viewport.write(' ', pt, emptyStyle)
          }
        }
      }
    }
  }
}
