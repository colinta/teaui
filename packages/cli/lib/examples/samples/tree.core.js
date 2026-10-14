import {Screen, Text, Tree} from '@teaui/core'

const data = [
  {
    name: 'src',
    children: [
      {
        name: 'components',
        children: [{name: 'App.tsx'}, {name: 'Button.tsx'}],
      },
      {name: 'index.ts'},
    ],
  },
  {name: 'assets', children: [{name: 'logo.svg'}]},
  {name: 'package.json'},
]

const tree = new Tree({
  width: 30,
  height: 10,
  titleView: new Text('Project'),
  data,
  render: item => new Text(item.name),
  getChildren: item => item.children,
})

const [screen] = await Screen.start(tree)

// There is no expanded prop or expand() method. Open branches through public
// screen input after layout, just as a user would click src and components.
screen.render()
const pointer = {
  type: 'mouse',
  button: 'left',
  ctrl: false,
  alt: false,
  gui: false,
  shift: false,
}
for (const {x, y} of [
  {x: 2, y: 1},
  {x: 6, y: 2},
]) {
  screen.trigger({...pointer, name: 'mouse.button.down', x, y})
  screen.trigger({...pointer, name: 'mouse.button.up', x, y})
}
// Move away to leave a deterministic, unhovered hierarchy; no timers needed.
screen.trigger({...pointer, name: 'mouse.move.in', x: 29, y: 9})
screen.render()
