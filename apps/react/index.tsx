import React, {useState, useMemo} from 'react'
import {
  interceptConsoleLog,
  type Border,
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
  Drawer,
  Dropdown,
  FontStyle,
  type FontStyleValue,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Input,
  Progress,
  Scrollable,
  Separator,
  Slider,
  Space,
  Spinner,
  Stack,
  Style,
  Tabs,
  Text,
  run,
} from '@teaui/react'
import YAML from 'yaml'

// ── Helpers ──────────────────────────────────────────────────────────────────

function syntaxHighlightJSON(json: string): React.ReactNode {
  // Split JSON into tokens and colorize them
  const parts: React.ReactNode[] = []
  const regex =
    /("(?:\\.|[^"\\])*")\s*:|("(?:\\.|[^"\\])*")|(true|false|null)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}\[\]:,])/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(json)) !== null) {
    // whitespace before the match
    if (match.index > lastIndex) {
      parts.push(json.slice(lastIndex, match.index))
    }

    if (match[1] !== undefined) {
      // key
      parts.push(
        <Style key={match.index} foreground="cyan">
          {match[1]}
        </Style>,
      )
      parts.push(':')
    } else if (match[2] !== undefined) {
      // string value
      parts.push(
        <Style key={match.index} foreground="green">
          {match[2]}
        </Style>,
      )
    } else if (match[3] !== undefined) {
      // boolean/null
      parts.push(
        <Style key={match.index} foreground="yellow">
          {match[3]}
        </Style>,
      )
    } else if (match[4] !== undefined) {
      // number
      parts.push(
        <Style key={match.index} foreground="magenta">
          {match[4]}
        </Style>,
      )
    } else if (match[5] !== undefined) {
      // punctuation
      parts.push(
        <Style key={match.index} foreground="white">
          {match[5]}
        </Style>,
      )
    }

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < json.length) {
    parts.push(json.slice(lastIndex))
  }

  return <>{parts}</>
}

// ── Tab: YAML → JSON ────────────────────────────────────────────────────────

const DEFAULT_YAML = `# Edit this YAML
name: TeaUI
version: 1.0
features:
  - React renderer
  - Preact renderer
  - Core library
config:
  border: rounded
  theme: default
  debug: false
tags: [tui, terminal, ui]
`

function YamlTab() {
  const [yamlText, setYamlText] = useState(DEFAULT_YAML)

  const {json, error} = useMemo(() => {
    try {
      const parsed = YAML.parse(yamlText)
      return {json: JSON.stringify(parsed, null, 2), error: null}
    } catch (e: any) {
      return {json: null, error: e.message ?? String(e)}
    }
  }, [yamlText])

  return (
    <Stack.down gap={1} flex={1}>
      <Text>
        <Style bold foreground="cyan">
          YAML → JSON
        </Style>{' '}
        — Edit YAML on the left, see colorized JSON on the right
      </Text>
      <Stack.right flex={1} gap={1}>
        <Box border="rounded" flex={1}>
          <Stack.down flex={1}>
            <Text>
              <Style bold>YAML Input</Style>
            </Text>
            <Input
              value={yamlText}
              onChange={setYamlText}
              multiline
              wrap
              flex={1}
            />
          </Stack.down>
        </Box>
        <Box border="rounded" flex={1}>
          <Stack.down flex={1}>
            <Text>
              <Style bold>JSON Output</Style>
            </Text>
            {error ? (
              <Text wrap>
                <Style foreground="red" bold>
                  Error:{' '}
                </Style>
                <Style foreground="red">{error}</Style>
              </Text>
            ) : (
              <Scrollable flex={1}>
                <Text>{json ? syntaxHighlightJSON(json) : ''}</Text>
              </Scrollable>
            )}
          </Stack.down>
        </Box>
      </Stack.right>
    </Stack.down>
  )
}

// ── Tab: Digits ─────────────────────────────────────────────────────────────

const BORDER_CHOICES: [string, Border][] = [
  ['single', 'single'],
  ['bold', 'bold'],
  ['double', 'double'],
  ['rounded', 'rounded'],
  ['dotted', 'dotted'],
]

