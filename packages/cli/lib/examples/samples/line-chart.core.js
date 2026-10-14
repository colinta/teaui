import {LineChart, Screen} from '@teaui/core'

const chart = new LineChart(
  [
    [0, 1],
    [1, 4],
    [2, 2],
    [3, 5],
  ],
  {extract: point => point},
)

await Screen.start(chart)
