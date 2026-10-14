import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 40
const HEIGHT = 4

export const mouseExample: ComponentExample = {
  name: 'mouse',
  availability: 'both',
  description:
    'Add fallback mouse handling without visual decoration; child button and wheel handlers take priority, while movement may reach both child and ancestor',
  props: [
    {
      name: 'mouse',
      type: 'MouseEventListenerName | MouseEventListenerName[]',
      description:
        'Event groups to receive; defaults to mouse.button.all, mouse.wheel, and mouse.move. An empty array disables registration',
      availability: 'both',
    },
    {
      name: 'onMouse',
      type: '(event: MouseEvent, system: System) => void',
      description:
        'Called for matching events; event.position is relative to the Mouse region, not the terminal',
      availability: 'both',
    },
    {
      name: 'child',
      type: 'View',
      description: 'Single child view covered by the mouse region',
      availability: 'core',
    },
    {
      name: 'children',
      type: 'View[]',
      description: 'Child views covered by the mouse region',
      availability: 'core',
    },
    {
      name: 'child',
      type: 'React.ReactNode',
      description: 'Single child element or text',
      availability: 'react',
    },
    {
      name: 'children',
      type: 'React.ReactNode',
      description: 'Child elements or text covered by the mouse region',
      availability: 'react',
    },
    {
      name: 'width',
      type: 'Dimension',
      description: "Columns or 'fill', 'shrink', 'natural'",
      availability: 'both',
    },
    {
      name: 'height',
      type: 'Dimension',
      description: "Rows or 'fill', 'shrink', 'natural'",
      availability: 'both',
    },
    {
      name: 'ref',
      type: 'React.Ref<Mouse>',
      description: 'Reference to the underlying Core Mouse',
      availability: 'react',
    },
  ],
  source: {
    core: () => readExampleSource('mouse.core.js'),
    react: () => readExampleSource('mouse.react.tsx'),
  },
  render: {
    core: () => renderSample('mouse.core.js'),
    react: () => renderSample('mouse.react.tsx'),
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
