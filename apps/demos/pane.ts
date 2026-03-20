import {Button, Checkbox, Pane, Stack, Text} from '@teaui/core'

import {demo} from './demo.js'

const detail = new Text({
  text: 'Select an item from the sidebar.',
  wrap: true,
})

const items = [
  {name: 'Inbox', count: 12},
  {name: 'Drafts', count: 3},
  {name: 'Sent', count: 47},
  {name: 'Archive', count: 231},
  {name: 'Trash', count: 8},
  {name: 'Spam', count: 42},
  {name: 'Starred', count: 5},
  {name: 'Important', count: 19},
  {name: 'Work', count: 64},
  {name: 'Personal', count: 15},
]

const sidebar = Stack.down(
  items.map(
    item =>
      new Button({
        title: item.name,

        border: 'none',
        onClick() {
          detail.text = `${item.name}\n\n${item.count} messages\n\nThis is the detail view for "${item.name}". Drag the separator to resize, or click it to collapse.`
        },
      }),
  ),
)

const pane = new Pane({
  border: true,
  children: [sidebar, detail],
})

const checkbox = new Checkbox({
  title: `Has Border`,
  value: true,
  onChange: value => (pane.border = value),
})

demo(Stack.down([checkbox, pane], {gap: 1}))
