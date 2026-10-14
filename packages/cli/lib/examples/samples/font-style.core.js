import {FontStyle, Screen, Stack, Text} from '@teaui/core'

const INITIAL_VALUE = {
  bold: true,
  italic: false,
  underline: true,
  strikethrough: false,
}

function describeStyles(value) {
  const enabled = Object.keys(value).filter(key => value[key])
  return `Enabled: ${enabled.join(', ') || 'none'}`
}

const summary = new Text(describeStyles(INITIAL_VALUE))
const fontStyle = new FontStyle({
  value: INITIAL_VALUE,
  onChange: value => {
    summary.text = describeStyles(value)
  },
})

const toolbar = Stack.down({
  width: 48,
  height: 5,
  gap: 1,
  children: [fontStyle, summary],
})

await Screen.start(toolbar)
