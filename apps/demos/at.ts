import {At, Box, Space, Text, ZStack, bold} from '@teaui/core'

import {demo} from './demo.js'

demo(
  new ZStack({
    children: [
      new Space({background: '#333'}),
      At.topLeft([new Text({text: bold(' ⌜ top-left ')})]),
      At.topCenter([new Text({text: bold(' top-center ')})]),
      At.topRight([new Text({text: bold(' top-right ⌝')})]),
      At.left([new Text({text: bold(' ◁ left ')})]),
      At.center([
        new Box({
          border: 'rounded',
          padding: 1,
          child: new Text({text: 'center'}),
        }),
      ]),
      At.right([new Text({text: bold(' right ▷')})]),
      At.bottomLeft([new Text({text: bold(' ⌞ bottom-left ')})]),
      At.bottomCenter([new Text({text: bold(' bottom-center ')})]),
      At.bottomRight([new Text({text: bold(' bottom-right ⌟')})]),
    ],
  }),
)
