import {Screen, Stack, Text, Window} from '@teaui/core'

const WIDTH = 44
const HALF = 22

const example = Stack.down({
  width: WIDTH,
  height: 10,
  children: [
    Stack.right({
      children: [
        new Window({
          title: 'Inactive',
          width: HALF,
          height: 4,
          child: new Text('rounded border'),
        }),
        new Window({
          title: 'Active',
          width: HALF,
          height: 4,
          child: new Text('double border'),
        }),
      ],
    }),
    new Window({
      title: 'A title that is much too long',
      width: WIDTH,
      height: 3,
      showClose: false,
      titleBar: [new Text('[save]')],
      child: new Text('title bar views sit before the buttons'),
    }),
    new Window({
      title: 'No buttons',
      width: WIDTH,
      height: 2,
      showClose: false,
      showMinimize: false,
      showMaximize: false,
    }),
    new Window({
      title: 'Minimized to one row',
      width: WIDTH,
      isMinimized: true,
    }),
  ],
})

await Screen.start(example)
