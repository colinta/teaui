import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 48
const HEIGHT = 3

export const hotkeyExample: ComponentExample = {
  name: 'hotkey',
  availability: 'both',
  description:
    'Register a non-visual keyboard shortcut without requiring focus; optional labels appear in AutoLegend',
  props: [
    {
      name: 'hotKey',
      type: 'HotKeyProp',
      description:
        "Required FullKeyName string (such as 'x' or 'C-r') or HotKeyDef object with char and optional ctrl, alt, gui, shift booleans; string modifier prefixes are C-, A-, G-, S-",
      availability: 'both',
    },
    {
      name: 'label',
      type: 'string',
      description:
        'Optional AutoLegend hint; HotKey itself draws nothing and has zero natural size, with or without a label',
      availability: 'both',
    },
    {
      name: 'onPress',
      type: '(event: KeyEvent) => void',
      description:
        'Optional callback receiving the matching keyboard event, including its full key name and modifiers; no focused control is needed',
      availability: 'both',
    },
    {
      name: 'ref',
      type: 'React.Ref<HotKey>',
      description: 'Reference to the underlying Core HotKey',
      availability: 'react',
    },
  ],
  source: {
    core: () => readExampleSource('hotkey.core.js'),
    react: () => readExampleSource('hotkey.react.tsx'),
  },
  render: {
    core: () => renderSample('hotkey.core.js'),
    react: () => renderSample('hotkey.react.tsx'),
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
