import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 12
const HEIGHT = 10

export const digitsExample: ComponentExample = {
  name: 'digits',
  availability: 'both',
  description: 'Render large three-row letters, numbers, and punctuation',
  props: [
    {
      name: 'text',
      type: 'string | number',
      description:
        'Required text or number; lowercase letters become uppercase, unsupported characters are ignored, and newlines start another three-row line',
      availability: 'both',
    },
    {
      name: 'style',
      type: 'Style',
      description: 'Optional text style; use the Style value from @teaui/core',
      availability: 'both',
    },
    {
      name: 'bold',
      type: 'boolean',
      description:
        'Use heavy-stroke glyphs, not the ANSI bold style; defaults to false',
      availability: 'both',
    },
    {
      name: 'width',
      type: 'Dimension',
      description:
        'Inherited width in terminal columns or fill/shrink/natural; naturally the widest glyph line',
      availability: 'both',
    },
    {
      name: 'height',
      type: 'Dimension',
      description:
        'Inherited height in terminal rows or fill/shrink/natural; naturally three rows per line',
      availability: 'both',
    },
    {
      name: 'ref',
      type: 'React.Ref<Digits>',
      description: 'Reference to the underlying Core Digits',
      availability: 'react',
    },
  ],
  source: {
    core: () => readExampleSource('digits.core.js'),
    react: () => readExampleSource('digits.react.tsx'),
  },
  render: {
    core: () => renderSample('digits.core.js'),
    react: () => renderSample('digits.react.tsx'),
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
