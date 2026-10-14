import {Callout, Screen, Text} from '@teaui/core'

const callout = new Callout({
  title: 'Note',
  purpose: 'primary',
  children: [new Text({text: 'Remember to save your work.'})],
})

await Screen.start(callout)
