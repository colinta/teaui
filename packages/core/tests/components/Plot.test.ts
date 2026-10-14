import {describe, it, expect} from 'vitest'
import {Style} from '../../lib/Style.js'
import {testRender} from '../../lib/TestScreen.js'
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

  it('allows x and y label formatters to skip labels', () => {
    const chart = new LineChart(sampleData, {
      extract: (d: DataPoint) => [d.x, d.y],
      xLabels: row => (row.label === 'B' ? null : row.label),
      yLabels: value => (value === 4 ? undefined : String(value)),
    })
    expect(chart.getXLabels()).toEqual(['A', null, 'C', 'D', 'E'])
    expect(chart.getYLabels(3)).toEqual(['8', undefined, '0'])
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

  it('renders data on the first frame (not blank)', () => {
    const chart = new LineChart(sampleData, {
      extract: (d: DataPoint) => [d.x, d.y],
    })
    const t = testRender(chart, {width: 20, height: 10})
    // At least some cells should have non-empty braille (not just U+2800 spaces)
    const content = t.terminal.textContent()
    const hasVisibleBraille = [...content].some(
      ch => ch.charCodeAt(0) > 0x2800 && ch.charCodeAt(0) <= 0x28ff,
    )
    expect(hasVisibleBraille).toBe(true)
  })

  it('renders empty data without throwing', () => {
    const chart = new LineChart<DataPoint>([], {
      extract: (d: DataPoint) => [d.x, d.y],
    })
    // Should not throw
    testRender(chart, {width: 20, height: 10})
  })

  it('retains data and extraction when updating only View props', () => {
    const chart = new LineChart(sampleData, {
      extract: d => [d.x, d.y],
    })
    chart.update({width: 20})
    expect(chart.data).toBe(sampleData)
    expect(chart.getXRange()).toEqual({min: 0, max: 4})
    expect(chart.getYRange()).toEqual({min: 0, max: 8})
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
      extract: (d, index) => [index, d.value],
    })
    const range = chart.getYRange()
    expect(range.min).toBe(0)
    expect(range.max).toBe(30)
  })

  it('computes a padded x range from extracted values', () => {
    const chart = new BarChart(barData, {
      extract: (d, index) => [index, d.value],
    })
    const range = chart.getXRange()
    expect(range.min).toBe(-0.5)
    expect(range.max).toBe(3.5)
  })

  it('handles empty data', () => {
    const chart = new BarChart<{value: number}>([], {
      extract: (d, index) => [index, d.value],
    })
    const range = chart.getYRange()
    expect(range.min).toBeLessThanOrEqual(range.max)
  })

  it('generates x labels', () => {
    const chart = new BarChart(barData, {
      extract: (d, index) => [index, d.value],
      xLabels: d => d.label,
    })
    expect(chart.getXLabels()).toEqual(['Jan', 'Feb', 'Mar', 'Apr'])
  })

  it('allows x and y label formatters to skip labels', () => {
    const chart = new BarChart(barData, {
      extract: (d, index) => [index, d.value],
      xLabels: (row, index) => (index === 1 ? undefined : row.label),
      yLabels: value => (value === 15 ? null : String(value)),
    })
    expect(chart.getXLabels()).toEqual(['Jan', undefined, 'Mar', 'Apr'])
    expect(chart.getYLabels(3)).toEqual(['30', null, '0'])
  })

  it('renders without throwing', () => {
    const chart = new BarChart(barData, {
      extract: (d, index) => [index, d.value],
    })
    const t = testRender(chart, {width: 20, height: 10})
    const content = t.terminal.textContent()
    expect(content.length).toBeGreaterThan(0)
  })

  it('renders bars with block characters', () => {
    const chart = new BarChart([{value: 100}], {
      extract: (d, index) => [index, d.value],
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
      extract: (d, index) => [index, d.value],
      barWidth: 1,
    })
    const t = testRender(chart, {width: 1, height: 2})
    // Bottom row should be full block, top row should be empty or partial
    const bottomChar = t.terminal.charAt(0, 1)
    expect(bottomChar).toBe('█')
  })

  it('retains data and extraction when updating only View props', () => {
    const chart = new BarChart(barData, {
      extract: (d, index) => [index, d.value],
    })
    chart.update({width: 20})
    expect(chart.data).toBe(barData)
    expect(chart.getYRange()).toEqual({min: 0, max: 30})
  })

  it('positions bars using extracted x values', () => {
    const chart = new BarChart(
      [
        {x: 0, value: 10},
        {x: 10, value: 10},
      ],
      {
        extract: row => [row.x, row.value],
        barWidth: 1,
      },
    )
    const t = testRender(chart, {width: 9, height: 1})
    expect(t.terminal.charAt(2, 0)).toBe('█')
    expect(t.terminal.charAt(6, 0)).toBe('█')
  })

  it('supports custom bar width', () => {
    const chart = new BarChart([{value: 100}, {value: 100}], {
      extract: (d, index) => [index, d.value],
      barWidth: 3,
    })
    const t = testRender(chart, {width: 10, height: 4})
    const content = t.terminal.textContent()
    expect(content).toContain('█')
  })

  it('supports a style function for individual bars', () => {
    const data = [{value: 100}, {value: 100}]
    const calls: Array<{row: (typeof data)[number]; index: number}> = []
    const chart = new BarChart(data, {
      extract: (row, index) => [index, row.value],
      style: (row, index) => {
        calls.push({row, index})
        return new Style({foreground: index === 0 ? 'red' : 'green'})
      },
    })
    const t = testRender(chart, {width: 4, height: 1})
    expect(calls).toEqual([
      {row: data[0], index: 0},
      {row: data[1], index: 1},
    ])
    expect(t.terminal.styleAt(1, 0).foreground).toBe('red')
    expect(t.terminal.styleAt(2, 0).foreground).toBe('green')
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

  it('renders chart data on the first frame', () => {
    const plot = new Plot({width: 40, height: 12})
    const chart = new LineChart(sampleData, {
      extract: (d: DataPoint) => [d.x, d.y],
    })
    plot.add(chart)

    const t = testRender(plot, {width: 40, height: 12})
    const content = t.terminal.textContent()
    // The chart area should contain visible braille characters, not just blanks
    const hasVisibleBraille = [...content].some(
      ch => ch.charCodeAt(0) > 0x2800 && ch.charCodeAt(0) <= 0x28ff,
    )
    expect(hasVisibleBraille).toBe(true)
  })

  it('renders with a BarChart', () => {
    const barData = [
      {value: 10, label: 'A'},
      {value: 20, label: 'B'},
      {value: 15, label: 'C'},
    ]
    const plot = new Plot({title: 'Bar Plot', width: 30, height: 10})
    const chart = new BarChart(barData, {
      extract: (d, index) => [index, d.value],
      xLabels: d => d.label,
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

  it('renders a line over bars without clearing the bars', () => {
    const plot = new Plot({
      width: 30,
      height: 10,
      xAxisLabels: false,
      yAxisLabels: false,
    })
    plot.add(
      new BarChart([10, 20, 15], {
        extract: (value, index) => [index, value],
        barWidth: 3,
      }),
    )
    const t = testRender(plot, {width: 30, height: 10})
    expect(t.terminal.textContent()).toMatch(/[▁-█]/)

    plot.add(
      new LineChart(
        [
          [0, 5],
          [1, 10],
          [2, 15],
        ],
        {extract: ([x, y]) => [x, y]},
      ),
    )
    t.render()

    const content = t.terminal.textContent()
    expect(content).toMatch(/[▁-█]/)
    expect(content).toMatch(/[\u2801-\u28ff]/)
  })

  it('preserves a bar background when a line is drawn over it', () => {
    const plot = new Plot({
      width: 9,
      height: 4,
      showAxes: false,
      xAxisLabels: false,
      yAxisLabels: false,
    })
    plot.add(
      new BarChart([{x: 0, value: 10}], {
        extract: row => [row.x, row.value],
        barWidth: 3,
        style: new Style({foreground: 'cyan', background: 'cyan'}),
      }),
    )
    const t = testRender(plot, {width: 9, height: 4})
    expect(t.terminal.styleAt(4, 2).background).toBe('cyan')

    plot.add(
      new LineChart(
        [
          [-1, 5],
          [1, 5],
        ],
        {extract: point => point},
      ),
    )
    t.render()

    expect(t.terminal.charAt(4, 2)).toMatch(/[\u2801-\u28ff]/)
    expect(t.terminal.styleAt(4, 2).background).toBe('cyan')
  })

  it('supports multiple charts', () => {
    const plot = new Plot({width: 40, height: 15})
    const chart1 = new LineChart(sampleData, {
      extract: (d: DataPoint) => [d.x, d.y],
    })
    const chart2 = new LineChart(
      [
        {x: 0, y: 1, label: 'X'},
        {x: 4, y: 6, label: 'Y'},
      ],
      {extract: (d: DataPoint) => [d.x, d.y]},
    )
    plot.add(chart1)
    plot.add(chart2)

    // Should not throw
    const t = testRender(plot, {width: 40, height: 15})
    expect(t.terminal.textContent().length).toBeGreaterThan(0)
  })

  it('supports indexed chart insertion and moves without duplicate charts', () => {
    const plot = new Plot()
    const a = new BarChart([1], {
      extract: (value, index) => [index, value],
    })
    const b = new BarChart([2], {
      extract: (value, index) => [index, value],
    })
    const c = new BarChart([3], {
      extract: (value, index) => [index, value],
    })
    plot.add(a)
    plot.add(b)
    plot.add(c, 1)
    expect(plot.charts).toEqual([a, c, b])
    plot.add(b, 0)
    expect(plot.charts).toEqual([b, a, c])
    plot.add(b)
    expect(plot.charts).toEqual([a, c, b])
    plot.remove(c)
    expect(plot.charts).toEqual([a, b])
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

  it('aligns bar labels with extracted x values', () => {
    const plot = new Plot({
      width: 9,
      height: 2,
      showAxes: false,
      yAxisLabels: false,
    })
    plot.add(
      new BarChart(
        [
          {x: 0, value: 10, label: 'A'},
          {x: 10, value: 10, label: 'B'},
        ],
        {
          extract: row => [row.x, row.value],
          xLabels: row => row.label,
        },
      ),
    )

    const terminal = testRender(plot, {width: 9, height: 2}).terminal
    expect(terminal.charAt(2, 0)).toBe('█')
    expect(terminal.charAt(2, 1)).toBe('A')
    expect(terminal.charAt(6, 0)).toBe('█')
    expect(terminal.charAt(6, 1)).toBe('B')
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

  it('skips null x-axis labels without changing label positions', () => {
    const plot = new Plot({width: 40, height: 12})
    const chart = new LineChart(sampleData, {
      extract: (d: DataPoint) => [d.x, d.y],
      xLabels: row => (row.label === 'B' ? null : row.label),
    })
    plot.add(chart)

    const content = testRender(plot, {
      width: 40,
      height: 12,
    }).terminal.textContent()
    expect(content).toContain('A')
    expect(content).not.toContain('B')
    expect(content).toContain('C')
  })

  it('with custom y-axis labels', () => {
    const plot = new Plot({
      width: 40,
      height: 12,
      yLabels: value => `$${Math.round(value)}`,
    })
    const chart = new LineChart(sampleData, {
      extract: (d: DataPoint) => [d.x, d.y],
    })
    plot.add(chart)

    const t = testRender(plot, {width: 40, height: 12})
    const content = t.terminal.textContent()
    // Should contain dollar-formatted labels
    expect(content).toContain('$')
  })

  it('calculates y-axis labels from the combined chart range', () => {
    const plot = new Plot({width: 30, height: 8})
    plot.add(
      new LineChart([10, 20], {
        extract: value => [value, value],
        yLabels: value => `WRONG${value}`,
      }),
    )
    plot.add(
      new BarChart([100], {
        extract: (value, index) => [index, value],
      }),
    )

    const content = testRender(plot, {
      width: 30,
      height: 8,
    }).terminal.textContent()
    expect(content).toContain('100')
    expect(content).toContain('0')
    expect(content).not.toContain('WRONG')
  })

  it('skips null y-axis labels while preserving their positions', () => {
    const plot = new Plot({
      width: 30,
      height: 5,
      yLabels: value => (value === 50 ? null : String(value)),
    })
    plot.add(
      new BarChart([100], {
        extract: (value, index) => [index, value],
      }),
    )

    const lines = testRender(plot, {width: 30, height: 5})
      .terminal.textContent()
      .split('\n')
    expect(lines[0]).toContain('100')
    expect(lines[1]).toMatch(/^\s*│/)
    expect(lines[2]).toContain('0')
  })

  describe('snapshot rendering', () => {
    it('renders a line chart', () => {
      const plot = new Plot({
        title: 'Sales',
        width: 40,
        height: 12,
        yLabels: value => String(Math.round(value)),
      })
      const chart = new LineChart(sampleData, {
        extract: (d: DataPoint) => [d.x, d.y],
        xLabels: (d: DataPoint) => d.label,
      })
      plot.add(chart)

      const t = testRender(plot, {width: 40, height: 12})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders a bar chart', () => {
      const barData = [
        {value: 10, label: 'Jan'},
        {value: 25, label: 'Feb'},
        {value: 15, label: 'Mar'},
        {value: 30, label: 'Apr'},
        {value: 20, label: 'May'},
      ]
      const plot = new Plot({
        title: 'Revenue',
        width: 40,
        height: 12,
        yLabels: value => String(Math.round(value)),
      })
      const chart = new BarChart(barData, {
        extract: (d, index) => [index, d.value],
        xLabels: d => d.label,
      })
      plot.add(chart)

      const t = testRender(plot, {width: 40, height: 12})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })
  })
})
