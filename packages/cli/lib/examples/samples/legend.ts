import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 48
const HEIGHT = 8

export const legendExample: ComponentExample = {
  name: 'legend',
  availability: 'both',
  description:
    'Display explicit keyboard hints with key sigils and automatic wrapping; hints do not bind shortcuts',
  props: [
    {
      name: 'items',
      type: 'LegendItem[]',
      description:
        'Required array of {key: string | string[], label: string}; arrays display slash-separated keys, modifier strings such as C-c display sigils, and an empty array draws nothing',
      availability: 'both',
    },
    {
      name: 'purpose',
      type: 'Palette | Purpose',
      description: 'Inherited palette for bold accent keys and muted labels',
      availability: 'both',
    },
    {
      name: 'width',
      type: "number | 'fill' | 'shrink' | 'natural'",
      description:
        'Inherited width constraint; items wrap to available columns',
      availability: 'both',
    },
    {
      name: 'height',
      type: "number | 'fill' | 'shrink' | 'natural'",
      description:
        'Inherited height constraint; natural height fits wrapped rows',
      availability: 'both',
    },
    {
      name: 'ref',
      type: 'React.Ref<Legend>',
      description: 'Reference to the underlying Core Legend',
      availability: 'react',
    },
  ],
  source: {
    core: () => readExampleSource('legend.core.js'),
    react: () => readExampleSource('legend.react.tsx'),
  },
  render: {
    core: () => renderSample('legend.core.js'),
    react: () => renderSample('legend.react.tsx'),
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
