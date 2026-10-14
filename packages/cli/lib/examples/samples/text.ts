import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 36
const HEIGHT = 11

export const textExample: ComponentExample = {
  name: 'text',
  availability: 'both',
  description:
    'Render styled text with word wrapping, left/center/right alignment, and Unicode fonts',
  props: [
    {
      name: 'text',
      type: 'string',
      description:
        'Core content, also accepted as the constructor string; newlines separate lines. Mutually exclusive with lines; defaults to empty',
      availability: 'core',
    },
    {
      name: 'lines',
      type: 'string[]',
      description: 'Core pre-split content, as an alternative to text',
      availability: 'core',
    },
    {
      name: 'children',
      type: 'React.ReactNode',
      description:
        'React text content, including inline Style elements; text and lines are not React Text props',
      availability: 'react',
    },
    {
      name: 'alignment',
      type: "'left' | 'center' | 'right'",
      description:
        "Horizontal text alignment within the content width; defaults to 'left'",
      availability: 'both',
    },
    {
      name: 'wrap',
      type: 'boolean',
      description:
        'Word-wrap to the content width; long words split when necessary. Defaults to false (clip)',
      availability: 'both',
    },
    {
      name: 'font',
      type: 'FontFamily',
      description:
        "Unicode character mapping, not a terminal font selection; defaults to 'default', with options such as monospace, sans-bold, and double-struck",
      availability: 'both',
    },
    {
      name: 'style',
      type: 'Style',
      description: 'Core text style, constructed with new Style({...})',
      availability: 'core',
    },
    {
      name: 'style',
      type: 'Partial<Style>',
      description:
        'React text style object; its fields override direct styling props and merge with inherited text styles',
      availability: 'react',
    },
    {
      name: 'bold',
      type: 'boolean',
      description: 'React text weight; true takes precedence over dim',
      availability: 'react',
    },
    {
      name: 'dim',
      type: 'boolean',
      description: 'React dim text; mutually exclusive with bold',
      availability: 'react',
    },
    {
      name: 'italic',
      type: 'boolean',
      description: 'React italic text',
      availability: 'react',
    },
    {
      name: 'underline',
      type: 'boolean',
      description: 'React underlined text',
      availability: 'react',
    },
    {
      name: 'strikeout',
      type: 'boolean',
      description: 'React strikethrough text; the prop name is strikeout',
      availability: 'react',
    },
    {
      name: 'inverse',
      type: 'boolean',
      description: 'React reversed foreground and background colors',
      availability: 'react',
    },
    {
      name: 'blink',
      type: 'boolean',
      description:
        'Accepted React style field, but the current serializer does not emit blink codes',
      availability: 'react',
    },
    {
      name: 'invisible',
      type: 'boolean',
      description:
        'Accepted React style field, but the current serializer does not emit conceal codes',
      availability: 'react',
    },
    {
      name: 'foreground',
      type: 'Color',
      description:
        'React text color: named color, #rrggbb, RGB tuple, {sgr}, or {grayscale}',
      availability: 'react',
    },
    {
      name: 'background',
      type: 'Color',
      description:
        'React background color; accepts the same forms as foreground',
      availability: 'react',
    },
    {
      name: 'link',
      type: 'string',
      description: 'React OSC 8 hyperlink URI; terminal support varies',
      availability: 'react',
    },
    {
      name: 'linkParams',
      type: 'string',
      description: 'React OSC 8 parameters, for example id=text-example',
      availability: 'react',
    },
    {
      name: 'width',
      type: 'Dimension',
      description:
        'Inherited width in columns or fill/shrink/natural; determines the wrapping and alignment area',
      availability: 'both',
    },
    {
      name: 'height',
      type: 'Dimension',
      description: 'Inherited height in rows or fill/shrink/natural',
      availability: 'both',
    },
    {
      name: 'ref',
      type: 'React.Ref<React.ComponentRef<typeof Text>>',
      description:
        'Reference to the React text provider, not an underlying Core Text',
      availability: 'react',
    },
  ],
  source: {
    core: () => readExampleSource('text.core.js'),
    react: () => readExampleSource('text.react.tsx'),
  },
  render: {
    core: () => renderSample('text.core.js'),
    react: () => renderSample('text.react.tsx'),
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
