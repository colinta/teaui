import {Collapsible, Screen, Stack, Text} from '@teaui/core'

const examples = Stack.down({
  width: 32,
  height: 8,
  gap: 1,
  children: [
    new Collapsible({
      isCollapsed: true,
      preview: 2,
      collapsed: new Text({
        text: 'Two-line preview\nClick to expand\nHidden preview line',
      }),
      expanded: new Text({text: 'Hidden expanded content'}),
    }),
    new Collapsible({
      isCollapsed: false,
      collapsed: new Text({text: 'Replaced preview'}),
      expanded: new Text({text: 'Expanded content\nClick to collapse'}),
    }),
    new Collapsible({
      isCollapsed: false,
      showCollapsed: true,
      collapsed: new Text({text: 'Summary stays visible'}),
      expanded: new Text({text: 'Additional details'}),
    }),
  ],
})

await Screen.start(examples)
