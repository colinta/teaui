import type {Color} from './Color.js'
import {Style} from './Style.js'

const DEFAULT_TEXT = 'default'
const DEFAULT_MUTED_TEXT = '#808080(239)'
const DEFAULT_SCRIM_TEXT = '#808080(239)'
const DEFAULT_SCRIM_BACKGROUND = '#434343(238)'

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

export type UIState = {
  variant?: 'flat' | 'raised'
  isPressed?: boolean
  isHover?: boolean
  hasFocus?: boolean
  isOrnament?: boolean
  isSelected?: boolean
  isPlaceholder?: boolean
}

export type TextTone = 'default' | 'muted' | 'placeholder' | 'accent'

export type TextState = {
  tone?: TextTone
  isSelected?: boolean
  hasFocus?: boolean
}

export interface PaletteProps {
  text?: Color
  mutedText?: Color
  placeholderText?: Color
  accentText?: Color
  flatBackground?: Color
  raisedBackground: Color
  hoverBackground: Color
  focusBackground: Color
  pressedBackground: Color
  selectionText?: Color
  selectionBackground?: Color
  inactiveSelectionText?: Color
  inactiveSelectionBackground?: Color
  scrimText?: Color
  scrimBackground?: Color
  checkedBackground?: Color
  checkedSelectionBackground?: Color
  emoji?: boolean
}

/**
 * Semantic colors for passive surfaces, controls, interaction states, and text.
 *
 * `ui()` resolves interactive states using this precedence:
 * pressed > focus > hover > rest.
 *
 * Flat controls are the default and rest on `flatBackgroundColor` so they
 * blend into a parent surface. Raised controls opt into
 * `raisedBackgroundColor`.
 */
export class Palette {
  textColor: Color
  mutedTextColor: Color
  placeholderTextColor: Color
  accentTextColor: Color
  flatBackgroundColor: Color
  raisedBackgroundColor: Color
  hoverBackgroundColor: Color
  focusBackgroundColor: Color
  pressedBackgroundColor: Color
  selectionTextColor: Color
  selectionBackgroundColor: Color
  inactiveSelectionTextColor: Color
  inactiveSelectionBackgroundColor: Color
  scrimTextColor: Color
  scrimBackgroundColor: Color
  checkedBackgroundColor: Color
  checkedSelectionBackgroundColor: Color
  emoji: boolean

  static plain = new Palette({
    raisedBackground: '#4F4F4F(239)',
    flatBackground: 'default',
    hoverBackground: '#616161(241)',
    focusBackground: '#3F3F3F(237)',
    pressedBackground: '#303030(236)',
    placeholderText: '#A0A0A0(247)',
    checkedBackground: '#3a2040',
    checkedSelectionBackground: '#4d2a55',
  })
  static primary = new Palette({
    raisedBackground: '#3B5EA7',
    flatBackground: '#273F70',
    hoverBackground: '#5A7AC2',
    focusBackground: '#21365F',
    pressedBackground: '#1B2C4E',
    checkedBackground: '#6b4a1d',
    checkedSelectionBackground: '#8a5f24',
    text: '#E2E2E2(253)',
    accentText: '#5A7AC2',
    mutedText: '#738CC1',
    placeholderText: '#8FA6D3',
  })
  static secondary = new Palette({
    raisedBackground: '#D0851C',
    flatBackground: '#805211',
    hoverBackground: '#D0924B',
    focusBackground: '#6D460E',
    pressedBackground: '#5A390C',
    checkedBackground: '#234a7a',
    checkedSelectionBackground: '#2e629f',
    text: '#E2E2E2(253)',
    accentText: '#D0924B',
    mutedText: '#D9AC6C',
    placeholderText: '#F2D09B',
  })
  static proceed = new Palette({
    raisedBackground: '#4A7A5B',
    flatBackground: '#2E4E3A',
    hoverBackground: '#58A877',
    focusBackground: '#274231',
    pressedBackground: '#203729',
    checkedBackground: '#5a3a70',
    checkedSelectionBackground: '#71498d',
    text: '#E2E2E2(253)',
    accentText: '#58A877',
    mutedText: '#7FB491',
    placeholderText: '#9BC5AA',
  })
  static cancel = new Palette({
    raisedBackground: '#A04A4C',
    flatBackground: '#5B282A',
    hoverBackground: '#C46264',
    focusBackground: '#4D2224',
    pressedBackground: '#401C1D',
    checkedBackground: '#1f5b63',
    checkedSelectionBackground: '#2b737d',
    text: '#E2E2E2(253)',
    accentText: '#C46264',
    mutedText: '#C98284',
    placeholderText: '#D9A0A1',
  })
  static selected = new Palette({
    text: '#383838(236)',
    mutedText: '#5A5A5A(240)',
    placeholderText: '#666666(241)',
    raisedBackground: '#BDBDBD(250)',
    flatBackground: '#BDBDBD(250)',
    hoverBackground: '#E6E6E6(254)',
    focusBackground: '#A1A1A1(247)',
    pressedBackground: '#8E8E8E(245)',
    checkedBackground: '#8fa1c8',
    checkedSelectionBackground: '#a7b8dc',
  })
  static red = Palette.cancel
  static green = Palette.proceed
  static blue = Palette.primary
  static orange = Palette.secondary

