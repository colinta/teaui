import {Accordion, Text} from '@teaui/core'
import type {ScreenshotSpec} from './types.js'

export default {
  size: {width: 30, height: 6},
  title: 'Accordion',
  component: () => {
    const acc = Accordion.create([
      ['Section 1', new Text({text: 'Hello, world!'})],
      ['Section 2', new Text({text: 'More content'})],
      ['Section 3', new Text({text: 'Even more'})],
    ])
    return acc
  },
} satisfies ScreenshotSpec
