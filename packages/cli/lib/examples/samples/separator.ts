import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 36
const HEIGHT = 20

export const separatorExample: ComponentExample = {
  name: 'separator',
  availability: 'both',
  description:
    'Horizontal or vertical divider lines with nine border styles; horizontal and vertical helpers set the direction',
  props: [
    {
      name: 'direction',
      type: "'horizontal' | 'vertical'",
      description:
        'Required on the base Separator; omitted with Separator.horizontal or Separator.vertical. The line spans the available width or height',
      availability: 'both',
    },
    {
      name: 'border',
      type: "'single' | 'leading' | 'trailing' | 'bold' | 'dash' | 'dash2' | 'dash3' | 'dash4' | 'double'",
      description:
        "Line character preset; defaults to 'single'. Leading and trailing use edge strokes, dash through dash4 use dashed strokes",
      availability: 'both',
    },
    {
      name: 'padding',
      type: 'number',
      description:
        'Defaults to 0. Numeric padding applies inherited spacing on all edges plus an internal line offset; natural thickness is 1 + 4 × padding (five rows or columns for padding 1)',
      availability: 'both',
    },
    {
      name: 'width',
      type: "number | 'fill' | 'shrink' | 'natural'",
      description:
        'Inherited width in terminal columns or a sizing mode; horizontal separators naturally span the available width',
      availability: 'both',
    },
    {
      name: 'height',
      type: "number | 'fill' | 'shrink' | 'natural'",
      description:
        'Inherited height in terminal rows or a sizing mode; vertical separators naturally span the available height',
      availability: 'both',
    },
    {
      name: 'purpose',
      type: 'Palette | Purpose',
      description: 'Inherited semantic palette; the line uses its text style',
      availability: 'both',
    },
    {
      name: 'ref',
      type: 'React.Ref<Separator>',
      description: 'Reference to the underlying Core Separator',
      availability: 'react',
    },
  ],
  source: {
    core: () => readExampleSource('separator.core.js'),
    react: () => readExampleSource('separator.react.tsx'),
  },
  render: {
    core: () => renderSample('separator.core.js'),
    react: () => renderSample('separator.react.tsx'),
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
