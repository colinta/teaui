import {Plot, LineChart, BarChart, Stack, Text} from '@teaui/core'

import {demo} from './demo.js'

// Sample time-series data
interface SalesData {
  month: string
  sales: number
}

const salesData: SalesData[] = [
  {month: 'Jan', sales: 120},
  {month: 'Feb', sales: 180},
  {month: 'Mar', sales: 150},
  {month: 'Apr', sales: 220},
  {month: 'May', sales: 280},
  {month: 'Jun', sales: 240},
  {month: 'Jul', sales: 310},
  {month: 'Aug', sales: 290},
  {month: 'Sep', sales: 350},
  {month: 'Oct', sales: 320},
  {month: 'Nov', sales: 380},
  {month: 'Dec', sales: 420},
]

// Line chart
const linePlot = new Plot({
  title: 'Monthly Sales (Line Chart)',
  width: 'fill',
  height: 'fill',
})

const lineChart = new LineChart<SalesData>(salesData, {
  extract: row => [salesData.indexOf(row), row.sales],
  xLabels: row => row.month,
  yLabels: value => `$${Math.round(value)}`,
})

linePlot.add(lineChart)

// Bar chart
const barPlot = new Plot({
  title: 'Monthly Sales (Bar Chart)',
  width: 'fill',
  height: 'fill',
})

const barChart = new BarChart<SalesData>(salesData, {
  extract: row => row.sales,
  xLabels: row => row.month,
  yLabels: value => `$${Math.round(value)}`,
  barWidth: 2,
  gap: 1,
})

barPlot.add(barChart)

demo(
  Stack.down({
    children: [
      new Text({text: 'Plot Demos'}),
      ['flex1', linePlot],
      ['flex1', barPlot],
    ],
  }),
)
