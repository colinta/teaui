import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 32
const HEIGHT = 4

export const collapsibleTextExample: ComponentExample = {
  name: 'collapsible-text',
  availability: 'both',
  description: 'Preview a text block, then click to expand or collapse it',
  props: [
    {
      name: 'text',
      type: 'string',
      description: 'Required text content; newline characters separate lines',
      availability: 'both',
    },
    {
      name: 'preview',
      type: 'number',
      description:
        'Lines shown when collapsed; defaults to 1, with a minimum of 1',
      availability: 'both',
    },
    {
      name: 'style',
      type: 'Style',
      description: 'Optional text style',
      availability: 'both',
    },
    {
      name: 'purpose',
      type: 'Palette | Purpose',
      description: 'Color palette for the toggle and hover/press background',
      availability: 'both',
    },
    {
      name: 'width',
      type: 'Dimension',
      description: 'Width in terminal columns or fill/shrink/natural',
      availability: 'both',
    },
    {
      name: 'height',
      type: 'Dimension',
      description: 'Height in terminal rows or fill/shrink/natural',
      availability: 'both',
    },
    {
      name: 'ref',
      type: 'React.Ref<CollapsibleText>',
      description: 'Reference to the underlying Core CollapsibleText',
      availability: 'react',
    },
  ],
  source: {
    core: () => readExampleSource('collapsible-text.core.js'),
    react: () => readExampleSource('collapsible-text.react.tsx'),
  },
  render: {
    core: () => renderSample('collapsible-text.core.js'),
    react: () => renderSample('collapsible-text.react.tsx'),
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
