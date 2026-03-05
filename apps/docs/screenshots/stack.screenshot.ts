import {Stack, Text, Button} from '@teaui/core'
import type {ScreenshotSpec} from './types.js'

export default {
  size: {width: 40, height: 8},
  title: 'Stack',
  component: () =>
    new Stack({
      direction: 'down',
      children: [
        new Text({text: 'Welcome to TeaUI'}),
        new Button({title: 'OK'}),
        new Button({title: 'Cancel'}),
      ],
    }),
} satisfies ScreenshotSpec
