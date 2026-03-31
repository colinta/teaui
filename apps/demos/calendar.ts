import {AutoLegend, Calendar, Stack, Space, Text} from '@teaui/core'

import {demo} from './demo.js'

const now = new Date()
const statusText = new Text({
  text: `Selected: ${now.toLocaleDateString()}`,
})

const calendar = new Calendar({
  date: now,
  visibleDate: new Date(now.getFullYear(), now.getMonth(), 1),
  theme: 'primary',
  onChangeVisible(date) {
    console.log(
      `Navigated to: ${date.toLocaleDateString('en-US', {month: 'long', year: 'numeric'})}`,
    )
  },
  onChange(date1, date2) {
    if (date1.getTime() === date2.getTime()) {
      statusText.text = `Selected: ${date1.toLocaleDateString()}`
    } else {
      statusText.text = `Range: ${date1.toLocaleDateString()} – ${date2.toLocaleDateString()}`
    }
    console.log(statusText.text)
  },
})

const calendarRange = new Calendar({
  date: now,
  visibleDate: new Date(now.getFullYear(), now.getMonth(), 1),
  selection: 'range',
  theme: 'proceed',
  onChangeVisible(date) {
    console.log(
      `Range calendar navigated to: ${date.toLocaleDateString('en-US', {month: 'long', year: 'numeric'})}`,
    )
  },
  onChange(date1, date2) {
    console.log(
      `Range selected: ${date1.toLocaleDateString()} – ${date2.toLocaleDateString()}`,
    )
  },
})

const calendarMonday = new Calendar({
  date: now,
  visibleDate: new Date(now.getFullYear(), now.getMonth(), 1),
  firstDayOfWeek: 1,
  theme: 'secondary',
})

demo(
  Stack.down({
    children: [
      new Space({height: 1}),
      Stack.right({
        children: [
          new Space({width: 2}),
          Stack.down({
            children: [
              new Text({text: 'Single selection (Sunday start):'}),
              new Space({height: 1}),
              calendar,
            ],
          }),
          new Space({width: 4}),
          Stack.down({
            children: [
              new Text({text: 'Range selection:'}),
              new Space({height: 1}),
              calendarRange,
            ],
          }),
          new Space({width: 4}),
          Stack.down({
            children: [
              new Text({text: 'Monday start:'}),
              new Space({height: 1}),
              calendarMonday,
            ],
          }),
        ],
      }),
      new Space({height: 1}),
      statusText,
      ['flex1', new Space()],
      new AutoLegend(),
    ],
  }),
)
