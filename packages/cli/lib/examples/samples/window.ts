import {readFileSync} from 'node:fs'

import {captureExample} from './capture.js'
import type {ComponentExample} from './types.js'

const WIDTH = 44
const HEIGHT = 10

export const windowExample: ComponentExample = {
  name: 'window',
  availability: 'both',
  description:
    'A movable, resizable window with a title bar, close/minimize/maximize buttons, and title bar views. The active window has a double border',
  props: [
    {
      name: 'title',
      type: 'string',
      description:
        "Drawn in the title bar with a space on each side, underlined, and truncated with an ellipsis when it doesn't fit",
      availability: 'both',
    },
    {
      name: 'titleBar',
      type: 'View[]',
      description:
        'Core views drawn in the title bar, to the right of the title and left of the buttons, each at its natural width',
      availability: 'core',
    },
    {
      name: 'titleBar',
      type: 'React.ReactNode',
      description:
        'React content drawn in the title bar, to the right of the title and left of the buttons',
      availability: 'react',
    },
    {
      name: 'showClose',
      type: 'boolean',
      description: 'Show the close button on the left; defaults to true',
      availability: 'both',
    },
    {
      name: 'showMinimize',
      type: 'boolean',
      description: 'Show the minimize button on the right; defaults to true',
      availability: 'both',
    },
    {
      name: 'showMaximize',
      type: 'boolean',
      description: 'Show the maximize button on the right; defaults to true',
      availability: 'both',
    },
    {
      name: 'resizable',
      type: 'boolean',
      description:
        'Drag the borders to resize; defaults to true. Outside a Desktop only the right and bottom borders resize',
      availability: 'both',
    },
    {
      name: 'movable',
      type: 'boolean',
      description:
        'Drag the title bar to move; defaults to true. Only windows in a Desktop can move',
      availability: 'both',
    },
    {
      name: 'isMinimized',
      type: 'boolean',
      description:
        'Collapse to a one-row title bar with only the title and a restore button (↔), which is always shown, even when showMinimize is false. In a Desktop, minimized windows are lined up along the bottom and cannot be moved or resized. Applied when the prop changes, so re-renders keep the user toggling it',
      availability: 'both',
    },
    {
      name: 'isMaximized',
      type: 'boolean',
      description:
        'Fill the parent. Applied when the prop changes, so re-renders keep the user toggling it',
      availability: 'both',
    },
    {
      name: 'x',
      type: 'number',
      description:
        'Column of the window in its Desktop. Applied when the prop changes; cascaded when unset',
      availability: 'both',
    },
    {
      name: 'y',
      type: 'number',
      description:
        'Row of the window in its Desktop. Applied when the prop changes; cascaded when unset',
      availability: 'both',
    },
    {
      name: 'width',
      type: 'number',
      description:
        'Width including the border; defaults to the content width. Applied when the prop changes',
      availability: 'both',
    },
    {
      name: 'height',
      type: 'number',
      description:
        'Height including the border; defaults to the content height. Applied when the prop changes',
      availability: 'both',
    },
    {
      name: 'minWidth',
      type: 'number',
      description:
        'Used when larger than the absolute minimum: 2 + 3 per button + 6 for a title + the title bar views',
      availability: 'both',
    },
    {
      name: 'minHeight',
      type: 'number',
      description: 'Used when larger than the absolute minimum of 2 rows',
      availability: 'both',
    },
    {
      name: 'maxWidth',
      type: 'number',
      description: 'Largest width the window can be resized to',
      availability: 'both',
    },
    {
      name: 'maxHeight',
      type: 'number',
      description: 'Largest height the window can be resized to',
      availability: 'both',
    },
    {
      name: 'onClose',
      type: '() => void',
      description:
        'Called by the close button. Without it the window removes itself; React apps should stop rendering the window',
      availability: 'both',
    },
    {
      name: 'onMinimize',
      type: '(isMinimized: boolean) => void',
      description:
        'Called after the minimize or restore button changes isMinimized',
      availability: 'both',
    },
    {
      name: 'onMaximize',
      type: '(isMaximized: boolean) => void',
      description: 'Called after the maximize button toggles isMaximized',
      availability: 'both',
    },
    {
      name: 'onMove',
      type: '(position: Point) => void',
      description: 'Called after the user moves the window',
      availability: 'both',
    },
    {
      name: 'onResize',
      type: '(size: Size) => void',
      description: 'Called after the user resizes the window',
      availability: 'both',
    },
    {
      name: 'onActivate',
      type: '() => void',
      description:
        'Called when the window becomes active: pressed, or a view inside it is pressed or focused',
      availability: 'both',
    },
    {
      name: 'child',
      type: 'View',
      description: 'Single content view',
      availability: 'core',
    },
    {
      name: 'children',
      type: 'View[]',
      description:
        'Content views, layered inside the border; a Window.TitleBar child holds title bar views',
      availability: 'core',
    },
    {
      name: 'children',
      type: 'React.ReactNode',
      description: 'Content, layered inside the border',
      availability: 'react',
    },
    {
      name: 'ref',
      type: 'React.Ref<Window>',
      description:
        'Reference to the Core Window: position, minimumSize, isActive, activate()',
      availability: 'react',
    },
  ],
  source: {
    core: () => readExampleSource('window.core.js'),
    react: () => readExampleSource('window.react.tsx'),
  },
  render: {
    core: () => renderSample('window.core.js'),
    react: () => renderSample('window.react.tsx'),
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
