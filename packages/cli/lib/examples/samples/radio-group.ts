import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 32
const HEIGHT = 5

export const radioGroupExample: ComponentExample = {
  name: 'radio-group',
  availability: 'both',
  description:
    'Manage one shared selection for Radio descendants through layout containers',
  props: [
    {
      name: 'value',
      type: 'T',
      description:
        'Optional selected value; defaults to undefined. Matches Radio values with Object.is, so object values must share the same reference',
      availability: 'both',
    },
    {
      name: 'onChange',
      type: '(value: T) => void',
      description:
        'Called only when a Radio or select(value) changes selection. Core stores the new value internally; React should update its value prop. Assigning the Core value setter does not notify',
      availability: 'both',
    },
    {
      name: 'purpose',
      type: 'Palette | Purpose',
      description: 'Inherited color palette for descendant Radios',
      availability: 'both',
    },
    {
      name: 'width',
      type: 'Dimension',
      description:
        'Inherited width in columns or fill/shrink/natural; naturally the widest child',
      availability: 'both',
    },
    {
      name: 'height',
      type: 'Dimension',
      description:
        'Inherited height in rows or fill/shrink/natural; naturally the tallest child, not the sum of children',
      availability: 'both',
    },
    {
      name: 'child',
      type: 'View',
      description:
        'Single child view; takes precedence over children in the constructor. Use a Stack to lay out options',
      availability: 'core',
    },
    {
      name: 'children',
      type: 'View[]',
      description:
        'Child views share the same viewport; use a layout container. Each Radio belongs to its nearest RadioGroup ancestor',
      availability: 'core',
    },
    {
      name: 'children',
      type: 'React.ReactNode',
      description:
        'Child content; use a Stack to lay out options. Each Radio belongs to its nearest RadioGroup ancestor',
      availability: 'react',
    },
    {
      name: 'ref',
      type: 'React.Ref<RadioGroup<T>>',
      description: 'Reference to the underlying Core RadioGroup<T>',
      availability: 'react',
    },
  ],
  source: {
    core: () => readExampleSource('radio-group.core.js'),
    react: () => readExampleSource('radio-group.react.tsx'),
  },
  render: {
    core: () => renderSample('radio-group.core.js'),
    react: () => renderSample('radio-group.react.tsx'),
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