function DigitsTab() {
  const [width, setWidth] = useState(8)
  const [height, setHeight] = useState(5)
  const [border, setBorder] = useState<Border>('rounded')
  const area = width * height

  return (
    <Stack.down gap={1} flex={1}>
      <Text>
        <Style bold foreground="cyan">
          Digits Display
        </Style>{' '}
        — Adjust width and height to resize the box
      </Text>
      <Stack.right gap={2}>
        <Stack.down gap={1} flex={1}>
          <Stack.right gap={1}>
            <Text>Width: </Text>
            <Slider
              flex={1}
              direction="horizontal"
              range={[3, 40]}
              value={width}
              buttons
              step={1}
              border
              onChange={setWidth}
            />
          </Stack.right>
          <Stack.right gap={1}>
            <Text>Height:</Text>
            <Slider
              flex={1}
              direction="horizontal"
              range={[3, 20]}
              value={height}
              buttons
              step={1}
              border
              onChange={setHeight}
            />
          </Stack.right>
          <Stack.right gap={1}>
            <Text>Border:</Text>
            <Dropdown
              choices={BORDER_CHOICES}
              selected={border}
              onSelect={setBorder}
              height={1}
            />
          </Stack.right>
        </Stack.down>
      </Stack.right>
      <Separator.horizontal />
      <Stack.right gap={2}>
        <Box border={border} width={width} height={height}>
          <Text alignment="center">
            {width}×{height}
          </Text>
        </Box>
        <Digits text={`${width} x ${height} = ${area}`} />
      </Stack.right>
    </Stack.down>
  )
}

// ── Tab: Text Styles ────────────────────────────────────────────────────────

function StylesTab() {
  const [fontStyle, setFontStyle] = useState<FontStyleValue>({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
  })
  const [sampleText, setSampleText] = useState(
    'The quick brown fox jumps over the lazy dog.',
  )

  return (
    <Stack.down gap={1} flex={1}>
      <Text>
        <Style bold foreground="cyan">
          Text Styles
        </Style>{' '}
        — Toggle bold, italic, underline, strikethrough
      </Text>
      <Stack.right gap={2}>
        <FontStyle value={fontStyle} onChange={setFontStyle} />
        <Input flex={1} value={sampleText} onChange={setSampleText} />
      </Stack.right>
      <Separator.horizontal />
      <Box border="rounded" height={5}>
        <Text wrap>
          <Style
            bold={fontStyle.bold}
            italic={fontStyle.italic}
            underline={fontStyle.underline}
            strikeout={fontStyle.strikethrough}
          >
            {sampleText}
          </Style>
        </Text>
      </Box>
      <Text>
        <Style foreground="white">Preview with all combinations:</Style>
      </Text>
      <Stack.down>
        <Text>
          <Style bold>Bold: {sampleText}</Style>
        </Text>
        <Text>
          <Style italic>Italic: {sampleText}</Style>
        </Text>
        <Text>
          <Style underline>Underline: {sampleText}</Style>
        </Text>
        <Text>
          <Style strikeout>Strikethrough: {sampleText}</Style>
        </Text>
        <Text>
          <Style bold italic underline>
            All three: {sampleText}
          </Style>
        </Text>
      </Stack.down>
    </Stack.down>
  )
}

// ── Tab: Widgets ────────────────────────────────────────────────────────────

function WidgetsTab() {
  const [progressVal, setProgressVal] = useState(42)
  const [showSpinner, setShowSpinner] = useState(true)

  return (
    <Scrollable flex={1}>
      <Stack.down gap={1}>
        <Text>
          <Style bold foreground="cyan">
            Widget Showcase
          </Style>
        </Text>

        {/* Progress bars */}
        <Stack.down>
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
          </Stack.right>
          <Progress value={progressVal} showPercent theme="blue" />
          <Progress value={progressVal} showPercent theme="green" />
          <Progress value={progressVal} showPercent theme="orange" />
          <Progress value={progressVal} showPercent theme="red" height={2} />
        </Stack.down>

        <Separator.horizontal />

        {/* Spinner + Checkbox */}
        <Stack.right gap={2}>
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

        <Separator.horizontal />

        {/* Accordion */}
        <Text>
          <Style bold>Accordion</Style>
        </Text>
        <Accordion multiple>
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

        <Separator.horizontal />

        {/* Collapsible */}
        <Text>
          <Style bold>Collapsible / CollapsibleText</Style>
        </Text>
        <Collapsible
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
      </Stack.down>
    </Scrollable>
  )
}

// ── Tab: Drawer ─────────────────────────────────────────────────────────────

