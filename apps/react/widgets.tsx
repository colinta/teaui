import React, {useState, useReducer, type Reducer} from 'react'
import {interceptConsoleLog} from '@teaui/core'
import {
  Accordion,
  Button,
  Checkbox,
  Collapsible,
  CollapsibleText,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Progress,
  Scrollable,
  Separator,
  Slider,
  Spinner,
  Stack,
  Style,
  Text,
  run,
} from '@teaui/react'

export function WidgetsTab() {
  const [progressVal, setProgressVal] = useState(42)
  const [showSpinner, setShowSpinner] = useState(false)
  const [progressLocation, cycleProgressLocation] = useReducer<
    Reducer<'left' | 'center' | 'right', void>
  >(location => {
    switch (location) {
      case 'left':
        return 'center'
      case 'center':
        return 'right'
      case 'right':
        return 'left'
    }
  }, 'center')

  return (
    <Scrollable flex={1} gap={1}>
      <Text pin="horizontal">
        <Style bold foreground="cyan">
          Widget Showcase
        </Style>
      </Text>

      {/* Progress bars */}
      <Stack.down pin="horizontal">
        <Text>
          <Style bold>Progress Bars</Style>
        </Text>
        <Stack.right gap={1}>
          <Slider
            flex={1}
            direction="horizontal"
            range={[0, 100]}
            value={progressVal}
            buttons
            step={1}
            border
            onChange={setProgressVal}
          />
          <Button
            title={`Location: ${progressLocation}`}
            onClick={cycleProgressLocation}
          />
        </Stack.right>
        <Progress
          value={progressVal}
          showPercent
          location={progressLocation}
          theme="blue"
        />
        <Progress
          value={progressVal}
          showPercent
          location={progressLocation}
          theme="green"
        />
        <Progress
          value={progressVal}
          showPercent
          location={progressLocation}
          theme="orange"
        />
        <Progress
          value={progressVal}
          showPercent
          location={progressLocation}
          theme="red"
          height={2}
        />
      </Stack.down>

      <Separator.horizontal pin="horizontal" />

      {/* Spinner + Checkbox */}
      <Stack.right pin="horizontal" gap={2}>
        <Stack.down>
          <Text>
            <Style bold>Spinner</Style>
          </Text>
          <Stack.right gap={1}>
            <Spinner isAnimating={showSpinner} padding={1} />
            <Checkbox
              title="Animate"
              value={showSpinner}
              onChange={setShowSpinner}
            />
          </Stack.right>
        </Stack.down>

        {/* Headers */}
        <Stack.down>
          <Text>
            <Style bold>Headers</Style>
          </Text>
          <Stack.right gap={2}>
            <Stack.down>
              <H1 text="H1" />
              <H2 text="H2" />
              <H3 text="H3" />
            </Stack.down>
            <Stack.down>
              <H4 text="H4" />
              <H5 text="H5" />
              <H6 text="H6" />
            </Stack.down>
          </Stack.right>
        </Stack.down>
      </Stack.right>

      <Separator.horizontal pin="horizontal" />

      {/* Accordion */}
      <Text pin="horizontal">
        <Style bold>Accordion</Style>
      </Text>
      <Accordion pin="horizontal" multiple>
        <Accordion.Section title="Section A">
          <Text wrap>
            This is the content of section A. Accordions can hold any content
            and support single or multiple open sections.
          </Text>
        </Accordion.Section>
        <Accordion.Section title="Section B">
          <Text wrap>
            Section B has different content. You can nest any TeaUI components
            inside accordion sections.
          </Text>
        </Accordion.Section>
        <Accordion.Section title="Section C">
          <Stack.down>
            <Text wrap>Section C even has a progress bar:</Text>
            <Progress value={75} showPercent theme="green" />
          </Stack.down>
        </Accordion.Section>
      </Accordion>

      <Separator.horizontal pin="horizontal" />

      {/* Collapsible */}
      <Text pin="horizontal">
        <Style bold>Collapsible / CollapsibleText</Style>
      </Text>
      <Collapsible
        pin="horizontal"
        isCollapsed
        collapsed={
          <Text>
            <Style italic>Click to expand…</Style>
          </Text>
        }
        expanded={
          <Text wrap>
            <Style bold>Expanded!</Style> This is the full content of the
            collapsible section. It can contain any amount of text or nested
            components.
          </Text>
        }
      />
      <CollapsibleText text="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc consectetur molestie faucibus. Phasellus iaculis pellentesque felis eu fringilla. Ut in sollicitudin nisi. Praesent in mauris tortor. Nam interdum, magna eu pellentesque scelerisque." />
    </Scrollable>
  )
}

if (import.meta.url === `file://${process.argv[1]}`) {
  interceptConsoleLog()

  run(<WidgetsTab />)
}
