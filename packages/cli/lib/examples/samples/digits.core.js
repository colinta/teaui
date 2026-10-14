import {Digits, Screen, Stack, Style} from '@teaui/core'

const digits = Stack.down({
  gap: 1,
  children: [
    new Digits({text: 'tea\n3.14'}),
    new Digits({
      text: 2026,
      bold: true,
      style: new Style({foreground: 'cyan'}),
    }),
  ],
})

await Screen.start(digits)
