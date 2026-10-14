import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 40
const HEIGHT = 14

export const spaceExample: ComponentExample = {
  name: 'space',
  availability: 'both',
  description:
    'Empty view with zero natural size; explicit dimensions create fixed gaps, flex consumes remaining Stack space, and an optional background paints the allocated area. Core also provides Space.horizontal(size, extraProps) and Space.vertical(size, extraProps); React uses width and height props instead',
  props: [
    {
      name: 'width',
      type: 'Dimension',
      description:
        'Inherited width in columns: number or fill/shrink/natural. Natural width is 0; Core Space.horizontal(size, extraProps) sets width',
      availability: 'both',
    },
    {
      name: 'height',
      type: 'Dimension',
      description:
        'Inherited height in rows: number or fill/shrink/natural. Natural height is 0; Core Space.vertical(size, extraProps) sets height',
      availability: 'both',
    },
    {
      name: 'flex',
      type: 'FlexShorthand',
      description:
        "Inherited Stack sizing weight: number, 'natural', or a flexN string. Defaults to 'natural', so an unsized Space creates no gap; flex={1} consumes remaining space along the parent Stack direction",
      availability: 'both',
    },
    {
      name: 'background',
      type: 'Color',
      description:
        'Optional inherited background color. Omitted by default, leaving the allocated area unpainted; a color paints spaces throughout it without changing the natural size',
      availability: 'both',
    },
    {
      name: 'ref',
      type: 'React.Ref<Space>',
      description: 'Reference to the underlying Core Space',
      availability: 'react',
    },
  ],
  source: {
    core: () => readExampleSource('space.core.js'),
    react: () => readExampleSource('space.react.tsx'),
  },
  render: {
    core: () => renderSample('space.core.js'),
    react: () => renderSample('space.react.tsx'),
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
