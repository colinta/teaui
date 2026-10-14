import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 30
const HEIGHT = 10

export const treeExample: ComponentExample = {
  name: 'tree',
  availability: 'both',
  description:
    'Generic hierarchical data with tree-line decorations and mouse-driven expand/collapse; branches start collapsed and expansion is internal, not a controlled prop',
  props: [
    {
      name: 'data',
      type: 'T[]',
      description:
        'Required root items; T is the node type. Expansion uses positional paths such as .0 and .0.1, not item identities. Keep item order stable to preserve the meaning of expanded paths',
      availability: 'both',
    },
    {
      name: 'render',
      type: '(datum: T, path: string) => View',
      description:
        'Required Core node-view factory; path is a zero-based dotted index path such as .0.1. Views are cached by path, so update() does not recreate views at existing paths',
      availability: 'core',
    },
    {
      name: 'render',
      type: '(datum: T) => React.ReactNode',
      description:
        'Required React node renderer; receives only the node, not its index or path. Return JSX such as <Text>{datum.name}</Text>',
      availability: 'react',
    },
    {
      name: 'getChildren',
      type: '(datum: T, path: string) => T[] | undefined',
      description:
        'Optional Core child accessor; receives the node and its dotted index path. Omitted, undefined, or an empty array means a leaf; only nonempty branches can be toggled',
      availability: 'core',
    },
    {
      name: 'getChildren',
      type: '(datum: T) => T[] | undefined',
      description:
        'Optional React child accessor; receives only the node. Omitted, undefined, or an empty array means a leaf; only nonempty branches can be toggled',
      availability: 'react',
    },
    {
      name: 'titleView',
      type: 'View',
      description:
        'Required by Core types; view rendered above the root nodes. Use new Text() for a text title; title is not a Core prop',
      availability: 'core',
    },
    {
      name: 'title',
      type: 'React.ReactNode | string',
      description:
        'Required by React types; strings become text, JSX renders above the root nodes, and null omits the title. titleView is not a React prop',
      availability: 'react',
    },
    {
      name: 'width',
      type: 'Dimension',
      description:
        'Inherited width in terminal columns; each depth adds four columns of tree decorations. Does not add horizontal scrolling',
      availability: 'both',
    },
    {
      name: 'height',
      type: 'Dimension',
      description:
        'Inherited height in terminal rows, including the title and visible nodes. Does not add vertical scrolling; use a Scrollable parent for large trees',
      availability: 'both',
    },
  ],
  source: {
    core: () => readExampleSource('tree.core.js'),
    react: () => readExampleSource('tree.react.tsx'),
  },
  render: {
    core: () => renderSample('tree.core.js'),
    react: () => renderSample('tree.react.tsx'),
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
