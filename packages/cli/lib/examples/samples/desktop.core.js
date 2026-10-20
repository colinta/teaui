import {Desktop, Screen, Stack, Text, Window} from '@teaui/core'

const floating = new Desktop({
  height: 9,
  children: [
    new Window({
      title: 'Notes',
      x: 0,
      y: 0,
      width: 24,
      height: 6,
      child: new Text('floating layout'),
    }),
    new Window({
      title: 'Tools',
      x: 18,
      y: 3,
      width: 26,
      height: 6,
      child: new Text('drag the title bar'),
    }),
    new Window({title: 'Help', isMinimized: true}),
  ],
})

const tiled = new Desktop({
  layout: 'tiled',
  height: 8,
  children: [
    new Window({title: 'Main', child: new Text('tiled layout')}),
    new Window({title: 'Stacked', child: new Text('drag the border')}),
    new Window({title: 'Minimized', isMinimized: true}),
  ],
})

await Screen.start(
  Stack.down({width: 44, height: 17, children: [floating, tiled]}),
)
