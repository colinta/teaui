import {renderToAnsi, Table, type Column} from '@teaui/core'
import {accordionExample} from './examples/samples/accordion.js'
import {alertExample} from './examples/samples/alert.js'
import {alignExample} from './examples/samples/align.js'
import {alignmentExample} from './examples/samples/alignment.js'
import {atExample} from './examples/samples/at.js'
import {autoLegendExample} from './examples/samples/auto-legend.js'
import {badgeExample} from './examples/samples/badge.js'
import {barChartExample} from './examples/samples/bar-chart.js'
import {boxExample} from './examples/samples/box.js'
import {brExample} from './examples/samples/br.js'
import {breadcrumbExample} from './examples/samples/breadcrumb.js'
import {buttonExample} from './examples/samples/button.js'
import {calendarExample} from './examples/samples/calendar.js'
import {calloutExample} from './examples/samples/callout.js'
import {canvasExample} from './examples/samples/canvas.js'
import {checkboxExample} from './examples/samples/checkbox.js'
import {codeExample} from './examples/samples/code.js'
import {collapsibleExample} from './examples/samples/collapsible.js'
import {collapsibleTextExample} from './examples/samples/collapsible-text.js'
import {consoleLogExample} from './examples/samples/console-log.js'
import {desktopExample} from './examples/samples/desktop.js'
import {digitsExample} from './examples/samples/digits.js'
import {drawerExample} from './examples/samples/drawer.js'
import {dropdownExample} from './examples/samples/dropdown.js'
import {fontStyleExample} from './examples/samples/font-style.js'
import {geometryExample} from './examples/samples/geometry.js'
import {headerExample} from './examples/samples/header.js'
import {hotkeyExample} from './examples/samples/hotkey.js'
import {imageExample} from './examples/samples/image.js'
import {inputExample} from './examples/samples/input.js'
import {keyboardExample} from './examples/samples/keyboard.js'
import {legendExample} from './examples/samples/legend.js'
import {lineChartExample} from './examples/samples/line-chart.js'
import {logExample} from './examples/samples/log.js'
import {logoExample} from './examples/samples/logo.js'
import {modalExample} from './examples/samples/modal.js'
import {mouseExample} from './examples/samples/mouse.js'
import {pageExample} from './examples/samples/page.js'
import {paneExample} from './examples/samples/pane.js'
import {placementExample} from './examples/samples/placement.js'
import {plotExample} from './examples/samples/plot.js'
import {pressableExample} from './examples/samples/pressable.js'
import {progressExample} from './examples/samples/progress.js'
import {radioExample} from './examples/samples/radio.js'
import {radioGroupExample} from './examples/samples/radio-group.js'
import {scrollableExample} from './examples/samples/scrollable.js'
import {scrollableListExample} from './examples/samples/scrollable-list.js'
import {separatorExample} from './examples/samples/separator.js'
import {skeletonExample} from './examples/samples/skeleton.js'
import {sliderExample} from './examples/samples/slider.js'
import {spaceExample} from './examples/samples/space.js'
import {spinnerExample} from './examples/samples/spinner.js'
import {stackExample} from './examples/samples/stack.js'
import {styleExample} from './examples/samples/style.js'
import {subprocessExample} from './examples/samples/subprocess.js'
import {tableExample} from './examples/samples/table.js'
import {tabsExample} from './examples/samples/tabs.js'
import {textExample} from './examples/samples/text.js'
import {toggleExample} from './examples/samples/toggle.js'
import {toggleGroupExample} from './examples/samples/toggle-group.js'
import {trackMouseExample} from './examples/samples/track-mouse.js'
import {treeExample} from './examples/samples/tree.js'
import {windowExample} from './examples/samples/window.js'
import {zstackExample} from './examples/samples/zstack.js'
import {COMPONENTS} from './examples/catalog.js'
import type {
  Availability,
  ComponentDefinition,
  ComponentExample,
  ExampleProp,
  Framework,
} from './examples/samples/types.js'

export type {Framework} from './examples/samples/types.js'

export const EXAMPLES: readonly ComponentExample<Availability>[] = [
  accordionExample,
  alertExample,
  alignExample,
  alignmentExample,
  atExample,
  autoLegendExample,
  badgeExample,
  barChartExample,
  boxExample,
  brExample,
  breadcrumbExample,
  buttonExample,
  calendarExample,
  calloutExample,
  canvasExample,
  checkboxExample,
  codeExample,
  collapsibleExample,
  collapsibleTextExample,
  consoleLogExample,
  desktopExample,
  digitsExample,
  drawerExample,
  dropdownExample,
  fontStyleExample,
  geometryExample,
  headerExample,
  hotkeyExample,
  imageExample,
  inputExample,
  keyboardExample,
  legendExample,
  lineChartExample,
  logExample,
  logoExample,
  modalExample,
  mouseExample,
  pageExample,
  paneExample,
  placementExample,
  plotExample,
  pressableExample,
  progressExample,
  radioExample,
  radioGroupExample,
  scrollableExample,
  scrollableListExample,
  separatorExample,
  skeletonExample,
  sliderExample,
  spaceExample,
  spinnerExample,
  stackExample,
  styleExample,
  subprocessExample,
  tableExample,
  tabsExample,
  textExample,
  toggleExample,
  toggleGroupExample,
  trackMouseExample,
  treeExample,
  windowExample,
  zstackExample,
]
const PROPS_TABLE_WIDTH = 118
const PROPS_COLUMNS: Column<ExampleProp>[] = [
  {key: 'name', title: 'Prop', width: 18},
  {key: 'type', title: 'Type', width: 38},
  {key: 'description', title: 'Description'},
]

