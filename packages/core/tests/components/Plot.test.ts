import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/testing.js'
import {Plot} from '../../lib/components/Plot.js'
import {LineChart} from '../../lib/components/charts/LineChart.js'
import {BarChart} from '../../lib/components/charts/BarChart.js'

interface DataPoint {
  x: number
  y: number
  label: string
}

const sampleData: DataPoint[] = [
  {x: 0, y: 0, label: 'A'},
  {x: 1, y: 5, label: 'B'},
  {x: 2, y: 3, label: 'C'},
  {x: 3, y: 8, label: 'D'},
  {x: 4, y: 2, label: 'E'},
]

describe('LineChart', () => {
  it('computes x range from data', () => {
    const chart = new LineChart(sampleData, {
      extract: (d: DataPoint) => [d.x, d.y],
    })
    const range = chart.getXRange()
    expect(range.min).toBe(0)
    expect(range.max).toBe(4)
  })

  it('computes y range from data', () => {
    const chart = new LineChart(sampleData, {
      extract: (d: DataPoint) => [d.x, d.y],
    })
    const range = chart.getYRange()
    expect(range.min).toBe(0)
    expect(range.max).toBe(8)
  })

  it('handles empty data', () => {
    const chart = new LineChart<DataPoint>([], {
      extract: (d: DataPoint) => [d.x, d.y],
    })
    const xRange = chart.getXRange()
    const yRange = chart.getYRange()
    expect(xRange.min).toBeLessThan(xRange.max)
    expect(yRange.min).toBeLessThan(yRange.max)
  })

  it('handles single data point', () => {
    const chart = new LineChart([{x: 5, y: 10, label: 'A'}], {
      extract: (d: DataPoint) => [d.x, d.y],
    })
    // Single point should expand the range
    const xRange = chart.getXRange()
    expect(xRange.min).toBeLessThan(xRange.max)
  })

  it('generates x labels', () => {
    const chart = new LineChart(sampleData, {
      extract: (d: DataPoint) => [d.x, d.y],
      xLabels: (d: DataPoint) => d.label,
    })
    expect(chart.getXLabels()).toEqual(['A', 'B', 'C', 'D', 'E'])
  })

  it('generates y labels', () => {
    const chart = new LineChart(sampleData, {
      extract: (d: DataPoint) => [d.x, d.y],
      yLabels: (v: number) => `${Math.round(v)}`,
    })
    const labels = chart.getYLabels(3)
    expect(labels).toHaveLength(3)
    // First label should be max, last should be min
    expect(labels[0]).toBe('8')
    expect(labels[2]).toBe('0')
  })

  it('renders without throwing', () => {
    const chart = new LineChart(sampleData, {
      extract: (d: DataPoint) => [d.x, d.y],
    })
    const t = testRender(chart, {width: 20, height: 10})
    // Should render braille characters
    const content = t.terminal.textContent()
    expect(content.length).toBeGreaterThan(0)
  })

  it('renders empty data without throwing', () => {
    const chart = new LineChart<DataPoint>([], {
      extract: (d: DataPoint) => [d.x, d.y],
    })
    // Should not throw
    testRender(chart, {width: 20, height: 10})
  })

  it('data can be updated', () => {
    const chart = new LineChart(sampleData, {
      extract: (d: DataPoint) => [d.x, d.y],
    })
    chart.data = [{x: 0, y: 0, label: 'Z'}]
    expect(chart.data).toHaveLength(1)
  })
})

describe('BarChart', () => {
  const barData = [
    {value: 10, label: 'Jan'},
    {value: 25, label: 'Feb'},
    {value: 15, label: 'Mar'},
    {value: 30, label: 'Apr'},
  ]

  it('computes y range starting from 0', () => {
    const chart = new BarChart(barData, {
      extract: (d) => d.value,
    })
    const range = chart.getYRange()
    expect(range.min).toBe(0)
    expect(range.max).toBe(30)
  })

  it('computes x range as index range', () => {
    const chart = new BarChart(barData, {
      extract: (d) => d.value,
    })
    const range = chart.getXRange()
    expect(range.min).toBe(0)
    expect(range.max).toBe(3) // 4 items, 0-indexed
  })

  it('handles empty data', () => {
    const chart = new BarChart<{value: number}>([], {
      extract: (d) => d.value,
    })
    const range = chart.getYRange()
    expect(range.min).toBeLessThanOrEqual(range.max)
  })

  it('generates x labels', () => {
    const chart = new BarChart(barData, {
      extract: (d) => d.value,
      xLabels: (d) => d.label,
    })
    expect(chart.getXLabels()).toEqual(['Jan', 'Feb', 'Mar', 'Apr'])
  })

  it('renders without throwing', () => {
    const chart = new BarChart(barData, {
      extract: (d) => d.value,
    })
    const t = testRender(chart, {width: 20, height: 10})
    const content = t.terminal.textContent()
    expect(content.length).toBeGreaterThan(0)
  })

  it('renders bars with block characters', () => {
    const chart = new BarChart([{value: 100}], {
      extract: (d) => d.value,
      barWidth: 1,
    })
    const t = testRender(chart, {width: 1, height: 4})
    // Full-height bar should have full blocks
    const content = t.terminal.textContent()
    expect(content).toContain('█')
  })

  it('renders partial height bars with fractional blocks', () => {
    // A bar at half height in a 2-row area = 1 full row
    const chart = new BarChart([{value: 50}], {
      extract: (d) => d.value,
      barWidth: 1,
    })
    const t = testRender(chart, {width: 1, height: 2})
    // Bottom row should be full block, top row should be empty or partial
    const bottomChar = t.terminal.charAt(0, 1)
    expect(bottomChar).toBe('█')
  })

  it('supports custom bar width', () => {
    const chart = new BarChart([{value: 100}, {value: 100}], {
      extract: (d) => d.value,
      barWidth: 3,
      gap: 1,
    })
    const t = testRender(chart, {width: 10, height: 4})
    const content = t.terminal.textContent()
    expect(content).toContain('█')
  })
})

