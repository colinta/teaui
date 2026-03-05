import {Box, Text} from '@teaui/core'
import type {ScreenshotSpec} from './types.js'

export default {
  size: {width: 30, height: 5},
  title: 'Box',
  component: () =>
    new Box({
      border: 'single',
      children: [new Text({text: 'Hello from a box!'})],
    }),
} satisfies ScreenshotSpec
