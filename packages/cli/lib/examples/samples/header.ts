import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 48
const HEIGHT = 19

export const headerExample: ComponentExample = {
  name: 'header',
  availability: 'both',
  description:
    'Configurable Header with custom borders, fonts, and emphasis, plus H1–H6 presets',
  props: [
    {
      name: 'text',
      type: 'string',
      description:
        'Heading text: required by the Core Header constructor, optional in React when supplied as a child, and optional for H1–H6 presets',
      availability: 'both',
    },
    {
      name: 'children',
      type: 'string',
      description:
        'React Header and H1–H6 accept heading text as a string child; children take precedence over text',
      availability: 'react',
    },
    {
      name: 'border',
      type: "'none' | 'single' | 'bold' | 'double'",
      description:
        'Header border style. H1 uses double, H2 bold, H3–H5 single, and H6 none',
      availability: 'both',
    },
    {
      name: 'font',
      type: 'FontFamily',
      description:
        'Header Unicode font family; defaults to the terminal font and is not configurable on H1–H6 presets',
      availability: 'both',
    },
    {
      name: 'bold',
      type: 'boolean',
      description:
        'Header ANSI bold emphasis; enabled by H1–H3 and otherwise unset in the presets',
      availability: 'both',
    },
    {
      name: 'dim',
      type: 'boolean',
      description:
        'Header ANSI dim emphasis; enabled by H5–H6 and otherwise unset in the presets',
      availability: 'both',
    },
    {
      name: 'ref',
      type: 'React.Ref<Header>',
      description: 'Reference to the underlying Core Header of React H1–H6',
      availability: 'react',
    },
  ],
  source: {
    core: () => readExampleSource('header.core.js'),
    react: () => readExampleSource('header.react.tsx'),
  },
  render: {
    core: () => renderSample('header.core.js'),
    react: () => renderSample('header.react.tsx'),
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
