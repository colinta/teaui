import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 16
const HEIGHT = 4

export const brExample: ComponentExample<'react'> = {
  name: 'br',
  availability: 'react',
  description:
    'Insert a line break in React text; consecutive breaks leave a blank line',
  props: [],
  source: {
    react: () =>
      readFileSync(
        new URL('./br.react.tsx', import.meta.url),
        'utf8',
      ).trimEnd(),
  },
  render: {
    react: () =>
      captureExample(new URL('./br.react.tsx', import.meta.url), {
        width: WIDTH,
        height: HEIGHT,
      }),
  },
}
