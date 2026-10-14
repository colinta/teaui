import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 30
const HEIGHT = 12

export const dropdownExample: ComponentExample = {
  name: 'dropdown',
  availability: 'both',
  description:
    'Choose generic values from a single- or multiple-selection modal',
  props: [
    {
      name: 'choices',
      type: '[string, T][]',
      description:
        'Required label/value pairs; T is the value type, matched by strict equality',
      availability: 'both',
    },
    {
      name: 'title',
      type: 'string',
      description:
        'Placeholder when nothing is selected; defaults to <select>, not a permanent label',
      availability: 'both',
    },
    {
      name: 'multiple',
      type: 'boolean',
      description:
        'Defaults to false; true enables checkboxes and array values. Choose the mode at construction (Core generic M); do not toggle it in updates',
      availability: 'both',
    },
    {
      name: 'selected',
      type: 'M extends true ? readonly T[] : T | undefined',
      description:
        'Core constructor: required array when multiple is true (use [] for none); optional scalar otherwise',
      availability: 'core',
    },
    {
      name: 'selected',
      type: 'T | readonly T[]',
      description:
        'React: scalar when multiple is false or omitted; array when true. Optional in React types, but multiple mode needs an array at runtime (use [] for none)',
      availability: 'react',
    },
    {
      name: 'onSelect',
      type: 'M extends true ? (values: T[]) => void : (value: T) => void',
      description:
        'Optional Core callback; multiple selects pass an array and keep the modal open, single selects pass T and close it',
      availability: 'core',
    },
    {
      name: 'onSelect',
      type: '((value: T) => void) | ((values: T[]) => void)',
      description:
        'Optional React callback determined by multiple; update selected state with T or T[]. Multiple mode keeps the modal open',
      availability: 'react',
    },
    {
      name: 'purpose',
      type: 'Palette | Purpose',
      description: 'Semantic palette for the control and its selection modal',
      availability: 'both',
    },
    {
      name: 'width',
      type: 'Dimension',
      description:
        'Control width; naturally the displayed text plus eight columns',
      availability: 'both',
    },
    {
      name: 'height',
      type: 'Dimension',
      description: 'Control height; naturally the displayed text line count',
      availability: 'both',
    },
  ],
  source: {
    core: () => readExampleSource('dropdown.core.js'),
    react: () => readExampleSource('dropdown.react.tsx'),
  },
  render: {
    core: () => renderSample('dropdown.core.js'),
    react: () => renderSample('dropdown.react.tsx'),
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
