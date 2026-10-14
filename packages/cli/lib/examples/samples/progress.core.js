import {Progress, Screen, Stack, Text} from '@teaui/core'

const examples = Stack.down({
  width: 36,
  height: 19,
  children: [
    new Text({text: 'Default: empty, no percentage'}),
    new Progress({height: 1}),
    new Text({text: 'Half: no percentage'}),
    new Progress({value: 50, height: 1}),
    new Text({text: 'Centered percentage'}),
    new Progress({
      value: 65,
      showPercent: true,
      location: 'center',
      purpose: 'primary',
      height: 1,
    }),
    new Text({text: 'Left: external percentage'}),
    new Progress({
      value: 5,
      showPercent: true,
      location: 'left',
      height: 1,
    }),
    new Text({text: 'Right: clamped above maximum'}),
    new Progress({
      value: 150,
      showPercent: true,
      location: 'right',
      height: 1,
    }),
    new Text({text: 'Custom range: 10..30, value 20'}),
    new Progress({
      min: 10,
      max: 30,
      value: 20,
      showPercent: true,
      height: 3,
    }),
    new Text({text: 'Vertical: fills bottom to top'}),
    new Progress({
      direction: 'vertical',
      value: 50,
      purpose: 'proceed',
      width: 3,
      height: 4,
    }),
  ],
})

await Screen.start(examples)
