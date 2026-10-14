import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 24
const HEIGHT = 5

export const trackMouseExample: ComponentExample = {
  name: 'track-mouse',
  availability: 'both',
  description: 'Wrap static content in coordinate rulers that follow the mouse',
  props: [
    {
      name: 'child',
      type: 'View',
      description: 'Single child view',
      availability: 'core',
    },
    {
      name: 'children',
      type: 'View[]',
      description: 'Child views rendered inside the coordinate rulers',
      availability: 'core',
    },
    {
      name: 'child',
      type: 'React.ReactNode',
      description: 'Single child element or text',
      availability: 'react',
    },
    {
      name: 'children',
      type: 'React.ReactNode',
      description: 'Child elements or text rendered inside the rulers',
      availability: 'react',
    },
    {
      name: 'width',
      type: 'Dimension',
      description: "Columns or 'fill', 'shrink', 'natural'",
      availability: 'both',
    },
    {
      name: 'height',
      type: 'Dimension',
      description: "Rows or 'fill', 'shrink', 'natural'",
      availability: 'both',
    },
    {
      name: 'mouseListener',
      type: 'MouseListenerProp',
      description: 'Listen for mouse events (function or listener options)',
      availability: 'both',
    },
    {
      name: 'ref',
      type: 'React.Ref<TrackMouse>',
      description: 'Reference to the underlying Core TrackMouse',
      availability: 'react',
    },
  ],
  source: {
    react: () => readExampleSource('track-mouse.react.tsx'),
    core: () => readExampleSource('track-mouse.core.js'),
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
  return renderSample('track-mouse.react.tsx')
}

function renderCore(): Promise<string> {
  return renderSample('track-mouse.core.js')
}

function renderSample(filename: string): Promise<string> {
  return captureExample(new URL(`./${filename}`, import.meta.url), {
    width: WIDTH,
    height: HEIGHT,
  })
}
