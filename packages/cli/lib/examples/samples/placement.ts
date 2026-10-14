import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 40
const HEIGHT = 8

export const placementExample: ComponentExample = {
  name: 'placement',
  availability: 'both',
  description:
    'Position and clip children using edge coordinates as a direct child of AlignmentScope; no edges means origin zero and natural size, unresolved points mean an empty area',
  props: [
    {
      name: 'top',
      type: 'number | VerticalCoordinate',
      description:
        'Inclusive y-coordinate in scope content; integer cell or point.top.plus(offset). With bottom, fills the height; alone, uses natural height',
      availability: 'both',
    },
    {
      name: 'right',
      type: 'number | HorizontalCoordinate',
      description:
        'Exclusive x-coordinate, not an inset; with left, fills the width; alone, ends natural-width content at this edge',
      availability: 'both',
    },
    {
      name: 'bottom',
      type: 'number | VerticalCoordinate',
      description:
        'Exclusive y-coordinate, not an inset; with top, fills the height; alone, ends natural-height content at this edge',
      availability: 'both',
    },
    {
      name: 'left',
      type: 'number | HorizontalCoordinate',
      description:
        'Inclusive x-coordinate in scope content; integer cell or point.left.minus(offset). With right, fills the width; alone, uses natural width',
      availability: 'both',
    },
    {
      name: 'isVisible',
      type: 'boolean',
      description: 'Visibility flag; defaults to true',
      availability: 'both',
    },
    {
      name: 'debug',
      type: 'boolean',
      description: 'View debugging flag; defaults to false',
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
        'Views overlaid within the resolved rectangle; put size and padding props on these children, not Placement',
      availability: 'core',
    },
    {
      name: 'children',
      type: 'React.ReactNode',
      description:
        'Content overlaid within the resolved rectangle; put size and padding props on children, not Placement',
      availability: 'react',
    },
    {
      name: 'ref',
      type: 'React.Ref<Placement>',
      description:
        'Reference to the Core Placement, including edge setters and read-only references diagnostics (not a prop)',
      availability: 'react',
    },
  ],
  source: {
    react: () => readExampleSource('placement.react.tsx'),
    core: () => readExampleSource('placement.core.js'),
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
  return renderSample('placement.react.tsx')
}

function renderCore(): Promise<string> {
  return renderSample('placement.core.js')
}

function renderSample(filename: string): Promise<string> {
  return captureExample(new URL(`./${filename}`, import.meta.url), {
    width: WIDTH,
    height: HEIGHT,
  })
}
