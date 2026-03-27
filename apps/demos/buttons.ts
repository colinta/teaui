import {Button, Separator, Space, Scrollable, Stack} from '@teaui/core'

import {demo} from './demo.js'

demo(
  Scrollable.down([
    new Separator({
      direction: 'horizontal',
      border: 'trailing',
      padding: 1,
    }),

    new Space({flex: 1}),
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

    new Separator({
      direction: 'horizontal',
      border: 'trailing',
      padding: 1,
    }),

    new Space({flex: 1}),
    new Button({
      height: 3,
      border: 'none',
      theme: 'primary',
      title: 'Primary',
    }),

    new Space({flex: 1}),
    new Button({
      height: 3,
      border: 'none',
      theme: 'proceed',
      title: 'Proceed',
    }),

    new Space({flex: 1}),
    new Button({
      height: 3,
      border: 'none',
      theme: 'cancel',
      title: 'Cancel',
    }),

    new Space({flex: 1}),
    new Button({
      height: 3,
      border: 'none',
      theme: 'secondary',
      title: 'Do it!',
    }),

    new Separator({
      direction: 'horizontal',
      border: 'trailing',
      padding: 1,
    }),

    new Space({flex: 1}),
    new Button({theme: 'plain', height: 3, title: 'Do it!'}),
    new Button({theme: 'selected', height: 3, title: 'Do it!'}),
    new Space({flex: 1}),
    new Separator({
      direction: 'horizontal',
      border: 'trailing',
      padding: 1,
    }),
  ]),
)
