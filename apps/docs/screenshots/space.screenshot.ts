import {Stack, Text, Space} from '@teaui/core'
import type {ScreenshotSpec} from './types.js'

export default {
  size: {width: 30, height: 1},
  title: 'Space',
  component: () =>
    Stack.right([new Text({text: 'Left'}), new Space(), new Text({text: 'Right'})]),
} satisfies ScreenshotSpec
