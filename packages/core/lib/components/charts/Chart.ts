import type {Viewport} from '../../Viewport.js'
import type {Props as ViewProps} from '../../View.js'
import {View} from '../../View.js'
import {Style} from '../../Style.js'
import {Size, interpolate} from '../../geometry.js'

export interface ChartRange {
  min: number
  max: number
}

export type ChartLabel = string | null | undefined

export interface ChartXLabel {
  value: number
  label: ChartLabel
}

export interface ChartLayout {
  /** Available width for the chart area in terminal columns */
  width: number
  /** Available height for the chart area in terminal rows */
  height: number
  /** Data X range */
  xRange: ChartRange
  /** Data Y range */
  yRange: ChartRange
  /** Preserve existing cells where this chart has no content */
  transparent?: boolean
}

/**
 * Gives chart types a common data, range, and label API so they can share Plot's
 * axes and labels. Extend it to add a new visualization that works with Plot,
 * or display a chart on its own when axes and labels are not needed.
 */
export abstract class Chart<T = unknown> extends View {
  #data: T[] = []
  #style: Style | undefined

  static formatYLabel(value: number): string {
    return formatNumber(value)
  }

  constructor(data: T[], props: ViewProps & {style?: Style} = {}) {
    const {style, ...viewProps} = props
    super(viewProps)
    this.#data = data
    this.#style = style
  }

  update(props: ViewProps & {data?: T[]; style?: Style}) {
    if (props.data !== undefined) {
      this.#data = props.data
    }
    this.#style = props.style
    super.update(props)
  }

  get data(): T[] {
    return this.#data
  }

  set data(value: T[]) {
    this.#data = value
    this.invalidateRender()
  }

  get chartStyle(): Style | undefined {
    return this.#style
  }

  abstract getXRange(): ChartRange
  abstract getYRange(): ChartRange
  abstract getXLabels(): ChartLabel[]

  getXLabelEntries(): ChartXLabel[] {
    const labels = this.getXLabels()
    const range = this.getXRange()
    return labels.map((label, index) => ({
      value: interpolate(
        index,
        [0, Math.max(1, labels.length - 1)],
        [range.min, range.max],
      ),
      label,
    }))
  }

  formatYLabel(value: number): ChartLabel {
    return Chart.formatYLabel(value)
  }

  /** @deprecated Configure yLabels on Plot instead. */
  getYLabels(count: number): ChartLabel[] {
    const range = this.getYRange()
    const labels: ChartLabel[] = []
    for (let i = 0; i < count; i++) {
      const value = interpolate(i, [0, count - 1], [range.max, range.min])
      labels.push(this.formatYLabel(value))
    }
    return labels
  }

  /**
   * Render the chart into the given viewport area. The viewport is already
   * clipped/positioned to the chart drawing area by the parent Plot.
   */
  abstract renderChart(viewport: Viewport, layout: ChartLayout): void

  naturalSize(available: Size): Size {
    return available
  }

  render(viewport: Viewport) {
    if (viewport.isEmpty) {
      return
    }

    const xRange = this.getXRange()
    const yRange = this.getYRange()
    this.renderChart(viewport, {
      width: viewport.contentSize.width,
      height: viewport.contentSize.height,
      xRange,
      yRange,
    })
  }
}

function formatNumber(n: number): string {
  if (Number.isInteger(n)) {
    return String(n)
  }
  if (Math.abs(n) >= 100) {
    return String(Math.round(n))
  }
  if (Math.abs(n) >= 10) {
    return n.toFixed(1)
  }
  return n.toFixed(2)
}
