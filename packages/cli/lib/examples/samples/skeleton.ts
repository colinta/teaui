import {readFileSync} from 'node:fs'
import {Screen, Skeleton} from '@teaui/core'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 44
const HEIGHT = 13

export const skeletonExample: ComponentExample = {
  name: 'skeleton',
  availability: 'both',
  description:
    'Animated grayscale loading placeholders in five shapes; the captured output shows the initial frame of the automatic three-second pulse',
  props: [
    {
      name: 'shape',
      type: "'rect' | 'circle' | 'rounded-rect' | 'row' | 'column'",
      description:
        'Defaults to rect. Rounded rectangles omit their four corner cells; circle uses cell-aspect-corrected curved edges (use width twice the height for a circle). Core shape assignment invalidates sizing; React updates the shape prop',
      availability: 'both',
    },
    {
      name: 'width',
      type: 'Dimension',
      description:
        'Width in columns or fill/shrink/natural; naturally fills the available width except column, which is one column wide. Explicit dimensions override the natural size',
      availability: 'both',
    },
    {
      name: 'height',
      type: 'Dimension',
      description:
        'Height in rows or fill/shrink/natural; naturally fills the available height except row, which is one row tall. Explicit dimensions override the natural size',
      availability: 'both',
    },
    {
      name: 'ref',
      type: 'React.Ref<Skeleton>',
      description: 'Reference to the underlying Core Skeleton',
      availability: 'react',
    },
  ],
  source: {
    core: () => readExampleSource('skeleton.core.js'),
    react: () => readExampleSource('skeleton.react.tsx'),
  },
  render: {
    core: () => renderSample('skeleton.core.js'),
    react: () => renderSample('skeleton.react.tsx'),
  },
}

function readExampleSource(filename: string): string {
  return readFileSync(
    new URL(`./${filename}`, import.meta.url),
    'utf8',
  ).trimEnd()
}

async function renderSample(filename: string): Promise<string> {
  // Freeze only Skeleton's capture-time tick registration at elapsed = 0.
  // Standalone samples still animate normally. Like captureExample's temporary
  // Screen.start replacement, this hook must not be used concurrently.
  const registerTick = Screen.prototype.registerTick
  Screen.prototype.registerTick = function (view) {
    if (!(view instanceof Skeleton)) {
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
