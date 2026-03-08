import {Box, Button, HotKey, Stack, Text} from '@teaui/core'

import {demo} from './demo.js'

// This demo tests that HotKey components work regardless of focus state.
// There are no focusable inputs here — only HotKey components and display text.
// Press 1, 2, or 3 to see if the hotkeys fire.
// Press 'r' to reset the counters.

let text1 = new Text({text: '[1] pressed: 0'})
let text2 = new Text({text: '[2] pressed: 0'})
let text3 = new Text({text: '[3] pressed: 0'})
let textR = new Text({text: '[r] reset'})
let textInfo = new Text({
  text: 'No focusable inputs — HotKeys should still work.\nPress 1, 2, 3 to increment counters. Press r to reset.',
})

let count1 = 0
let count2 = 0
let count3 = 0

function update() {
  text1.text = `[1] pressed: ${count1}`
  text2.text = `[2] pressed: ${count2}`
  text3.text = `[3] pressed: ${count3}`
}

demo(
  Stack.down([
    new Box({
      border: 'single',
      child: textInfo,
    }),
    text1,
    new HotKey({
      hotKey: '1',
      onPress: () => {
        count1++
        update()
        console.log(`hotkey 1 fired (count: ${count1})`)
      },
    }),
    text2,
    new HotKey({
      hotKey: '2',
      onPress: () => {
        count2++
        update()
        console.log(`hotkey 2 fired (count: ${count2})`)
      },
    }),
    text3,
    new HotKey({
      hotKey: '3',
      onPress: () => {
        count3++
        update()
        console.log(`hotkey 3 fired (count: ${count3})`)
      },
    }),
    textR,
    new HotKey({
      hotKey: 'r',
      onPress: () => {
        count1 = count2 = count3 = 0
        update()
        console.log('reset all counters')
      },
    }),
  ]),
)
