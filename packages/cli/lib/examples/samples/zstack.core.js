import {Screen, Stack, Text, ZStack} from '@teaui/core'

const CELL_WIDTH = 14
const CELL_HEIGHT = 3
const BACKGROUND = Array(CELL_HEIGHT).fill('.'.repeat(CELL_WIDTH)).join('\n')

function locationRow(locations) {
  return Stack.right({
    gap: 1,
    children: locations.map(location =>
      Stack.down({
        width: CELL_WIDTH,
        children: [
          new Text(location),
          new ZStack({
            width: CELL_WIDTH,
            height: CELL_HEIGHT,
            location,
            children: [
              new Text(BACKGROUND),
              new Text('OK'),
              new Text({text: 'hidden', isVisible: false}),
            ],
          }),
        ],
      }),
    ),
  })
}

const examples = Stack.down({
  width: 44,
  height: 15,
  children: [
    new Text('Later children overwrite earlier ones'),
    new ZStack({
      children: [new Text('0123456789'), new Text('OVER')],
    }),
    new Text('location: natural-size layers in 14x3 cells'),
    locationRow(['top-left', 'top-center', 'top-right']),
    locationRow(['left', 'center', 'right']),
    locationRow(['bottom-left', 'bottom-center', 'bottom-right']),
  ],
})

await Screen.start(examples)
