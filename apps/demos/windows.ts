import {
  AutoLegend,
  Button,
  Desktop,
  type DesktopLayout,
  Input,
  Rect,
  Stack,
  Text,
  ToggleGroup,
  Window,
} from '@teaui/core'

import {demo} from './demo.js'

/**
 * A custom layout plugin: windows side by side, in equal columns. Windows can't
 * be moved or resized. (Minimized windows are arranged by the Desktop, along the
 * bottom, and aren't passed to the layout.)
 */
const columns: DesktopLayout = {
  layout(windows, size) {
    const width = Math.floor(size.width / Math.max(1, windows.length))
    return windows.map((_, index) => {
      const isLast = index === windows.length - 1
      return new Rect(
        [index * width, 0],
        [isLast ? size.width - index * width : width, size.height],
      )
    })
  },
}

const LAYOUTS = ['floating', 'tiled', 'columns'] as const

let windowCount = 0
let saveCount = 0

const desktop = new Desktop({
  children: [
    // non-window children are drawn behind the windows
    new Text({
      lines: [
        'Drag title bars to move windows, and borders to resize them.',
        'Tiled: press ⊞ (bottom-left of the active window) for the keys:',
        '⌥w focus, ⌥m move, ⌥r size, ⌥z fullscreen, ⌥t modal; esc closes.',
      ],
      alignment: 'center',
    }),
  ],
})

function addWindow() {
  const id = ++windowCount
  const saved = new Text({text: 'Not saved yet'})
  const window = new Window({
    title: `Window ${id}`,
    width: 36,
    height: 9,
    onActivate() {
      console.info(`activated: Window ${id}`)
    },
    onMove(position) {
      console.info(`moved: Window ${id} to ${position.x},${position.y}`)
    },
    onResize(size) {
      console.info(`resized: Window ${id} to ${size.width}x${size.height}`)
    },
    titleBar:
      id === 1
        ? [
            new Button({
              title: 'save',
              border: 'none',
              onClick() {
                saved.text = `Saved ${++saveCount} times`
              },
            }),
          ]
        : undefined,
    child: Stack.down({
      padding: 1,
      gap: 1,
      children: [
        id === 1 ? saved : new Text({text: 'Focus the input to raise me'}),
        new Input({placeholder: `Window ${id} input`}),
      ],
    }),
  })
  desktop.add(window)
}

for (let index = 0; index < 3; index++) {
  addWindow()
}

const toolbar = Stack.right({
  gap: 1,
  children: [
    new ToggleGroup({
      titles: [...LAYOUTS],
      selected: [0],
      onChange(index) {
        const layout = LAYOUTS[index]
        desktop.layout = layout === 'columns' ? columns : layout
      },
    }),
    new Button({title: 'New Window', onClick: addWindow}),
    new Button({
      title: 'Restore All',
      onClick() {
        for (const window of desktop.windows) {
          window.isMinimized = false
          window.isMaximized = false
        }
      },
    }),
  ],
})

demo(
  Stack.down({
    children: [toolbar, ['flex1', desktop], new AutoLegend()],
  }),
  5,
)
