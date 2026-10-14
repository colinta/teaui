import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 16
const HEIGHT = 7

export const logoExample: ComponentExample = {
  name: 'logo',
  availability: 'both',
  description:
    'Render the colored TeaUI mug with static steam or animated braille steam',
  props: [
    {
      name: 'isAnimating',
      type: 'boolean',
      description:
        'Animate braille steam when true; defaults to false with static steam. The sample explicitly disables animation for stable output',
      availability: 'both',
    },
    {
      name: 'seed',
      type: 'number',
      description:
        'Construction-only RNG seed for repeatable animated steam at the same tick sequence; defaults to time and randomness. Later prop updates do not reseed',
      availability: 'both',
    },
    {
      name: 'width',
      type: 'Dimension',
      description:
        'Inherited width in terminal columns or fill/shrink/natural; natural width is 16. Smaller widths clip the fixed artwork rather than scaling it',
      availability: 'both',
    },
    {
      name: 'height',
      type: 'Dimension',
      description:
        'Inherited height in terminal rows or fill/shrink/natural; natural height is 7, including two steam rows. Smaller heights clip the artwork',
      availability: 'both',
    },
    {
      name: 'ref',
      type: 'React.Ref<Logo>',
      description: 'Reference to the underlying Core Logo',
      availability: 'react',
    },
  ],
  source: {
    core: () => readExampleSource('logo.core.js'),
    react: () => readExampleSource('logo.react.tsx'),
  },
  render: {
    core: () => renderSample('logo.core.js'),
    react: () => renderSample('logo.react.tsx'),
  },
}

function readExampleSource(filename: string): string {
  return readFileSync(
    new URL(`./${filename}`, import.meta.url),
    'utf8',
  ).trimEnd()
}

function renderSample(filename: string): Promise<string> {
  return captureExample(new URL(`./${filename}`, import.meta.url), {
    width: WIDTH,
    height: HEIGHT,
  })
}
