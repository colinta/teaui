import {Screen, Stack, Text} from '@teaui/core'

function letters() {
  return [new Text('A'), new Text('B'), new Text('C')]
}

const examples = Stack.down({
  width: 44,
  height: 13,
  children: [
    new Text('Directions: same children A, B, C'),
    Stack.right({
      gap: 2,
      children: [
        new Text({text: 'down (gap 1)', width: 21}),
        new Text({text: 'up (gap 1)', width: 21}),
      ],
    }),
    Stack.right({
      height: 5,
      gap: 2,
      children: [
        Stack.down(letters(), {width: 21, height: 5, gap: 1}),
        Stack.up(letters(), {width: 21, height: 5, gap: 1}),
      ],
    }),
    new Text('right (gap 2)'),
    Stack.right(letters(), {gap: 2}),
    new Text('left (gap 2)'),
    Stack.left(letters(), {gap: 2}),
    Stack.right({
      gap: 1,
      children: [
        new Text({text: 'fill=true', width: 15}),
        new Stack({
          direction: 'right',
          fill: true,
          children: [
            [1, new Text('A')],
            [1, new Text('B')],
          ],
        }),
      ],
    }),
    Stack.right({
      gap: 1,
      children: [
        new Text({text: 'fill=false', width: 15}),
        new Stack({
          direction: 'right',
          fill: false,
          children: [
            [1, new Text('A')],
            [1, new Text('B')],
          ],
        }),
      ],
    }),
  ],
})

await Screen.start(examples)
