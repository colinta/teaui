import {Screen, Separator, Stack, Text} from '@teaui/core'

const borders = [
  'single',
  'leading',
  'trailing',
  'bold',
  'dash',
  'dash2',
  'dash3',
  'dash4',
  'double',
]

const examples = Stack.down({
  width: 36,
  height: 20,
  children: [
    new Text({text: 'Horizontal borders'}),
    ...borders.map(border =>
      Stack.right({
        height: 1,
        children: [
          new Text({text: border, width: 10}),
          new Separator({direction: 'horizontal', border, flex: 1}),
        ],
      }),
    ),
    new Text({text: 'Vertical: single / bold / double'}),
    Stack.right({
      height: 3,
      children: [
        new Text({text: 'Left', width: 8}),
        Separator.vertical(),
        new Text({text: 'Middle', width: 8}),
        Separator.vertical({border: 'bold'}),
        new Text({text: 'Right', width: 8}),
        Separator.vertical({border: 'double'}),
      ],
    }),
    new Text({text: 'Numeric padding: 1 (five rows)'}),
    Separator.horizontal({border: 'double', padding: 1}),
  ],
})

await Screen.start(examples)
