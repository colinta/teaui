import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 44
const HEIGHT = 17

export const desktopExample: ComponentExample = {
  name: 'desktop',
  availability: 'both',
  description:
    'Manage Window children: placement with a layout plugin (floating or tiled), z-order, and the active window. Minimized windows are lined up along the bottom',
  props: [
    {
      name: 'layout',
      type: "'floating' | 'tiled' | DesktopLayout",
      description:
        "Defaults to 'floating': overlapping windows that move and resize. 'tiled' puts the first window on the left and stacks the rest. Pass a DesktopLayout for custom window management; it is only replaced when the prop changes",
      availability: 'both',
    },
    {
      name: 'width',
      type: "number | 'fill' | 'shrink' | 'natural'",
      description: 'Inherited view width; a Desktop fills the available width',
      availability: 'both',
    },
    {
      name: 'height',
      type: "number | 'fill' | 'shrink' | 'natural'",
      description:
        'Inherited view height; a Desktop fills the available height',
      availability: 'both',
    },
    {
      name: 'child',
      type: 'View',
      description: 'Single window or background view',
      availability: 'core',
    },
    {
      name: 'children',
      type: 'View[]',
      description:
        'Windows, drawn in z-order; other views are drawn behind the windows. Minimized windows are one row tall, lined up along the bottom in the order they were minimized, and cannot be moved or resized',
      availability: 'core',
    },
    {
      name: 'children',
      type: 'React.ReactNode',
      description:
        'Windows, drawn in z-order; other views are drawn behind the windows. Minimized windows are one row tall, lined up along the bottom in the order they were minimized, and cannot be moved or resized',
      availability: 'react',
    },
    {
      name: 'ref',
      type: 'React.Ref<Desktop>',
      description:
        'Reference to the Core Desktop: windows (z-order), activeWindow, layout',
      availability: 'react',
    },
  ],
  source: {
    core: () => readExampleSource('desktop.core.js'),
    react: () => readExampleSource('desktop.react.tsx'),
  },
  render: {
    core: () => renderSample('desktop.core.js'),
    react: () => renderSample('desktop.react.tsx'),
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
