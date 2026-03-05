import {Input} from '@teaui/core'
import type {ScreenshotSpec} from './types.js'

export default {
  size: {width: 30, height: 1},
  title: 'Input',
  component: () => new Input({value: 'Hello, world!'}),
} satisfies ScreenshotSpec
