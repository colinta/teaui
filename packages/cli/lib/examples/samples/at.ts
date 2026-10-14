import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 28
const HEIGHT = 5

export const atExample: ComponentExample = {
  name: 'at',
  availability: 'both',
  description:
    'Fill the available area and anchor overlaid children at an edge, corner, or center; useful inside a ZStack',
  props: [
    {
      name: 'location',
      type: "'top-left' | 'top-center' | 'top-right' | 'left' | 'center' | 'right' | 'bottom-left' | 'bottom-center' | 'bottom-right'",
      description:
        "Anchor for the combined child area; defaults to 'top-left'. Core At.topRight and React At.topRight are location shortcuts",
      availability: 'both',
    },
    {
      name: 'useAvailable',
      type: 'boolean',
      description:
        'Position within the viewport available area instead of its content area; defaults to false',
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
      description: 'Single child, placed before constructor children',
      availability: 'core',
    },
    {
      name: 'children',
      type: 'View[]',
      description:
        'Views overlaid at the chosen location, not stacked in a row',
      availability: 'core',
    },
    {
      name: 'children',
      type: 'React.ReactNode',
      description: 'Content overlaid at the chosen location',
      availability: 'react',
    },
    {
      name: 'ref',
      type: 'React.Ref<At>',
      description: 'Reference to the underlying Core At',
      availability: 'react',
    },
  ],
  source: {
    react: () => readExampleSource('at.react.tsx'),
    core: () => readExampleSource('at.core.js'),
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
  return renderSample('at.react.tsx')
}

function renderCore(): Promise<string> {
  return renderSample('at.core.js')
}

function renderSample(filename: string): Promise<string> {
  return captureExample(new URL(`./${filename}`, import.meta.url), {
    width: WIDTH,
    height: HEIGHT,
  })
}
