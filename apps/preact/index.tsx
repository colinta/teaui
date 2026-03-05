import {useState, useReducer, useMemo} from 'preact/hooks'
import {
  bold,
  italic,
  underline,
  strikeout,
  interceptConsoleLog,
} from '@teaui/core'
import {
  Accordion,
  Box,
  Br,
  Button,
  Checkbox,
  Collapsible,
  CollapsibleText,
  ConsoleLog,
  Digits,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Drawer,
  Input,
  Scrollable,
  Separator,
  Slider,
  Space,
  Stack,
  Style,
  Tabs,
  Text,
  Tree,
  ToggleGroup,
  run,
} from '@teaui/preact'
import {Border} from '@teaui/core'

const borders: Border[] = ['dotted', 'bold', 'rounded', 'double']

function useToggle(initial: boolean) {
  return useReducer<boolean, void>(state => !state, initial)
}

function Demo() {
  const [height, setHeight_] = useState(12)
  const [message, leave] = useReducer<string, void>(
    state => (state === 'hello' ? 'goodbye' : 'hello'),
    'hello',
  )
  const [showExtra, toggleExtra] = useToggle(false)
  const [selected, setSelected] = useState<number[]>([])
  const [debug, toggleDebug] = useToggle(false)
  const [accordionMultiple, toggleAccordionMultiple] = useToggle(false)
  const [border, switchBorder] = useReducer<Border, void>((border: Border) => {
    borders.unshift(border)
    return borders.pop() as Border
  }, 'single')

  const setHeight = (height: number) => {
    if (debug) {
      console.debug({height})
    }
    setHeight_(height)
  }

  return (
    <Drawer.bottom>
      <Stack.right>
        <Box border={border} flex={1}>
          <Stack.down gap={1}>
            <Stack.right>
              <Space width={1} />
              <Slider
                direction="horizontal"
                range={[0, 20]}
                value={height}
                buttons
                step={1}
                border
                onChange={setHeight}
              />
              <Space width={1} />
              <Slider
                flex={1}
                direction="horizontal"
                range={[0, 20]}
                value={height}
                buttons
                step={1}
                border
                onChange={setHeight}
              />
              <Space width={1} />
            </Stack.right>
            <Separator.horizontal />
            <Stack.down>
              <Stack.right gap={1}>
                <Button title="-" onClick={() => setHeight(height - 1)} />
                <Button title="+" onClick={() => setHeight(height + 1)} />
                <Checkbox
                  title="Show Console Log"
                  onChange={() => toggleDebug()}
                  value={debug}
                  hotKey="C-d"
                />
                <Checkbox
                  title="Accordion: multiple"
                  onChange={() => toggleAccordionMultiple()}
                  value={debug}
                  hotKey="C-m"
                />
              </Stack.right>

              <Stack.right gap={1}>
                <Digits
                  text={`${height} + ${height} = ${2 * height}`}
                  minWidth={32}
                />
                <ToggleGroup
                  titles={[
                    bold('B'),
                    italic('I'),
                    underline('U'),
                    strikeout('S'),
                  ]}
                  selected={selected}
                  multiple
                  onChange={(_: any, selected: any) => setSelected(selected)}
                />
              </Stack.right>
            </Stack.down>
            <Tabs border>
              <Tabs.Section title="Text Example" height={height}>
                <Stack.right>
                  <Text>
                    <Style bold foreground="blue">
                      {message}{' '}
                      <Style italic foreground="green">
                        world
                      </Style>
                      , I hope you are doing well,{' '}
                      <Style italic>
                        all things <Style underline>considered</Style>
                      </Style>
                    </Style>
                    <br />
                    world @ {height}
                    <Br />
                    👍{'\n'}
                    👋
                  </Text>
                  <Space width={1} />
                  <Button
                    title={message === 'hello' ? 'Leave' : 'Enter'}
                    height={1}
                    onClick={leave}
                  />
                </Stack.right>
              </Tabs.Section>
              <Tabs.Section title="Headers Example">
                <Stack.down height={height}>
                  <H1 text="Header 1" />
                  <H2 text="Header 2" />
                  <H3 text="Header 3" />
                  <H4 text="Header 4" />
                  <H5 text="Header 5" />
                  <H6 text="Header 6" />
                </Stack.down>
              </Tabs.Section>
            </Tabs>
            <Input
              wrap
              value="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc consectetur molestie faucibus. Phasellus iaculis pellentesque felis eu fringilla. Ut in sollicitudin nisi. Praesent in mauris tortor. Nam interdum, magna eu pellentesque scelerisque, dui sodales enim, et vestibulum nulla dui id ligula. Nam ullamcorper, augue ut interdum vulputate, eros mauris lobortis sapien, ac sodales dui eros ac elit."
            />
            <Stack.right>
              <Space flex={1} />
              <Button flex={3} title="Border" onClick={switchBorder} />
              <Space flex={1} />
            </Stack.right>
            <Button
              title={showExtra ? 'Hide' : 'Show'}
              onClick={() => toggleExtra()}
            />
            {showExtra ? (
              <Scrollable height={7}>
                <Stack.down>
                  <Collapsible
                    isCollapsed
                    collapsed={<Text italic>{message} (1)</Text>}
                    expanded={
                      <Text wrap>
                        {message} (1)
                        <br />
                        <Style bold>bye,</Style> it was nice to see you! I hope
                        we have another chance to chat. Now I've run out of
                        things to say. Anyway, I think you see what the
                        collapsed text component does.
                      </Text>
                    }
                  />
                  <Collapsible
                    isCollapsed
                    collapsed={<Text italic>{message} (2)</Text>}
                    expanded={
                      <Text wrap>
                        {message} (2)
                        <br />
                        <Style bold>bye,</Style> it was nice to see you! I hope
                        we have another chance to chat. Now I've run out of
                        things to say. Anyway, I think you see what the
                        collapsed text component does.
                      </Text>
                    }
                  />
                  <Collapsible
                    isCollapsed
                    collapsed={<Text italic>{message} (3)</Text>}
                    expanded={
                      <Text wrap>
                        {message} (3)
                        <br />
                        <Style bold>bye,</Style> it was nice to see you! I hope
                        we have another chance to chat. Now I've run out of
                        things to say. Anyway, I think you see what the
                        collapsed text component does.
                      </Text>
                    }
                  />
                  <Collapsible
                    isCollapsed
                    collapsed={<Text italic>{message} (4)</Text>}
                    expanded={
                      <Text wrap>
                        {message} (4)
                        <br />
                        <Style bold>{message}</Style> it was nice to see you! I
                        hope we have another chance to chat. Now I've run out of
                        things to say. Anyway, I think you see what the
                        collapsed text component does.
                      </Text>
                    }
                  />
                  <Collapsible
                    isCollapsed
                    collapsed={<Text italic>{message} (5)</Text>}
                    expanded={
                      <Text wrap>
                        {message} (5)
                        <br />
                        <Style bold>bye,</Style> it was nice to see you! I hope
                        we have another chance to chat. Now I've run out of
                        things to say. Anyway, I think you see what the
                        collapsed text component does.
                      </Text>
                    }
                  />
                  <Collapsible
                    isCollapsed
                    collapsed={<Text italic>{message} (6)</Text>}
                    expanded={
                      <Text wrap>
                        {message} (6)
                        <br />
                        <Style bold>bye,</Style> it was nice to see you! I hope
                        we have another chance to chat. Now I've run out of
                        things to say. Anyway, I think you see what the
                        collapsed text component does.
                      </Text>
                    }
                  />
                  <Collapsible
                    isCollapsed
                    collapsed={<Text italic>{message} (7)</Text>}
                    expanded={
                      <Text wrap>
                        {message} (7)
                        <br />
                        <Style bold>bye,</Style> it was nice to see you! I hope
                        we have another chance to chat. Now I've run out of
                        things to say. Anyway, I think you see what the
                        collapsed text component does.
                      </Text>
                    }
                  />
                  <Collapsible
                    isCollapsed
                    collapsed={<Text italic>{message} (8)</Text>}
                    expanded={
                      <Text wrap>
                        {message} (8)
                        <br />
                        <Style bold>bye,</Style> it was nice to see you! I hope
                        we have another chance to chat. Now I've run out of
                        things to say. Anyway, I think you see what the
                        collapsed text component does.
                      </Text>
                    }
                  />
                  <Collapsible
                    isCollapsed
                    collapsed={<Text italic>{message} (9)</Text>}
                    expanded={
                      <Text wrap>
                        {message} (9)
                        <br />
                        <Style bold>bye,</Style> it was nice to see you! I hope
                        we have another chance to chat. Now I've run out of
                        things to say. Anyway, I think you see what the
                        collapsed text component does.
                      </Text>
                    }
                  />
                </Stack.down>
              </Scrollable>
            ) : null}
            {debug ? <ConsoleLog /> : null}
          </Stack.down>
        </Box>
        <Accordion multiple={accordionMultiple}>
          <Accordion.Section title="A">
            Yup, this is section A
          </Accordion.Section>
          <Accordion.Section title="B">You get the idea</Accordion.Section>
          <Accordion.Section title="C" width="shrink">
            <Stack.down>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc
              consectetur molestie faucibus. Phasellus iaculis pellentesque
              felis eu fringilla. Ut in sollicitudin nisi. Praesent in mauris
              tortor. Nam interdum, magna eu pellentesque scelerisque, dui ipsum
              adipiscing ante, vel ullamcorper nisl sapien id arcu. Nullam
              egestas diam eu felis mollis sit amet cursus enim vehicula.
              Quisque eu tellus id erat pellentesque consequat. Maecenas
              fermentum faucibus magna, eget dictum nisi congue sed.
              <CollapsibleText text="Quisque a justo a nisi eleifend facilisis sit amet at augue. Sed a sapien vitae augue hendrerit porta vel eu ligula. Proin enim urna, faucibus in vestibulum tincidunt, commodo sit amet orci. Vestibulum ac sem urna, quis mattis urna. Nam eget ullamcorper ligula. Nam volutpat, arcu vel auctor dignissim, tortor nisi sodales enim, et vestibulum nulla dui id ligula. Nam ullamcorper, augue ut interdum vulputate, eros mauris lobortis sapien, ac sodales dui eros ac elit." />
            </Stack.down>
          </Accordion.Section>
        </Accordion>
      </Stack.right>
      <Text alignment="center">Not much to see here</Text>
    </Drawer.bottom>
  )
}

interceptConsoleLog()

run(<Demo />)
