import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 24
const HEIGHT = 8

export const canvasExample: ComponentExample = {
  name: 'canvas',
  availability: 'both',
  description:
    'Draw pixel shapes with Braille: each terminal cell holds 2×4 pixels',
  props: [
    {
      name: 'draw',
      type: '(canvas: Canvas) => void',
      description:
        'Draw after sizing; the pixel buffer is cleared before each callback. Use pixelWidth/pixelHeight and pixel coordinates',
      availability: 'both',
    },
    {
      name: 'width',
      type: "number | 'fill' | 'shrink' | 'natural'",
      description: 'Inherited width in terminal columns, not pixels',
      availability: 'both',
    },
    {
      name: 'height',
      type: "number | 'fill' | 'shrink' | 'natural'",
      description: 'Inherited height in terminal rows, not pixels',
      availability: 'both',
    },
    {
      name: 'ref',
      type: 'React.Ref<Canvas>',
      description: 'Reference to the underlying Core Canvas',
      availability: 'react',
    },
  ],
  source: {
    react: () => readExampleSource('canvas.react.tsx'),
    core: () => readExampleSource('canvas.core.js'),
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
  return renderSample('canvas.react.tsx')
}

function renderCore(): Promise<string> {
  return renderSample('canvas.core.js')
}

function renderSample(filename: string): Promise<string> {
  return captureExample(new URL(`./${filename}`, import.meta.url), {
    width: WIDTH,
    height: HEIGHT,
  })
}
