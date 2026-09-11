import {
  Scrollable,
  Separator,
  Space,
  Stack,
  Text,
  Palette,
  ToggleGroup,
  colorToHex,
  type Color,
  type Purpose,
  type Style,
} from '@teaui/core'

import {demo} from './demo.js'

type PaletteEntry = {
  section: string
  state: string
  api: string
  description: string
  resolveStyle: (palette: Palette) => Style
}

const STATE_WIDTH = 24
const API_WIDTH = 52
const SWATCH_WIDTH = 18
const FLAGS_WIDTH = 18
const DESCRIPTION_WIDTH = 48
const SWATCH_PLACEHOLDER = '#000000'
const SWATCH_PADDING = '  '
const SECTION_STYLE = Palette.selected.ui()
const HEADER_STYLE = Palette.plain.text({hasFocus: true})

const PURPOSES = [
  'plain',
  'primary',
  'secondary',
  'proceed',
  'cancel',
  'selected',
] as const satisfies readonly Purpose[]

const ENTRIES: PaletteEntry[] = [
  {
    section: 'Flat UI',
    state: 'Rest',
    api: 'palette.ui()',
    description: 'The default: controls that blend into their parent surface.',
    resolveStyle: palette => palette.ui(),
  },
  {
    section: 'Flat UI',
    state: 'Hover',
    api: 'palette.ui({isHover: true})',
    description: 'Pointer hover. This is intentionally lighter than rest.',
    resolveStyle: palette => palette.ui({isHover: true}),
  },
  {
    section: 'Flat UI',
    state: 'Focus',
    api: 'palette.ui({hasFocus: true})',
    description: 'Keyboard focus. This is intentionally darker than rest.',
    resolveStyle: palette => palette.ui({hasFocus: true}),
  },
  {
    section: 'Flat UI',
    state: 'Pressed',
    api: 'palette.ui({isPressed: true})',
    description: 'Transient pointer or keyboard press; highest precedence.',
    resolveStyle: palette => palette.ui({isPressed: true}),
  },
  {
    section: 'Raised UI',
    state: 'Rest',
    api: "palette.ui({variant: 'raised'})",
    description: 'Buttons, dropdowns, and controls raised above the surface.',
    resolveStyle: palette => palette.ui({variant: 'raised'}),
  },
  {
    section: 'Raised UI',
    state: 'Hover',
    api: "palette.ui({variant: 'raised', isHover: true})",
    description: 'Raised controls use the same lighter hover state.',
    resolveStyle: palette => palette.ui({variant: 'raised', isHover: true}),
  },
  {
    section: 'Raised UI',
    state: 'Focus',
    api: "palette.ui({variant: 'raised', hasFocus: true})",
    description: 'A distinct dark focus color, separate from hover.',
    resolveStyle: palette => palette.ui({variant: 'raised', hasFocus: true}),
  },
  {
    section: 'Raised UI',
    state: 'Pressed',
    api: "palette.ui({variant: 'raised', isPressed: true})",
    description: 'Raised-control pressed state.',
    resolveStyle: palette => palette.ui({variant: 'raised', isPressed: true}),
  },
  {
    section: 'UI content',
    state: 'Placeholder',
    api: 'palette.ui({isPlaceholder: true})',
    description: 'Readable placeholder text on a resting input surface.',
    resolveStyle: palette => palette.ui({isPlaceholder: true}),
  },
  {
    section: 'UI content',
    state: 'Focused placeholder',
    api: 'palette.ui({isPlaceholder: true, hasFocus: true})',
    description: 'Placeholder text on the darker focus surface.',
    resolveStyle: palette => palette.ui({isPlaceholder: true, hasFocus: true}),
  },
  {
    section: 'UI content',
    state: 'Inactive selection',
    api: 'palette.ui({isSelected: true})',
    description: 'Selection retained after a control loses focus.',
    resolveStyle: palette => palette.ui({isSelected: true}),
  },
  {
    section: 'UI content',
    state: 'Active selection',
    api: 'palette.ui({isSelected: true, hasFocus: true})',
    description: 'Selection in the focused control.',
    resolveStyle: palette => palette.ui({isSelected: true, hasFocus: true}),
  },
  {
    section: 'Ornaments',
    state: 'Rest',
    api: "palette.ui({variant: 'raised', isOrnament: true})",
    description: 'Receding button caps, borders, and decorative chrome.',
    resolveStyle: palette => palette.ui({variant: 'raised', isOrnament: true}),
  },
  {
    section: 'Ornaments',
    state: 'Interactive',
    api: "palette.ui({variant: 'raised', isOrnament: true, isHover: true})",
    description: 'Ornaments disappear into the active background.',
    resolveStyle: palette =>
      palette.ui({variant: 'raised', isOrnament: true, isHover: true}),
  },
  {
    section: 'Text',
    state: 'Default',
    api: 'palette.text()',
    description: 'Readable text on the passive surface.',
    resolveStyle: palette => palette.text(),
  },
  {
    section: 'Text',
    state: 'Muted',
    api: "palette.text({tone: 'muted'})",
    description: 'Secondary labels and lower-emphasis content.',
    resolveStyle: palette => palette.text({tone: 'muted'}),
  },
  {
    section: 'Text',
    state: 'Placeholder',
    api: "palette.text({tone: 'placeholder'})",
    description: 'Placeholder text on a passive surface.',
    resolveStyle: palette => palette.text({tone: 'placeholder'}),
  },
  {
    section: 'Text',
    state: 'Accent',
    api: "palette.text({tone: 'accent'})",
    description: 'Decorative emphasis that does not imply interaction state.',
    resolveStyle: palette => palette.text({tone: 'accent'}),
  },
  {
    section: 'Text',
    state: 'Inactive selection',
    api: 'palette.text({isSelected: true})',
    description: 'Selected text outside the focused control.',
    resolveStyle: palette => palette.text({isSelected: true}),
  },
  {
    section: 'Text',
    state: 'Active selection',
    api: 'palette.text({isSelected: true, hasFocus: true})',
    description: 'Selected text in the focused control.',
    resolveStyle: palette => palette.text({isSelected: true, hasFocus: true}),
  },
]

