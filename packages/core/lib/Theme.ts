import type {Color} from './Color.js'
import {Style} from './Style.js'

export type Purpose =
  | 'primary' // aka blue
  | 'blue'
  | 'secondary' // aka orange
  | 'orange'
  | 'proceed' // aka green
  | 'green'
  | 'cancel' // aka red
  | 'red'
  | 'selected'
  | 'plain'

const defaultText = 'default'
const defaultContrastText = '#FFF(16)'
const defaultDimText = '#808080(239)'
const defaultDimBackground = '#434343(238)'

interface Props {
  text?: Color
  dimText?: Color
  dimBackground?: Color
  contrastText?: Color
  controlBackground: Color
  textBackground?: Color
  highlight: Color
  darken: Color
  tableChecked?: Color
  tableCheckedHighlight?: Color
  emoji?: boolean
}

export class Theme {
  textColor: Color
  contrastTextColor: Color
  dimTextColor: Color
  dimBackgroundColor: Color
  controlBackgroundColor: Color
  textBackgroundColor: Color
  highlightColor: Color
  darkenColor: Color
  tableCheckedColor: Color
  tableCheckedHighlightColor: Color
  emoji: boolean

  static plain = new Theme({
    controlBackground: '#4F4F4F(239)',
    textBackground: 'default',
    highlight: '#616161(241)',
    darken: '#3F3F3F(237)',
    tableChecked: '#3a2040',
    tableCheckedHighlight: '#4d2a55',
  })
  static primary = new Theme({
    controlBackground: '#3B5EA7',
    textBackground: '#273F70',
    highlight: '#5A7AC2',
    darken: '#314F8C',
    tableChecked: '#6b4a1d',
    tableCheckedHighlight: '#8a5f24',
    text: '#E2E2E2(253)',
    contrastText: '#5A7AC2',
    dimText: '#314F8C',
  })
  static secondary = new Theme({
    controlBackground: '#D0851C',
    textBackground: '#805211',
    highlight: '#D0924B',
    darken: '#A66A16',
    tableChecked: '#234a7a',
    tableCheckedHighlight: '#2e629f',
    text: '#E2E2E2(253)',
    contrastText: '#D0924B',
    dimText: '#A66A16',
  })
  static proceed = new Theme({
    controlBackground: '#4A7A5B',
    textBackground: '#2E4E3A',
    highlight: '#58A877',
    darken: '#3D664C',
    tableChecked: '#5a3a70',
    tableCheckedHighlight: '#71498d',
    text: '#E2E2E2(253)',
    contrastText: '#58A877',
    dimText: '#3D664C',
  })
  static cancel = new Theme({
    controlBackground: '#A04A4C',
    textBackground: '#5B282A',
    highlight: '#C46264',
    darken: '#853D3F',
    tableChecked: '#1f5b63',
    tableCheckedHighlight: '#2b737d',
    text: '#E2E2E2(253)',
    contrastText: '#C46264',
    dimText: '#853D3F',
  })
  static selected = new Theme({
    text: '#383838(236)',
    controlBackground: '#BDBDBD(250)',
    textBackground: '#BDBDBD(250)',
    highlight: '#E6E6E6(254)',
    darken: '#7F7F7F(243)',
    tableChecked: '#8fa1c8',
    tableCheckedHighlight: '#a7b8dc',
  })
  static red = Theme.cancel
  static green = Theme.proceed
  static blue = Theme.primary
  static orange = Theme.secondary

  constructor({
    text,
    contrastText,
    dimText,
    dimBackground,
    controlBackground,
    textBackground,
    highlight,
    darken,
    tableChecked,
    tableCheckedHighlight,
    emoji,
  }: Props) {
    this.textColor = text ?? defaultText
    this.contrastTextColor = contrastText ?? defaultContrastText
    this.dimTextColor = dimText ?? defaultDimText
    this.dimBackgroundColor = dimBackground ?? defaultDimBackground
    this.controlBackgroundColor = controlBackground
    this.textBackgroundColor = textBackground ?? controlBackground
    this.highlightColor = highlight
    this.darkenColor = darken
    this.tableCheckedColor = tableChecked ?? Theme.plain.tableCheckedColor
    this.tableCheckedHighlightColor =
      tableCheckedHighlight ?? Theme.plain.tableCheckedHighlightColor
    this.emoji = emoji ?? true
  }

  /**
   * "Ornament" is meant to draw decorative characters that disappear on hover/press
   */
  ui({
    isPressed,
    isHover,
    isOrnament,
  }: {
    isPressed?: boolean
    isHover?: boolean
    isOrnament?: boolean
  } = {}): Style {
    if (isPressed) {
      return new Style({
        foreground: isOrnament ? this.darkenColor : this.textColor,
        background: this.darkenColor,
      })
    } else if (isHover) {
      return new Style({
        foreground: isOrnament ? this.highlightColor : this.textColor,
        background: this.highlightColor,
      })
    } else if (isOrnament) {
      return new Style({
        foreground: this.darkenColor,
        background: this.controlBackgroundColor,
      })
    } else {
      return new Style({
        foreground: this.textColor,
        background: this.controlBackgroundColor,
      })
    }
  }

  /**
   * Creates a text style using the current theme.
   *
   * Not all combinations are supported:
   * - isSelected and isPlaceholder revert to just isPlaceholder
   */
  text({
    isPressed,
    isHover,
    isSelected,
    isPlaceholder,
    hasFocus,
  }: {
    isPressed?: boolean
    isHover?: boolean
    isSelected?: boolean
    isPlaceholder?: boolean
    hasFocus?: boolean
  } = {}): Style {
    if (isPlaceholder) {
      return new Style({
        foreground: isPressed ? this.textColor : this.dimTextColor,
        background: isHover
          ? this.dimBackgroundColor
          : this.textBackgroundColor,
        bold: hasFocus,
      })
    }

    if (isPressed) {
      return new Style({
        foreground: this.highlightColor,
        background: this.textBackgroundColor,
        inverse: hasFocus && isSelected,
        bold: hasFocus,
      })
    }

    if (isHover) {
      return new Style({
        foreground: this.contrastTextColor,
        background: this.textBackgroundColor,
        inverse: hasFocus && isSelected,
        bold: hasFocus,
      })
    }

    if (isSelected && !hasFocus) {
      return new Style({
        foreground: this.dimTextColor,
        background: this.dimBackgroundColor,
      })
    }

    return new Style({
      foreground: this.textColor,
      background: this.textBackgroundColor,
      inverse: hasFocus && isSelected,
      bold: hasFocus,
    })
  }

  merge(props: Partial<Props>): Theme {
    return new Theme({
      text: props.text ?? this.textColor,
      contrastText: props.contrastText ?? this.contrastTextColor,
      dimText: props.dimText ?? this.dimTextColor,
      dimBackground: props.dimBackground ?? this.dimBackgroundColor,
      controlBackground:
        props.controlBackground ?? this.controlBackgroundColor,
      textBackground:
        props.textBackground ?? this.textBackgroundColor,
      highlight: props.highlight ?? this.highlightColor,
      darken: props.darken ?? this.darkenColor,
      tableChecked:
        props.tableChecked ?? this.tableCheckedColor,
      tableCheckedHighlight:
        props.tableCheckedHighlight ??
        this.tableCheckedHighlightColor,
      emoji: props.emoji ?? this.emoji,
    })
  }
}
