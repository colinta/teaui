import {Button} from '@teaui/core'
import type {ScreenshotSpec} from './types.js'

export default {
  size: {width: 30, height: 3},
  title: 'Button',
  component: () => new Button({title: 'Click Me'}),
} satisfies ScreenshotSpec
