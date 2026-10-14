import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 27
const HEIGHT = 9

export const plotExample: ComponentExample = {
  name: 'plot',
  availability: 'both',
  description:
    'Add axes, labels, and a title around a chart; Core uses add(chart)',
  props: [
    {
      name: 'title',
      type: 'string',
      description: 'Title displayed above the chart',
      availability: 'both',
    },
    {
      name: 'xAxisLabels',
      type: 'boolean',
      description: 'Show x-axis tick labels; defaults to true',
      availability: 'both',
    },
    {
      name: 'yAxisLabels',
      type: 'boolean',
      description: 'Show y-axis tick labels; defaults to true',
      availability: 'both',
    },
    {
      name: 'yLabels',
      type: '(value: number) => string | null | undefined',
      description:
        'Format ticks from the combined Y range; return null/undefined to skip one',
      availability: 'both',
    },
    {
      name: 'showAxes',
      type: 'boolean',
      description: 'Show axis lines; defaults to true',
      availability: 'both',
    },
    {
      name: 'children',
      type: 'React.ReactNode',
      description:
        'Chart children only; Core uses add(chart) and remove(chart)',
      availability: 'react',
    },
    {
      name: 'ref',
      type: 'React.Ref<Plot>',
      description: 'Reference to the underlying Core Plot',
      availability: 'react',
    },
  ],
  source: {
    react: () => readExampleSource('plot.react.tsx'),
    core: () => readExampleSource('plot.core.js'),
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
  return renderSample('plot.react.tsx')
}

function renderCore(): Promise<string> {
  return renderSample('plot.core.js')
}

function renderSample(filename: string): Promise<string> {
  return captureExample(new URL(`./${filename}`, import.meta.url), {
    width: WIDTH,
    height: HEIGHT,
  })
}
