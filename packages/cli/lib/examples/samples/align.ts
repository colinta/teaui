import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 21
const HEIGHT = 4

export const alignExample: ComponentExample = {
  name: 'align',
  availability: 'both',
  description: 'Align cells across rows using the widest cell in each column',
  props: [
    {
      name: 'direction',
      type: "'up' | 'down' | 'left' | 'right'",
      description:
        "Stack rows down or up, or columns right or left; defaults to 'down'",
      availability: 'both',
    },
    {
      name: 'separator',
      type: 'string',
      description:
        "Separator text; defaults to '│', with one space on each side",
      availability: 'both',
    },
    {
      name: 'separatorStyle',
      type: 'Style',
      description: 'Optional style applied to separator text',
      availability: 'both',
    },
    {
      name: 'width',
      type: "number | 'fill' | 'shrink' | 'natural'",
      description: 'Inherited view width in terminal columns or a sizing mode',
      availability: 'both',
    },
    {
      name: 'height',
      type: "number | 'fill' | 'shrink' | 'natural'",
      description: 'Inherited view height in terminal rows or a sizing mode',
      availability: 'both',
    },
    {
      name: 'child',
      type: 'View',
      description: 'Additional single view, placed before constructor children',
      availability: 'core',
    },
    {
      name: 'children',
      type: 'View[]',
      description:
        'Align.row cells share column widths; other views span the width in row mode or height in column mode',
      availability: 'core',
    },
    {
      name: 'children',
      type: 'React.ReactNode',
      description:
        'Align.Row cells share column widths; other views span the width in row mode or height in column mode',
      availability: 'react',
    },
    {
      name: 'ref',
      type: 'React.Ref<Align>',
      description: 'Reference to the underlying Core Align',
      availability: 'react',
    },
  ],
  source: {
    react: () => readExampleSource('align.react.tsx'),
    core: () => readExampleSource('align.core.js'),
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
  return renderSample('align.react.tsx')
}

function renderCore(): Promise<string> {
  return renderSample('align.core.js')
}

function renderSample(filename: string): Promise<string> {
  return captureExample(new URL(`./${filename}`, import.meta.url), {
    width: WIDTH,
    height: HEIGHT,
  })
}
