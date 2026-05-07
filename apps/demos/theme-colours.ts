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
  section: 'UI' | 'Text'
  api: string
  styleSource: string
  description: string
  resolveStyle: (palette: Palette) => Style
}

const API_WIDTH = 30
const SWATCH_WIDTH = 18
const STYLE_WIDTH = 28
const DESCRIPTION_WIDTH = 50
const EXAMPLE_TEXT = 'Example'
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
    section: 'UI',
    api: 'palette.ui()',
    styleSource: styleSource(['foreground: text', 'background: background']),
    description:
      'Default surface for buttons, dropdown triggers, and other interactive chrome.',
    resolveStyle: palette => palette.ui(),
  },
  {
    section: 'UI',
    api: 'palette.ui({\n  isOrnament: true,\n})',
    styleSource: styleSource(['foreground: darken', 'background: background']),
    description:
      'Decorative control chrome, like borders and caps that recede until hover or press.',
    resolveStyle: palette => palette.ui({isOrnament: true}),
  },
  {
    section: 'UI',
    api: 'palette.ui({\n  isHover: true,\n})',
    styleSource: styleSource(['foreground: text', 'background: highlight']),
    description: 'Hovered or focused control surface.',
    resolveStyle: palette => palette.ui({isHover: true}),
  },
  {
    section: 'UI',
    api: 'palette.ui({\n  isHover: true,\n  isOrnament: true,\n})',
    styleSource: styleSource([
      'foreground: highlight',
      'background: highlight',
    ]),
    description:
      'Hovered ornament colour for button tops, borders, and other decorative chrome.',
    resolveStyle: palette => palette.ui({isHover: true, isOrnament: true}),
  },
  {
    section: 'UI',
    api: 'palette.ui({\n  isPressed: true,\n})',
    styleSource: styleSource(['foreground: text', 'background: darken']),
    description: 'Pressed control surface.',
    resolveStyle: palette => palette.ui({isPressed: true}),
  },
  {
    section: 'UI',
    api: 'palette.ui({\n  isPressed: true,\n  isOrnament: true,\n})',
    styleSource: styleSource(['foreground: darken', 'background: darken']),
    description:
      'Pressed ornament colour for borders and decorative control pieces.',
    resolveStyle: palette => palette.ui({isPressed: true, isOrnament: true}),
  },
  {
    section: 'Text',
    api: 'palette.text()',
    styleSource: styleSource(['foreground: text', 'background: textBg']),
    description: 'Default readable text on text surfaces.',
    resolveStyle: palette => palette.text(),
  },
  {
    section: 'Text',
    api: 'palette.text({\n  hasFocus: true,\n})',
    styleSource: styleSource([
      'foreground: text',
      'background: textBg',
      'bold: true',
    ]),
    description: 'Focused text, used heavily in inputs and editable text.',
    resolveStyle: palette => palette.text({hasFocus: true}),
  },
  {
    section: 'Text',
    api: 'palette.text({\n  hasFocus: true,\n  isSelected: true,\n})',
    styleSource: styleSource([
      'foreground: text',
      'background: textBg',
      'inverse: true',
      'bold: true',
    ]),
    description: 'Focused text selection, rendered as an inverse highlight.',
    resolveStyle: palette => palette.text({hasFocus: true, isSelected: true}),
  },
  {
    section: 'Text',
    api: 'palette.text({\n  isSelected: true,\n})',
    styleSource: styleSource(['foreground: dimText', 'background: dimBg']),
    description: 'Unfocused selection with dimmed selected colours.',
    resolveStyle: palette => palette.text({isSelected: true}),
  },
  {
    section: 'Text',
    api: 'palette.text({\n  isHover: true,\n})',
    styleSource: styleSource(['foreground: contrast', 'background: textBg']),
    description:
      'Hovered interactive text, like collapsible labels and drawer text.',
    resolveStyle: palette => palette.text({isHover: true}),
  },
  {
    section: 'Text',
    api: 'palette.text({\n  isHover: true,\n  hasFocus: true,\n})',
    styleSource: styleSource([
      'foreground: contrast',
      'background: textBg',
      'bold: true',
    ]),
    description: 'Hovered text while the control is focused.',
    resolveStyle: palette => palette.text({isHover: true, hasFocus: true}),
  },
  {
    section: 'Text',
    api: 'palette.text({\n  isHover: true,\n  hasFocus: true,\n  isSelected: true,\n})',
    styleSource: styleSource([
      'foreground: contrast',
      'background: textBg',
      'inverse: true',
      'bold: true',
    ]),
    description:
      'Hovered focused selection, keeping the inverse selected treatment.',
    resolveStyle: palette =>
      palette.text({isHover: true, hasFocus: true, isSelected: true}),
  },
  {
    section: 'Text',
    api: 'palette.text({\n  isPressed: true,\n})',
    styleSource: styleSource(['foreground: highlight', 'background: textBg']),
    description: 'Pressed interactive text.',
    resolveStyle: palette => palette.text({isPressed: true}),
  },
  {
    section: 'Text',
    api: 'palette.text({\n  isPressed: true,\n  hasFocus: true,\n})',
    styleSource: styleSource([
      'foreground: highlight',
      'background: textBg',
      'bold: true',
    ]),
    description: 'Pressed text while the control is focused.',
    resolveStyle: palette => palette.text({isPressed: true, hasFocus: true}),
  },
  {
    section: 'Text',
    api: 'palette.text({\n  isPressed: true,\n  hasFocus: true,\n  isSelected: true,\n})',
    styleSource: styleSource([
      'foreground: highlight',
      'background: textBg',
      'inverse: true',
      'bold: true',
    ]),
    description: 'Pressed focused selection.',
    resolveStyle: palette =>
      palette.text({isPressed: true, hasFocus: true, isSelected: true}),
  },
  {
    section: 'Text',
    api: 'palette.text({\n  isPlaceholder: true,\n})',
    styleSource: styleSource(['foreground: dimText', 'background: textBg']),
    description:
      'Placeholder text in inputs and other empty text-entry surfaces.',
    resolveStyle: palette => palette.text({isPlaceholder: true}),
  },
  {
    section: 'Text',
    api: 'palette.text({\n  isPlaceholder: true,\n  isHover: true,\n})',
    styleSource: styleSource(['foreground: dimText', 'background: dimBg']),
    description: 'Hovered placeholder text.',
    resolveStyle: palette => palette.text({isPlaceholder: true, isHover: true}),
  },
  {
    section: 'Text',
    api: 'palette.text({\n  isPlaceholder: true,\n  isPressed: true,\n})',
    styleSource: styleSource(['foreground: text', 'background: textBg']),
    description: 'Pressed placeholder text.',
    resolveStyle: palette =>
      palette.text({isPlaceholder: true, isPressed: true}),
  },
  {
    section: 'Text',
    api: 'palette.text({\n  isPlaceholder: true,\n  hasFocus: true,\n})',
    styleSource: styleSource([
      'foreground: dimText',
      'background: textBg',
      'bold: true',
    ]),
    description: 'Focused placeholder text, which becomes bold to show focus.',
    resolveStyle: palette =>
      palette.text({isPlaceholder: true, hasFocus: true}),
  },
]