describe('Plot', () => {
  it('renders with a LineChart', () => {
    const plot = new Plot({title: 'Test Plot', width: 40, height: 15})
    const chart = new LineChart(sampleData, {
      extract: (d: DataPoint) => [d.x, d.y],
    })
    plot.add(chart)

    const t = testRender(plot, {width: 40, height: 15})
    const content = t.terminal.textContent()
    // Should show title
    expect(content).toContain('Test Plot')
    // Should show axis lines
    expect(content).toContain('│')
    expect(content).toContain('─')
    expect(content).toContain('└')
  })

  it('renders with a BarChart', () => {
    const barData = [
      {value: 10, label: 'A'},
      {value: 20, label: 'B'},
      {value: 15, label: 'C'},
    ]
    const plot = new Plot({title: 'Bar Plot', width: 30, height: 10})
    const chart = new BarChart(barData, {
      extract: (d) => d.value,
      xLabels: (d) => d.label,
    })
    plot.add(chart)

    const t = testRender(plot, {width: 30, height: 10})
    const content = t.terminal.textContent()
    expect(content).toContain('Bar Plot')
  })

  it('renders without title', () => {
    const plot = new Plot({width: 30, height: 10})
    const chart = new LineChart(sampleData, {
      extract: (d: DataPoint) => [d.x, d.y],
    })
    plot.add(chart)

    const t = testRender(plot, {width: 30, height: 10})
    const content = t.terminal.textContent()
    // Should have axis but no title
    expect(content).toContain('│')
  })

  it('renders without axes', () => {
    const plot = new Plot({showAxes: false, width: 30, height: 10})
    const chart = new LineChart(sampleData, {
      extract: (d: DataPoint) => [d.x, d.y],
    })
    plot.add(chart)

    const t = testRender(plot, {width: 30, height: 10})
    const content = t.terminal.textContent()
    // Should NOT contain axis characters
    expect(content).not.toContain('└')
  })

  it('renders without y-axis labels', () => {
    const plot = new Plot({yAxisLabels: false, width: 30, height: 10})
    const chart = new LineChart(sampleData, {
      extract: (d: DataPoint) => [d.x, d.y],
    })
    plot.add(chart)

    // Should not throw
    const t = testRender(plot, {width: 30, height: 10})
    expect(t.terminal.textContent().length).toBeGreaterThan(0)
  })

  it('renders nothing with no charts', () => {
    const plot = new Plot({width: 30, height: 10})
    // No charts added
    const t = testRender(plot, {width: 30, height: 10})
    // Should be essentially empty
    const content = t.terminal.textContent()
    expect(content.trim()).toBe('')
  })

  it('supports multiple charts', () => {
    const plot = new Plot({width: 40, height: 15})
    const chart1 = new LineChart(sampleData, {
      extract: (d: DataPoint) => [d.x, d.y],
    })
    const chart2 = new LineChart(
      [{x: 0, y: 1, label: 'X'}, {x: 4, y: 6, label: 'Y'}],
      {extract: (d: DataPoint) => [d.x, d.y]},
    )
    plot.add(chart1)
    plot.add(chart2)

    // Should not throw
    const t = testRender(plot, {width: 40, height: 15})
    expect(t.terminal.textContent().length).toBeGreaterThan(0)
  })

  it('remove chart works', () => {
    const plot = new Plot({width: 30, height: 10})
    const chart = new LineChart(sampleData, {
      extract: (d: DataPoint) => [d.x, d.y],
    })
    plot.add(chart)
    plot.remove(chart)

    const t = testRender(plot, {width: 30, height: 10})
    const content = t.terminal.textContent()
    expect(content.trim()).toBe('')
  })

  it('with x-axis labels', () => {
    const plot = new Plot({width: 40, height: 12})
    const chart = new LineChart(sampleData, {
      extract: (d: DataPoint) => [d.x, d.y],
      xLabels: (d: DataPoint) => d.label,
    })
    plot.add(chart)

    const t = testRender(plot, {width: 40, height: 12})
    const content = t.terminal.textContent()
    // Should contain at least some x labels
    expect(content).toContain('A')
  })

  it('with custom y-axis labels', () => {
    const plot = new Plot({width: 40, height: 12})
    const chart = new LineChart(sampleData, {
      extract: (d: DataPoint) => [d.x, d.y],
      yLabels: (v: number) => `$${Math.round(v)}`,
    })
    plot.add(chart)

    const t = testRender(plot, {width: 40, height: 12})
    const content = t.terminal.textContent()
    // Should contain dollar-formatted labels
    expect(content).toContain('$')
  })
})
