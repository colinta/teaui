import {Palette} from './Palette.js'

export function childPalette(
  purpose: Palette,
  isPressed = false,
  isHover = false,
) {
  return new Palette({
    controlBackground: isPressed
      ? purpose.darkenColor
      : isHover
        ? purpose.highlightColor
        : purpose.controlBackgroundColor,
    textBackground: isPressed
      ? purpose.darkenColor
      : isHover
        ? purpose.highlightColor
        : purpose.controlBackgroundColor,
    highlight: purpose.highlightColor,
    darken: isPressed
      ? purpose.darkenColor
      : isHover
        ? purpose.highlightColor
        : purpose.darkenColor,
    text: purpose.textColor,
    contrastText: purpose.contrastTextColor,
    dimText: purpose.dimTextColor,
    tableChecked: purpose.tableCheckedColor,
    tableCheckedHighlight: purpose.tableCheckedHighlightColor,
    emoji: purpose.emoji,
  })
}
