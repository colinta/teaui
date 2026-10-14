import React from 'react'
import {describe, expect, it, vi} from 'vitest'
import {
  BarChart as CoreBarChart,
  LineChart as CoreLineChart,
  Log as CoreLog,
  Plot as CorePlot,
  TrackMouse as CoreTrackMouse,
  Style,
  Window,
  testRender,
  type Screen,
  type LogLine,
} from '@teaui/core'
import {
  BarChart,
  LineChart,
  Log,
  Plot,
  Space,
  Text,
  TrackMouse,
  render,
  type BarChartProps,
  type LineChartProps,
  type LogProps,
  type PlotProps,
  type TrackMouseProps,
} from '../lib/index.js'

function mount(element: React.ReactNode, width = 24, height = 8) {
  const window = new Window()
  const screen = {render: vi.fn()} as unknown as Screen
  const unmount = render(screen, window, element)
  const t = testRender(window, {width, height})
  return {window, t, unmount}
}

function flush() {
  return new Promise<void>(resolve => setTimeout(resolve, 0))
}

const points = [
  {x: 0, y: 1, alternate: 6, label: 'A'},
  {x: 1, y: 4, alternate: 2, label: 'B'},
  {x: 2, y: 2, alternate: 8, label: 'C'},
]
type Row = (typeof points)[number]

describe('chart wrappers', () => {
  it('renders BarChart and updates data, extract, labels, width, and style in place', async () => {
    const ref = React.createRef<CoreBarChart<Row>>()
    const initial: BarChartProps<Row> = {
      data: points,
      extract: row => [row.x, row.y],
      xLabels: row => row.label,
      yLabels: value => `Y${value}`,
      barWidth: 2,
      style: new Style({foreground: 'red'}),
    }
    let update!: React.Dispatch<React.SetStateAction<BarChartProps<Row>>>
    function App() {
      const [props, setProps] = React.useState(initial)
      update = setProps
      return <BarChart ref={ref} {...props} />
    }
    const {t} = mount(<App />, 12, 4)
    const chart = ref.current!
    expect(chart).toBeInstanceOf(CoreBarChart)
    expect(chart.getXLabels()).toEqual(['A', 'B', 'C'])
    expect(t.terminal.textContent()).toMatchSnapshot('wide red bars')
    expect(t.terminal.styleOf('█')?.foreground).toBe('red')

    update({
      data: points.slice(1),
      extract: row => [row.x, row.alternate],
      xLabels: (row, index) => `${index}:${row.label}`,
      yLabels: value => `$${value}`,
      barWidth: 3,
      style: new Style({foreground: 'green'}),
    })
    await flush()
    t.render()
    expect(ref.current).toBe(chart)
    expect(chart.data).toEqual(points.slice(1))
    expect(chart.getYRange()).toEqual({min: 0, max: 8})
    expect(chart.getXLabels()).toEqual(['0:B', '1:C'])
    expect(chart.getYLabels(2)).toEqual(['$8', '$0'])
    expect(t.terminal.textContent()).toMatchSnapshot('updated green bars')
    expect(t.terminal.styleOf('█')?.foreground).toBe('green')

    update({data: points, extract: row => [row.x, row.y]})
    await flush()
    t.render()
    expect(chart.getXLabels()).toEqual([])
    expect(chart.getYLabels(2)).toEqual(['4', '0'])
    expect(chart.chartStyle).toBeUndefined()
    expect(t.terminal.textContent()).toMatchSnapshot('default width restored')

    update({data: [], extract: row => [row.x, row.y]})
    await flush()
    t.render()
    expect(t.terminal.textContent()).toBe('')
  })

  it('supports a BarChart style function for individual rows', () => {
    const data = [{value: 1}, {value: 1}]
    const {t} = mount(
      <BarChart
        data={data}
        extract={(row, index) => [index, row.value]}
        style={(_row, index) =>
          new Style({foreground: index === 0 ? 'red' : 'green'})
        }
      />,
      4,
      1,
    )
    expect(t.terminal.styleAt(1, 0).foreground).toBe('red')
    expect(t.terminal.styleAt(2, 0).foreground).toBe('green')
  })

  it('renders LineChart braille and updates its data, extraction, and formatters in place', async () => {
    const ref = React.createRef<CoreLineChart<Row>>()
    const initial: LineChartProps<Row> = {
      data: points,
      extract: row => [row.x, row.y],
      xLabels: row => row.label,
      yLabels: value => `Y${value}`,
    }
    let update!: React.Dispatch<React.SetStateAction<LineChartProps<Row>>>
    function App() {
      const [props, setProps] = React.useState(initial)
      update = setProps
      return <LineChart ref={ref} {...props} />
    }
    const {t} = mount(<App />, 12, 4)
    const chart = ref.current!
    expect(chart).toBeInstanceOf(CoreLineChart)
    expect(t.terminal.textContent()).toMatch(/[\u2801-\u28ff]/)
    expect(t.terminal.textContent()).toMatchSnapshot('initial line')

    const style = new Style({bold: true})
    update({
      data: points.slice(1),
      extract: row => [row.x * 2, row.alternate],
      xLabels: row => `X${row.label}`,
      yLabels: value => `$${value}`,
      style,
    })
    await flush()
    t.render()
    expect(ref.current).toBe(chart)
    expect(chart.getXRange()).toEqual({min: 2, max: 4})
    expect(chart.getYRange()).toEqual({min: 2, max: 8})
    expect(chart.getXLabels()).toEqual(['XB', 'XC'])
    expect(chart.getYLabels(2)).toEqual(['$8', '$2'])
    expect(chart.chartStyle).toBe(style)
    expect(t.terminal.textContent()).toMatchSnapshot('updated line')

    update({data: points, extract: row => [row.x, row.y]})
    await flush()
    expect(chart.getXLabels()).toEqual([])
    expect(chart.getYLabels(2)).toEqual(['4', '1'])
    expect(chart.chartStyle).toBeUndefined()

    update({data: [], extract: row => [row.x, row.y]})
    await flush()
    t.render()
    expect(t.terminal.textContent()).toBe('')
  })
})

