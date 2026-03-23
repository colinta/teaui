import React from 'react'
import {Tree, Text} from '@teaui/react'

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
  {name: 'package.json'},
  {name: 'tsconfig.json'},
]

function App() {
  return (
    <Tree
      data={data}
      title="Project"
      render={item => <Text>{item.name}</Text>}
      getChildren={item => item.children}
    />
  )
}

export default {width: 30, height: 9, title: 'Tree', App}
