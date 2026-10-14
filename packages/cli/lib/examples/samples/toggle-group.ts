import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 36
const HEIGHT = 11

export const toggleGroupExample: ComponentExample = {
  name: 'toggle-group',
  availability: 'both',
  description:
    'Mouse-operated segmented buttons with single or multiple selection. Clicking a selected segment clears it, even in single mode; no built-in keyboard selection',
  props: [
    {
      name: 'titles',
      type: 'string[]',
      description:
        'Required segment labels in index order; supports multiline text. Core can assign titles to rebuild the layout',
      availability: 'both',
    },
    {
      name: 'selected',
      type: 'number[]',
      description:
        'Required zero-based selected indices; use [] for none. Duplicates are removed, but single mode does not normalize the supplied array. Core stores clicks internally; programmatic changes use update with the complete props, not a selected setter. React should keep this array in state',
      availability: 'both',
    },
    {
      name: 'onChange',
      type: '(changed: number, selected: number[]) => void',
      description:
        'Called after a left click with the toggled index and a new array of all selected indices in insertion order. Clearing the last selection yields []. Constructor and prop updates do not notify',
      availability: 'both',
    },
    {
      name: 'multiple',
      type: 'boolean',
      description:
        'Defaults to false: clicking an unselected segment replaces the selection. True adds it to the existing selection. Clicking a selected segment removes it in either mode',
      availability: 'both',
    },
    {
      name: 'direction',
      type: "'horizontal' | 'vertical'",
      description:
        'Defaults to horizontal. Vertical is accepted by the types and measured, but vertical drawing and selection are not implemented; use horizontal',
      availability: 'both',
    },
    {
      name: 'padding',
      type: 'number',
      description:
        'Segment padding defaults to 1 and is clamped to at least 0; adds columns beside labels and, above 1, extra rows. Explicit padding also applies inherited outer View padding',
      availability: 'both',
    },
    {
      name: 'purpose',
      type: 'Palette | Purpose',
      description:
        'Inherited palette for text and selected segment background/foreground colors',
      availability: 'both',
    },
    {
      name: 'width',
      type: 'Dimension',
      description:
        'Width in columns or fill/shrink/natural. Horizontal natural width is the sum of label widths plus two segment paddings and one border per label, plus one final border and any outer padding. A larger width does not stretch segments',
      availability: 'both',
    },
    {
      name: 'height',
      type: 'Dimension',
      description:
        'Height in rows or fill/shrink/natural. With default segment padding, horizontal natural height is the tallest label plus two border rows, before outer padding',
      availability: 'both',
    },
    {
      name: 'ref',
      type: 'React.Ref<ToggleGroup>',
      description: 'Reference to the underlying Core ToggleGroup',
      availability: 'react',
    },
  ],
  source: {
    core: () => readExampleSource('toggle-group.core.js'),
    react: () => readExampleSource('toggle-group.react.tsx'),
  },
  render: {
    core: () => renderSample('toggle-group.core.js'),
    react: () => renderSample('toggle-group.react.tsx'),
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
