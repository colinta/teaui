import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 7
const HEIGHT = 1

export const badgeExample: ComponentExample = {
  name: 'badge',
  availability: 'both',
  description: 'Display a compact status label with colored caps',
  props: [
    {
      name: 'text',
      type: 'string',
      description: "Badge label; defaults to '' (renders nothing)",
      availability: 'both',
    },
    {
      name: 'purpose',
      type: "'primary' | 'blue' | 'secondary' | 'orange' | 'proceed' | 'green' | 'cancel' | 'red' | 'selected' | 'plain'",
      description: 'Color palette; inherits from its parent, otherwise plain',
      availability: 'both',
    },
    {
      name: 'ref',
      type: 'React.Ref<Badge>',
      description: 'Reference to the underlying Core Badge',
      availability: 'react',
    },
  ],
  source: {
    react: () => readExampleSource('badge.react.tsx'),
    core: () => readExampleSource('badge.core.js'),
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
  return renderSample('badge.react.tsx')
}

function renderCore(): Promise<string> {
  return renderSample('badge.core.js')
}

function renderSample(filename: string): Promise<string> {
  return captureExample(new URL(`./${filename}`, import.meta.url), {
    width: WIDTH,
    height: HEIGHT,
  })
}
