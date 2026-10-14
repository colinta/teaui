import {Screen, Stack, Text, Toggle} from '@teaui/core'

const INITIAL_VALUE = false
const summary = new Text(describeValue(INITIAL_VALUE))

function describeValue(value) {
  return `Notifications: ${value ? 'on' : 'off'}`
}

const notifications = new Toggle({
  value: INITIAL_VALUE,
  width: 6,
  height: 2,
  onChange: value => {
    notifications.value = value
    summary.text = describeValue(value)
  },
})

const examples = Stack.down({
  width: 32,
  height: 9,
  children: [
    new Text('Normal: off / on'),
    Stack.right({
      gap: 2,
      height: 2,
      children: [
        new Toggle({value: false, width: 6, height: 2}),
        new Toggle({value: true, width: 6, height: 2}),
      ],
    }),
    new Text('Compact: off / on'),
    Stack.right({
      gap: 2,
      height: 1,
      children: [
        new Toggle({value: false, width: 6, height: 1}),
        new Toggle({value: true, width: 6, height: 1}),
      ],
    }),
    summary,
    notifications,
    new Text('Click, or Tab then Space/Enter'),
  ],
})

await Screen.start(examples)
