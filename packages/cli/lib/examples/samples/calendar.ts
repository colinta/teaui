import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 22
const HEIGHT = 8

export const calendarExample: ComponentExample = {
  name: 'calendar',
  availability: 'both',
  description: 'Select a date from a monthly calendar',
  props: [
    {
      name: 'date',
      type: 'Date',
      description: 'Selected date',
      availability: 'both',
    },
    {
      name: 'visibleDate',
      type: 'Date',
      description: 'Displayed month and year',
      availability: 'both',
    },
    {
      name: 'onChangeVisible',
      type: '(date: Date) => void',
      description: 'Called when the displayed month or year changes',
      availability: 'both',
    },
    {
      name: 'onChange',
      type: '(date1: Date, date2: Date) => void',
      description: 'Called when a date or range is selected',
      availability: 'both',
    },
    {
      name: 'selection',
      type: "'single' | 'range'",
      description: "Selection mode; defaults to 'single'",
      availability: 'both',
    },
    {
      name: 'firstDayOfWeek',
      type: '0 | 1',
      description: 'Start weeks on Sunday (0) or Monday (1)',
      availability: 'both',
    },
    {
      name: 'now',
      type: 'Date',
      description: 'Override the current date',
      availability: 'both',
    },
    {
      name: 'ref',
      type: 'React.Ref<Calendar>',
      description: 'Reference to the underlying Core Calendar',
      availability: 'react',
    },
  ],
  source: {
    react: () => readExampleSource('calendar.react.tsx'),
    core: () => readExampleSource('calendar.core.js'),
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
  return renderSample('calendar.react.tsx')
}

function renderCore(): Promise<string> {
  return renderSample('calendar.core.js')
}

function renderSample(filename: string): Promise<string> {
  return captureExample(new URL(`./${filename}`, import.meta.url), {
    width: WIDTH,
    height: HEIGHT,
  })
}
