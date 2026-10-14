import {Drawer, Screen, Stack, Text} from '@teaui/core'

const openDrawer = new Drawer({
  location: 'right',
  isOpen: true,
  title: 'Folders',
  hotKey: 'A-d',
  width: 32,
  height: 6,
  content: new Text({text: 'Messages\nPick a folder\nAlt+D toggles'}),
  drawer: new Text({text: 'Inbox\nDrafts\nArchive', width: 12}),
})

const examples = Stack.down({
  width: 32,
  height: 10,
  gap: 1,
  children: [
    openDrawer,
    new Drawer({
      location: 'left',
      hidesWhenClosed: true,
      hotKey: 'A-h',
      title: 'Settings',
      width: 32,
      height: 3,
      content: new Text({
        text: 'Hidden when closed\nAlt+H opens hidden panel\nFull-width content, no chrome',
      }),
      drawer: new Text({text: 'Preferences', width: 12}),
    }),
  ],
})

const [screen] = await Screen.start(examples)

// Measure the panel, then settle its initial animation without a timer.
screen.render()
openDrawer.receiveTick(1000)
screen.render()
