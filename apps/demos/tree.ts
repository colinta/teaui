import {Tree, Text} from '@teaui/core'
import {demo} from './demo.js'

interface Data {
  title: string
  items: Data[]
}

const data: Data[] = [
  {
    title: 'Item 1',
    items: [
      {
        title: 'Item 1.1',
        items: [
          {title: 'Lonely Item 1.1.1', items: []},
          {title: 'Lonely Item 1.1.2', items: []},
          {title: 'Lonely Item 1.1.3', items: []},
        ],
      },
      {title: 'Lonely Item 1.2', items: []},
      {title: 'Lonely Item 1.3\n[ ] more lines', items: []},
    ],
  },
  {
    title: 'Item 2',
    items: [
      {title: 'Lonely 2.1', items: []},
      {
        title: 'Item 2.2',
        items: [
          {title: 'Lonely 2.2.1', items: []},
          {title: 'Lonely 2.2.2', items: []},
          {title: 'Lonely 2.2.3', items: []},
        ],
      },
      {title: 'Lonely 2.3\n[ ] more lines', items: []},
    ],
  },
  {
    title: 'Item 3',
    items: [
      {title: 'Lonely 3.1', items: []},
      {title: 'Lonely 3.2', items: []},
      {
        title: 'Item 3.3\n[ ] more lines',
        items: [
          {title: 'Lonely 3.3.1', items: []},
          {title: 'Lonely 3.3.2', items: []},
          {title: 'Lonely 3.3.3', items: []},
        ],
      },
    ],
  },
]

demo(
  new Tree<Data>({
    titleView: new Text({text: 'Title view'}),
    data,
    render({title}, path) {
      return new Text({text: title + ` (${path})`})
    },
    getChildren({items}) {
      return items
    },
  }),
)
