import {Stack, Checkbox} from '@teaui/core'
import type {ScreenshotSpec} from './types.js'

export default {
  size: {width: 40, height: 3},
  title: 'Checkbox',
  component: () =>
    new Stack({
      direction: 'down',
      children: [
        new Checkbox({title: 'Enable notifications', isChecked: true}),
        new Checkbox({title: 'Dark mode', isChecked: false}),
        new Checkbox({title: 'Auto-save', isChecked: true}),
      ],
    }),
} satisfies ScreenshotSpec
