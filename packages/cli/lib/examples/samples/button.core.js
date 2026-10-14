import {Button, Screen} from '@teaui/core'

let clicks = 0
const button = new Button({
  title: 'Clicks: 0',
  purpose: 'primary',
  hotKey: 'c',
  width: 24,
  height: 3,
  onClick: () => {
    button.title = `Clicks: ${++clicks}`
  },
})

await Screen.start(button)
