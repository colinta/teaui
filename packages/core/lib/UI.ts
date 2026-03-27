import {Theme} from './Theme.js'

export function childTheme(theme: Theme, isPressed = false, isHover = false) {
  return new Theme({
    background: isPressed
      ? theme.darkenColor
      : isHover
        ? theme.highlightColor
        : theme.backgroundColor,
    textBackground: isPressed
      ? theme.darkenColor
      : isHover
        ? theme.highlightColor
        : theme.backgroundColor,
    highlight: theme.highlightColor,
    darken: isPressed
      ? theme.darkenColor
      : isHover
        ? theme.highlightColor
        : theme.darkenColor,
    text: theme.textColor,
    contrastText: theme.contrastTextColor,
    dimText: theme.dimTextColor,
    tableChecked: theme.tableCheckedColor,
    tableCheckedHighlight: theme.tableCheckedHighlightColor,
    emoji: theme.emoji,
  })
}
