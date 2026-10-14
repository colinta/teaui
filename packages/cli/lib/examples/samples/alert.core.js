import {Alert, Screen, Stack, Text} from '@teaui/core'

const editor = Stack.down({
  children: [
    new Text({text: 'Document editor'}),
    new Alert({
      visible: true,
      title: 'Unsaved changes',
      purpose: 'secondary',
      children: [new Text({text: 'Save before closing this document.'})],
    }),
  ],
})

await Screen.start(editor)
