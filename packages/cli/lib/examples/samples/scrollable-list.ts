import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 36
const HEIGHT = 13

export const scrollableListExample: ComponentExample = {
  name: 'scrollable-list',
  availability: 'both',
  description:
    'Scroll generic items using cached Core views or JSX rows; the React wrapper uses the same scrolling container, not a selectable list',
  props: [
    {
      name: 'data',
      type: 'T[]',
      description:
        'Required item array; T is the item type. Core caches views by item identity; use updateData() to replace Core data and clear caches',
      availability: 'both',
    },
    {
      name: 'renderItem',
      type: '(item: T, row: number) => View',
      description:
        'Optional Core renderer with a zero-based filtered row index. Returned views are cached; invalidate(), invalidateItem(item, "view"), or invalidateAllRows("view") rebuild them. There is no default item-to-text renderer',
      availability: 'core',
    },
    {
      name: 'renderItem',
      type: '(item: T, index: number) => React.ReactNode',
      description:
        'Required JSX renderer with a zero-based filtered index. The wrapper maps every filtered item into children up front; row views determine their own height',
      availability: 'react',
    },
    {
      name: 'filter',
      type: '(item: T) => boolean',
      description:
        'Keep items returning true; omitted shows all items. Core updateFilter() resets scrolling and preserves cached views; refresh() reapplies a filter that captures changed external state. React filters before calling renderItem',
      availability: 'both',
    },
    {
      name: 'showScrollbars',
      type: 'boolean',
      description:
        'Core only; defaults to true and reserves one column for a draggable vertical bar, even without overflow. False uses the full row width. Not exposed by the React wrapper',
      availability: 'core',
    },
    {
      name: 'keepAtBottom',
      type: 'boolean',
      description:
        'Core only; defaults to false. Initially show the bottom, then follow growing data while already at the bottom without forcing a user who scrolled up back down. Not exposed by the React wrapper',
      availability: 'core',
    },
    {
      name: 'width',
      type: "number | 'fill' | 'shrink' | 'natural'",
      description:
        'Inherited width; numeric values are terminal columns including the scrollbar column',
      availability: 'both',
    },
    {
      name: 'height',
      type: "number | 'fill' | 'shrink' | 'natural'",
      description:
        'Inherited viewport height; numeric values are terminal rows, not the number of data items. Core scrollBy(), advancePage(), and scrollToRow() need an initial layout',
      availability: 'both',
    },
  ],
  source: {
    core: () => readExampleSource('scrollable-list.core.js'),
    react: () => readExampleSource('scrollable-list.react.tsx'),
  },
  render: {
    core: () => renderSample('scrollable-list.core.js'),
    react: () => renderSample('scrollable-list.react.tsx'),
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
