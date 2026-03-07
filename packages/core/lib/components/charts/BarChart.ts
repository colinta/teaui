import type {Viewport} from '../../Viewport.js'
import type {Props as ViewProps} from '../../View.js'
import {Style} from '../../Style.js'
import {Point, interpolate} from '../../geometry.js'
import {Chart, type ChartRange, type ChartLayout} from './Chart.js'

// Block characters for sub-cell height resolution (8 levels per row)
// Index 0 = empty, 1 = ▁ (1/8), 2 = ▂ (2/8), ... 8 = █ (full)
const BLOCKS = [' ', '▁', '▂', '▃', '▄', '▅', '▆', '▇', '█']

export interface BarChartProps<T> extends ViewProps {
  /** Extract the y-value from each data row */
  extract: (row: T) => number
  /** Generate x-axis label for a data row */
  xLabels?: (row: T, index: number) => string
  /** Generate y-axis label from a numeric value */
  yLabels?: (value: number) => string
  /** Terminal columns per bar (default 1) */
  barWidth?: number
  /** Gap between bars in terminal columns (default 0) */
  gap?: number
  /** Style for the bars */
  style?: Style
}

export class BarChart<T> extends Chart<T> {
  #extract: (row: T) => number
  #xLabelsFn: ((row: T, index: number) => string) | undefined
  #yLabelsFn: ((value: number) => string) | undefined
  #barWidth: number
  #gap: number

  constructor(data: T[], props: BarChartProps<T>) {
    const {extract, xLabels, yLabels, barWidth, gap, ...rest} = props
    super(data, rest)
    this.#extract = extract
    this.#xLabelsFn = xLabels
    this.#yLabelsFn = yLabels
    this.#barWidth = barWidth ?? 1
    this.#gap = gap ?? 0
  }

  getXRange(): ChartRange {
    return {min: 0, max: Math.max(1, this.data.length - 1)}
  }

  getYRange(): ChartRange {
    if (this.data.length === 0) return {min: 0, max: 1}
    let min = 0 // bars always start from 0
    let max = -Infinity
    for (const row of this.data) {
      const y = this.#extract(row)
      if (y > max) max = y
    }
    if (max <= 0) max = 1
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

    const style = this.chartStyle ?? this.theme.ui({isHover: true}).invert()
    const emptyStyle = this.theme.text()

    const totalBarSlots = this.data.length
    const totalWidth = layout.width
    const totalHeight = layout.height

    // Calculate bar positions
    const barStep = this.#barWidth + this.#gap
    const usedWidth = totalBarSlots * barStep - this.#gap
    const startX = Math.max(0, Math.floor((totalWidth - usedWidth) / 2))

    // Each terminal row gives 8 sub-levels of height via block chars
    const maxSubRows = totalHeight * 8

    const pt = new Point(0, 0).mutableCopy()
    for (let i = 0; i < totalBarSlots; i++) {
      const value = this.#extract(this.data[i])
      const barSubHeight = Math.round(
        interpolate(
          value,
          [layout.yRange.min, layout.yRange.max],
          [0, maxSubRows],
          true,
        ),
      )

      const barX = startX + i * barStep

      // For each column of this bar
      for (let bx = 0; bx < this.#barWidth; bx++) {
        const x = barX + bx
        if (x >= totalWidth) break

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
          } else {
            // Empty
            viewport.write(' ', pt, emptyStyle)
          }
        }
      }
    }
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
