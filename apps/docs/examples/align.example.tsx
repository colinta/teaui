import React from 'react'
import {Align, Stack, Style, Text} from '@teaui/react'

function App() {
  return (
    <Stack.down>
      <Text>
        <Style bold foreground="yellow">
          Point Break
        </Style>
      </Text>
      <Align>
        <Align.Row>
          <Text>
            <Style foreground="cyan">Actors</Style>
          </Text>
          <Text>
            <Style foreground="cyan">
              Patrick Swayze, Keanu Reeves, Lori Petty
            </Style>
          </Text>
        </Align.Row>
        <Align.Row>
          <Text>
            <Style foreground="green">Released</Style>
          </Text>
          <Text>
            <Style foreground="green">1991</Style>
          </Text>
        </Align.Row>
        <Align.Row>
          <Text>
            <Style foreground="magenta">Director</Style>
          </Text>
          <Text>
            <Style foreground="magenta">Kathryn Bigelow</Style>
          </Text>
        </Align.Row>
      </Align>
    </Stack.down>
  )
}

export default {width: 50, height: 4, title: 'Align', App}
