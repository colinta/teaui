import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 32
const HEIGHT = 8

export const collapsibleExample: ComponentExample = {
  name: 'collapsible',
  availability: 'both',
  description:
    'Click to switch between a collapsed preview and expanded content',
  props: [
    {
      name: 'isCollapsed',
      type: 'boolean',
      description:
        'Initial/reset collapsed state; defaults to true and clicks toggle it internally',
      availability: 'both',
    },
    {
      name: 'showCollapsed',
      type: 'boolean',
      description:
        'Keep the full collapsed view above expanded content; defaults to false',
      availability: 'both',
    },
    {
      name: 'preview',
      type: 'number',
      description:
        'Maximum preview rows while collapsed; defaults to 1 and is clamped to at least 1',
      availability: 'both',
    },
    {
      name: 'collapsed',
      type: 'View',
      description: 'Preview view shown while collapsed',
      availability: 'core',
    },
    {
      name: 'collapsed',
      type: 'React.ReactNode',
      description: 'Preview content; wrap multiple views in a Stack',
      availability: 'react',
    },
    {
      name: 'expanded',
      type: 'View',
      description:
        'Expanded view; replaces the preview unless showCollapsed is true',
      availability: 'core',
    },
    {
      name: 'expanded',
      type: 'React.ReactNode',
      description:
        'Expanded content; replaces the preview unless showCollapsed is true',
      availability: 'react',
    },
    {
      name: 'width',
      type: 'Dimension',
      description: 'Inherited width; numeric values are terminal columns',
      availability: 'both',
    },
    {
      name: 'height',
      type: 'Dimension',
      description: 'Inherited height; numeric values are terminal rows',
      availability: 'both',
    },
    {
      name: 'child',
      type: 'View',
      description:
        'Single collapsed view via update(); initialize with collapsed instead',
      availability: 'core',
    },
    {
      name: 'children',
      type: 'View[]',
      description:
        'First collapsed, second expanded via update(); initialize with named props',
      availability: 'core',
    },
    {
      name: 'ref',
      type: 'React.Ref<Collapsible>',
      description: 'Reference to the underlying Core Collapsible',
      availability: 'react',
    },
  ],
  source: {
    react: () => readExampleSource('collapsible.react.tsx'),
    core: () => readExampleSource('collapsible.core.js'),
  },
  render: {
    react: () => renderSample('collapsible.react.tsx'),
    core: () => renderSample('collapsible.core.js'),
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
