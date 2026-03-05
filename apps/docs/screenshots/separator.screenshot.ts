import {Stack, Text, Separator} from '@teaui/core'
import type {ScreenshotSpec} from './types.js'

export default {
  size: {width: 30, height: 3},
  title: 'Separator',
  component: () =>
    Stack.down([
      new Text({text: 'Above'}),
      Separator.horizontal(),
      new Text({text: 'Below'}),
    ]),
} satisfies ScreenshotSpec
