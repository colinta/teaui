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

const defaultText = '#E2E2E2(253)'
const defaultBrightText = '#FFF(16)'
const defaultDimText = '#808080(239)'
const defaultDimBackground = '#434343(238)'

interface Props {
  text?: Color
  dimText?: Color
  dimBackground?: Color
  brightText?: Color
  background: Color
  textBackground?: Color
  highlight: Color
  darken: Color
  emoji?: boolean
}

export class Theme {
  textColor: Color
  brightTextColor: Color
  dimTextColor: Color
  dimBackgroundColor: Color
  backgroundColor: Color
  textBackgroundColor: Color
  highlightColor: Color
  darkenColor: Color
  emoji: boolean

  static plain = new Theme({
    background: '#4F4F4F(239)',
    textBackground: 'default',
    highlight: '#616161(241)',
    darken: '#3F3F3F(237)',
  })
  static primary = new Theme({
    background: '#0032FA',
    textBackground: '#00197F',
    highlight: '#0074FF',
    darken: '#002AD3',
    text: '#E2E2E2(253)',
    brightText: '#0074FF',
    dimText: '#0058C8',
  })
  static secondary = new Theme({
    background: '#D0851C',
    textBackground: '#805211',
    highlight: '#F39614',
    darken: '#A66A16',
    text: '#E2E2E2(253)',
    brightText: '#F39614',
    dimText: '#A66A16',
  })
  static proceed = new Theme({
    background: '#108040',
    textBackground: '#073F20',
    highlight: '#1EB317',
    darken: '#0C6030',
    text: '#E2E2E2(253)',
    brightText: '#1EB317',
    dimText: '#0C6030',
  })
  static cancel = new Theme({
    background: '#981618',
    textBackground: '#4A0A0B',
    highlight: '#C51B1E',
    darken: '#821113',
    text: '#E2E2E2(253)',
    brightText: '#C51B1E',
    dimText: '#821113',
  })
  static selected = new Theme({
    text: '#383838(236)',
    background: '#BDBDBD(250)',
    textBackground: '#BDBDBD(250)',
    highlight: '#E6E6E6(254)',
    darken: '#7F7F7F(243)',
  })
  static red = Theme.cancel
  static green = Theme.proceed
  static blue = Theme.primary
  static orange = Theme.secondary

  constructor({
    text,
    brightText,
    dimText,
    dimBackground,
    background,
    textBackground,
    highlight,
    darken,
    emoji,
  }: Props) {
    this.textColor = text ?? defaultText
    this.brightTextColor = brightText ?? defaultBrightText
    this.dimTextColor = dimText ?? defaultDimText
    this.dimBackgroundColor = dimBackground ?? defaultDimBackground
    this.backgroundColor = background
    this.textBackgroundColor = textBackground ?? background
    this.highlightColor = highlight
    this.darkenColor = darken
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
        background: this.backgroundColor,
      })
    } else {
      return new Style({
        foreground: this.textColor,
        background: this.backgroundColor,
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
        foreground: this.brightTextColor,
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
}
