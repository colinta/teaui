import {At, Screen, Text, ZStack} from '@teaui/core'

const layout = new ZStack({
  width: 28,
  height: 5,
  children: [
    new At({location: 'top-left', child: new Text('Start')}),
    At.topRight([new Text('Ready')]),
    At.center([new Text('TeaUI')]),
    At.bottomLeft([new Text('Help')]),
    At.bottomRight([new Text('Exit')]),
  ],
})

await Screen.start(layout)
