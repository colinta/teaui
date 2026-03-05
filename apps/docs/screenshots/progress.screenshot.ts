import {Progress} from '@teaui/core'
import type {ScreenshotSpec} from './types.js'

export default {
  size: {width: 30, height: 1},
  title: 'Progress',
  component: () => new Progress({value: 65, max: 100, showPercent: true}),
} satisfies ScreenshotSpec
