import {Screen, Skeleton, Stack, Text} from '@teaui/core'

const examples = Stack.down({
  width: 44,
  height: 13,
  background: 'default',
  children: [
    new Text('Skeleton loading placeholders'),
    Stack.right({
      height: 5,
      gap: 1,
      children: [
        Stack.down({
          width: 14,
          children: [
            new Text('rect (default)'),
            new Skeleton({width: 14, height: 4}),
          ],
        }),
        Stack.down({
          width: 14,
          children: [
            new Text('rounded-rect'),
            new Skeleton({shape: 'rounded-rect', width: 14, height: 4}),
          ],
        }),
        Stack.down({
          width: 14,
          children: [
            new Text('circle (8x4)'),
            new Skeleton({shape: 'circle', width: 8, height: 4}),
          ],
        }),
      ],
    }),
    new Text('row: natural height = 1'),
    new Skeleton({shape: 'row', height: 'natural'}),
    new Text('column: natural width = 1'),
    new Skeleton({shape: 'column', width: 'natural', height: 4}),
  ],
})

await Screen.start(examples)
