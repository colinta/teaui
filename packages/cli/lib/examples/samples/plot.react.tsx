import React from 'react'
import {BarChart, Plot, run} from '@teaui/react'

await run(
  <Plot
    title="Daily orders"
    yLabels={value => (value < 4 ? null : value.toFixed(0))}
  >
    <BarChart
      data={[2, 5, 3, 8]}
      extract={(value, index) => [index, value]}
      xLabels={(_value, index) => (index % 2 === 0 ? String(index + 1) : null)}
      barWidth={3}
    />
  </Plot>,
)
