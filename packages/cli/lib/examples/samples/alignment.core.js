import {
  Alignment,
  AlignmentScope,
  At,
  Box,
  Placement,
  Screen,
  Stack,
  Text,
} from '@teaui/core'

const cards = new Alignment({name: 'cards'})
const layout = new AlignmentScope({
  width: 40,
  height: 6,
  children: [
    new Placement({
      left: 0,
      right: cards.left.minus(1),
      child: new Text({
        text: 'This text stops one column before the widest card.',
        wrap: true,
      }),
    }),
    At.topRight([
      Stack.down([
        cards,
        Stack.left([new Box({child: new Text('Ready')})]),
        Stack.left([new Box({child: new Text('Next step')})]),
      ]),
    ]),
  ],
})

await Screen.start(layout)
