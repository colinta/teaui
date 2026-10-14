import {Pane, Screen, Stack, Text} from '@teaui/core'

const examples = Stack.down({
  width: 44,
  height: 8,
  children: [
    new Pane({
      border: true,
      collapsible: true,
      width: 44,
      height: 5,
      children: [
        new Text({text: 'Folders\nInbox\nDrafts'}),
        new Text({text: 'Files\nOne.txt\nTwo.txt'}),
        new Text({
          text: 'Preview\nSelected message\nDrag separators to resize',
        }),
      ],
    }),
    new Pane({
      border: false,
      collapsible: false,
      width: 44,
      height: 3,
      children: [
        new Text({text: 'Pinned\nHome\nHelp'}),
        new Text({
          text: 'Non-collapsible\nClick keeps the sidebar open\nDrag minimum: 4 columns',
        }),
      ],
    }),
  ],
})

await Screen.start(examples)
