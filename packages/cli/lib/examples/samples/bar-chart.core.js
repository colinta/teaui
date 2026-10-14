import {BarChart, Screen, Style} from '@teaui/core'

const chart = new BarChart([2, 4, 6, 8], {
  extract: (value, index) => [index, value],
  style: (_value, index) =>
    new Style({foreground: index % 2 === 0 ? 'cyan' : 'magenta'}),
  barWidth: 2,
})

await Screen.start(chart)
