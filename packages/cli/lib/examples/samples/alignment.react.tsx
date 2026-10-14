import React from 'react'
import {
  Alignment,
  AlignmentScope,
  At,
  Box,
  Placement,
  Stack,
  Text,
  useAlignment,
  run,
} from '@teaui/react'

function App() {
  const cards = useAlignment('cards')
  return (
    <AlignmentScope width={40} height={6}>
      <Placement left={0} right={cards.left.minus(1)}>
        <Text wrap>This text stops one column before the widest card.</Text>
      </Placement>
      <At.topRight>
        <Stack.down>
          <Alignment point={cards} />
          <Stack.left>
            <Box>
              <Text>Ready</Text>
            </Box>
          </Stack.left>
          <Stack.left>
            <Box>
              <Text>Next step</Text>
            </Box>
          </Stack.left>
        </Stack.down>
      </At.topRight>
    </AlignmentScope>
  )
}

await run(<App />)
