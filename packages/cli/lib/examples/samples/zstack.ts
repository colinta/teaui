import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 44
const HEIGHT = 15

export const zstackExample: ComponentExample = {
  name: 'zstack',
  availability: 'both',
  description:
    'Overlay child views in insertion order, optionally aligning each layer at one of nine locations',
  props: [
    {
      name: 'location',
      type: "'top-left' | 'top-center' | 'top-right' | 'left' | 'center' | 'right' | 'bottom-left' | 'bottom-center' | 'bottom-right'",
      description:
        'Unset by default: children share the full content area and natural size is the maximum visible child size on each axis. When set, fills available space and aligns each child at its natural size, capped to the content area. In Core, change it after construction with the align setter, not a location setter',
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
      name: 'padding',
      type: 'number | Partial<Edges>',
      description: 'Inherited view padding: all edges or individual edges',
      availability: 'both',
    },
    {
      name: 'isVisible',
      type: 'boolean',
      description:
        'Inherited visibility flag; defaults to true. Invisible child views are skipped during sizing and rendering',
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
      description:
        'Overlapping child views; later children render on top of earlier ones',
      availability: 'core',
    },
    {
      name: 'children',
      type: 'React.ReactNode',
      description:
        'Overlapping child content; later children render on top of earlier ones',
      availability: 'react',
    },
    {
      name: 'ref',
      type: 'React.Ref<ZStack>',
      description:
        'Reference to the underlying Core ZStack, including its align getter/setter',
      availability: 'react',
    },
  ],
  source: {
    core: () => readExampleSource('zstack.core.js'),
    react: () => readExampleSource('zstack.react.tsx'),
  },
  render: {
    core: () => renderSample('zstack.core.js'),
    react: () => renderSample('zstack.react.tsx'),
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
