import {Skeleton, Space, Stack, Text, type View} from '@teaui/core'

import {demo} from './demo.js'

const LABEL_WIDTH = 14

const shapes = Stack.down(
  [
    example(
      'rect',
      Stack.right(
        [
          new Skeleton({shape: 'rect', width: 4, height: 4}),
          new Skeleton({shape: 'rect', width: 10, height: 4}),
        ],
        {gap: 2},
      ),
    ),
    example(
      'rounded-rect',
      Stack.right(
        [
          new Skeleton({shape: 'rounded-rect', width: 4, height: 4}),
          new Skeleton({shape: 'rounded-rect', width: 10, height: 4}),
        ],
        {gap: 2},
      ),
    ),
    example(
      'circle',
      Stack.right(
        [
          new Skeleton({shape: 'circle', width: 4, height: 4}),
          new Skeleton({shape: 'circle', width: 10, height: 4}),
        ],
        {gap: 2},
      ),
    ),
    example(
      '',
      Stack.right(
        [
          new Skeleton({shape: 'circle', width: 9, height: 6}),
          new Skeleton({shape: 'circle', width: 13, height: 6}),
        ],
        {gap: 2},
      ),
    ),
    example('row', Stack.down([rowPair(1), Space.vertical(1), rowPair(2)])),
    example(
      'column',
      Stack.right([
        columnGroup(4, 1),
        Space.horizontal(2),
        columnGroup(6, 1),
        Space.horizontal(4),
        columnGroup(4, 2),
        Space.horizontal(4),
        columnGroup(6, 2),
      ]),
    ),
  ],
  {gap: 1},
)

demo(shapes)

function example(label: string, view: View) {
  return Stack.right([new Text({text: label, width: LABEL_WIDTH}), view])
}

function rowPair(count: number) {
  return Stack.right([
    rowGroup(3, count),
    Space.horizontal(6),
    rowGroup(7, count),
  ])
}

function rowGroup(width: number, count: number) {
  return Stack.down(
    Array.from({length: count}, () => new Skeleton({shape: 'row', width})),
  )
}

function columnGroup(height: number, count: number) {
  return Stack.right(
    Array.from({length: count}, () => new Skeleton({shape: 'column', height})),
  )
}
