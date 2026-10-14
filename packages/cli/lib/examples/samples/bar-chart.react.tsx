import React from 'react'
import {BarChart, run} from '@teaui/react'

await run(
  <BarChart
    data={[2, 4, 6, 8]}
    extract={(value, index) => [index, value]}
    barWidth={2}
  />,
)
