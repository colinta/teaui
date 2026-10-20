import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 24
const HEIGHT = 3

export const buttonExample: ComponentExample = {
  name: 'button',
  availability: 'both',
  description: 'Activate a button with a click, Enter, or a hot key',
  props: [
    {
      name: 'title',
      type: 'string',
      description: 'Button label; custom child content replaces it',
      availability: 'both',
    },
    {
      name: 'onClick',
      type: '() => void',
      description: 'Called on a mouse click, Enter while focused, or hot key',
      availability: 'both',
    },
    {
      name: 'align',
      type: "'left' | 'center' | 'right'",
      description: "Content alignment; defaults to 'center'",
      availability: 'both',
    },
    {
      name: 'border',
      type: "'default' | 'arrows' | 'none'",
      description: "Border style; defaults to bracketed 'default'",
      availability: 'both',
    },
    {
      name: 'hotKey',
      type: 'HotKey',
      description: 'Keyboard shortcut, including when the button is unfocused',
      availability: 'both',
    },
    {
      name: 'focusable',
      type: 'boolean',
      description: 'Join the Tab focus ring and handle Enter; defaults to true',
      availability: 'both',
    },
    {
      name: 'foreground',
      type: 'Color',
      description:
        'Text color override for normal, hover, pressed, and focus states',
      availability: 'both',
    },
    {
      name: 'purpose',
      type: 'Palette | Purpose',
      description:
        "Semantic palette, such as 'primary', 'proceed', or 'cancel' (aka 'destructive')",
      availability: 'both',
    },
    {
      name: 'width',
      type: 'Dimension',
      description: 'Button width; numeric values are terminal columns',
      availability: 'both',
    },
    {
      name: 'height',
      type: 'Dimension',
      description: 'Button height; numeric values are terminal rows',
      availability: 'both',
    },
    {
      name: 'child',
      type: 'View',
      description: 'Single custom child view instead of title',
      availability: 'core',
    },
    {
      name: 'children',
      type: 'View[]',
      description: 'Custom child views instead of title',
      availability: 'core',
    },
    {
      name: 'children',
      type: 'React.ReactNode',
      description: 'Custom child content instead of title',
      availability: 'react',
    },
    {
      name: 'ref',
      type: 'React.Ref<Button>',
      description: 'Reference to the underlying Core Button',
      availability: 'react',
    },
  ],
  source: {
    react: () => readExampleSource('button.react.tsx'),
    core: () => readExampleSource('button.core.js'),
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
  return renderSample('button.react.tsx')
}

function renderCore(): Promise<string> {
  return renderSample('button.core.js')
}

function renderSample(filename: string): Promise<string> {
  return captureExample(new URL(`./${filename}`, import.meta.url), {
    width: WIDTH,
    height: HEIGHT,
  })
}
