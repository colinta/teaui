import React from 'react'
import {
  Alignment,
  AlignmentScope,
  Box,
  Placement,
  Stack,
  Text,
  useAlignment,
  run,
} from '@teaui/react'

function App() {
  const anchor = useAlignment('anchor')
  return (
    <AlignmentScope width={40} height={8}>
      {/* Without edges, content uses its natural size at the scope origin. */}
      <Placement>
        <Text>Placement: edges, not insets</Text>
      </Placement>
      {/* Two edges per axis fill the rectangle; the children are clipped to it. */}
      <Placement
        left={1}
        right={anchor.left.minus(1)}
        top={anchor.top}
        bottom={anchor.top.plus(4)}
      >
        <Box>
          <Text>{'Both edges fill.\nChildren are clipped.\nNot shown'}</Text>
        </Box>
      </Placement>
      {/* Trailing edges are exclusive coordinates, not distances from the scope. */}
      <Placement right={anchor.left.minus(1)} bottom={8}>
        <Text>Trailing edges</Text>
      </Placement>
      {/* Leading edges alone position natural-sized content. */}
      <Placement left={anchor.left} top={anchor.top.plus(4)}>
        <Text>Leading</Text>
      </Placement>
      {/* The marker can be published after the placements that reference it. */}
      <Placement left={28} top={2}>
        <Stack.down>
          <Alignment point={anchor} />
          <Box>
            <Text>Anchor</Text>
          </Box>
        </Stack.down>
      </Placement>
    </AlignmentScope>
  )
}

await run(<App />)
