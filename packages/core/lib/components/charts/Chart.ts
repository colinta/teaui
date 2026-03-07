import type {Viewport} from '../../Viewport.js'
import type {Props as ViewProps} from '../../View.js'
import {View} from '../../View.js'
import {Style} from '../../Style.js'
import {Size} from '../../geometry.js'

export interface ChartRange {
  min: number
  max: number
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
}

/**
 * Base class for chart types. A Chart is a View that knows how to compute
 * its data ranges and render into a provided layout area.
 */
export abstract class Chart<T = unknown> extends View {
  #data: T[] = []
  #style: Style | undefined

  constructor(data: T[], props: ViewProps & {style?: Style} = {}) {
    const {style, ...viewProps} = props
    super(viewProps)
    this.#data = data
    this.#style = style
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
  abstract getXLabels(): string[]
  abstract getYLabels(count: number): string[]

  /**
   * Render the chart into the given viewport area. The viewport is already
   * clipped/positioned to the chart drawing area by the parent Plot.
   */
  abstract renderChart(viewport: Viewport, layout: ChartLayout): void

  naturalSize(available: Size): Size {
    return available
  }

  render(viewport: Viewport) {
    if (viewport.isEmpty) return

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
