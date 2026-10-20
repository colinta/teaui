import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 36
const HEIGHT = 19

export const inputExample: ComponentExample = {
  name: 'input',
  availability: 'both',
  description:
    'Editable text with selection, undo/redo, wrapping, multiline editing, display-only formatting, and secret (password) masking',
  props: [
    {
      name: 'value',
      type: 'string',
      description:
        'Initial/current text, defaulting to empty; Core stores edits internally, while React should update its value prop in onChange. Newlines become spaces unless multiline is true',
      availability: 'both',
    },
    {
      name: 'placeholder',
      type: 'string',
      description: 'Hint shown only when value is empty; defaults to empty',
      availability: 'both',
    },
    {
      name: 'wrap',
      type: 'boolean',
      description:
        'Defaults to false; wraps at terminal-cell boundaries without changing value. Independent of multiline: a single logical line can occupy several visual rows',
      availability: 'both',
    },
    {
      name: 'multiline',
      type: 'boolean',
      description:
        'Defaults to false; preserves newlines and makes Enter insert a newline with the current indentation instead of submitting',
      availability: 'both',
    },
    {
      name: 'font',
      type: 'FontFamily',
      description:
        'Unicode display font (for example double-struck); defaults to default and does not change the stored value',
      availability: 'both',
    },
    {
      name: 'format',
      type: '(text: string) => string',
      description:
        'Optional display-only ANSI styling function; return the same text with SGR escapes, not replacement characters. Does not change value and is not applied to the placeholder',
      availability: 'both',
    },
    {
      name: 'secret',
      type: 'boolean',
      description:
        "Defaults to false; masks every character as '•' for passwords while value stays the real text. Forces single-line without wrapping, ignores format, and word movement treats the value as one word. The placeholder is not masked",
      availability: 'both',
    },
    {
      name: 'onChange',
      type: '(text: string) => void',
      description:
        'Called when user editing changes the text, including paste and undo/redo; not called by assigning the Core value property',
      availability: 'both',
    },
    {
      name: 'onSubmit',
      type: '(text: string) => void',
      description:
        'Called with the current value on Enter only when multiline is false; wrapping does not disable submission',
      availability: 'both',
    },
    {
      name: 'purpose',
      type: 'Palette | Purpose',
      description: 'Semantic palette for the input, focus, and selection',
      availability: 'both',
    },
    {
      name: 'width',
      type: 'Dimension',
      description:
        'Viewport width in columns or fill/shrink/natural; determines wrapping or horizontal scrolling',
      availability: 'both',
    },
    {
      name: 'height',
      type: 'Dimension',
      description:
        'Viewport height in rows or fill/shrink/natural; allow extra rows for wrapped or multiline text',
      availability: 'both',
    },
    {
      name: 'ref',
      type: 'React.Ref<Input>',
      description: 'Reference to the underlying Core Input',
      availability: 'react',
    },
  ],
  source: {
    core: () => readExampleSource('input.core.js'),
    react: () => readExampleSource('input.react.tsx'),
  },
  render: {
    core: () => renderSample('input.core.js'),
    react: () => renderSample('input.react.tsx'),
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
