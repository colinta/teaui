import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 16
const HEIGHT = 6

export const imageExample: ComponentExample = {
  name: 'image',
  availability: 'both',
  description:
    'Display asynchronously decoded images as colored half-block cells with @teaui/image; React imports Image from @teaui/image/react',
  props: [
    {
      name: 'source',
      type: 'string | Buffer',
      description:
        'Required local image file path or encoded image bytes (not raw RGBA pixels or a URL). Decoded asynchronously with sharp; blank until loaded, and stays blank on failure. The sample embeds SVG bytes without file or network access',
      availability: 'both',
    },
    {
      name: 'fit',
      type: "'contain' | 'cover' | 'stretch'",
      description:
        "Defaults to 'contain': preserve aspect ratio, fit without enlargement, and center the result. 'cover' fills and center-crops; 'stretch' fills without preserving aspect ratio. Changing source or fit reloads the image",
      availability: 'both',
    },
    {
      name: 'width',
      type: 'Dimension',
      description:
        'Inherited width in terminal columns (number or fill/shrink/natural), not source pixels. Requests available space before loading; contain can shrink afterward. The sample uses 16 columns around a 12-pixel-wide image',
      availability: 'both',
    },
    {
      name: 'height',
      type: 'Dimension',
      description:
        'Inherited height in terminal rows (number or fill/shrink/natural). Each row holds two pixel rows: the foreground is the top pixel and the background is the bottom pixel. The sample centers 8 pixel rows (4 terminal rows) in 6 rows. Resizing reloads the image; an unmatched last pixel row has a black bottom half',
      availability: 'both',
    },
  ],
  source: {
    core: () => readExampleSource('image.core.js'),
    react: () => readExampleSource('image.react.tsx'),
  },
  render: {
    core: () => renderSample('image.core.js'),
    react: () => renderSample('image.react.tsx'),
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
