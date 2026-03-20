import {Logo, Box, Stack, Text, Style} from '@teaui/core'

import {demo} from './demo.js'

demo(
  Stack.down({
    children: [
      new Box({
        border: 'rounded',
        child: new Logo({isAnimating: true}),
        width: 'natural',
      }),
      new Text({
        text: '',
        style: new Style({foreground: 'white'}),
      }),
    ],
  }),
  false,
)
