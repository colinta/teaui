import {Badge, Stack, Text, Style} from '@teaui/core'

import {demo} from './demo.js'

demo(
  Stack.down({
    gap: 1,
    children: [
      new Text({
        text: 'Badge Examples',
        style: new Style({bold: true}),
      }),
      Stack.right({
        gap: 1,
        children: [
          new Badge({text: 'default'}),
          new Badge({text: 'primary', purpose: 'primary'}),
          new Badge({text: 'secondary', purpose: 'secondary'}),
        ],
      }),
      Stack.right({
        gap: 1,
        children: [
          new Badge({text: 'proceed', purpose: 'proceed'}),
          new Badge({text: 'cancel', purpose: 'cancel'}),
          new Badge({text: 'selected', purpose: 'selected'}),
        ],
      }),
    ],
  }),
  false,
)
