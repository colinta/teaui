import React from 'react'
import {LineChart, run} from '@teaui/react'

await run(
  <LineChart<[number, number]>
    data={[
      [0, 1],
      [1, 4],
      [2, 2],
      [3, 5],
    ]}
    extract={point => point}
  />,
)
