import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 40
const HEIGHT = 1

export const breadcrumbExample: ComponentExample = {
  name: 'breadcrumb',
  availability: 'both',
  description: 'Display a navigation path with clickable powerline segments',
  props: [
    {
      name: 'items',
      type: 'BreadcrumbItem[]',
      description: 'Required: items with a title and optional onPress callback',
      availability: 'both',
    },
    {
      name: 'isActive',
      type: 'boolean',
      description: 'Show colored backgrounds; defaults to true',
      availability: 'both',
    },
    {
      name: 'palette',
      type: 'PaletteEntry[]',
      description:
        'Nonempty cycling palette: fg, bg, optional fgHover and bgHover',
      availability: 'both',
    },
    {
      name: 'ref',
      type: 'React.Ref<Breadcrumb>',
      description: 'Reference to the underlying Core Breadcrumb',
      availability: 'react',
    },
  ],
  source: {
    react: () => readExampleSource('breadcrumb.react.tsx'),
    core: () => readExampleSource('breadcrumb.core.js'),
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
  return renderSample('breadcrumb.react.tsx')
}

function renderCore(): Promise<string> {
  return renderSample('breadcrumb.core.js')
}

function renderSample(filename: string): Promise<string> {
  return captureExample(new URL(`./${filename}`, import.meta.url), {
    width: WIDTH,
    height: HEIGHT,
  })
}
