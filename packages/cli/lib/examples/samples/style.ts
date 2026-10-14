import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 56
const HEIGHT = 5

export const styleExample: ComponentExample<'react'> = {
  name: 'style',
  availability: 'react',
  description:
    'Inline text styling with nested inheritance and explicit overrides; use Text for font, alignment, and wrapping',
  props: [
    {
      name: 'bold',
      type: 'boolean',
      description:
        'Bold text; true takes precedence over dim. Omitted flags inherit; false disables an inherited flag',
      availability: 'react',
    },
    {
      name: 'dim',
      type: 'boolean',
      description: 'Dim text; mutually exclusive with bold',
      availability: 'react',
    },
    {
      name: 'italic',
      type: 'boolean',
      description: 'Italic text; omitted inherits, false disables',
      availability: 'react',
    },
    {
      name: 'underline',
      type: 'boolean',
      description: 'Underlined text; omitted inherits, false disables',
      availability: 'react',
    },
    {
      name: 'strikeout',
      type: 'boolean',
      description:
        'Strikethrough text; the prop is strikeout, not strikethrough',
      availability: 'react',
    },
    {
      name: 'inverse',
      type: 'boolean',
      description: 'Reverse foreground and background colors',
      availability: 'react',
    },
    {
      name: 'blink',
      type: 'boolean',
      description:
        'Accepted Style field, but the current inline serializer does not emit blink codes',
      availability: 'react',
    },
    {
      name: 'invisible',
      type: 'boolean',
      description:
        'Accepted Style field, but the current inline serializer does not emit conceal codes',
      availability: 'react',
    },
    {
      name: 'foreground',
      type: 'Color',
      description:
        'Text color: named color, #rrggbb, RGB tuple, {sgr}, or {grayscale}; omitted inherits',
      availability: 'react',
    },
    {
      name: 'background',
      type: 'Color',
      description: 'Background color; accepts the same forms as foreground',
      availability: 'react',
    },
    {
      name: 'link',
      type: 'string',
      description:
        'OSC 8 hyperlink URI; an empty string ends an inherited link. Terminal support varies',
      availability: 'react',
    },
    {
      name: 'linkParams',
      type: 'string',
      description: 'OSC 8 parameters, for example id=style-example',
      availability: 'react',
    },
    {
      name: 'style',
      type: 'Partial<Style>',
      description:
        'Core Style fields merged after direct inline props, so explicit object fields take precedence',
      availability: 'react',
    },
    {
      name: 'children',
      type: 'React.ReactNode',
      description:
        'Inline text and nested Style elements; adjacent text stays in one text run rather than creating separate rows',
      availability: 'react',
    },
    {
      name: 'ref',
      type: 'React.Ref<React.ComponentRef<typeof Style>>',
      description: 'Reference to the React inline text-style provider',
      availability: 'react',
    },
  ],
  source: {
    react: () =>
      readFileSync(
        new URL('./style.react.tsx', import.meta.url),
        'utf8',
      ).trimEnd(),
  },
  render: {
    react: () =>
      captureExample(new URL('./style.react.tsx', import.meta.url), {
        width: WIDTH,
        height: HEIGHT,
      }),
  },
}
