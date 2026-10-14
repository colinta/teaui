import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 28
const HEIGHT = 5

export const radioExample: ComponentExample = {
  name: 'radio',
  availability: 'both',
  description:
    'Select a generic value through the nearest RadioGroup; click or press a key while focused',
  props: [
    {
      name: 'title',
      type: 'string',
      description: "Option label; defaults to ''",
      availability: 'both',
    },
    {
      name: 'value',
      type: 'T',
      description:
        'Required option value (T defaults to unknown); compared with the nearest RadioGroup value using Object.is. Use unique values',
      availability: 'both',
    },
    {
      name: 'hotKey',
      type: 'HotKey',
      description:
        'Label/legend key; modifiers append an underlined hint. Does not register an unfocused shortcut',
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
      type: 'React.Ref<Radio<T>>',
      description:
        'Reference to the underlying Core Radio with the same value type',
      availability: 'react',
    },
  ],
  source: {
    core: () => readExampleSource('radio.core.js'),
    react: () => readExampleSource('radio.react.tsx'),
  },
  render: {
    core: () => renderSample('radio.core.js'),
    react: () => renderSample('radio.react.tsx'),
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
