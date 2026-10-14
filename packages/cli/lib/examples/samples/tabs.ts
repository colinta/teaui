import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 36
const HEIGHT = 10

export const tabsExample: ComponentExample = {
  name: 'tabs',
  availability: 'both',
  description: 'Click tab titles to switch between section bodies',
  props: [
    {
      name: 'border',
      type: 'boolean',
      description: 'Draw a border around the selected body; defaults to true',
      availability: 'both',
    },
    {
      name: 'selected',
      type: 'number',
      description:
        'Zero-based tab index; defaults to 0. Clicks change it internally; updates reset it when supplied',
      availability: 'both',
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
      description: 'Single section; prefer Tabs.create() or addTab() for setup',
      availability: 'core',
    },
    {
      name: 'children',
      type: 'View[]',
      description: 'Section views; only Tabs.Section bodies are rendered',
      availability: 'core',
    },
    {
      name: 'children',
      type: 'React.ReactNode',
      description:
        'Use Tabs.Section children; only the selected body is rendered',
      availability: 'react',
    },
    {
      name: 'Section.title',
      type: 'string',
      description: 'Clickable tab title; defaults to an empty string',
      availability: 'both',
    },
    {
      name: 'Section.child',
      type: 'View',
      description: 'Single section body view',
      availability: 'core',
    },
    {
      name: 'Section.children',
      type: 'View[]',
      description: 'Overlapping body views; use a Stack for sequential layout',
      availability: 'core',
    },
    {
      name: 'Section.children',
      type: 'React.ReactNode',
      description: 'Section body content; use a Stack for sequential layout',
      availability: 'react',
    },
    {
      name: 'Section.ref',
      type: 'React.Ref<InstanceType<typeof Tabs.Section>>',
      description: 'Reference to the underlying Core section',
      availability: 'react',
    },
  ],
  source: {
    core: () => readExampleSource('tabs.core.js'),
    react: () => readExampleSource('tabs.react.tsx'),
  },
  render: {
    core: () => renderSample('tabs.core.js'),
    react: () => renderSample('tabs.react.tsx'),
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
