import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 32
const HEIGHT = 9

export const toggleExample: ComponentExample = {
  name: 'toggle',
  availability: 'both',
  description:
    'Animated boolean switch in normal or compact form; click, or Tab to focus and press Space or Enter. Uses fixed gray/green track colors and a white slider',
  props: [
    {
      name: 'value',
      type: 'boolean',
      description:
        'Defaults to false. Core value assignment invalidates rendering without calling onChange; React can keep value in state. Changes animate the slider over 120 ms',
      availability: 'both',
    },
    {
      name: 'onChange',
      type: '(value: boolean) => void',
      description:
        'Called with the new boolean after a left click or focused Space/Enter toggles the internal value. Update React state here for a controlled toggle',
      availability: 'both',
    },
    {
      name: 'isEnabled',
      type: 'boolean',
      description:
        'Defaults to true; when false the toggle is drawn dimmed and ignores input. It keeps focus, but does not draw the focus style. In a Form, it is also disabled while the form is submitting',
      availability: 'both',
    },
    {
      name: 'formName',
      type: 'string',
      description:
        "The name of this input's value in its Form; defaults to '' (not part of the form). Reported as a boolean FormField",
      availability: 'both',
    },
    {
      name: 'width',
      type: 'Dimension',
      description:
        'Width in columns or fill/shrink/natural; naturally 6. The drawing stays six columns wide rather than stretching to fill a larger width',
      availability: 'both',
    },
    {
      name: 'height',
      type: 'Dimension',
      description:
        'Height in rows or fill/shrink/natural; naturally 2. One content row selects compact rendering; additional rows do not stretch the two-row drawing',
      availability: 'both',
    },
    {
      name: 'ref',
      type: 'React.Ref<Toggle>',
      description: 'Reference to the underlying Core Toggle',
      availability: 'react',
    },
  ],
  source: {
    core: () => readExampleSource('toggle.core.js'),
    react: () => readExampleSource('toggle.react.tsx'),
  },
  render: {
    core: () => renderSample('toggle.core.js'),
    react: () => renderSample('toggle.react.tsx'),
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
