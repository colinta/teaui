import {CollapsibleText, Screen} from '@teaui/core'

const text = new CollapsibleText({
  text: 'Deployment summary\n3 checks passed\nNo warnings found\nReady to release',
  preview: 2,
  purpose: 'primary',
  width: 32,
  height: 4,
})

await Screen.start(text)
