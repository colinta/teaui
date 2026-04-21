import React, {useState, useMemo} from 'react'
import {interceptConsoleLog} from '@teaui/core'
import {Box, Input, run, Scrollable, Stack, Style, Text} from '@teaui/react'
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
#test: foo
tags: [tui, terminal, ui]
`

export function YamlTab() {
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
              <Scrollable.down flex={1}>
                <Text>
                  {parsed !== null ? syntaxHighlightJSON(parsed) : ''}
                </Text>
              </Scrollable.down>
            )}
          </Stack.down>
        </Box>
      </Stack.right>
    </Stack.down>
  )
}

if (import.meta.url === `file://${process.argv[1]}`) {
  interceptConsoleLog()

  run(<YamlTab />)
}
