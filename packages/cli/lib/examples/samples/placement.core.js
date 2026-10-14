import {
  Alignment,
  AlignmentScope,
  Box,
  Placement,
  Screen,
  Stack,
  Text,
} from '@teaui/core'

const anchor = new Alignment({name: 'anchor'})
const layout = new AlignmentScope({
  width: 40,
  height: 8,
  children: [
    // Without edges, content uses its natural size at the scope origin.
    new Placement({child: new Text('Placement: edges, not insets')}),
    // Two edges per axis fill the rectangle; the children are clipped to it.
    new Placement({
      left: 1,
      right: anchor.left.minus(1),
      top: anchor.top,
      bottom: anchor.top.plus(4),
      child: new Box({
        child: new Text('Both edges fill.\nChildren are clipped.\nNot shown'),
      }),
    }),
    // Trailing edges are exclusive coordinates, not distances from the scope.
    new Placement({
      right: anchor.left.minus(1),
      bottom: 8,
      child: new Text('Trailing edges'),
    }),
    // Leading edges alone position natural-sized content.
    new Placement({
      left: anchor.left,
      top: anchor.top.plus(4),
      child: new Text('Leading'),
    }),
    // The marker can be published after the placements that reference it.
    new Placement({
      left: 28,
      top: 2,
      child: Stack.down([anchor, new Box({child: new Text('Anchor')})]),
    }),
  ],
})

await Screen.start(layout)
