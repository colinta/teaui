import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 44
const HEIGHT = 13

export const stackExample: ComponentExample = {
  name: 'stack',
  availability: 'both',
  description:
    'Arrange child views in four directions with gaps and weighted flex sizing',
  props: [
    {
      name: 'direction',
      type: "'up' | 'down' | 'left' | 'right'",
      description:
        "Defaults to 'down'. Use Stack.down/up/right/left shortcuts in Core or JSX; up and left place the first child at the bottom or right edge",
      availability: 'both',
    },
    {
      name: 'fill',
      type: 'boolean',
      description:
        "Defaults to true: with flex children, the natural size fills available space on the stack axis. False keeps the children's combined natural size. Only affects natural sizing; does not set child flex",
      availability: 'both',
    },
    {
      name: 'gap',
      type: 'number',
      description:
        'Defaults to 0: columns between horizontal children or rows between vertical children; no leading or trailing gap. Hidden children and layout markers do not add gaps',
      availability: 'both',
    },
    {
      name: 'flex',
      type: "'natural' | number | `flex${number}`",
      description:
        "Inherited view sizing within a parent Stack: defaults to 'natural'; numeric weights share the remaining space along the parent stack's axis",
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
      type: '[FlexShorthand, View] | View',
      description:
        'Additional single view or flex tuple, appended after children',
      availability: 'core',
    },
    {
      name: 'children',
      type: '([FlexShorthand, View] | View)[]',
      description:
        "Ordered views or [flex, view] tuples; plain views use their own flex property. FlexShorthand is 'natural', a numeric weight, or a flexN string",
      availability: 'core',
    },
    {
      name: 'children',
      type: 'React.ReactNode',
      description:
        'Ordered child views; set flex on each child view to share remaining space by weight',
      availability: 'react',
    },
    {
      name: 'ref',
      type: 'React.Ref<Stack>',
      description: 'Reference to the underlying Core Stack',
      availability: 'react',
    },
  ],
  source: {
    core: () => readExampleSource('stack.core.js'),
    react: () => readExampleSource('stack.react.tsx'),
  },
  render: {
    core: () => renderSample('stack.core.js'),
    react: () => renderSample('stack.react.tsx'),
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
