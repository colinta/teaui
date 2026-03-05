import {Header} from '@teaui/core'
import type {ScreenshotSpec} from './types.js'

export default {
  size: {width: 30, height: 3},
  title: 'Header',
  component: () => new Header({text: 'TeaUI Header', border: 'double'}),
} satisfies ScreenshotSpec
