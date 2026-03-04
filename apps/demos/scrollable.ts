import {Scrollable, Stack, Text} from '@teaui/core'

import {demo} from './demo.js'

demo(
  new Scrollable({
    child: Stack.down({
      children: Array(100)
        .fill(0)
        .map(
          (_, index) =>
            new Text({
              text: (index % 2
                ? 'abcdefghijklmnopqrstuvwxyz'
                : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
              ).repeat(12),
            }),
        ),
    }),
  }),
)