describe('Plot wrapper', () => {
  it('composes chart children from fragments and updates plot options', async () => {
    const ref = React.createRef<CorePlot>()
    const chartRef = React.createRef<CoreBarChart<Row>>()
    let update!: React.Dispatch<React.SetStateAction<PlotProps>>
    function Charts() {
      return (
        <>
          <BarChart
            ref={chartRef}
            data={points}
            extract={row => [row.x, row.y]}
            xLabels={row => row.label}
            barWidth={2}
          />
          <LineChart data={points} extract={row => [row.x, row.y]} />
        </>
      )
    }
    function App() {
      const [props, setProps] = React.useState<PlotProps>({
        title: 'Sales',
        yLabels: value => String(Math.round(value)),
      })
      update = setProps
      return (
        <Plot ref={ref} {...props}>
          <Charts />
        </Plot>
      )
    }
    const {t, unmount} = mount(<App />)
    const plot = ref.current!
    expect(plot).toBeInstanceOf(CorePlot)
    expect(plot.charts[0]).toBeInstanceOf(CoreBarChart)
    expect(plot.charts[1]).toBeInstanceOf(CoreLineChart)
    expect(t.terminal.textContent()).toContain('Sales')
    expect(t.terminal.textContent()).toContain('└')
    expect(t.terminal.textContent()).toMatchSnapshot('axes and title')

    update({
      title: 'Bare',
      showAxes: false,
      xAxisLabels: false,
      yAxisLabels: false,
    })
    await flush()
    t.render()
    expect(ref.current).toBe(plot)
    expect(t.terminal.textContent()).toContain('Bare')
    expect(t.terminal.textContent()).not.toContain('└')
    expect(t.terminal.textContent()).toMatchSnapshot('no axes or labels')

    update({})
    await flush()
    t.render()
    expect(t.terminal.textContent()).not.toContain('Bare')
    expect(t.terminal.textContent()).toContain('└')
    expect(t.terminal.textContent()).toMatchSnapshot('defaults restored')
    unmount()
    expect(ref.current).toBeNull()
    expect(chartRef.current).toBeNull()
  })

  it('preserves chart identity and x-axis-label order on keyed insertion, moves, and removal', async () => {
    const ref = React.createRef<CorePlot>()
    let reorder!: React.Dispatch<React.SetStateAction<string[]>>
    function App() {
      const [keys, setKeys] = React.useState(['a', 'b'])
      reorder = setKeys
      return (
        <Plot ref={ref}>
          {keys.map(key => (
            <LineChart
              key={key}
              data={[0, 1]}
              extract={value => [value, value]}
              xLabels={() => key.toUpperCase()}
            />
          ))}
        </Plot>
      )
    }
    const {t} = mount(<App />)
    const plot = ref.current!
    const [a, b] = plot.charts
    const known = new Map([
      ['a', a],
      ['b', b],
    ])
    for (const keys of [
      ['c', 'a', 'b'],
      ['b', 'c', 'a'],
      ['b', 'a', 'c'],
      ['c'],
      [],
    ]) {
      reorder(keys)
      await flush()
      t.render()
      for (const [index, key] of keys.entries()) {
        if (!known.has(key)) {
          known.set(key, plot.charts[index])
        }
        expect(plot.charts[index]).toBe(known.get(key))
      }
      expect(plot.charts).toHaveLength(keys.length)
      if (keys.length) {
        expect(t.terminal.textContent()).toContain(keys[0].toUpperCase())
      } else {
        expect(t.terminal.textContent()).toBe('')
      }
    }
  })

  it.each([
    ['view', (): React.ReactNode => <Space />],
    ['text', (): React.ReactNode => 'not a chart'],
  ] as const)('rejects non-chart children (%s)', (_label, child) => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      expect(() => mount(<Plot>{child()}</Plot>)).toThrow(
        'Plot only accepts Chart children',
      )
    } finally {
      error.mockRestore()
    }
  })
})

