import {Screen, Stack, Text, ToggleGroup} from '@teaui/core'

const SINGLE_TITLES = ['Left', 'Center', 'Right']
const MULTIPLE_TITLES = ['Bold', 'Italic', 'Underline']
const INITIAL_SINGLE = [1]
const INITIAL_MULTIPLE = [0, 2]

function describeSelection(titles, selected) {
  return selected.map(index => titles[index]).join(', ') || 'none'
}

const singleSummary = new Text(
  `Single: ${describeSelection(SINGLE_TITLES, INITIAL_SINGLE)}`,
)
const multipleSummary = new Text(
  `Multiple: ${describeSelection(MULTIPLE_TITLES, INITIAL_MULTIPLE)}`,
)

const single = new ToggleGroup({
  titles: SINGLE_TITLES,
  selected: INITIAL_SINGLE,
  multiple: false,
  onChange: (_changed, selected) => {
    singleSummary.text = `Single: ${describeSelection(SINGLE_TITLES, selected)}`
  },
})
const multiple = new ToggleGroup({
  titles: MULTIPLE_TITLES,
  selected: INITIAL_MULTIPLE,
  multiple: true,
  onChange: (_changed, selected) => {
    multipleSummary.text = `Multiple: ${describeSelection(MULTIPLE_TITLES, selected)}`
  },
})

const examples = Stack.down({
  width: 36,
  height: 11,
  children: [
    new Text('Single selection (click to toggle)'),
    single,
    singleSummary,
    new Text('Multiple selection'),
    multiple,
    multipleSummary,
    new Text('Click again to clear an option'),
  ],
})

await Screen.start(examples)