  constructor({
    text,
    mutedText,
    placeholderText,
    accentText,
    flatBackground,
    raisedBackground,
    hoverBackground,
    focusBackground,
    pressedBackground,
    selectionText,
    selectionBackground,
    inactiveSelectionText,
    inactiveSelectionBackground,
    scrimText,
    scrimBackground,
    checkedBackground,
    checkedSelectionBackground,
    emoji,
  }: PaletteProps) {
    this.textColor = text ?? DEFAULT_TEXT
    this.mutedTextColor = mutedText ?? DEFAULT_MUTED_TEXT
    this.placeholderTextColor = placeholderText ?? this.mutedTextColor
    this.accentTextColor = accentText ?? this.textColor
    this.flatBackgroundColor = flatBackground ?? raisedBackground
    this.raisedBackgroundColor = raisedBackground
    this.hoverBackgroundColor = hoverBackground
    this.focusBackgroundColor = focusBackground
    this.pressedBackgroundColor = pressedBackground
    this.selectionTextColor = selectionText ?? this.textColor
    this.selectionBackgroundColor = selectionBackground ?? hoverBackground
    this.inactiveSelectionTextColor =
      inactiveSelectionText ?? this.mutedTextColor
    this.inactiveSelectionBackgroundColor =
      inactiveSelectionBackground ?? focusBackground
    this.scrimTextColor = scrimText ?? DEFAULT_SCRIM_TEXT
    this.scrimBackgroundColor = scrimBackground ?? DEFAULT_SCRIM_BACKGROUND
    this.checkedBackgroundColor =
      checkedBackground ?? Palette.plain.checkedBackgroundColor
    this.checkedSelectionBackgroundColor =
      checkedSelectionBackground ??
      Palette.plain.checkedSelectionBackgroundColor
    this.emoji = emoji ?? true
  }

  ui({
    variant = 'flat',
    isPressed = false,
    isHover = false,
    hasFocus = false,
    isOrnament = false,
    isSelected = false,
    isPlaceholder = false,
  }: UIState = {}): Style {
    const background = isPressed
      ? this.pressedBackgroundColor
      : hasFocus
        ? this.focusBackgroundColor
        : isHover
          ? this.hoverBackgroundColor
          : variant === 'raised'
            ? this.raisedBackgroundColor
            : this.flatBackgroundColor

    if (isOrnament) {
      return new Style({
        foreground:
          isPressed || hasFocus || isHover
            ? background
            : this.pressedBackgroundColor,
        background,
      })
    }

    if (isSelected) {
      return new Style({
        foreground: hasFocus
          ? this.selectionTextColor
          : this.inactiveSelectionTextColor,
        background: hasFocus
          ? this.selectionBackgroundColor
          : this.inactiveSelectionBackgroundColor,
      })
    }

    return new Style({
      foreground: isPlaceholder ? this.placeholderTextColor : this.textColor,
      background,
    })
  }

  text({
    tone = 'default',
    isSelected = false,
    hasFocus = false,
  }: TextState = {}): Style {
    if (isSelected) {
      return new Style({
        foreground: hasFocus
          ? this.selectionTextColor
          : this.inactiveSelectionTextColor,
        background: hasFocus
          ? this.selectionBackgroundColor
          : this.inactiveSelectionBackgroundColor,
        bold: hasFocus,
      })
    }

    return new Style({
      foreground: this.#textColor(tone),
      background: this.flatBackgroundColor,
      bold: hasFocus,
    })
  }

  #textColor(tone: TextTone): Color {
    switch (tone) {
      case 'muted':
        return this.mutedTextColor
      case 'placeholder':
        return this.placeholderTextColor
      case 'accent':
        return this.accentTextColor
      case 'default':
        return this.textColor
    }
  }

  merge(props: Partial<PaletteProps>): Palette {
    return new Palette({
      text: props.text ?? this.textColor,
      mutedText: props.mutedText ?? this.mutedTextColor,
      placeholderText: props.placeholderText ?? this.placeholderTextColor,
      accentText: props.accentText ?? this.accentTextColor,
      flatBackground: props.flatBackground ?? this.flatBackgroundColor,
      raisedBackground: props.raisedBackground ?? this.raisedBackgroundColor,
      hoverBackground: props.hoverBackground ?? this.hoverBackgroundColor,
      focusBackground: props.focusBackground ?? this.focusBackgroundColor,
      pressedBackground: props.pressedBackground ?? this.pressedBackgroundColor,
      selectionText: props.selectionText ?? this.selectionTextColor,
      selectionBackground:
        props.selectionBackground ?? this.selectionBackgroundColor,
      inactiveSelectionText:
        props.inactiveSelectionText ?? this.inactiveSelectionTextColor,
      inactiveSelectionBackground:
        props.inactiveSelectionBackground ??
        this.inactiveSelectionBackgroundColor,
      scrimText: props.scrimText ?? this.scrimTextColor,
      scrimBackground: props.scrimBackground ?? this.scrimBackgroundColor,
      checkedBackground: props.checkedBackground ?? this.checkedBackgroundColor,
      checkedSelectionBackground:
        props.checkedSelectionBackground ??
        this.checkedSelectionBackgroundColor,
      emoji: props.emoji ?? this.emoji,
    })
  }
}