const selectedPurpose = {index: 0}
const rowViews = ENTRIES.map(createRow)
const selector = new ToggleGroup({
  titles: PURPOSES.map(formatPurpose),
  selected: [selectedPurpose.index],
  onChange(changed) {
    selectedPurpose.index = changed
    refresh()
  },
})

refresh()

demo(
  Stack.down({
    children: [
      selector,
      new Space({height: 1}),
      new Separator({direction: 'horizontal'}),
      new Space({height: 1}),
      ['flex1', Scrollable.down({children: buildRows()})],
    ],
  }),
)

function buildRows() {
  const children = [] as Array<
    Text | ReturnType<typeof Stack.right> | Space | Separator
  >
  let currentSection: string | undefined

  for (const [index, entry] of ENTRIES.entries()) {
    if (entry.section !== currentSection) {
      if (currentSection) {
        children.push(new Space({height: 1}))
        children.push(new Separator({direction: 'horizontal'}))
        children.push(new Space({height: 1}))
      }
      currentSection = entry.section
      children.push(new Text({text: entry.section, style: SECTION_STYLE}))
      children.push(new Space({height: 1}))
      children.push(headerRow())
      children.push(new Space({height: 1}))
    }

    children.push(rowViews[index].view)
    children.push(new Space({height: 1}))
  }

  return children
}

function createRow(entry: PaletteEntry) {
  const foregroundLabel = swatch()
  const backgroundLabel = swatch()
  const flagsLabel = new Text({text: '', width: FLAGS_WIDTH})

  return {
    view: Stack.right([
      new Text({text: entry.state, width: STATE_WIDTH}),
      new Text({text: entry.api, width: API_WIDTH, wrap: true}),
      foregroundLabel,
      backgroundLabel,
      flagsLabel,
      new Text({text: entry.description, width: DESCRIPTION_WIDTH, wrap: true}),
    ]),
    update(palette: Palette) {
      const style = entry.resolveStyle(palette)
      foregroundLabel.text = paddedSwatchText(colorLabel(style.foreground))
      foregroundLabel.style = style
      backgroundLabel.text = paddedSwatchText(colorLabel(style.background))
      backgroundLabel.style = style
      flagsLabel.text = styleFlags(style)
    },
  }
}

function swatch() {
  return new Text({
    text: SWATCH_PLACEHOLDER,
    width: SWATCH_WIDTH,
    alignment: 'center',
  })
}

function headerRow() {
  return Stack.right([
    new Text({text: 'State', width: STATE_WIDTH, style: HEADER_STYLE}),
    new Text({text: 'API', width: API_WIDTH, style: HEADER_STYLE}),
    new Text({
      text: 'Foreground',
      width: SWATCH_WIDTH,
      alignment: 'center',
      style: HEADER_STYLE,
    }),
    new Text({
      text: 'Background',
      width: SWATCH_WIDTH,
      alignment: 'center',
      style: HEADER_STYLE,
    }),
    new Text({text: 'Flags', width: FLAGS_WIDTH, style: HEADER_STYLE}),
    new Text({text: 'Use', width: DESCRIPTION_WIDTH, style: HEADER_STYLE}),
  ])
}

function refresh() {
  const palette = paletteForPurpose(PURPOSES[selectedPurpose.index])
  for (const row of rowViews) row.update(palette)
}

function paletteForPurpose(purpose: (typeof PURPOSES)[number]) {
  return Palette[purpose]
}

function formatPurpose(purpose: string) {
  return purpose[0].toUpperCase() + purpose.slice(1)
}

function colorLabel(color: Color | undefined) {
  if (color === undefined || color === 'default') return 'default'
  return colorToHex(color).replace(/\(.+\)$/, '')
}

function paddedSwatchText(text: string) {
  return `${SWATCH_PADDING}${text}${SWATCH_PADDING}`
}

function styleFlags(style: Style) {
  return [
    style.bold && 'bold',
    style.dim && 'dim',
    style.italic && 'italic',
    style.underline && 'underline',
    style.inverse && 'inverse',
  ]
    .filter(Boolean)
    .join(', ')
}
