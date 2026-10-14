import {Radio, RadioGroup, Screen, Stack, Text} from '@teaui/core'

const OPTIONS = [
  ['Economy', 'economy'],
  ['Standard', 'standard'],
  ['Express', 'express'],
]
const INITIAL_VALUE = 'standard'

function describeSelection(value) {
  const label = OPTIONS.find(([, option]) => option === value)?.[0] ?? 'none'
  return `Shipping: ${label}`
}

const summary = new Text(describeSelection(INITIAL_VALUE))
const group = new RadioGroup({
  width: 32,
  height: 5,
  value: INITIAL_VALUE,
  onChange: value => {
    summary.text = describeSelection(value)
  },
  child: Stack.down({
    gap: 1,
    children: [
      Stack.down({
        children: OPTIONS.map(([title, value]) => new Radio({title, value})),
      }),
      summary,
    ],
  }),
})

await Screen.start(group)
