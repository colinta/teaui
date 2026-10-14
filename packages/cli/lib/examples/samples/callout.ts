import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 32
const HEIGHT = 5

export const calloutExample: ComponentExample = {
  name: 'callout',
  availability: 'both',
  description:
    'Show an inline notification with an accent bar and tinted background',
  props: [
    {
      name: 'title',
      type: 'string',
      description:
        'Bold title above a separator; defaults to the first child heading. Empty string hides it',
      availability: 'both',
    },
    {
      name: 'purpose',
      type: "'primary' | 'blue' | 'secondary' | 'orange' | 'proceed' | 'green' | 'cancel' | 'red' | 'selected' | 'plain'",
      description:
        'Named color palette for the accent bar and tinted background',
      availability: 'both',
    },
    {
      name: 'direction',
      type: "'up' | 'down' | 'left' | 'right'",
      description:
        "Layout direction for the title and body; defaults to 'down'",
      availability: 'both',
    },
    {
      name: 'child',
      type: 'View',
      description:
        'Single body view; takes precedence over constructor children',
      availability: 'core',
    },
    {
      name: 'children',
      type: 'View[]',
      description: 'Body views arranged in the selected direction',
      availability: 'core',
    },
    {
      name: 'children',
      type: 'React.ReactNode',
      description: 'Body content arranged in the selected direction',
      availability: 'react',
    },
    {
      name: 'ref',
      type: 'React.Ref<Callout>',
      description: 'Reference to the underlying Core Callout',
      availability: 'react',
    },
  ],
  source: {
    react: () => readExampleSource('callout.react.tsx'),
    core: () => readExampleSource('callout.core.js'),
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
  return renderSample('callout.react.tsx')
}

function renderCore(): Promise<string> {
  return renderSample('callout.core.js')
}

function renderSample(filename: string): Promise<string> {
  return captureExample(new URL(`./${filename}`, import.meta.url), {
    width: WIDTH,
    height: HEIGHT,
  })
}
