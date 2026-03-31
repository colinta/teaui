import {
  AutoLegend,
  Button,
  colorToHex,
  colors,
  Digits,
  Input,
  Slider,
  Space,
  Stack,
  Text,
  Theme,
  type Color,
  type Purpose,
} from '@teaui/core'

import {demo} from './demo.js'

const ROW_LABEL_WIDTH = 22
const CELL_WIDTH = 9

function pad(num: number) {
  if (num < 10) {
    return `0${num}`
  } else {
    return `${num}`
  }
}

function setRGB(red: number, green: number, blue: number) {
  rgb[0] = red
  rgb[1] = green
  rgb[2] = blue
  update()
}

function setRGBFromHex(hex: string) {
  const [red, green, blue] = colors.hexToRGB(hex)
  setRGB(red, green, blue)
}

function themeColorHex(theme: Theme, color: Color): `#${string}` {
  const resolved = color === 'default' ? theme.textBackgroundColor : color
  const hex = colorToHex(resolved)
  const [red, green, blue] = colors.hexToRGB(hex.replace(/\(.+\)$/, ''))
  return colors.RGBtoHex(red, green, blue)
}

const swatch = new Space({background: '#000', height: 'fill'})
const rgb = [
  Math.floor(Math.random() * 255),
  Math.floor(Math.random() * 255),
  Math.floor(Math.random() * 255),
] as [number, number, number]

const redInput = new Input({
    value: `${pad(rgb[0])}`,
    padding: {top: 1},
    onChange: text => {
      const value = Number.parseFloat(text)
      if (!Number.isNaN(value)) {
        rgb[0] = Math.round(value)
        update()
      }
    },
  }),
  greenInput = new Input({
    value: `${pad(rgb[1])}`,
    padding: {top: 1},
    onChange: text => {
      const value = Number.parseFloat(text)
      if (!Number.isNaN(value)) {
        rgb[1] = Math.round(value)
        update()
      }
    },
  }),
  blueInput = new Input({
    value: `${pad(rgb[2])}`,
    padding: {top: 1},
    onChange: text => {
      const value = Number.parseFloat(text)
      if (!Number.isNaN(value)) {
        rgb[2] = Math.round(value)
        update()
      }
    },
  })

const rgbText1 = new Digits({text: '', bold: true})
const rgbText2 = new Digits({text: '', bold: false})
function updateText(text: string) {
  rgbText1.text = text
  rgbText2.text = text
}
const ansiText = new Text()

const update = () => {
  rgb[0] = Math.max(0, Math.min(255, rgb[0]))
  rgb[1] = Math.max(0, Math.min(255, rgb[1]))
  rgb[2] = Math.max(0, Math.min(255, rgb[2]))
  // const rgb = colors.HSBtoRGB(rgb[0] / 360, rgb[1] / 100, rgb[2] / 100)
  const sgr = colors.match(...rgb, undefined)
  let ansi = `\x1b[38;5;${sgr};48;5;${sgr}m      \x1b[39;49m`
  ansi = [ansi, ansi, ansi].join('\n') + ` (6bit: ${sgr})`
  updateText(colors.RGBtoHex(...rgb))
  ansiText.text = ansi
  swatch.background = colors.RGBtoHex(...rgb) as Color

  redInput.value = `${rgb[0]}`
  greenInput.value = `${rgb[1]}`
  blueInput.value = `${rgb[2]}`
}
update()

const themeColumns = [
  {name: 'primary', purpose: 'primary', theme: Theme.primary},
  {name: 'secondary', purpose: 'secondary', theme: Theme.secondary},
  {name: 'proceed', purpose: 'proceed', theme: Theme.proceed},
  {name: 'cancel', purpose: 'cancel', theme: Theme.cancel},
  {name: 'selected', purpose: 'selected', theme: Theme.selected},
  {name: 'plain', purpose: 'plain', theme: Theme.plain},
] as const satisfies readonly {name: string; purpose: Purpose; theme: Theme}[]

const themeRows = [
  {name: 'text', key: 'textColor'},
  {name: 'contrastText', key: 'contrastTextColor'},
  {name: 'dimText', key: 'dimTextColor'},
  {name: 'dimBackground', key: 'dimBackgroundColor'},
  {name: 'controlBackground', key: 'controlBackgroundColor'},
  {name: 'textBackground', key: 'textBackgroundColor'},
  {name: 'highlight', key: 'highlightColor'},
  {name: 'darken', key: 'darkenColor'},
  {name: 'tableChecked', key: 'tableCheckedColor'},
  {name: 'tableCheckedHighlight', key: 'tableCheckedHighlightColor'},
] as const

function themeHeaderRow(start: number, end: number) {
  return Stack.right(
    [
      new Text({text: '', width: ROW_LABEL_WIDTH}),
      ...themeColumns
        .slice(start, end)
        .map(
          ({name}) =>
            new Text({text: name, width: CELL_WIDTH, alignment: 'center'}),
        ),
    ],
    {fill: false, gap: 1},
  )
}

function themeValueRow(
  row: (typeof themeRows)[number],
  start: number,
  end: number,
) {
  return Stack.right(
    [
      new Text({text: row.name, width: ROW_LABEL_WIDTH}),
      ...themeColumns.slice(start, end).map(({purpose, theme}) => {
        const isBackground = row.name !== 'text' && !row.name.endsWith('Text')
        const hex = themeColorHex(theme, (theme as any)[row.key] as Color)
        return new Button({
          title: hex,
          width: CELL_WIDTH,
          theme: purpose,
          border: 'none',
          foreground: isBackground ? undefined : hex,
          background: isBackground ? hex : undefined,
          onClick() {
            setRGBFromHex(hex)
          },
        })
      }),
    ],
    {fill: false, gap: 1},
  )
}

function themeGrid(start: number, end: number) {
  return Stack.down(
    [
      themeHeaderRow(start, end),
      ...themeRows.map(row => themeValueRow(row, start, end)),
    ],
    {fill: false},
  )
}

const builtInColors = Stack.right([themeGrid(0, 3), themeGrid(3, 6)], {
  fill: false,
  gap: 4,
})

demo(
  Stack.down([
    [
      'flex1',
      Stack.right([
        [
          'flex1',
          Stack.down([
            ['flex1', swatch],
            Stack.right([rgbText1, ansiText]),
            rgbText2,
          ]),
        ],
        [
          'flex1',
          Stack.right([
            new Slider({
              direction: 'vertical',
              range: [0, 255],
              value: rgb[0],
              buttons: true,
              step: 1,
              border: true,
              onChange(value) {
                rgb[0] = Math.round(value)
                update()
              },
            }),
            new Slider({
              theme: 'green',
              direction: 'vertical',
              range: [0, 255],
              value: rgb[1],
              buttons: true,
              border: true,
              step: 1,
              onChange(value) {
                rgb[1] = Math.round(value)
                update()
              },
            }),
            new Slider({
              theme: 'blue',
              direction: 'vertical',
              range: [0, 255],
              value: rgb[2],
              buttons: true,
              border: true,
              step: 1,
              onChange(value) {
                rgb[2] = Math.round(value)
                update()
              },
            }),
            redInput,
            greenInput,
            blueInput,
          ]),
        ],
      ]),
    ],
    builtInColors,
    new AutoLegend(),
  ]),
)