const selectedPurpose = {
  index: 0,
}

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
      ['flex1', Scrollable.down({children: buildSections()})],
    ],
  }),
)

function buildSections() {
  const children = [] as Array<
    Text | ReturnType<typeof Stack.right> | Space | Separator
  >
  let currentSection: PaletteEntry['section'] | undefined

  for (const [index, entry] of ENTRIES.entries()) {
    if (entry.section !== currentSection) {
      if (currentSection) {
        children.push(new Space({height: 1}))
        children.push(new Separator({direction: 'horizontal'}))
        children.push(new Space({height: 1}))
      }
      currentSection = entry.section
      children.push(
        new Text({
          text: entry.section,
          style: SECTION_STYLE,
        }),
      )
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
  const foregroundLabel = new Text({
    text: SWATCH_PLACEHOLDER,
    width: SWATCH_WIDTH,
    alignment: 'center',
  })
  const backgroundLabel = new Text({
    text: SWATCH_PLACEHOLDER,
    width: SWATCH_WIDTH,
    alignment: 'center',
  })
  const example = new Text({
    text: EXAMPLE_TEXT,
    width: SWATCH_WIDTH,
    alignment: 'center',
  })
  const styleText = new Text({
    text: entry.styleSource,
    width: STYLE_WIDTH,
    wrap: true,
  })

  return {
    view: Stack.right([
      new Text({text: entry.api, width: API_WIDTH}),
      Stack.down({children: [foregroundLabel, backgroundLabel, example]}),
      styleText,
      new Text({text: entry.description, width: DESCRIPTION_WIDTH, wrap: true}),
    ]),
    update(palette: Palette) {
      const style = entry.resolveStyle(palette)
      const foreground = style.foreground ?? 'default'
      const background = style.background ?? 'default'

      foregroundLabel.text = paddedSwatchText(colorLabel(foreground))
      foregroundLabel.style = style
      backgroundLabel.text = paddedSwatchText(colorLabel(background))
      backgroundLabel.style = style
      example.text = paddedSwatchText(EXAMPLE_TEXT)
      example.style = style
    },
  }
}

function headerRow() {
  return Stack.right([
    new Text({text: 'API', width: API_WIDTH, style: HEADER_STYLE}),
    new Text({
      text: 'Colours',
      width: SWATCH_WIDTH,
      alignment: 'center',
      style: HEADER_STYLE,
    }),
    new Text({
      text: 'Style',
      width: STYLE_WIDTH,
      style: HEADER_STYLE,
    }),
    new Text({text: 'Use', width: DESCRIPTION_WIDTH, style: HEADER_STYLE}),
  ])
}

function refresh() {
  const purpose = PURPOSES[selectedPurpose.index]
  const palette = paletteForPurpose(purpose)

  for (const row of rowViews) {
    row.update(palette)
  }
}

function paletteForPurpose(purpose: (typeof PURPOSES)[number]) {
  switch (purpose) {
    case 'primary':
      return Palette.primary
    case 'secondary':
      return Palette.secondary
    case 'proceed':
      return Palette.proceed
    case 'cancel':
      return Palette.cancel
    case 'selected':
      return Palette.selected
    case 'plain':
      return Palette.plain
  }
}

function formatPurpose(purpose: string) {
  return purpose[0].toUpperCase() + purpose.slice(1)
}

function colorLabel(color: Color) {
  return colorToHex(color).replace(/\(.+\)$/, '')
}

function paddedSwatchText(text: string) {
  return `${SWATCH_PADDING}${text}${SWATCH_PADDING}`
}

function styleSource(lines: string[]) {
  return `Style({\n  ${lines.join('\n  ')}\n})`
}
