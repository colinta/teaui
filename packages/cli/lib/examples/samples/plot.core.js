import {BarChart, Plot, Screen} from '@teaui/core'

const plot = new Plot({
  title: 'Daily orders',
  yLabels: value => (value < 4 ? null : value.toFixed(0)),
})
plot.add(
  new BarChart([2, 5, 3, 8], {
    extract: (value, index) => [index, value],
    xLabels: (_value, index) => (index % 2 === 0 ? String(index + 1) : null),
    barWidth: 3,
  }),
)

await Screen.start(plot)
