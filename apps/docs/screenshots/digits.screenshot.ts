import {Digits} from '@teaui/core'
import type {ScreenshotSpec} from './types.js'

export default {
  size: {width: 20, height: 5},
  title: 'Digits',
  component: () => new Digits({text: '42'}),
} satisfies ScreenshotSpec
