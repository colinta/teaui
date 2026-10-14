import React from 'react'
import {Style as CoreStyle, interceptConsoleLog} from '@teaui/core'
import {BarChart, LineChart, Plot, Stack, Style, Text, run} from '@teaui/react'

interface SalesRow {
  x: number
  month: string
  sales: number
  forecast: number
}

const SALES: SalesRow[] = [
  {x: 0, month: 'Jan', sales: 12, forecast: 10},
  {x: 1, month: 'Feb', sales: 19, forecast: 13},
  {x: 2, month: 'Mar', sales: 15, forecast: 16},
  {x: 3, month: 'Apr', sales: 26, forecast: 19},
  {x: 4, month: 'May', sales: 22, forecast: 22},
  {x: 5, month: 'Jun', sales: 31, forecast: 25},
  {x: 6, month: 'Jul', sales: 28, forecast: 28},
  {x: 7, month: 'Aug', sales: 35, forecast: 31},
  {x: 8, month: 'Sep', sales: 30, forecast: 34},
  {x: 9, month: 'Oct', sales: 41, forecast: 37},
  {x: 10, month: 'Nov', sales: 38, forecast: 40},
  {x: 11, month: 'Dec', sales: 46, forecast: 43},
]

export function ChartsTab() {
  return (
    <Stack.down flex={1} gap={1}>
      <Text>
        <Style bold foreground="cyan">
          Charts
        </Style>{' '}
        — bars show actual sales; the line shows the forecast
      </Text>

      <Plot
        flex={1}
        title="Monthly sales — actual vs forecast"
        yLabels={value => `$${Math.round(value)}`}
      >
        <BarChart
          data={SALES}
          extract={row => [row.x, row.sales]}
          xLabels={(row, index) => (index % 2 === 0 ? row.month : null)}
          style={barStyle}
          barWidth={3}
        />
        <LineChart data={SALES} extract={row => [row.x, row.forecast]} />
      </Plot>
    </Stack.down>
  )
}

function barStyle(_row: SalesRow, index: number): CoreStyle {
  const color = index % 2 === 0 ? 'cyan' : 'magenta'
  return new CoreStyle({foreground: color, background: color})
}

if (import.meta.url === `file://${process.argv[1]}`) {
  interceptConsoleLog()
  run(<ChartsTab />)
}
