import {Checkbox, Screen} from '@teaui/core'

const checkbox = new Checkbox({
  title: 'Notifications: off',
  value: false,
  purpose: 'primary',
  width: 24,
  height: 1,
  onChange: value => {
    checkbox.title = `Notifications: ${value ? 'on' : 'off'}`
  },
})

await Screen.start(checkbox)
