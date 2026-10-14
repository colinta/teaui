import {Screen, Slider, Stack, Text} from '@teaui/core'

const INITIAL_VALUE = 20
const summary = new Text(describeValue(INITIAL_VALUE))

function describeValue(value) {
  return `Buttons: range [10, 30], value ${value}`
}

const vertical = {direction: 'vertical', range: [0, 100], value: 50, step: 25}
const examples = Stack.down({
  width: 44,
  height: 27,
  children: [
    new Text('Default: range [0, 1], value 0'),
    new Slider({width: 44, height: 1}),
    new Text('Bordered: range [0, 100], value 50'),
    new Slider({
      range: [0, 100],
      value: 50,
      border: true,
      width: 44,
      height: 3,
    }),
    summary,
    new Slider({
      range: [10, 30],
      value: INITIAL_VALUE,
      step: 5,
      buttons: true,
      width: 44,
      height: 1,
      onChange: value => {
        summary.text = describeValue(value)
      },
    }),
    new Text('Border + buttons: value 75, step 5'),
    new Slider({
      range: [0, 100],
      value: 75,
      step: 5,
      buttons: true,
      border: true,
      purpose: 'primary',
      width: 44,
      height: 3,
    }),
    Stack.right({
      gap: 2,
      children: [
        new Text({text: 'Minimum 0', width: 21}),
        new Text({text: 'Maximum 100', width: 21}),
      ],
    }),
    Stack.right({
      gap: 2,
      children: [
        new Slider({range: [0, 100], value: 0, width: 21, height: 1}),
        new Slider({range: [0, 100], value: 100, width: 21, height: 1}),
      ],
    }),
    new Text('Vertical: [0, 100], step 25; down = more'),
    Stack.right({
      height: 12,
      gap: 1,
      children: [
        Stack.down({
          width: 10,
          children: [
            new Text('Plain'),
            new Slider({...vertical, width: 1, height: 11}),
          ],
        }),
        Stack.down({
          width: 10,
          children: [
            new Text('Border'),
            new Slider({...vertical, border: true, width: 3, height: 11}),
          ],
        }),
        Stack.down({
          width: 10,
          children: [
            new Text('Buttons'),
            new Slider({...vertical, buttons: true, width: 1, height: 11}),
          ],
        }),
        Stack.down({
          width: 11,
          children: [
            new Text('Both'),
            new Slider({
              ...vertical,
              buttons: true,
              border: true,
              width: 3,
              height: 11,
            }),
          ],
        }),
      ],
    }),
  ],
})

await Screen.start(examples)
