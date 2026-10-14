import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 44
const HEIGHT = 8

export const paneExample: ComponentExample = {
  name: 'pane',
  availability: 'both',
  description:
    'Split browser and detail views with draggable, optionally collapsible separators',
  props: [
    {
      name: 'border',
      type: 'boolean',
      description: 'Draw a rounded outer border; defaults to false',
      availability: 'both',
    },
    {
      name: 'collapsible',
      type: 'boolean',
      description:
        'Defaults to true: click a separator to toggle its browser pane, or drag to 3 columns or fewer to collapse on release. False disables collapse and enforces a 4-column drag minimum',
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
      name: 'child',
      type: 'View',
      description:
        'Single detail view; takes precedence over children in the constructor',
      availability: 'core',
    },
    {
      name: 'children',
      type: 'View[]',
      description:
        'All but the last view are browser panes; the last is the detail pane and fills the remaining width',
      availability: 'core',
    },
    {
      name: 'children',
      type: 'React.ReactNode',
      description:
        'All but the last child view are browser panes; the last is the detail pane and fills the remaining width',
      availability: 'react',
    },
    {
      name: 'ref',
      type: 'React.Ref<Pane>',
      description: 'Reference to the underlying Core Pane',
      availability: 'react',
    },
  ],
  source: {
    core: () => readExampleSource('pane.core.js'),
    react: () => readExampleSource('pane.react.tsx'),
  },
  render: {
    core: () => renderSample('pane.core.js'),
    react: () => renderSample('pane.react.tsx'),
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
