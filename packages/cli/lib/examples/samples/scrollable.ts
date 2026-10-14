import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 40
const HEIGHT = 17

export const scrollableExample: ComponentExample = {
  name: 'scrollable',
  availability: 'both',
  description:
    'Arrange overflowing children in a direction with mouse-wheel scrolling and optional draggable scrollbars; use scrollBy(), advancePage(), or scrollTo() after layout',
  props: [
    {
      name: 'direction',
      type: "'down' | 'up' | 'left' | 'right'",
      description:
        'Child layout direction, not the scrolling restriction; defaults to down. The down/up/left/right helpers set this prop',
      availability: 'both',
    },
    {
      name: 'gap',
      type: 'number',
      description:
        'Space between children along the layout axis; defaults to 0',
      availability: 'both',
    },
    {
      name: 'scrollable',
      type: "'both' | 'horizontal' | 'vertical'",
      description:
        'Allowed scrolling axes, independently of direction; defaults to both',
      availability: 'both',
    },
    {
      name: 'showScrollbars',
      type: "boolean | 'horizontal' | 'vertical'",
      description:
        'Defaults to true; false hides both bars. An axis name enables only that bar. Bars appear on overflow in allowed axes and consume one row or column',
      availability: 'both',
    },
    {
      name: 'keepAtBottom',
      type: 'boolean',
      description:
        'Defaults to false; with the vertical scrollbar enabled, follow growing content at the bottom while already there, without forcing a user who scrolled up back down',
      availability: 'both',
    },
    {
      name: 'contentSize',
      type: '{width?: number; height?: number}',
      description:
        'Override the scrollable content extent; omitted axes use the viewport size. Without this prop, children determine the extent',
      availability: 'both',
    },
    {
      name: 'offset',
      type: 'Point',
      description:
        'Content offset in positive right/down coordinates; use with onOffsetChange for controlled scrolling',
      availability: 'both',
    },
    {
      name: 'onOffsetChange',
      type: '(offset: Point) => void',
      description:
        'Receives the positive content offset on nonzero permitted scrollBy()/advancePage() requests (even at an edge), and when scrollTo() moves; not emitted for applying the offset prop, bottom-following, or scrollbar dragging',
      availability: 'both',
    },
    {
      name: 'width',
      type: 'Dimension',
      description: 'Inherited width; numeric values are terminal columns',
      availability: 'both',
    },
    {
      name: 'height',
      type: 'Dimension',
      description: 'Inherited height; numeric values are terminal rows',
      availability: 'both',
    },
    {
      name: 'child',
      type: 'View',
      description: 'Single content view, appended after any children',
      availability: 'core',
    },
    {
      name: 'children',
      type: 'View[]',
      description: 'Content views laid out in direction order with gap spacing',
      availability: 'core',
    },
    {
      name: 'children',
      type: 'React.ReactNode',
      description: 'Content views laid out in direction order with gap spacing',
      availability: 'react',
    },
    {
      name: 'ref',
      type: 'React.Ref<Scrollable>',
      description:
        'Reference to the Core Scrollable for scrollBy(dx, dy), advancePage(delta), and scrollTo(view or {x?, y?}); scrollTo reveals a target rather than setting an absolute offset',
      availability: 'react',
    },
  ],
  source: {
    core: () => readExampleSource('scrollable.core.js'),
    react: () => readExampleSource('scrollable.react.tsx'),
  },
  render: {
    core: () => renderSample('scrollable.core.js'),
    react: () => renderSample('scrollable.react.tsx'),
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
