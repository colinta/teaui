import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 16
const HEIGHT = 5

export const barChartExample: ComponentExample = {
  name: 'bar-chart',
  availability: 'both',
  description:
    'Draw standalone bars; Core takes data as the first constructor argument',
  props: [
    {
      name: 'data',
      type: 'T[]',
      description:
        'Rows to plot; Core passes data to new BarChart(data, props)',
      availability: 'react',
    },
    {
      name: 'extract',
      type: '(row: T, index: number) => [number, number]',
      description: 'Required: extract the X position and height of each bar',
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
      name: 'barWidth',
      type: 'number',
      description: 'Terminal columns per bar; defaults to 1',
      availability: 'both',
    },
    {
      name: 'style',
      type: 'Style | ((row: T, index: number) => Style)',
      description: 'Shared style or a style function for each bar',
      availability: 'both',
    },
    {
      name: 'ref',
      type: 'React.Ref<BarChart<T>>',
      description: 'Reference to the underlying Core BarChart',
      availability: 'react',
    },
  ],
  source: {
    react: () => readExampleSource('bar-chart.react.tsx'),
    core: () => readExampleSource('bar-chart.core.js'),
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
  return renderSample('bar-chart.react.tsx')
}

function renderCore(): Promise<string> {
  return renderSample('bar-chart.core.js')
}

function renderSample(filename: string): Promise<string> {
  return captureExample(new URL(`./${filename}`, import.meta.url), {
    width: WIDTH,
    height: HEIGHT,
  })
}
