import {
  BORDERS,
  Box,
  type Border,
  Checkbox,
  Scrollable,
  Space,
  Stack,
  Text,
} from '@teaui/core'

import {demo} from './demo.js'

function main() {
  const boxes: {border: Border; box: Box; label: Text}[] = []

  function createBox(border: Border) {
    const label = new Text({alignment: 'center', text: border})
    const box = new Box({border, flex: 2, child: label})
    boxes.push({border, box, label})
    return box
  }

  const grid = Scrollable.down({
    flex: 1,
    gap: 1,
    children: toRows(BORDERS).map(([left, right]) =>
      Stack.right({
        height: 5,
        children: [
          new Space({flex: 1}),
          createBox(left),
          new Space({flex: 1}),
          right ? createBox(right) : new Space({flex: 2}),
          new Space({flex: 1}),
        ],
      }),
    ),
  })

  const titled = new Checkbox({
    title: 'Titled',
    value: false,
    onChange(value) {
      for (const {border, box, label} of boxes) {
        box.title = value ? border : undefined
        label.text = value ? '' : border
      }
    },
  })

  demo(Stack.down({flex: 1, gap: 1, children: [titled, grid]}))
}

function toRows<T>(items: readonly T[]): [T, T | undefined][] {
  const rows: [T, T | undefined][] = []
  for (let index = 0; index < items.length; index += 2) {
    rows.push([items[index], items[index + 1]])
  }
  return rows
}

main()
