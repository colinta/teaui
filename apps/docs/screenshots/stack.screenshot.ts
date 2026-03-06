import {Box, Stack, Text, Button} from '@teaui/core'
import type {ScreenshotSpec} from './types.js'

export default {
  size: {width: 40, height: 5},
  title: 'Stack',
  component: () =>
    new Box({
      border: 'single',
      children: [
        new Stack({
          direction: 'down',
          children: [
            new Text({text: 'First there was Ncurses'}),
            new Button({title: 'Tell me more!'}),
          ],
        }),
      ],
    }),
} satisfies ScreenshotSpec
