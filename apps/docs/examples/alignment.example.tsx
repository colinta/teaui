import React, {useState} from 'react'
import {
  Alignment,
  AlignmentScope,
  At,
  Box,
  Button,
  Placement,
  Stack,
  Text,
  useAlignment,
} from '@teaui/react'

function App() {
  const cards = useAlignment('cards')
  const [isWide, setWide] = useState(false)

  return (
    <AlignmentScope>
      <Placement left={0} right={cards.left.minus(1)}>
        <Text wrap>
          This text ends one column before the widest card. Press the button to
          resize a card, and the text reflows in the same render - no Geometry
          callbacks or extra state.
        </Text>
      </Placement>
      <At.topRight>
        <Stack.down>
          <Alignment point={cards} />
          <Stack.left>
            <Box border="rounded">
              <Text>status: ok</Text>
            </Box>
          </Stack.left>
          <Stack.left>
            <Button onClick={() => setWide(wide => !wide)}>
              {isWide ? 'a much wider card' : 'widen'}
            </Button>
          </Stack.left>
        </Stack.down>
      </At.topRight>
    </AlignmentScope>
  )
}

export default {width: 50, height: 8, title: 'Alignment points', App}