describe('Log wrapper', () => {
  it('renders supplied entries and replaces, clears, and removes controlled logs', async () => {
    const ref = React.createRef<CoreLog>()
    let update!: React.Dispatch<React.SetStateAction<LogProps>>
    const logs: LogLine[] = [
      {level: 'info', args: ['Server started']},
      {level: 'warn', args: ['Slow connection']},
      {level: 'error', args: ['Failed\nTry again']},
    ]
    function App() {
      const [props, setProps] = React.useState<LogProps>({logs})
      update = setProps
      return <Log ref={ref} {...props} />
    }
    const {t} = mount(<App />, 30, 6)
    const log = ref.current!
    expect(log).toBeInstanceOf(CoreLog)
    expect(t.terminal.textContent()).toContain('Server started')
    expect(t.terminal.textContent()).toContain('Try again')
    expect(t.terminal.textContent()).toMatchSnapshot('structured entries')
    expect(t.terminal.styleOf('Slow connection')?.foreground).toBe('yellow')

    update({logs: [{level: 'debug', args: ['Replacement']}]})
    await flush()
    t.render()
    expect(ref.current).toBe(log)
    expect(t.terminal.textContent()).not.toContain('Server started')
    expect(t.terminal.textContent()).toContain('Replacement')
    expect(t.terminal.textContent()).toMatchSnapshot('replacement entry')

    update({logs: []})
    await flush()
    t.render()
    expect(t.terminal.textContent()).not.toContain('Replacement')
    expect(t.terminal.textContent()).toMatchSnapshot('empty log scrollbar')

    update({logs})
    await flush()
    update({})
    await flush()
    t.render()
    expect(t.terminal.textContent()).not.toContain('Server started')
    expect(t.terminal.textContent()).toMatchSnapshot('empty log scrollbar')
  })

  it('supports imperative Core methods through a ref when logs are uncontrolled', async () => {
    const ref = React.createRef<CoreLog>()
    let update!: React.Dispatch<React.SetStateAction<number>>
    function App() {
      const [height, setHeight] = React.useState(3)
      update = setHeight
      return <Log ref={ref} height={height} />
    }
    const {t, unmount} = mount(<App />, 30, 4)
    ref.current!.setLogs([{level: 'info', args: ['Imperative']}])
    update(4)
    await flush()
    t.render()
    expect(t.terminal.textContent()).toContain('Imperative')
    ref.current!.appendLog({level: 'log', args: ['Appended']})
    t.render()
    expect(t.terminal.textContent()).toContain('Appended')
    ref.current!.clear()
    t.render()
    expect(t.terminal.textContent()).not.toContain('Imperative')
    expect(t.terminal.textContent()).not.toContain('Appended')
    unmount()
    expect(ref.current).toBeNull()
  })
})

describe('TrackMouse wrapper', () => {
  it('renders rulers and children, tracks pointer movement, and reconciles child/children props', async () => {
    const ref = React.createRef<CoreTrackMouse>()
    const listener = vi.fn()
    let update!: React.Dispatch<React.SetStateAction<TrackMouseProps>>
    function App() {
      const [props, setProps] = React.useState<TrackMouseProps>({
        children: <Text>Content</Text>,
      })
      update = setProps
      return <TrackMouse ref={ref} mouseListener={listener} {...props} />
    }
    const {t, unmount} = mount(<App />, 16, 5)
    const view = ref.current!
    expect(view).toBeInstanceOf(CoreTrackMouse)
    expect(view.children).toHaveLength(1)
    expect(t.terminal.textContent()).toContain('Content')
    expect(t.terminal.textContent()).toMatchSnapshot('rulers and content')

    t.sendMouse('mouse.move.in', {x: 4, y: 2})
    t.render()
    expect(listener).toHaveBeenCalled()
    expect(t.terminal.textContent()).toContain('4, 2')
    expect(t.terminal.styleAt(4, 0).inverse).toBe(true)
    expect(t.terminal.styleAt(0, 2).inverse).toBe(true)
    expect(t.terminal.textContent()).toMatchSnapshot('pointer coordinates')

    update({child: <Text>Replacement</Text>})
    await flush()
    t.render()
    expect(ref.current).toBe(view)
    expect(view.children).toHaveLength(1)
    expect(t.terminal.textContent()).toContain('Replacement')
    expect(t.terminal.textContent()).not.toContain('Content')

    update({children: 'Plain text'})
    await flush()
    t.render()
    expect(t.terminal.textContent()).toContain('Plain text')

    update({})
    await flush()
    t.render()
    expect(view.children).toHaveLength(0)
    expect(t.terminal.textContent()).not.toContain('Plain text')
    unmount()
    expect(ref.current).toBeNull()
  })
})
