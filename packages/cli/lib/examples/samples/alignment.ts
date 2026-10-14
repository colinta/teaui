import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 40
const HEIGHT = 6

export const alignmentExample: ComponentExample = {
  name: 'alignment',
  availability: 'both',
  description:
    'Publish a zero-sized, invisible point for Placement edges in an AlignmentScope; takes no space or gap in a Stack',
  props: [
    {
      name: 'point',
      type: 'AlignmentPoint',
      description:
        'Point to publish; defaults to a new point. Use createAlignment in Core or useAlignment in React to create it separately',
      availability: 'both',
    },
    {
      name: 'name',
      type: 'string',
      description:
        'Diagnostic name for the new point, set at construction; ignored when point is supplied',
      availability: 'both',
    },
    {
      name: 'isVisible',
      type: 'boolean',
      description:
        'Defaults to true; a hidden marker leaves dependent placements empty for that frame',
      availability: 'both',
    },
    {
      name: 'debug',
      type: 'boolean',
      description: 'Inherited view debugging flag; defaults to false',
      availability: 'both',
    },
    {
      name: 'ref',
      type: 'React.Ref<Alignment>',
      description: 'Reference to the underlying Core Alignment marker',
      availability: 'react',
    },
  ],
  source: {
    react: () => readExampleSource('alignment.react.tsx'),
    core: () => readExampleSource('alignment.core.js'),
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
  return renderSample('alignment.react.tsx')
}

function renderCore(): Promise<string> {
  return renderSample('alignment.core.js')
}

function renderSample(filename: string): Promise<string> {
  return captureExample(new URL(`./${filename}`, import.meta.url), {
    width: WIDTH,
    height: HEIGHT,
  })
}
