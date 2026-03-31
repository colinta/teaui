import {
  AutoLegend,
  Box,
  HotKey,
  Keyboard,
  Mouse,
  Stack,
  Text,
  type FullKeyName,
} from '@teaui/core'
import type {KeyEvent, MouseEvent} from '@teaui/core'

import {demo} from './demo.js'

// This demo tests that HotKey components work with various modifier combinations,
// and shows a live keyboard/mouse event log on the right side.
//
// Left panel: HotKey counter demo
// Right panel: Raw event log (keyboard + mouse location)

// ─── Event Log (right panel) ────────────────────────────────────────────────

const MAX_LOG_LINES = 30

const mouseLocationText = new Text({text: 'Mouse: -'})
const eventLogText = new Text({text: '(press keys or move mouse)'})
const logLines: string[] = []

function addLogLine(line: string) {
  logLines.push(line)
  if (logLines.length > MAX_LOG_LINES) {
    logLines.shift()
  }
  eventLogText.text = logLines.join('\n')
}

function formatKeyEvent(event: KeyEvent): string {
  const mods: string[] = []
  if (event.ctrl) mods.push('ctrl')
  if (event.gui) mods.push('gui')
  if (event.shift) mods.push('shift')
  const modStr = mods.length ? mods.join('+') + '+' : ''
  return `KEY ${modStr}${event.name} (char=${JSON.stringify(event.char)}, full=${event.full})`
}

function formatMouseEvent(event: MouseEvent): string {
  const mods: string[] = []
  if (event.ctrl) mods.push('ctrl')
  if (event.gui) mods.push('gui')
  if (event.shift) mods.push('shift')
  const modStr = mods.length ? ' ' + mods.join('+') : ''
  return `MOUSE ${event.name} btn=${event.button} (${event.position.x},${event.position.y})${modStr}`
}

// ─── HotKey Counters (left panel) ───────────────────────────────────────────

interface HotKeyEntry {
  label: string
  hotKey: FullKeyName
}

const entries: HotKeyEntry[] = [
  {label: '1', hotKey: '1'},
  {label: '2', hotKey: '2'},
  {label: '3', hotKey: '3'},
  {label: 'enter', hotKey: 'return'},
  {label: 'A-enter', hotKey: 'A-return'},
  {label: 'S-enter', hotKey: 'S-return'},
  {label: 'C-a', hotKey: 'C-a'},
  {label: 'C-b', hotKey: 'C-b'},
  {label: 'A-x', hotKey: 'A-x'},
  {label: 'A-z', hotKey: 'A-z'},
  {label: 'C-A-d', hotKey: 'C-A-d'},
  {label: 'C-A-l', hotKey: 'C-A-l'},
  {label: 'C-A-return', hotKey: 'C-A-return'},
  {label: 'C-S-backspace', hotKey: 'C-S-backspace'},
  {label: 'G-y', hotKey: 'G-y'},
  {label: 'r', hotKey: 'r'},
]

const counts: number[] = entries.map(() => 0)
const texts: Text[] = entries.map(
  (e, i) =>
    new Text({
      text:
        e.hotKey === 'r'
          ? `[${e.label}] reset`
          : `[${e.label}] pressed: ${counts[i]}`,
    }),
)

function update() {
  entries.forEach((e, i) => {
    if (e.hotKey !== 'r') {
      texts[i].text = `[${e.label}] pressed: ${counts[i]}`
    }
  })
}

const textInfo = new Text({
  text: 'Press key combos to increment counters.\nPress r to reset. Press q to quit.\n\nWith CSI u, shift+enter and alt+enter\nare now distinguishable!',
})

const hotKeyChildren: (Text | HotKey | Box)[] = [
  new Box({border: 'single', child: textInfo}),
]

entries.forEach((e, i) => {
  hotKeyChildren.push(texts[i])
  hotKeyChildren.push(
    new HotKey({
      hotKey: e.hotKey,
      label: e.label,
      onPress: () => {
        if (e.hotKey === 'r') {
          counts.fill(0)
          update()
        } else {
          counts[i]++
          update()
        }
      },
    }),
  )
})

const leftPanel = new Box({
  border: 'single',
  child: Stack.down(hotKeyChildren),
})

// ─── Right Panel: Event Log ─────────────────────────────────────────────────

const rightPanel = new Box({
  border: 'single',
  child: new Keyboard({
    onKey: (event: KeyEvent) => {
      addLogLine(formatKeyEvent(event))
    },
    children: [
      new Mouse({
        mouse: ['mouse.button.all', 'mouse.wheel', 'mouse.move'],
        onMouse: (event: MouseEvent) => {
          mouseLocationText.text = `Mouse: (${event.position.x}, ${event.position.y}) ${event.button} ${event.name}`
          // Only log clicks and wheel, not every move
          if (!event.name.startsWith('mouse.move.')) {
            addLogLine(formatMouseEvent(event))
          }
        },
        children: [
          Stack.down([
            mouseLocationText,
            new Text({text: '─'.repeat(40)}),
            new Text({text: 'Event Log:'}),
            eventLogText,
          ]),
        ],
      }),
    ],
  }),
})

// ─── Layout ─────────────────────────────────────────────────────────────────

demo(
  Stack.down([
    [
      'flex1',
      Stack.right([
        ['flex1', leftPanel],
        ['flex1', rightPanel],
      ]),
    ],
    new AutoLegend(),
  ]),
)
