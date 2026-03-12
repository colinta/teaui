import React, {useState, useMemo, useEffect, useRef, useCallback} from 'react'
import {interceptConsoleLog, type Border} from '@teaui/core'
import {
  Accordion,
  Box,
  Br,
  Breadcrumb,
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

function indent(depth: number): string {
  return '  '.repeat(depth)
}

type JSONValue = null | boolean | number | string | JSONArray | JSONObject
interface JSONArray extends Array<JSONValue> {}
interface JSONObject extends Record<string, JSONValue> {}

function renderValue(
  value: JSONValue,
  depth: number,
  key: string | number,
): React.ReactNode {
  if (value === null) {
    return (
      <Style key={key} foreground="yellow">
        null
      </Style>
    )
  }
  if (typeof value === 'boolean') {
    return (
      <Style key={key} foreground="yellow">
        {String(value)}
      </Style>
    )
  }
  if (typeof value === 'number') {
    return (
      <Style key={key} foreground="magenta">
        {String(value)}
      </Style>
    )
  }
  if (typeof value === 'string') {
    return (
      <Style key={key} foreground="green">
        {JSON.stringify(value)}
      </Style>
    )
  }
  if (Array.isArray(value)) {
    return renderArray(value, depth, key)
  }
  if (typeof value === 'object') {
    return renderObject(value, depth, key)
  }
  return String(value)
}

function renderArray(
  arr: JSONArray,
  depth: number,
  key: string | number,
): React.ReactNode {
  if (arr.length === 0) {
    return '[]'
  }

  const parts: React.ReactNode[] = ['[\n']
  for (let i = 0; i < arr.length; i++) {
    parts.push(indent(depth + 1))
    parts.push(renderValue(arr[i], depth + 1, i))
    if (i < arr.length - 1) {
      parts.push(',')
    }
    parts.push('\n')
  }
  parts.push(indent(depth))
  parts.push(']')
  return <React.Fragment key={key}>{parts}</React.Fragment>
}

function renderObject(
  obj: JSONObject,
  depth: number,
  key: string | number,
): React.ReactNode {
  const keys = Object.keys(obj)
  if (keys.length === 0) {
    return '{}'
  }

  const parts: React.ReactNode[] = ['{\n']
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    parts.push(indent(depth + 1))
    parts.push(
      <Style key={key} foreground="blue">
        {JSON.stringify(key)}
      </Style>,
    )
    parts.push(': ')
    parts.push(renderValue(obj[key], depth + 1, i))
    if (i < keys.length - 1) {
      parts.push(',')
    }
    parts.push('\n')
  }
  parts.push(indent(depth))
  parts.push('}')
  return <React.Fragment key={key}>{parts}</React.Fragment>
}

function syntaxHighlightJSON(value: JSONValue): React.ReactNode {
  return renderValue(value, 0, 0)
}

// ── Tab: YAML → JSON ────────────────────────────────────────────────────────

const DEFAULT_YAML = `# Edit this YAML
name: TeaUI
version: 1.0
features:
  - React renderer
  - Core library
config:
  border: rounded
  theme: default
  debug: false
tags: [tui, terminal, ui]
`

