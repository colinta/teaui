import {Stack, Text} from '@teaui/core'
import type {ScreenshotSpec} from './types.js'

export default {
  size: {width: 30, height: 3},
  title: 'Text',
  component: () =>
    Stack.down([
      new Text({text: 'Left aligned'}),
      new Text({text: 'Centered', alignment: 'center'}),
      new Text({text: 'Right aligned', alignment: 'right'}),
    ]),
} satisfies ScreenshotSpec
