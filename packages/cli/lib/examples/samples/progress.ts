import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 36
const HEIGHT = 19

export const progressExample: ComponentExample = {
  name: 'progress',
  availability: 'both',
  description:
    'Display horizontal or bottom-to-top vertical progress with a custom range and optional horizontal percentage labels',
  props: [
    {
      name: 'direction',
      type: "'horizontal' | 'vertical'",
      description:
        'Defaults to horizontal; vertical fills from bottom to top and does not display percentage text',
      availability: 'both',
    },
    {
      name: 'min',
      type: 'number',
      description: 'Range start; defaults to 0 and is the default value',
      availability: 'both',
    },
    {
      name: 'max',
      type: 'number',
      description: 'Range end; defaults to 100',
      availability: 'both',
    },
    {
      name: 'value',
      type: 'number',
      description:
        'Current value, defaulting to min; displayed fill and percentage are clamped to the range. Core value assignment invalidates rendering; React updates the value prop',
      availability: 'both',
    },
    {
      name: 'showPercent',
      type: 'boolean',
      description:
        'Defaults to false; show the rounded range-relative percentage on horizontal bars only',
      availability: 'both',
    },
    {
      name: 'location',
      type: "'left' | 'center' | 'right'",
      description:
        'Defaults to center inside the horizontal bar; left and right place an external, right-aligned percentage with a five-column reserve including the separator. Only used with showPercent',
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
        'Width in columns or fill/shrink/natural; naturally uses the available width, even for vertical bars',
      availability: 'both',
    },
    {
      name: 'height',
      type: 'Dimension',
      description:
        'Height in rows or fill/shrink/natural; naturally one row in either direction. Set an explicit height for vertical or multi-row horizontal bars',
      availability: 'both',
    },
    {
      name: 'ref',
      type: 'React.Ref<Progress>',
      description: 'Reference to the underlying Core Progress',
      availability: 'react',
    },
  ],
  source: {
    core: () => readExampleSource('progress.core.js'),
    react: () => readExampleSource('progress.react.tsx'),
  },
  render: {
    core: () => renderSample('progress.core.js'),
    react: () => renderSample('progress.react.tsx'),
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
