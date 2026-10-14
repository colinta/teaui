import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 48
const HEIGHT = 5

export const fontStyleExample: ComponentExample = {
  name: 'font-style',
  availability: 'both',
  description:
    'Choose bold, italic, underline, and strikethrough independently with a mouse',
  props: [
    {
      name: 'value',
      type: 'FontStyleValue',
      description:
        'Required object with boolean bold, italic, underline, and strikethrough fields; any combination may be enabled',
      availability: 'both',
    },
    {
      name: 'onChange',
      type: '(value: FontStyleValue) => void',
      description:
        'Called with all four booleans after a mouse toggle; Core stores the new value internally, while React should update its value prop',
      availability: 'both',
    },
    {
      name: 'purpose',
      type: 'Palette | Purpose',
      description:
        'Color palette for the managed ToggleGroup; inherits from its parent, otherwise plain',
      availability: 'both',
    },
    {
      name: 'width',
      type: 'Dimension',
      description:
        'Width in columns or fill/shrink/natural; naturally 17 columns before inherited padding',
      availability: 'both',
    },
    {
      name: 'height',
      type: 'Dimension',
      description:
        'Height in rows or fill/shrink/natural; naturally three rows before inherited padding',
      availability: 'both',
    },
    {
      name: 'ref',
      type: 'React.Ref<FontStyle>',
      description: 'Reference to the underlying Core FontStyle',
      availability: 'react',
    },
  ],
  source: {
    core: () => readExampleSource('font-style.core.js'),
    react: () => readExampleSource('font-style.react.tsx'),
  },
  render: {
    core: () => renderSample('font-style.core.js'),
    react: () => renderSample('font-style.react.tsx'),
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
