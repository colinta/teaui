import React, {useState} from 'react'
import {interceptConsoleLog} from '@teaui/core'
import {
  Alignment,
  AlignmentScope,
  At,
  Box,
  Placement,
  Slider,
  Stack,
  Style,
  Text,
  run,
  useAlignment,
} from '@teaui/react'

export function AlignmentTab() {
  // top-left of the card column; the column is as wide as its widest card
  const cards = useAlignment('cards')
  // bottom-left of the card column (a trailing marker)
  const cardsEnd = useAlignment('cards-end')
  const [card1, setCard1] = useState(8)
  const [card2, setCard2] = useState(16)

  return (
    <AlignmentScope flex={1}>
      {/* declared before the markers it depends on - order only affects painting */}
      <Placement left={0} right={cards.left.minus(2)}>
        <Stack.down gap={1}>
          <Text>
            <Style bold foreground="cyan">
              Alignment points
            </Style>
          </Text>
          <Text wrap>
            This column ends two cells before the widest card. Drag the sliders
            to resize the cards, and it reflows in the same render: the
            Placement is pinned to an Alignment marker at the top-left of the
            card column. No Geometry callbacks, no extra state.
          </Text>
          <Stack.right gap={1}>
            <Text paddingTop={1}>card 1</Text>
            <Slider
              flex={1}
              direction="horizontal"
              range={[1, 40]}
              value={card1}
              buttons
              step={1}
              border
              onChange={setCard1}
            />
          </Stack.right>
          <Stack.right gap={1}>
            <Text paddingTop={1}>card 2</Text>
            <Slider
              flex={1}
              direction="horizontal"
              range={[1, 40]}
              value={card2}
              buttons
              step={1}
              border
              onChange={setCard2}
            />
          </Stack.right>
        </Stack.down>
      </Placement>

      <At.topRight>
        <Stack.down>
          <Alignment point={cards} />
          <Stack.left>
            <Box border="rounded" title="card 1">
              <Text>{DOT.repeat(card1)}</Text>
            </Box>
          </Stack.left>
          <Stack.left>
            <Box border="rounded" title="card 2">
              <Text>{DOT.repeat(card2)}</Text>
            </Box>
          </Stack.left>
          <Alignment point={cardsEnd} />
        </Stack.down>
      </At.topRight>

      {/* a vertical pin: just below the card column, at its left edge */}
      <Placement left={cards.left} top={cardsEnd.top.plus(1)}>
        <Text wrap>↑ the widest card sets the edge</Text>
      </Placement>
    </AlignmentScope>
  )
}

const DOT = '·'

if (import.meta.url === `file://${process.argv[1]}`) {
  interceptConsoleLog()

  run(<AlignmentTab />)
}
