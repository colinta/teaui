import {Dropdown, Screen, Space, Stack, Text} from '@teaui/core'

const choices = [
  ['Apple', 'apple'],
  ['Banana', 'banana'],
  ['Cherry', 'cherry'],
]

const single = new Dropdown({
  choices,
  title: 'Pick a fruit',
  multiple: false,
  selected: undefined,
  height: 1,
  onSelect: value => {
    single.selected = value
  },
})

const multiple = new Dropdown({
  choices,
  title: 'Pick several fruits',
  multiple: true,
  selected: ['apple', 'cherry'],
  height: 1,
  onSelect: values => {
    multiple.selected = values
  },
})

const examples = Stack.down({
  width: 30,
  height: 12,
  children: [
    new Text({text: 'Single selection'}),
    single,
    new Text({text: 'Multiple selection'}),
    multiple,
    new Space({flex: 1}),
  ],
})

await Screen.start(examples)
