import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 40
const HEIGHT = 7

export const codeExample: ComponentExample = {
  name: 'code',
  availability: 'both',
  description:
    'Display syntax-highlighted code with @teaui/code; React imports Code from @teaui/code/react',
  props: [
    {
      name: 'code',
      type: 'string',
      description: 'Required source text to display, not execute',
      availability: 'both',
    },
    {
      name: 'language',
      type: 'string',
      description: 'Highlight.js language name; auto-detected when omitted',
      availability: 'both',
    },
    {
      name: 'showLineNumbers',
      type: 'boolean',
      description: 'Show a line-number gutter; defaults to false',
      availability: 'both',
    },
    {
      name: 'highlightLines',
      type: 'number[]',
      description:
        '1-based source line numbers with a gray background on their first display row; defaults to []',
      availability: 'both',
    },
    {
      name: 'wrap',
      type: 'boolean',
      description:
        'Wrap long lines after the gutter; defaults to false (clip). Continuation rows have no line number',
      availability: 'both',
    },
    {
      name: 'width',
      type: "number | 'fill' | 'shrink' | 'natural'",
      description: 'Inherited width in terminal columns, including the gutter',
      availability: 'both',
    },
    {
      name: 'height',
      type: "number | 'fill' | 'shrink' | 'natural'",
      description: 'Inherited height in terminal rows',
      availability: 'both',
    },
  ],
  source: {
    core: () => readExampleSource('code.core.js'),
    react: () => readExampleSource('code.react.tsx'),
  },
  render: {
    core: () => renderSample('code.core.js'),
    react: () => renderSample('code.react.tsx'),
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
