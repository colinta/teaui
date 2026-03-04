import {Button, Stack, Separator, Space} from '@teaui/core'

import {demo} from './demo.js'

demo(
  Stack.down([
    new Separator({
      direction: 'horizontal',
      border: 'trailing',
      padding: 1,
    }),

    ['flex1', new Space()],
    Stack.right(
      Array(8)
        .fill(0)
        .map((_, index): ['flex1', Button] => [
          'flex1',
          new Button({
            height: 1,
            theme: 'primary',
            title: `Launch ${8 - index}`,
          }),
        ]),
    ),
    ['flex1', new Space()],
    new Button({
      height: 3,
      border: 'none',
      theme: 'proceed',
      title: 'Proceed',
    }),

    ['flex1', new Space()],
    new Button({
      height: 3,
      border: 'none',
      theme: 'cancel',
      title: 'Cancel',
    }),

    ['flex1', new Space()],
    new Button({
      height: 3,
      border: 'none',
      theme: 'secondary',
      title: 'Do it!',
    }),

    ['flex1', new Space()],
    new Button({theme: 'plain', height: 3, title: 'Do it!'}),
    new Button({theme: 'selected', height: 3, title: 'Do it!'}),
    ['flex1', new Space()],
    new Separator({
      direction: 'horizontal',
      border: 'trailing',
      padding: 1,
    }),
  ]),
)
