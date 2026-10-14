import type {Viewport} from '../Viewport.js'
import type {Props as ViewProps} from '../View.js'
import {View} from '../View.js'
import {Point, Rect, Size, interpolate} from '../geometry.js'
import {Style} from '../Style.js'
import {Chart, type ChartLabel, type ChartRange} from './charts/Chart.js'

export interface PlotProps extends ViewProps {
  /** Title displayed above the chart */
  title?: string
  /** Show x-axis tick labels (default true) */
  xAxisLabels?: boolean
  /** Show y-axis tick labels (default true) */
  yAxisLabels?: boolean
  /** Format y-axis labels calculated from the combined chart range */
  yLabels?: (value: number) => ChartLabel
  /** Show border/axes lines (default true) */
  showAxes?: boolean
}

export class Plot extends View {
  #charts: Chart<any>[] = []
  #title: string | undefined
  #xAxisLabels: boolean = true
  #yAxisLabels: boolean = true
  #yLabelsFn: ((value: number) => ChartLabel) | undefined
  #showAxes: boolean = true

  constructor(props: PlotProps = {}) {
    super(props)
    this.#update(props)
  }

  update(props: PlotProps) {
    this.#update(props)
    super.update(props)
  }

  #update({title, xAxisLabels, yAxisLabels, yLabels, showAxes}: PlotProps) {
    this.#title = title
    this.#xAxisLabels = xAxisLabels ?? true
    this.#yAxisLabels = yAxisLabels ?? true
    this.#yLabelsFn = yLabels
    this.#showAxes = showAxes ?? true
  }

  get charts(): readonly Chart<any>[] {
    return this.#charts
  }

  add(chart: Chart<any>, at?: number): void {
    const index = this.#charts.indexOf(chart)
    if (index !== -1) {
      this.#charts.splice(index, 1)
    }
    this.#charts.splice(at ?? this.#charts.length, 0, chart)
    this.invalidateRender()
  }

  remove(chart: Chart<any>): void {
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
    if (viewport.isEmpty || this.#charts.length === 0) {
      return
    }

    const textStyle = this.purpose.text()
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
    let yLabels: ChartLabel[] = []
    const chartHeight =
      totalH -
      titleHeight -
      (this.#xAxisLabels ? 1 : 0) -
      (this.#showAxes ? 1 : 0)

    if (this.#yAxisLabels && chartHeight > 0) {
      // Generate labels from the combined Y range.
      const labelCount = Math.max(2, Math.min(chartHeight, 8))
      yLabels = this.#getYLabels(yRange, labelCount)
      const labelWidths = yLabels.flatMap(label =>
        label == null ? [] : [label.length],
      )
      if (labelWidths.length > 0) {
        yLabelWidth = Math.max(...labelWidths) + 1 // +1 for space
      }
    }

    // Axis line takes 1 column if shown
    const axisLineWidth = this.#showAxes ? 1 : 0

    const chartX = yLabelWidth + axisLineWidth
    const chartY = titleHeight
    const chartW = Math.max(0, totalW - chartX)
    const chartH = Math.max(0, chartHeight)

    if (chartW <= 0 || chartH <= 0) {
      return
    }

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
        const label = yLabels[i]
        if (label == null) {
          continue
        }
        const labelY =
          chartY +
          Math.round((i * (chartH - 1)) / Math.max(1, yLabels.length - 1))
        if (labelY < chartY + chartH) {
          viewport.write(
            label.padStart(yLabelWidth - 1),
            new Point(0, labelY),
            textStyle,
          )
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
      const xLabels = this.#charts[0].getXLabelEntries()
      if (xLabels.length > 0) {
        const xAxisY = chartY + chartH + (this.#showAxes ? 1 : 0)
        if (xAxisY < totalH) {
          // Sample labels, then position them on the shared numeric X scale.
          const labelCount = Math.min(xLabels.length, Math.floor(chartW / 4))
          for (let i = 0; i < labelCount; i++) {
            const dataIdx = Math.round(
              (i * (xLabels.length - 1)) / Math.max(1, labelCount - 1),
            )
            const {value, label} = xLabels[dataIdx]
            if (label == null) {
              continue
            }
            const labelX =
              chartX +
              Math.round(
                interpolate(
                  value,
                  [xRange.min, xRange.max],
                  [0, chartW - 1],
                  true,
                ),
              )
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
          transparent: this.#charts.length > 1,
        })
      })
    }
  }

  #getYLabels(range: ChartRange, count: number): ChartLabel[] {
    const labels: ChartLabel[] = []
    for (let i = 0; i < count; i++) {
      const value = interpolate(i, [0, count - 1], [range.max, range.min])
      if (this.#yLabelsFn) {
        labels.push(this.#yLabelsFn(value))
      } else if (this.#charts.length === 1) {
        // Preserve the deprecated chart formatter when there is no ambiguity.
        labels.push(this.#charts[0].formatYLabel(value))
      } else {
        labels.push(Chart.formatYLabel(value))
      }
    }
    return labels
  }

  #combinedXRange(): ChartRange {
    let min = Infinity
    let max = -Infinity
    for (const chart of this.#charts) {
      const range = chart.getXRange()
      if (range.min < min) {
        min = range.min
      }
      if (range.max > max) {
        max = range.max
      }
    }
    if (!isFinite(min)) {
      return {min: 0, max: 1}
    }
    return {min, max}
  }

  #combinedYRange(): ChartRange {
    let min = Infinity
    let max = -Infinity
    for (const chart of this.#charts) {
      const range = chart.getYRange()
      if (range.min < min) {
        min = range.min
      }
      if (range.max > max) {
        max = range.max
      }
    }
    if (!isFinite(min)) {
      return {min: 0, max: 1}
    }
    return {min, max}
  }
}