export function listExamples(framework?: Framework): string {
  const components = framework
    ? COMPONENTS.filter(component => isAvailableIn(component, framework))
    : COMPONENTS
  const nameWidth = Math.max(
    ...components.map(component => component.name.length),
  )
  const examples = components
    .map(component => {
      const name = component.name.padEnd(nameWidth)
      const example = findImplementedExample(component.name)
      const frameworks: Framework[] = framework
        ? [framework]
        : component.availability === 'both'
          ? ['core', 'react']
          : [component.availability]
      const status = frameworks.every(
        framework => example?.source[framework] && example.render[framework],
      )
        ? 'ready'
        : 'todo'
      return `  ${name}  ${status}`
    })
    .join('\n')

  const scope = framework ? capitalize(framework) : 'All'
  const usage = framework
    ? `Run teaui example <name> --${framework}.`
    : 'Run teaui example <name> --react (default) or --core.'

  return `\
Component examples (${scope}):

${examples}

${usage}
`
}

export async function showExample(
  name: string,
  framework: Framework = 'react',
): Promise<string> {
  const component = findComponent(name, framework)

  if (!component) {
    throw new Error(
      `Unknown component: ${name}\n\n${listExamples(framework).trimEnd()}`,
    )
  }

  const example = findImplementedExample(component.name)
  if (!example) {
    throw new Error(`Example not implemented yet: ${component.name}`)
  }

  const source = example.source[framework]
  const render = example.render[framework]
  if (!isAvailableIn(example, framework) || !source || !render) {
    throw new Error(`Example unavailable for ${framework}: ${component.name}`)
  }

  const props = renderPropsTable(example.props, framework)
  const code = source()
  const output = await render()

  return `\

${header(capitalize(example.name))}

${props}

Example
${indent(code)}

Output
${indent(output)}
`
}

function findComponent(
  query: string,
  framework: Framework,
): ComponentDefinition | undefined {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) {
    return undefined
  }

  const exact = COMPONENTS.find(component => component.name === normalizedQuery)
  if (exact) {
    return isAvailableIn(exact, framework) ? exact : undefined
  }

  const components = COMPONENTS.filter(component =>
    isAvailableIn(component, framework),
  )

  const examples = components.filter(component =>
    findImplementedExample(component.name),
  )
  return (
    uniqueMatch(
      normalizedQuery,
      examples.filter(component => component.name.startsWith(normalizedQuery)),
    ) ??
    uniqueMatch(
      normalizedQuery,
      examples.filter(component =>
        isSubsequence(normalizedQuery, component.name),
      ),
    ) ??
    uniqueMatch(
      normalizedQuery,
      examples.filter(component => {
        const maxDistance = Math.max(1, Math.floor(normalizedQuery.length / 3))
        return editDistance(normalizedQuery, component.name) <= maxDistance
      }),
    )
  )
}

function findImplementedExample(
  name: string,
): ComponentExample<Availability> | undefined {
  return EXAMPLES.find(example => example.name === name)
}

function isAvailableIn(
  component: ComponentDefinition,
  framework: Framework,
): boolean {
  return (
    component.availability === 'both' || component.availability === framework
  )
}

function uniqueMatch(
  query: string,
  matches: readonly ComponentDefinition[],
): ComponentDefinition | undefined {
  if (matches.length === 1) {
    return matches[0]
  }
  if (matches.length > 1) {
    throw new Error(
      `Ambiguous component: ${query}\nMatches: ${matches.map(match => match.name).join(', ')}`,
    )
  }
  return undefined
}

function isSubsequence(query: string, candidate: string): boolean {
  let queryIndex = 0
  for (const character of candidate) {
    if (character === query[queryIndex]) {
      queryIndex++
    }
    if (queryIndex === query.length) {
      return true
    }
  }
  return false
}

function editDistance(left: string, right: string): number {
  let previous = Array.from({length: right.length + 1}, (_, index) => index)

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex++) {
    const current = [leftIndex]
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex++) {
      const substitution =
        previous[rightIndex - 1] +
        (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1)
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        substitution,
      )
    }
    previous = current
  }

  return previous[right.length]
}

function renderPropsTable(
  props: readonly ExampleProp[],
  framework: Framework,
): string {
  const availableProps = props.filter(
    prop => prop.availability === 'both' || prop.availability === framework,
  )
  const table = new Table<ExampleProp>({
    data: availableProps,
    columns: PROPS_COLUMNS,
    selectedIndex: -1,
    format(key, prop) {
      switch (key) {
        case 'name':
          return `${prop.name}?`
        case 'type':
        case 'description':
          return prop[key]
        default:
          return ''
      }
    },
  })

  return renderToAnsi(table, {
    width: PROPS_TABLE_WIDTH,
    height: availableProps.length + 2,
  })
}

function header(title: string): string {
  return `\
  \x1b[1m${title}\x1b[0m
  ${'━'.repeat(title.length)}
`
}

function indent(input: string, indent = '  ') {
  return input
    .split('\n')
    .map(line => `${indent}${line}\x1b[0m`)
    .join('\n')
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
