import {ToggleGroup} from '@teaui/core'
import type {ScreenshotSpec} from './types.js'

export default {
  size: {width: 30, height: 1},
  title: 'ToggleGroup',
  component: () =>
    new ToggleGroup({
      titles: ['Small', 'Medium', 'Large'],
      selected: [1],
    }),
} satisfies ScreenshotSpec
