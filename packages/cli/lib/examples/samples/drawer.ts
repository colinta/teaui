import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 32
const HEIGHT = 10

export const drawerExample: ComponentExample = {
  name: 'drawer',
  availability: 'both',
  description:
    'Slide a panel over main content; click its handle or use a hotkey',
  props: [
    {
      name: 'location',
      type: "'left' | 'right' | 'top' | 'bottom'",
      description: 'Edge the panel slides from; defaults to left',
      availability: 'both',
    },
    {
      name: 'isOpen',
      type: 'boolean',
      description:
        'Initial/reset open state; defaults to false, with animated transitions',
      availability: 'both',
    },
    {
      name: 'hidesWhenClosed',
      type: 'boolean',
      description:
        'Hide the closed handle and give content the full viewport; defaults to false',
      availability: 'both',
    },
    {
      name: 'onToggle',
      type: '(isOpen: boolean) => void',
      description:
        'Called on state changes, including open(), close(), and toggle()',
      availability: 'both',
    },
    {
      name: 'hotKey',
      type: 'HotKey',
      description:
        'Toggle shortcut; works even when the closed handle is hidden',
      availability: 'both',
    },
    {
      name: 'title',
      type: 'string',
      description:
        'Panel heading; falls back to drawer.heading, with an empty string suppressing it',
      availability: 'both',
    },
    {
      name: 'content',
      type: 'View',
      description: 'Main content view; constructor-only slot',
      availability: 'core',
    },
    {
      name: 'content',
      type: 'React.ReactNode',
      description: 'Main content; wrap multiple views in a Stack',
      availability: 'react',
    },
    {
      name: 'drawer',
      type: 'View',
      description: 'Sliding panel view; constructor-only slot',
      availability: 'core',
    },
    {
      name: 'drawer',
      type: 'React.ReactNode',
      description: 'Sliding panel content; wrap multiple views in a Stack',
      availability: 'react',
    },
    {
      name: 'width',
      type: 'Dimension',
      description: 'Inherited width; numeric values are terminal columns',
      availability: 'both',
    },
    {
      name: 'height',
      type: 'Dimension',
      description: 'Inherited height; numeric values are terminal rows',
      availability: 'both',
    },
    {
      name: 'child',
      type: 'View',
      description:
        'Main content via update()/add(); initialize with content and drawer',
      availability: 'core',
    },
    {
      name: 'children',
      type: 'View[]',
      description:
        'Content then panel via update()/add(); initialize with named slots',
      availability: 'core',
    },
    {
      name: 'children',
      type: 'React.ReactNode',
      description:
        'First view is content, second is the panel; do not mix with named slots',
      availability: 'react',
    },
    {
      name: 'ref',
      type: 'React.Ref<Drawer>',
      description: 'Reference to the underlying Core Drawer',
      availability: 'react',
    },
  ],
  source: {
    react: () => readExampleSource('drawer.react.tsx'),
    core: () => readExampleSource('drawer.core.js'),
  },
  render: {
    react: () => renderSample('drawer.react.tsx'),
    core: () => renderSample('drawer.core.js'),
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
