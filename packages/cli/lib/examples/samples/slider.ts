import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 44
const HEIGHT = 27

export const sliderExample: ComponentExample = {
  name: 'slider',
  availability: 'both',
  description:
    'Choose a bounded numeric value by clicking or dragging, or Tab to focus and use arrows, Home, and End; supports both directions, borders, and step buttons',
  props: [
    {
      name: 'direction',
      type: "'horizontal' | 'vertical'",
      description:
        'Defaults to horizontal; vertical values increase from top to bottom. React also provides Slider.horizontal and Slider.vertical helpers',
      availability: 'both',
    },
    {
      name: 'range',
      type: '[number, number]',
      description:
        'Inclusive minimum and maximum; defaults to [0, 1]. Supply an ascending range',
      availability: 'both',
    },
    {
      name: 'value',
      type: 'number',
      description:
        'Defaults to the range minimum; provide a value within range. User changes are clamped. Core value assignment invalidates rendering without calling onChange; React can keep value in state',
      availability: 'both',
    },
    {
      name: 'step',
      type: 'number',
      description:
        'Defaults to 1 and is at least 1. Arrows and buttons add/subtract step; integer steps also snap mouse positions relative to the range minimum. Required by Core constructor types when buttons is true; pass it in either framework for step buttons',
      availability: 'both',
    },
    {
      name: 'buttons',
      type: 'boolean',
      description:
        'Defaults to false; add decrease/increase buttons at either end. Horizontal borderless buttons use brackets; vertical borderless buttons use arrows only',
      availability: 'both',
    },
    {
      name: 'border',
      type: 'boolean',
      description:
        'Defaults to false; draw a frame when at least three rows (horizontal) or columns (vertical) are available. Core border assignment invalidates sizing',
      availability: 'both',
    },
    {
      name: 'onChange',
      type: '(value: number) => void',
      description:
        'Called only when keyboard, mouse, or button interaction changes the value; Home selects the minimum and End the maximum. Update React state here for a controlled slider',
      availability: 'both',
    },
    {
      name: 'purpose',
      type: 'Palette | Purpose',
      description: 'Semantic palette for the track, frame, and buttons',
      availability: 'both',
    },
    {
      name: 'width',
      type: 'Dimension',
      description:
        'Width in columns or fill/shrink/natural. Let N = max(5, ceil((max - min) / step)): horizontal natural width is N plus 6 with buttons, otherwise plus 2 with a border; vertical natural width is 3 with a border, otherwise 1',
      availability: 'both',
    },
    {
      name: 'height',
      type: 'Dimension',
      description:
        'Height in rows or fill/shrink/natural. Horizontal natural height is 3 with a border, otherwise 1; vertical natural height is N plus 6 with both border and buttons, plus 2 with either alone, otherwise N. Explicit dimensions override natural sizing',
      availability: 'both',
    },
    {
      name: 'ref',
      type: 'React.Ref<Slider>',
      description: 'Reference to the underlying Core Slider',
      availability: 'react',
    },
  ],
  source: {
    core: () => readExampleSource('slider.core.js'),
    react: () => readExampleSource('slider.react.tsx'),
  },
  render: {
    core: () => renderSample('slider.core.js'),
    react: () => renderSample('slider.react.tsx'),
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
