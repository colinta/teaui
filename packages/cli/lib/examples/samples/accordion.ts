import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 30
const HEIGHT = 5

export const accordionExample: ComponentExample = {
  name: 'accordion',
  availability: 'both',
  description: 'Click section headers to expand or collapse their content',
  props: [
    {
      name: 'multiple',
      type: 'boolean',
      description: 'Allow multiple open sections; defaults to false',
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
      description:
        'Single section via update(); use create()/addSection() to initialize',
      availability: 'core',
    },
    {
      name: 'children',
      type: 'View[]',
      description: 'Section views via update(); use create() to initialize',
      availability: 'core',
    },
    {
      name: 'children',
      type: 'React.ReactNode',
      description: 'Only Accordion.Section children are rendered',
      availability: 'react',
    },
    {
      name: 'Section.title',
      type: 'string',
      description: 'Section header text; defaults to an empty string',
      availability: 'both',
    },
    {
      name: 'Section.isOpen',
      type: 'boolean',
      description: 'Initially expanded; defaults to false (not controlled)',
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
      type: 'React.Ref<InstanceType<typeof Accordion.Section>>',
      description: 'Reference to the underlying Core section',
      availability: 'react',
    },
  ],
  source: {
    react: () => readExampleSource('accordion.react.tsx'),
    core: () => readExampleSource('accordion.core.js'),
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
  return renderSample('accordion.react.tsx')
}

function renderCore(): Promise<string> {
  return renderSample('accordion.core.js')
}

function renderSample(filename: string): Promise<string> {
  return captureExample(new URL(`./${filename}`, import.meta.url), {
    width: WIDTH,
    height: HEIGHT,
  })
}
