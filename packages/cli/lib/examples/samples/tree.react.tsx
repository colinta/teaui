import React from 'react'
import {run, Text, Tree} from '@teaui/react'

interface Item {
  name: string
  children?: Item[]
}

const data: Item[] = [
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

const [screen] = await run(
  <Tree<Item>
    width={30}
    height={10}
    title="Project"
    data={data}
    render={item => <Text>{item.name}</Text>}
    getChildren={item => item.children}
  />,
)

// There is no expanded prop or expand() method. Open branches through public
// screen input after layout, just as a user would click src and components.
screen.render()
const pointer = {
  type: 'mouse' as const,
  button: 'left' as const,
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
