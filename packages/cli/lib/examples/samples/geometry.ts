import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 32
const HEIGHT = 6

export const geometryExample: ComponentExample = {
  name: 'geometry',
  availability: 'both',
  description:
    'Measure available content space during rendering for responsive or windowed content; fills available space by default',
  props: [
    {
      name: 'onLayout',
      type: '(size: Size) => void',
      description:
        'Called during render when non-empty content size changes, before children render; Size uses terminal columns/rows, excludes padding, and layout probes are skipped',
      availability: 'both',
    },
    {
      name: 'width',
      type: "number | 'fill' | 'shrink' | 'natural'",
      description:
        'Inherited width in terminal columns or a sizing mode; natural size fills available width',
      availability: 'both',
    },
    {
      name: 'height',
      type: "number | 'fill' | 'shrink' | 'natural'",
      description:
        'Inherited height in terminal rows or a sizing mode; natural size fills available height',
      availability: 'both',
    },
    {
      name: 'padding',
      type: 'number | Partial<Edges>',
      description:
        'Inherited padding on all edges or individual edges; subtracted from the size reported to onLayout',
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
      description: 'Overlapping child views; use a Stack to arrange them',
      availability: 'core',
    },
    {
      name: 'children',
      type: 'React.ReactNode',
      description: 'Overlapping child content; use a Stack to arrange it',
      availability: 'react',
    },
    {
      name: 'ref',
      type: 'React.Ref<Geometry>',
      description: 'Reference to the underlying Core Geometry',
      availability: 'react',
    },
  ],
  source: {
    react: () => readExampleSource('geometry.react.tsx'),
    core: () => readExampleSource('geometry.core.js'),
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
  return renderSample('geometry.react.tsx')
}

function renderCore(): Promise<string> {
  return renderSample('geometry.core.js')
}

function renderSample(filename: string): Promise<string> {
  return captureExample(new URL(`./${filename}`, import.meta.url), {
    width: WIDTH,
    height: HEIGHT,
  })
}
