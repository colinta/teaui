import {Tree, Text} from '@teaui/core'
import type {ScreenshotSpec} from './types.js'

interface Item {
  name: string
  children?: Item[]
}

const data: Item[] = [
  {
    name: 'src',
    children: [{name: 'App.tsx'}, {name: 'Button.tsx'}],
  },
  {name: 'package.json'},
  {name: 'README.md'},
]

export default {
  size: {width: 30, height: 6},
  title: 'Tree',
  component: () =>
    new Tree<Item>({
      data,
      titleView: new Text({text: 'Project'}),
      render: item => new Text({text: item.name}),
      getChildren: item => item.children,
    }),
} satisfies ScreenshotSpec
