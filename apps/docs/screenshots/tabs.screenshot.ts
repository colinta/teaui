import {Tabs, Text} from '@teaui/core'
import type {ScreenshotSpec} from './types.js'

export default {
  size: {width: 35, height: 5},
  title: 'Tabs',
  component: () =>
    Tabs.create(
      [
        ['Info', new Text({text: 'Information panel'})],
        ['Settings', new Text({text: 'Settings panel'})],
        ['Help', new Text({text: 'Help panel'})],
      ],
      {border: true},
    ),
} satisfies ScreenshotSpec