function YamlTab() {
  const [yamlText, setYamlText] = useState(DEFAULT_YAML)

  const {parsed, error} = useMemo(() => {
    try {
      const parsed = YAML.parse(yamlText)
      return {parsed, error: null}
    } catch (e: any) {
      return {parsed: null, error: e.message ?? String(e)}
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
                <Text>
                  {parsed !== null ? syntaxHighlightJSON(parsed) : ''}
                </Text>
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

// ── Clock Demo ──────────────────────────────────────────────────────────────

function pad(n: number, len: number): string {
  return String(n).padStart(len, '0')
}

function formatClock(now: Date): string {
  const date = `${now.getFullYear()}/${pad(now.getMonth() + 1, 2)}/${pad(now.getDate(), 2)}`
  const time = `${pad(now.getHours(), 2)}:${pad(now.getMinutes(), 2)}:${pad(now.getSeconds(), 2)}.${pad(now.getMilliseconds(), 3)}`
  return `${date}\n${time}`
}

function ClockDemo() {
  const [clock, setClock] = useState(() => formatClock(new Date()))
  const rafRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    rafRef.current = setInterval(() => {
      setClock(formatClock(new Date()))
    }, 16)
    return () => {
      if (rafRef.current !== undefined) {
        clearInterval(rafRef.current)
      }
    }
  }, [])

  return (
    <Stack.down gap={1}>
      <Text>
        <Style bold foreground="cyan">
          Clock
        </Style>
        {' — '}Live date and time using Digits
      </Text>
      <Digits text={clock} />
    </Stack.down>
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

function BreadcrumbTab() {
  const [currentPage, setCurrentPage] = useState('Home')
  const [navigation] = useState([
    'Home',
    'Products',
    'Electronics',
    'Smartphones',
    'iPhone',
  ])

  const handleBreadcrumbClick = useCallback((pageName: string) => {
    setCurrentPage(pageName)
  }, [])

  // Get breadcrumb items up to the current page
  const currentIndex = navigation.indexOf(currentPage)
  const breadcrumbItems =
    currentIndex >= 0 ? navigation.slice(0, currentIndex + 1) : navigation

  return (
    <Scrollable flex={1}>
      <Stack.down gap={2}>
        <Text>
          <Style bold foreground="cyan">
            Breadcrumb Demo
          </Style>
        </Text>

        {/* Context-based breadcrumbs */}
        <Box border="single" padding={1}>
          <Breadcrumb.Container>
            <Text>Context-based breadcrumbs:</Text>
            {breadcrumbItems.map((item, index) => (
              <Breadcrumb.Item
                key={item}
                title={item}
                onPress={() => handleBreadcrumbClick(item)}
              />
            ))}
            <Br />
            <Text>Current page: {currentPage}</Text>
            <Text wrap>
              Click any breadcrumb above to navigate. This uses the
              Breadcrumb.Container with individual Breadcrumb.Item components
              that register themselves.
            </Text>
          </Breadcrumb.Container>
        </Box>

        {/* Standalone breadcrumb */}
        <Box border="single" padding={1}>
          <Text>Standalone breadcrumb:</Text>
          <Breadcrumb
            items={breadcrumbItems.map(item => ({
              title: item,
              onPress: () => handleBreadcrumbClick(item),
            }))}
          />
          <Br />
          <Text wrap>
            This is a standalone Breadcrumb component with all items passed as
            props.
          </Text>
        </Box>

        {/* Inactive breadcrumb */}
        <Box border="single" padding={1}>
          <Text>Inactive breadcrumb (muted style):</Text>
          <Breadcrumb
            items={breadcrumbItems.map(item => ({
              title: item,
              onPress: () => handleBreadcrumbClick(item),
            }))}
            isActive={false}
          />
          <Br />
          <Text wrap>
            Same breadcrumb with isActive=false for a muted appearance.
          </Text>
        </Box>

        {/* Custom palette */}
        <Box border="single" padding={1}>
          <Text>Custom color palette:</Text>
          <Breadcrumb
            items={breadcrumbItems.map(item => ({
              title: item,
              onPress: () => handleBreadcrumbClick(item),
            }))}
            palette={[
              {fg: 'white', bg: 'red'},
              {fg: 'black', bg: 'yellow'},
              {fg: 'white', bg: 'green'},
            ]}
          />
          <Br />
          <Text wrap>
            This breadcrumb uses a custom color palette with red, yellow, and
            green segments.
          </Text>
        </Box>
      </Stack.down>
    </Scrollable>
  )
}

function MoreTab() {
  const [debug, setDebug] = useState(false)

  return (
    <Scrollable flex={1}>
      <Stack.down gap={1}>
        {/* Clock */}
        <ClockDemo />

        <Separator.horizontal />

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
          <Tabs.Section title="Breadcrumbs">
            <BreadcrumbTab />
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
