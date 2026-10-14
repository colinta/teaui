import {Align, Screen, Text} from '@teaui/core'

const align = new Align({
  width: 21,
  height: 4,
  children: [
    new Text('TeaUI project details'),
    Align.row([new Text('Name'), new Text('TeaUI')]),
    Align.row([new Text('Language'), new Text('TypeScript')]),
    Align.row([new Text('Status'), new Text('Ready')]),
  ],
})

await Screen.start(align)
