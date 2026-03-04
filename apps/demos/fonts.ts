import {
  type FontFamily,
  FontFamilies,
  Text,
  Dropdown,
  Stack,
  Space,
  Button,
} from '@teaui/core'

import {demo} from './demo.js'

const choices: [string, FontFamily][] = FontFamilies.map(f => [f, f])

const text = new Text({
  text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.\n0123456789\nNunc consectetur molestie faucibus.\nPhasellus iaculis pellentesque felis eu fringilla.\nUt in sollicitudin nisi.\nPraesent in mauris tortor.\nNam interdum, magna eu pellentesque scelerisque, dui ipsum adipiscing ante, vel ullamcorper nisl sapien id arcu.\nNullam egestas diam eu felis mollis sit amet cursus enim vehicula.\nQuisque eu tellus id erat pellentesque consequat.\nMaecenas fermentum faucibus magna, eget dictum nisi congue sed.\nQuisque a justo a nisi eleifend facilisis sit amet at augue.\nSed a sapien vitae augue hendrerit porta vel eu ligula.\nProin enim urna, faucibus in vestibulum tincidunt, commodo sit amet orci.\nVestibulum ac sem urna, quis mattis urna.\nNam eget ullamcorper ligula.\nNam volutpat, arcu vel auctor dignissim, tortor nisi sodales enim, et vestibulum nulla dui id ligula.\nNam ullamcorper, augue ut interdum vulputate, eros mauris lobortis sapien, ac sodales dui eros ac elit.',
  wrap: true,
  font: 'default',
  padding: {left: 1, right: 1},
})

const dropdown = new Dropdown({
  theme: 'proceed',
  onSelect(value: FontFamily) {
    text.font = value
  },
  padding: {left: 2, right: 2},
  height: 3,
  choices,
  selected: 'default',
})

const buttons = Stack.right({
  children: FontFamilies.map(
    f =>
      new Button({
        title: f,
        border: 'none',
        onClick() {
          text.font = f
          dropdown.selected = f
        },
      }),
  ),
})

demo(
  Stack.down({
    children: [
      new Space({height: 1}),
      dropdown,
      buttons,
      new Space({height: 1}),
      text,
    ],
  }),
)
