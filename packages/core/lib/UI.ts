import {Palette} from './Palette.js'

export function childPalette(
  purpose: Palette,
  isPressed = false,
  isHover = false,
) {
  const background = purpose.ui({
    variant: 'raised',
    isPressed,
    isHover,
  }).background!

  return new Palette({
    text: purpose.textColor,
    mutedText: purpose.mutedTextColor,
    placeholderText: purpose.placeholderTextColor,
    accentText: purpose.accentTextColor,
    flatBackground: background,
    raisedBackground: background,
    hoverBackground: purpose.hoverBackgroundColor,
    focusBackground: purpose.focusBackgroundColor,
    pressedBackground: purpose.pressedBackgroundColor,
    selectionText: purpose.selectionTextColor,
    selectionBackground: purpose.selectionBackgroundColor,
    inactiveSelectionText: purpose.inactiveSelectionTextColor,
    inactiveSelectionBackground: purpose.inactiveSelectionBackgroundColor,
    scrimText: purpose.scrimTextColor,
    scrimBackground: purpose.scrimBackgroundColor,
    checkedBackground: purpose.checkedBackgroundColor,
    checkedSelectionBackground: purpose.checkedSelectionBackgroundColor,
    emoji: purpose.emoji,
  })
}
