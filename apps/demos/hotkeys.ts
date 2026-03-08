import {Box, Button, HotKey, Stack, Text} from '@teaui/core'

import {demo} from './demo.js'

// This demo tests that HotKey components work with various modifier combinations.
// Press the indicated key combinations to increment counters.
//
// Note: Shift+letter hotkeys don't work in most terminals because the terminal
// sends the uppercase letter without a shift flag. Ctrl+Shift combinations
// have the same limitation. Use Ctrl, Alt/Meta, and Ctrl+Alt combos instead.

interface HotKeyEntry {
  label: string
  hotKey: string
}

const entries: HotKeyEntry[] = [
  // Simple keys
  {label: '1', hotKey: '1'},
  {label: '2', hotKey: '2'},
  {label: '3', hotKey: '3'},
  // Enter variants (Ctrl+Enter and Shift+Enter are indistinguishable from
  // plain Enter in most terminals — all send 0x0D. Alt+Enter works via ESC prefix.)
  {label: 'enter', hotKey: 'return'},
  {label: 'M-enter', hotKey: 'M-return'},
  // Ctrl
  {label: 'C-a', hotKey: 'C-a'},
  {label: 'C-b', hotKey: 'C-b'},
  {label: 'C-e', hotKey: 'C-e'},
  // Alt/Meta
  {label: 'M-x', hotKey: 'M-x'},
  {label: 'M-z', hotKey: 'M-z'},
  {label: 'M-j', hotKey: 'M-j'},
  // Ctrl+Alt
  {label: 'C-M-d', hotKey: 'C-M-d'},
  {label: 'C-M-l', hotKey: 'C-M-l'},
  {label: 'C-M-n', hotKey: 'C-M-n'},
  // Reset
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
  text: 'No focusable inputs — HotKeys should still work.\nPress the key combinations below to increment counters.\nPress r to reset all.',
})

const children: (Text | HotKey | Box)[] = [
  new Box({border: 'single', child: textInfo}),
]

entries.forEach((e, i) => {
  children.push(texts[i])
  children.push(
    new HotKey({
      hotKey: e.hotKey,
      onPress: () => {
        if (e.hotKey === 'r') {
          counts.fill(0)
          update()
          console.log('reset all counters')
        } else {
          counts[i]++
          update()
          console.log(`hotkey ${e.label} fired (count: ${counts[i]})`)
        }
      },
    }),
  )
})

demo(Stack.down(children))
