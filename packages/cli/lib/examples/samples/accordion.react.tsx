import React from 'react'
import {Accordion, Text, run} from '@teaui/react'

await run(
  <Accordion multiple={false} width={30} height={5}>
    <Accordion.Section title="Overview" isOpen>
      <Text>Hello, world!</Text>
    </Accordion.Section>
    <Accordion.Section title="Details">
      <Text>Click to reveal details.</Text>
    </Accordion.Section>
  </Accordion>,
)
