import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 24
const HEIGHT = 5

export const boxExample: ComponentExample = {
  name: 'box',
  availability: 'both',
  description: 'Frame child views with a border and an optional title',
  props: [
    {
      name: 'border',
      type: "'single' | 'bold' | 'double' | 'rounded' | 'dotted' | 'dashed' | 'ascii' | 'mixed' | 'mixed-alt' | 'shade' | 'block' | 'shadow' | 'corners' | 'none' | BorderChars",
      description:
        "Preset or custom 6–8-entry border tuple; defaults to 'single'",
      availability: 'both',
    },
    {
      name: 'title',
      type: 'string',
      description:
        'Top heading; defaults to the first child heading. Empty string hides it',
      availability: 'both',
    },
    {
      name: 'highlight',
      type: 'boolean',
      description: 'Enable border hover highlighting; defaults to false',
      availability: 'both',
    },
    {
      name: 'location',
      type: "'top-left' | 'top-center' | 'top-right' | 'left' | 'center' | 'right' | 'bottom-left' | 'bottom-center' | 'bottom-right'",
      description:
        'Align children inside the border; unset children share the full inner area',
      availability: 'both',
    },
    {
      name: 'padding',
      type: 'number | Partial<Edges>',
      description: 'Inherited view padding: all edges or individual edges',
      availability: 'both',
    },
    {
      name: 'width',
      type: "number | 'fill' | 'shrink' | 'natural'",
      description: 'Inherited view width in terminal columns or a sizing mode',
      availability: 'both',
    },
    {
      name: 'height',
      type: "number | 'fill' | 'shrink' | 'natural'",
      description: 'Inherited view height in terminal rows or a sizing mode',
      availability: 'both',
    },
    {
      name: 'child',
      type: 'View',
      description:
        'Single child view; takes precedence over constructor children',
      availability: 'core',
    },
    {
      name: 'children',
      type: 'View[]',
      description: 'Overlapping child views; later children render on top',
      availability: 'core',
    },
    {
      name: 'children',
      type: 'React.ReactNode',
      description: 'Overlapping child content; later children render on top',
      availability: 'react',
    },
    {
      name: 'ref',
      type: 'React.Ref<Box>',
      description: 'Reference to the underlying Core Box',
      availability: 'react',
    },
  ],
  source: {
    react: () => readExampleSource('box.react.tsx'),
    core: () => readExampleSource('box.core.js'),
  },
  render: {
    react: renderReact,
    core: renderCore,
  },
}

function readExampleSource(filename: string): string {
  return readFileSync(
    new URL(`./${filename}`, import.meta.url),
    'utf8',
  ).trimEnd()
}

function renderReact(): Promise<string> {
  return renderSample('box.react.tsx')
}

function renderCore(): Promise<string> {
  return renderSample('box.core.js')
}

function renderSample(filename: string): Promise<string> {
  return captureExample(new URL(`./${filename}`, import.meta.url), {
    width: WIDTH,
    height: HEIGHT,
  })
}
