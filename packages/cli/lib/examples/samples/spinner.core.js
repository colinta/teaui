import {Screen, Spinner, Stack, Text} from '@teaui/core'

const examples = Stack.down({
  width: 44,
  height: 16,
  background: 'default',
  children: [
    new Text('Spinner styles (initial frame)'),
    new Text('dots: default style and animation (1x1)'),
    new Spinner({purpose: 'primary'}),
    new Text('bounce: isAnimating = true (5x2)'),
    new Spinner({style: 'bounce', isAnimating: true, purpose: 'proceed'}),
    new Text('loop (5x1)'),
    new Spinner({style: 'loop', purpose: 'secondary'}),
    new Text('kitt (7x1)'),
    new Spinner({style: 'kitt', purpose: 'red'}),
    new Text('snake (3x3)'),
    new Spinner({style: 'snake', purpose: 'green'}),
    new Text('Paused dots: still visible, same accent'),
    new Spinner({isAnimating: false, purpose: 'primary'}),
  ],
})

await Screen.start(examples)
