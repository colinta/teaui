import {Slider} from '@teaui/core'
import type {ScreenshotSpec} from './types.js'

export default {
  size: {width: 30, height: 1},
  title: 'Slider',
  component: () =>
    new Slider({
      direction: 'horizontal',
      range: [0, 100],
      value: 65,
    }),
} satisfies ScreenshotSpec
