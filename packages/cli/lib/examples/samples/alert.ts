import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 48
const HEIGHT = 11

export const alertExample: ComponentExample = {
  name: 'alert',
  availability: 'both',
  description: 'Show a centered modal notification in a rounded box',
  props: [
    {
      name: 'title',
      type: 'string',
      description:
        'Bold title above a separator; defaults to the first child heading. Empty string hides it',
      availability: 'both',
    },
    {
      name: 'purpose',
      type: "'primary' | 'blue' | 'secondary' | 'orange' | 'proceed' | 'green' | 'cancel' | 'red' | 'selected' | 'plain'",
      description: 'Named color palette for the notification content',
      availability: 'both',
    },
    {
      name: 'direction',
      type: "'up' | 'down' | 'left' | 'right'",
      description:
        "Layout direction for the title and body; defaults to 'down'",
      availability: 'both',
    },
    {
      name: 'visible',
      type: 'boolean',
      description: 'Present the modal overlay; defaults to false',
      availability: 'both',
    },
    {
      name: 'dim',
      type: 'boolean',
      description: 'Dim the background behind the alert; defaults to true',
      availability: 'both',
    },
    {
      name: 'dismissOnEsc',
      type: 'boolean',
      description: 'Dismiss when Escape is pressed; defaults to true',
      availability: 'both',
    },
    {
      name: 'dismissOnClick',
      type: 'boolean',
      description: 'Dismiss on a background click; defaults to true',
      availability: 'both',
    },
    {
      name: 'onDismiss',
      type: '() => void',
      description:
        'Called on dismissal via Escape, background click, or Core dismiss()',
      availability: 'both',
    },
    {
      name: 'child',
      type: 'View',
      description:
        'Single body view; takes precedence over constructor children',
      availability: 'core',
    },
    {
      name: 'children',
      type: 'View[]',
      description: 'Body views arranged in the selected direction',
      availability: 'core',
    },
    {
      name: 'children',
      type: 'React.ReactNode',
      description: 'Body content arranged in the selected direction',
      availability: 'react',
    },
  ],
  source: {
    react: () => readExampleSource('alert.react.tsx'),
    core: () => readExampleSource('alert.core.js'),
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
  return renderSample('alert.react.tsx')
}

function renderCore(): Promise<string> {
  return renderSample('alert.core.js')
}

function renderSample(filename: string): Promise<string> {
  return captureExample(new URL(`./${filename}`, import.meta.url), {
    width: WIDTH,
    height: HEIGHT,
  })
}
