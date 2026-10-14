import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 24
const HEIGHT = 1

export const checkboxExample: ComponentExample = {
  name: 'checkbox',
  availability: 'both',
  description: 'Toggle a boolean with a click or a key while focused',
  props: [
    {
      name: 'title',
      type: 'string',
      description: "Label beside the checkbox; defaults to ''",
      availability: 'both',
    },
    {
      name: 'value',
      type: 'boolean',
      description: 'Required checked state; React should update it in onChange',
      availability: 'both',
    },
    {
      name: 'onChange',
      type: '(value: boolean) => void',
      description:
        'Called with the new value after a mouse or focused-key toggle',
      availability: 'both',
    },
    {
      name: 'hotKey',
      type: 'HotKey',
      description:
        'Underline matching label text and add a keyboard legend entry',
      availability: 'both',
    },
    {
      name: 'purpose',
      type: 'Palette | Purpose',
      description: 'Color palette; inherits from its parent, otherwise plain',
      availability: 'both',
    },
    {
      name: 'width',
      type: 'Dimension',
      description:
        'Width in columns or fill/shrink/natural; label plus two columns naturally',
      availability: 'both',
    },
    {
      name: 'height',
      type: 'Dimension',
      description:
        'Height in rows or fill/shrink/natural; naturally at least one row',
      availability: 'both',
    },
    {
      name: 'ref',
      type: 'React.Ref<Checkbox>',
      description: 'Reference to the underlying Core Checkbox',
      availability: 'react',
    },
  ],
  source: {
    react: () => readExampleSource('checkbox.react.tsx'),
    core: () => readExampleSource('checkbox.core.js'),
  },
  render: {
    react: () => renderSample('checkbox.react.tsx'),
    core: () => renderSample('checkbox.core.js'),
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
