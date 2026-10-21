import {readFileSync} from 'node:fs'
import {Screen, Spinner} from '@teaui/core'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 44
const HEIGHT = 16

export const spinnerExample: ComponentExample = {
  name: 'spinner',
  availability: 'both',
  description:
    'Animated loading indicators in five styles; standalone samples animate normally, while captured output shows the initial frame',
  props: [
    {
      name: 'style',
      type: "'dots' | 'bounce' | 'loop' | 'kitt' | 'snake'",
      description:
        'Defaults to dots. Style options are dots, bounce, loop, kitt, and snake. Changing style resets the frame and elapsed time; Core style assignment invalidates sizing, while React updates the style prop',
      availability: 'both',
    },
    {
      name: 'isAnimating',
      type: 'boolean',
      description:
        'Defaults to true. False pauses on the current frame without hiding or resetting it. Core isAnimating assignment invalidates rendering; React updates the prop',
      availability: 'both',
    },
    {
      name: 'purpose',
      type: 'Palette | Purpose',
      description:
        'Uses the palette accent text color with the default background, even when paused; inherits from its parent, otherwise plain',
      availability: 'both',
    },
    {
      name: 'ref',
      type: 'React.Ref<Spinner>',
      description: 'Reference to the underlying Core Spinner',
      availability: 'react',
    },
  ],
  source: {
    core: () => readExampleSource('spinner.core.js'),
    react: () => readExampleSource('spinner.react.tsx'),
  },
  render: {
    core: () => renderSample('spinner.core.js'),
    react: () => renderSample('spinner.react.tsx'),
  },
}

function readExampleSource(filename: string): string {
  return readFileSync(
    new URL(`./${filename}`, import.meta.url),
    'utf8',
  ).trimEnd()
}

async function renderSample(filename: string): Promise<string> {
  // Freeze only Spinner's capture-time tick registration at frame zero.
  // Samples retain their public isAnimating values and animate when run normally.
  // Like captureExample's Screen.start hook, this must not run concurrently.
  const registerTick = Screen.prototype.registerTick
  Screen.prototype.registerTick = function (view) {
    if (!(view instanceof Spinner)) {
      registerTick.call(this, view)
    }
  }
  try {
    return await captureExample(new URL(`./${filename}`, import.meta.url), {
      width: WIDTH,
      height: HEIGHT,
    })
  } finally {
    Screen.prototype.registerTick = registerTick
  }
}
