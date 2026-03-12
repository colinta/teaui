import type {Viewport} from '../Viewport.js'
import type {Props as ViewProps} from '../View.js'
import {View} from '../View.js'
import {Point, Rect, Size} from '../geometry.js'
import {Style} from '../Style.js'
import {Chart, type ChartRange} from './charts/Chart.js'

interface Props extends ViewProps {
  /** Title displayed above the chart */
  title?: string
  /** Show x-axis tick labels (default true) */
  xAxisLabels?: boolean
  /** Show y-axis tick labels (default true) */
  yAxisLabels?: boolean
  /** Show border/axes lines (default true) */
  showAxes?: boolean
}

export class Plot extends View {
  #charts: Chart[] = []
  #title: string | undefined
  #xAxisLabels: boolean = true
  #yAxisLabels: boolean = true
  #showAxes: boolean = true

  constructor(props: Props = {}) {
    super(props)
    this.#update(props)
  }

  update(props: Props) {
    this.#update(props)
    super.update(props)
  }

  #update({title, xAxisLabels, yAxisLabels, showAxes}: Props) {
    this.#title = title
    this.#xAxisLabels = xAxisLabels ?? true
    this.#yAxisLabels = yAxisLabels ?? true
    this.#showAxes = showAxes ?? true
  }

  add(chart: Chart): void {
    this.#charts.push(chart)
    this.invalidateRender()
  }

  remove(chart: Chart): void {
    const idx = this.#charts.indexOf(chart)
    if (idx !== -1) {
      this.#charts.splice(idx, 1)
      this.invalidateRender()
    }
  }

  naturalSize(available: Size): Size {
    return available
  }

  render(viewport: Viewport) {
    if (viewport.isEmpty || this.#charts.length === 0) return

    const textStyle = this.theme.text()
    const totalW = viewport.contentSize.width
    const totalH = viewport.contentSize.height

    // Compute combined data ranges from all charts
    const xRange = this.#combinedXRange()
    const yRange = this.#combinedYRange()

    // Layout regions
    let titleHeight = 0
    if (this.#title) {
      titleHeight = 1
    }

    // Y-axis labels on the left
    let yLabelWidth = 0
    let yLabels: string[] = []
    const chartHeight =
      totalH -
      titleHeight -
      (this.#xAxisLabels ? 1 : 0) -
      (this.#showAxes ? 1 : 0)

    if (this.#yAxisLabels && chartHeight > 0) {
      // Get labels from first chart
      const labelCount = Math.max(2, Math.min(chartHeight, 8))
      yLabels = this.#charts[0].getYLabels(labelCount)
      yLabelWidth = Math.max(0, ...yLabels.map(l => l.length)) + 1 // +1 for space
    }

    // Axis line takes 1 column if shown
    const axisLineWidth = this.#showAxes ? 1 : 0

    const chartX = yLabelWidth + axisLineWidth
    const chartY = titleHeight
    const chartW = Math.max(0, totalW - chartX)
    const chartH = Math.max(0, chartHeight)

    if (chartW <= 0 || chartH <= 0) return

    // Draw title
    if (this.#title && titleHeight > 0) {
      const titleX =
        chartX + Math.max(0, Math.floor((chartW - this.#title.length) / 2))
      viewport.write(
        this.#title.slice(0, totalW),
        new Point(titleX, 0),
        new Style({bold: true}).merge(textStyle),
      )
    }

    // Draw y-axis labels
    if (this.#yAxisLabels && yLabels.length > 0 && chartH > 0) {
      for (let i = 0; i < yLabels.length; i++) {
        const labelY =
          chartY +
          Math.round((i * (chartH - 1)) / Math.max(1, yLabels.length - 1))
        if (labelY < chartY + chartH) {
          const label = yLabels[i].padStart(yLabelWidth - 1)
          viewport.write(label, new Point(0, labelY), textStyle)
        }
      }
    }

    // Draw axes lines
    if (this.#showAxes) {
      const axisX = yLabelWidth
      const pt = new Point(0, 0).mutableCopy()

      // Vertical axis line
      for (let y = chartY; y < chartY + chartH; y++) {
        pt.x = axisX
        pt.y = y
        viewport.write('│', pt, textStyle)
      }

      // Bottom-left corner
      pt.x = axisX
      pt.y = chartY + chartH
      viewport.write('└', pt, textStyle)

      // Horizontal axis line
      for (let x = axisX + 1; x < totalW; x++) {
        pt.x = x
        pt.y = chartY + chartH
        viewport.write('─', pt, textStyle)
      }
    }

    // Draw x-axis labels
    if (this.#xAxisLabels && this.#charts.length > 0) {
      const xLabels = this.#charts[0].getXLabels()
      if (xLabels.length > 0) {
        const xAxisY = chartY + chartH + (this.#showAxes ? 1 : 0)
        if (xAxisY < totalH) {
          // Distribute labels evenly
          const labelCount = Math.min(xLabels.length, Math.floor(chartW / 4))
          for (let i = 0; i < labelCount; i++) {
            const dataIdx = Math.round(
              (i * (xLabels.length - 1)) / Math.max(1, labelCount - 1),
            )
            const label = xLabels[dataIdx]
            const labelX =
              chartX +
              Math.round((i * (chartW - 1)) / Math.max(1, labelCount - 1))
            const truncated = label.slice(
              0,
              Math.min(label.length, chartW - (labelX - chartX)),
            )
            viewport.write(truncated, new Point(labelX, xAxisY), textStyle)
          }
        }
      }
    }

    // Render charts in the chart area
    const chartRect = new Rect(
      new Point(chartX, chartY),
      new Size(chartW, chartH),
    )
    for (const chart of this.#charts) {
      viewport.clipped(chartRect, clippedViewport => {
        chart.renderChart(clippedViewport, {
          width: chartW,
          height: chartH,
          xRange,
          yRange,
        })
      })
    }
  }

  #combinedXRange(): ChartRange {
    let min = Infinity
    let max = -Infinity
    for (const chart of this.#charts) {
      const range = chart.getXRange()
      if (range.min < min) min = range.min
      if (range.max > max) max = range.max
    }
    if (!isFinite(min)) return {min: 0, max: 1}
    return {min, max}
  }

  #combinedYRange(): ChartRange {
    let min = Infinity
    let max = -Infinity
    for (const chart of this.#charts) {
      const range = chart.getYRange()
      if (range.min < min) min = range.min
      if (range.max > max) max = range.max
    }
    if (!isFinite(min)) return {min: 0, max: 1}
    return {min, max}
  }
}
