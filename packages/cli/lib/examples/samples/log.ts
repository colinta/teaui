import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 36
const HEIGHT = 5

export const logExample: ComponentExample = {
  name: 'log',
  availability: 'both',
  description:
    'Display structured log entries; Core supplies entries with setLogs()',
  props: [
    {
      name: 'logs',
      type: 'LogLine[]',
      description:
        'Controlled entries; Core uses setLogs(), appendLog(), and clear()',
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
      name: 'ref',
      type: 'React.Ref<Log>',
      description: 'Reference to Core Log for imperative logging methods',
      availability: 'react',
    },
  ],
  source: {
    react: () => readExampleSource('log.react.tsx'),
    core: () => readExampleSource('log.core.js'),
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
  return renderSample('log.react.tsx')
}

function renderCore(): Promise<string> {
  return renderSample('log.core.js')
}

function renderSample(filename: string): Promise<string> {
  return captureExample(new URL(`./${filename}`, import.meta.url), {
    width: WIDTH,
    height: HEIGHT,
  })
}