function DrawerTab() {
  return (
    <Drawer.left
      flex={1}
      theme="secondary"
      hotKey="C-o"
      drawer={
        <Stack.down maxWidth={35}>
          <Text>
            <Style bold>Drawer Menu</Style>
          </Text>
          <Separator.horizontal />
          <Accordion multiple>
            {Array.from({length: 5}, (_, i) => (
              <Accordion.Section key={i} title={`Menu ${i + 1}`}>
                <Text>
                  Item {i + 1} content{'\n'}with multiple lines
                </Text>
              </Accordion.Section>
            ))}
          </Accordion>
        </Stack.down>
      }
      content={
        <Stack.down flex={1} gap={1} padding={1}>
          <Text>
            <Style bold foreground="cyan">
              Drawer Demo
            </Style>
          </Text>
          <Text wrap>
            Press Ctrl-O or drag the edge to toggle the drawer on the left.
            Drawers can be placed on any side: top, right, bottom, or left.
          </Text>
          <Box border="rounded" flex={1}>
            <Text alignment="center" wrap>
              Main content area. The drawer overlays from the left side.
            </Text>
          </Box>
        </Stack.down>
      }
    />
  )
}

// ── Tab: Borders & Buttons ──────────────────────────────────────────────────

const BORDERS: {name: string; border: Border}[] = [
  {name: 'single', border: 'single'},
  {name: 'double', border: 'double'},
  {name: 'rounded', border: 'rounded'},
  {name: 'bold', border: 'bold'},
  {name: 'dotted', border: 'dotted'},
]

function MoreTab() {
  const [debug, setDebug] = useState(false)

  return (
    <Scrollable flex={1}>
      <Stack.down gap={1}>
        {/* Borders */}
        <Text>
          <Style bold foreground="cyan">
            Border Styles
          </Style>
        </Text>
        <Stack.right gap={1}>
          {BORDERS.map(({name, border}) => (
            <Box key={name} border={border} width={16} height={5}>
              <Text alignment="center">{name}</Text>
            </Box>
          ))}
        </Stack.right>

        <Separator.horizontal />

        {/* Buttons */}
        <Text>
          <Style bold foreground="cyan">
            Buttons
          </Style>
        </Text>
        <Stack.right gap={1}>
          <Button title="Default" />
          <Button title="Primary" theme="primary" />
          <Button title="Secondary" theme="secondary" />
          <Button title="Tall" height={3} />
          <Button title="Primary Tall" height={3} theme="primary" />
        </Stack.right>

        <Separator.horizontal />

        {/* Console Log */}
        <Text>
          <Style bold foreground="cyan">
            Console Log
          </Style>
        </Text>
        <Stack.right gap={1}>
          <Checkbox title="Show Console" value={debug} onChange={setDebug} />
          <Button
            title="log()"
            onClick={() => console.log('Hello from console.log!')}
          />
          <Button
            title="debug()"
            onClick={() => console.debug({action: 'debug', ts: Date.now()})}
          />
          <Button
            title="warn()"
            onClick={() => console.warn('This is a warning!')}
          />
        </Stack.right>
        {debug ? <ConsoleLog height={8} /> : null}

        <Separator.horizontal />

        {/* Color swatches */}
        <Text>
          <Style bold foreground="cyan">
            Color Palette
          </Style>
        </Text>
        <Text>
          <Style foreground="red">■ red </Style>
          <Style foreground="green">■ green </Style>
          <Style foreground="blue">■ blue </Style>
          <Style foreground="yellow">■ yellow </Style>
          <Style foreground="magenta">■ magenta </Style>
          <Style foreground="cyan">■ cyan </Style>
          <Style foreground="white">■ white </Style>
        </Text>
        <Text>
          <Style foreground="brightRed">■ brightRed </Style>
          <Style foreground="brightGreen">■ brightGreen </Style>
          <Style foreground="brightBlue">■ brightBlue </Style>
          <Style foreground="brightYellow">■ brightYellow </Style>
          <Style foreground="brightMagenta">■ brightMagenta </Style>
          <Style foreground="brightCyan">■ brightCyan </Style>
        </Text>
      </Stack.down>
    </Scrollable>
  )
}

// ── Main App ────────────────────────────────────────────────────────────────

function Demo() {
  return (
    <Box border="rounded" flex={1}>
      <Stack.down flex={1}>
        <Text alignment="center">
          <Style bold foreground="cyan">
            ☕ TeaUI React Demo
          </Style>
        </Text>
        <Tabs border flex={1}>
          <Tabs.Section title="YAML → JSON">
            <YamlTab />
          </Tabs.Section>
          <Tabs.Section title="Digits">
            <DigitsTab />
          </Tabs.Section>
          <Tabs.Section title="Styles">
            <StylesTab />
          </Tabs.Section>
          <Tabs.Section title="Widgets">
            <WidgetsTab />
          </Tabs.Section>
          <Tabs.Section title="Drawer">
            <DrawerTab />
          </Tabs.Section>
          <Tabs.Section title="More">
            <MoreTab />
          </Tabs.Section>
        </Tabs>
      </Stack.down>
    </Box>
  )
}

interceptConsoleLog()

run(<Demo />)
