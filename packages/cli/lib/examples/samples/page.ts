import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 36
const HEIGHT = 11

export const pageExample: ComponentExample = {
  name: 'page',
  availability: 'both',
  description:
    'Show one section at a time with sliding transitions and clickable dots; navigate with PageUp, PageDown, Home, End, or the scroll wheel',
  props: [
    {
      name: 'activeIndex',
      type: 'number',
      description:
        'Zero-based active section (default 0); navigation clamps to existing sections. Set after sections are attached using the Core setter or React ref',
      availability: 'both',
    },
    {
      name: 'onChange',
      type: '(index: number) => void',
      description:
        'Called with the new index when navigation changes the active section, not when the slide finishes',
      availability: 'both',
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
        'One section view; plain views become implicit sections using their heading',
      availability: 'core',
    },
    {
      name: 'children',
      type: 'View[]',
      description:
        'Page.Section or plain views; plain views become implicit sections using their heading',
      availability: 'core',
    },
    {
      name: 'children',
      type: 'React.ReactNode',
      description:
        'Page.Section or plain view children; a plain view uses its heading as the section title',
      availability: 'react',
    },
    {
      name: 'ref',
      type: 'React.Ref<Page>',
      description:
        'Reference to the underlying Core Page for activeIndex and other public APIs',
      availability: 'react',
    },
    {
      name: 'Section.title',
      type: 'string',
      description:
        "Active or hovered dot's title; omitted titles fall back to the first child's heading. An empty string suppresses that fallback; any nonempty section title adds a title row",
      availability: 'both',
    },
    {
      name: 'Section.child',
      type: 'View',
      description: 'Single section content view',
      availability: 'core',
    },
    {
      name: 'Section.children',
      type: 'View[]',
      description:
        'Overlapping section content views; use a Stack for sequential layout',
      availability: 'core',
    },
    {
      name: 'Section.children',
      type: 'React.ReactNode',
      description: 'Section content; use a Stack for sequential layout',
      availability: 'react',
    },
    {
      name: 'Section.ref',
      type: 'React.Ref<InstanceType<typeof Page.Section>>',
      description: 'Reference to the underlying Core section',
      availability: 'react',
    },
  ],
  source: {
    core: () => readExampleSource('page.core.js'),
    react: () => readExampleSource('page.react.tsx'),
  },
  render: {
    core: () => renderSample('page.core.js'),
    react: () => renderSample('page.react.tsx'),
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
