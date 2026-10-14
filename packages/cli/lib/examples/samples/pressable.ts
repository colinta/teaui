import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 40
const HEIGHT = 6

export const pressableExample: ComponentExample = {
  name: 'pressable',
  availability: 'both',
  description:
    'Make custom child content clickable with hover, pressed, and focus feedback, without a Button title or decorations',
  props: [
    {
      name: 'onClick',
      type: '() => void',
      description: 'Called on a left mouse click or Enter while focused',
      availability: 'both',
    },
    {
      name: 'focusable',
      type: 'boolean',
      description:
        'Join the Tab focus ring and handle Enter; defaults to true. False keeps mouse activation but skips keyboard focus',
      availability: 'both',
    },
    {
      name: 'foreground',
      type: 'Color',
      description:
        'Text color override merged over normal, hover, pressed, and focus styles',
      availability: 'both',
    },
    {
      name: 'purpose',
      type: 'Palette | Purpose',
      description: 'Inherited semantic palette for the actionable surface',
      availability: 'both',
    },
    {
      name: 'background',
      type: 'Color',
      description:
        'Inherited background override used when neither hovered nor focused',
      availability: 'both',
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
      name: 'child',
      type: 'View',
      description: 'Single custom child view; use a Stack to lay out content',
      availability: 'core',
    },
    {
      name: 'children',
      type: 'View[]',
      description: 'Custom child views drawn over the same surface area',
      availability: 'core',
    },
    {
      name: 'child',
      type: 'React.ReactNode',
      description: 'Single custom child element or text',
      availability: 'react',
    },
    {
      name: 'children',
      type: 'React.ReactNode',
      description:
        'Custom child content; use a Stack for sequential rather than overlapping layout',
      availability: 'react',
    },
    {
      name: 'ref',
      type: 'React.Ref<Pressable>',
      description: 'Reference to the underlying Core Pressable',
      availability: 'react',
    },
  ],
  source: {
    core: () => readExampleSource('pressable.core.js'),
    react: () => readExampleSource('pressable.react.tsx'),
  },
  render: {
    core: () => renderSample('pressable.core.js'),
    react: () => renderSample('pressable.react.tsx'),
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
