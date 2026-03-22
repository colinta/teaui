import {Scrollable, Text} from '@teaui/core'

import {demo} from './demo.js'

demo(
  Scrollable.down({
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
)
