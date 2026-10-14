import {Screen, Space, Stack, Text} from '@teaui/core'

const examples = Stack.down({
  width: 40,
  height: 14,
  background: 'default',
  children: [
    new Text({text: 'Natural: no implicit gap'}),
    Stack.right({
      height: 1,
      children: [new Text({text: 'A'}), new Space(), new Text({text: 'B'})],
    }),
    new Text({text: 'Fixed width: 4 columns'}),
    Stack.right({
      height: 1,
      children: [
        new Text({text: 'Left'}),
        Space.horizontal(4),
        new Text({text: 'Right'}),
      ],
    }),
    new Text({text: 'Flexible: consumes remaining width'}),
    Stack.right({
      height: 1,
      children: [
        new Text({text: 'Left'}),
        new Space({flex: 1}),
        new Text({text: 'Right'}),
      ],
    }),
    new Text({text: 'Fixed height: 2 rows'}),
    new Text({text: 'Top'}),
    Space.vertical(2),
    new Text({text: 'Bottom'}),
    new Text({text: 'Background: cyan, 8 x 2'}),
    Stack.right({
      height: 2,
      children: [
        new Text({text: '['}),
        new Space({width: 8, height: 2, background: 'cyan'}),
        new Text({text: ']'}),
      ],
    }),
  ],
})

await Screen.start(examples)
