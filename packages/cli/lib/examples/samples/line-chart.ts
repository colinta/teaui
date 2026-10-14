import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 24
const HEIGHT = 6

export const lineChartExample: ComponentExample = {
  name: 'line-chart',
  availability: 'both',
  description:
    'Draw a standalone braille line; Core takes data as the first constructor argument',
  props: [
    {
      name: 'data',
      type: 'T[]',
      description:
        'Rows to plot; Core passes data to new LineChart(data, props)',
      availability: 'react',
    },
    {
      name: 'extract',
      type: '(row: T) => [number, number]',
      description: 'Required: extract the x and y coordinates',
      availability: 'both',
    },
    {
      name: 'xLabels',
      type: '(row: T, index: number) => string | null | undefined',
      description:
        'X-axis labels inside Plot; return null/undefined to skip one',
      availability: 'both',
    },
    {
      name: 'style',
      type: 'Style',
      description: 'Chart style stored on the underlying chart',
      availability: 'both',
    },
    {
      name: 'ref',
      type: 'React.Ref<LineChart<T>>',
      description: 'Reference to the underlying Core LineChart',
      availability: 'react',
    },
  ],
  source: {
    react: () => readExampleSource('line-chart.react.tsx'),
    core: () => readExampleSource('line-chart.core.js'),
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
  return renderSample('line-chart.react.tsx')
}

function renderCore(): Promise<string> {
  return renderSample('line-chart.core.js')
}

function renderSample(filename: string): Promise<string> {
  return captureExample(new URL(`./${filename}`, import.meta.url), {
    width: WIDTH,
    height: HEIGHT,
  })
}
