import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 36
const HEIGHT = 10

export const modalExample: ComponentExample = {
  name: 'modal',
  availability: 'both',
  description:
    'Present an overlay with viewport.requestModal() during render; stop requesting it to dismiss',
  props: [
    {
      name: 'dim',
      type: 'boolean',
      description:
        'Restyle underlying screen cells before drawing content; defaults to false',
      availability: 'both',
    },
    {
      name: 'dimStyle',
      type: 'Style',
      description:
        'Dimming style when dim is true; defaults to purpose scrim text/background colors',
      availability: 'both',
    },
    {
      name: 'dismissOnClick',
      type: 'boolean',
      description:
        'Call onDismiss on outside click; defaults to true, does not hide the modal itself',
      availability: 'both',
    },
    {
      name: 'dismissOnEsc',
      type: 'boolean',
      description: 'Call onDismiss on Escape; defaults to false',
      availability: 'both',
    },
    {
      name: 'onDismiss',
      type: '() => void',
      description:
        'Dismissal callback; the presenting view must stop requesting the modal',
      availability: 'both',
    },
    {
      name: 'width',
      type: 'Dimension',
      description:
        'Inherited width; leave unset to cover the full screen and size the dialog child instead',
      availability: 'both',
    },
    {
      name: 'height',
      type: 'Dimension',
      description:
        'Inherited height; leave unset to cover the full screen and size the dialog child instead',
      availability: 'both',
    },
    {
      name: 'child',
      type: 'View',
      description: 'Single modal content view',
      availability: 'core',
    },
    {
      name: 'children',
      type: 'View[]',
      description: 'Modal content views; use a Box for the dialog surface',
      availability: 'core',
    },
    {
      name: 'children',
      type: 'React.ReactNode',
      description:
        'Modal content; the wrapper is not an automatic portal and needs a presenting view',
      availability: 'react',
    },
    {
      name: 'ref',
      type: 'React.Ref<Modal>',
      description: 'Reference to the underlying Core Modal',
      availability: 'react',
    },
  ],
  source: {
    core: () => readExampleSource('modal.core.js'),
    react: () => readExampleSource('modal.react.tsx'),
  },
  render: {
    core: () => renderSample('modal.core.js'),
    react: () => renderSample('modal.react.tsx'),
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
