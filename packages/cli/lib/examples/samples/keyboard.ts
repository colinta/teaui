import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 32
const HEIGHT = 3

export const keyboardExample: ComponentExample = {
  name: 'keyboard',
  availability: 'both',
  description:
    'Handle fallback keys without taking focus; matching hotkeys and focused views take priority, and the innermost registered Keyboard handles nested fallback events',
  props: [
    {
      name: 'onKey',
      type: '(event: KeyEvent) => void',
      description:
        'Called only when no hotkey matches and no view has focus; event.full includes modifier prefixes such as C- and S-',
      availability: 'both',
    },
    {
      name: 'child',
      type: 'View',
      description: 'Single child view; Keyboard adds no visual decoration',
      availability: 'core',
    },
    {
      name: 'children',
      type: 'View[]',
      description: 'Child views covered by the fallback listener',
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
      description: 'Child elements or text covered by the fallback listener',
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
      type: 'React.Ref<Keyboard>',
      description: 'Reference to the underlying Core Keyboard',
      availability: 'react',
    },
  ],
  source: {
    core: () => readExampleSource('keyboard.core.js'),
    react: () => readExampleSource('keyboard.react.tsx'),
  },
  render: {
    core: () => renderSample('keyboard.core.js'),
    react: () => renderSample('keyboard.react.tsx'),
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
