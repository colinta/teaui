import {Box, Button, Drawer, Stack, Input, Space, Text} from '@teaui/core'

import {demo} from './demo.js'

const firstInput = new Input({
  value: "family: 👨‍👩‍👧‍👦 smiley: 😀 some other text that isn't very interesting.",
})

const dontClickMe = new Button({
  title: 'Not me!',
  onClick() {
    console.info("You DIDN'T")
    firstInput.removeFromParent()
  },
})

let drawer: Drawer
const changeLocation = new Button({
  title: 'Change Drawer Location',
  onClick() {
    switch (drawer.location) {
      case 'top':
        drawer.location = 'right'
        break
      case 'right':
        drawer.location = 'bottom'
        break
      case 'bottom':
        drawer.location = 'left'
        break
      case 'left':
        drawer.location = 'top'
        break
    }
  },
})

drawer = new Drawer({
  // theme: 'primary',
  drawer: new Text({
    maxWidth: 40,
    wrap: true,
    text: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc consectetur molestie faucibus. Phasellus iaculis pellentesque felis eu fringilla. Ut in sollicitudin nisi. Praesent in mauris tortor. Nam interdum, magna eu pellentesque scelerisque, dui ipsum adipiscing ante, vel ullamcorper nisl sapien id arcu. Nullam egestas diam eu felis mollis sit amet cursus enim vehicula. Quisque eu tellus id erat pellentesque consequat. Maecenas fermentum faucibus magna, eget dictum nisi congue sed. Quisque a justo a nisi eleifend facilisis sit amet at augue. Sed a sapien vitae augue hendrerit porta vel eu ligula. Proin enim urna, faucibus in vestibulum tincidunt, commodo sit amet orci. Vestibulum ac sem urna, quis mattis urna. Nam eget ullamcorper ligula. Nam volutpat, arcu vel auctor dignissim, tortor nisi sodales enim, et vestibulum nulla dui id ligula. Nam ullamcorper, augue ut interdum vulputate, eros mauris lobortis sapien, ac sodales dui eros ac elit.`,
  }),
  content: Stack.down({
    children: [
      Stack.right({
        children: [
          ['flex1', new Text({text: 'flex1-left'})],
          ['flex1', firstInput],
          ['flex1', new Text({text: 'flex1-right', alignment: 'right'})],
        ],
      }),
      Stack.right({
        children: [
          ['flex3', new Text({text: 'flex3-left'})],
          [
            'flex1',
            new Input({
              value:
                "family: 👨‍👩‍👧‍👦 smiley: 😀 some other text that isn't very interesting.",
            }),
          ],
          ['flex3', new Text({text: 'flex3-right', alignment: 'right'})],
        ],
      }),
      Stack.right({
        children: [
          ['flex1', new Text({text: 'flex1-left'})],
          [
            'flex3',
            new Input({
              value:
                "family: 👨‍👩‍👧‍👦 smiley: 😀 some other text that isn't very interesting.",
            }),
          ],
          ['flex1', new Text({text: 'flex1-right', alignment: 'right'})],
        ],
      }),
      [
        'flex1',
        new Box({
          border: 'single',
          children: [
            Stack.right({
              children: [
                ['flex1', new Space()],
                [
                  'flex1',
                  Stack.down([
                    new Button({
                      title: 'Click me!🙂',
                      width: 'natural',
                      onClick() {
                        console.info('You did!')
                      },
                    }),
                    new Space({height: 1}),
                    dontClickMe,
                  ]),
                ],
                ['flex1', new Space()],
              ],
            }),
          ],
        }),
      ],
      changeLocation,
    ],
  }),
})

demo(drawer)
