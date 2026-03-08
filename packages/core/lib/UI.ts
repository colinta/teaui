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
    brightText: theme.brightTextColor,
    dimText: theme.dimTextColor,
    emoji: theme.emoji,
  })
}
