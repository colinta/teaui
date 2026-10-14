import {AutoLegend, HotKey, Input, Screen, Stack, ZStack} from '@teaui/core'

const view = Stack.down({
  width: 48,
  height: 4,
  gap: 1,
  children: [
    new ZStack({
      children: [
        new Input({value: 'Search docs'}),
        // Screen.start already binds Ctrl+C to quit.
        new HotKey({hotKey: 'C-c', label: 'Quit'}),
      ],
    }),
    new AutoLegend(),
  ],
})

await Screen.start(view)
