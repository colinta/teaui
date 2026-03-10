import {describe, it, expect} from 'vitest'
import {
  cursorTo,
  cursorMove,
  cursorUp,
  cursorDown,
  cursorForward,
  cursorBack,
  cursorNextLine,
  cursorPrevLine,
  cursorColumn,
  cursorSave,
  cursorRestore,
  cursorShow,
  cursorHide,
  cursorShape,
  eraseScreen,
  eraseDown,
  eraseUp,
  eraseLine,
  eraseLineEnd,
  eraseLineStart,
  eraseChars,
  scrollUp,
  scrollDown,
  fgColor,
  fgReset,
  bgColor,
  bgReset,
  hslToRgb,
  textAttr,
  textAttrOff,
  resetAll,
  alternateBufferEnter,
  alternateBufferExit,
  mouseEnable,
  mouseDisable,
  ESC,
  CSI,
} from '../src/ansi.js'

describe('ansi escape sequences', () => {
  describe('cursor movement', () => {
    it('cursorTo moves to absolute position', () => {
      // ANSI is 1-based, so (0,0) -> row 1, col 1
      expect(cursorTo(0, 0)).toBe(`${CSI}1;1H`)
      expect(cursorTo(5, 10)).toBe(`${CSI}11;6H`)
    })

    it('cursorMove moves relative', () => {
      expect(cursorMove(3, 0)).toBe(cursorForward(3))
      expect(cursorMove(-3, 0)).toBe(cursorBack(3))
      expect(cursorMove(0, 2)).toBe(cursorDown(2))
      expect(cursorMove(0, -2)).toBe(cursorUp(2))
      expect(cursorMove(3, 2)).toBe(cursorDown(2) + cursorForward(3))
      expect(cursorMove(0, 0)).toBe('')
    })

    it('cursorUp/Down/Forward/Back', () => {
      expect(cursorUp(1)).toBe(`${CSI}1A`)
      expect(cursorDown(5)).toBe(`${CSI}5B`)
      expect(cursorForward(3)).toBe(`${CSI}3C`)
      expect(cursorBack(2)).toBe(`${CSI}2D`)
    })

    it('cursorNextLine/PrevLine', () => {
      expect(cursorNextLine(1)).toBe(`${CSI}1E`)
      expect(cursorPrevLine(3)).toBe(`${CSI}3F`)
    })

    it('cursorColumn', () => {
      expect(cursorColumn(0)).toBe(`${CSI}1G`)
      expect(cursorColumn(5)).toBe(`${CSI}6G`)
    })

    it('cursorSave/Restore (DEC)', () => {
      expect(cursorSave()).toBe(`${ESC}7`)
      expect(cursorRestore()).toBe(`${ESC}8`)
    })

    it('cursorShow/Hide', () => {
      expect(cursorShow()).toBe(`${CSI}?25h`)
      expect(cursorHide()).toBe(`${CSI}?25l`)
    })

    it('cursorShape', () => {
      expect(cursorShape('block')).toBe(`${CSI}2 q`)
      expect(cursorShape('underline')).toBe(`${CSI}4 q`)
      expect(cursorShape('bar')).toBe(`${CSI}6 q`)
      expect(cursorShape('blinkingBlock')).toBe(`${CSI}1 q`)
      expect(cursorShape('blinkingUnderline')).toBe(`${CSI}3 q`)
      expect(cursorShape('blinkingBar')).toBe(`${CSI}5 q`)
    })
  })

  describe('erase sequences', () => {
    it('eraseScreen clears entire screen', () => {
      expect(eraseScreen()).toBe(`${CSI}2J`)
    })

    it('eraseDown/eraseUp', () => {
      expect(eraseDown()).toBe(`${CSI}0J`)
      expect(eraseUp()).toBe(`${CSI}1J`)
    })

    it('eraseLine/eraseLineEnd/eraseLineStart', () => {
      expect(eraseLine()).toBe(`${CSI}2K`)
      expect(eraseLineEnd()).toBe(`${CSI}0K`)
      expect(eraseLineStart()).toBe(`${CSI}1K`)
    })

    it('eraseChars erases n characters at cursor', () => {
      expect(eraseChars(1)).toBe(`${CSI}1X`)
      expect(eraseChars(5)).toBe(`${CSI}5X`)
      expect(eraseChars()).toBe(`${CSI}1X`)
    })
  })

  describe('scroll', () => {
    it('scrollUp/scrollDown', () => {
      expect(scrollUp(1)).toBe(`${CSI}1S`)
      expect(scrollDown(3)).toBe(`${CSI}3T`)
    })
  })

  describe('colors', () => {
    it('fgReset returns default foreground', () => {
      expect(fgReset()).toBe(`${CSI}39m`)
    })

    it('bgReset returns default background', () => {
      expect(bgReset()).toBe(`${CSI}49m`)
    })

    it('fgColor with named colors', () => {
      expect(fgColor('black')).toBe(`${CSI}30m`)
      expect(fgColor('red')).toBe(`${CSI}31m`)
      expect(fgColor('green')).toBe(`${CSI}32m`)
      expect(fgColor('yellow')).toBe(`${CSI}33m`)
      expect(fgColor('blue')).toBe(`${CSI}34m`)
      expect(fgColor('magenta')).toBe(`${CSI}35m`)
      expect(fgColor('cyan')).toBe(`${CSI}36m`)
      expect(fgColor('white')).toBe(`${CSI}37m`)
    })

    it('fgColor with bright named colors', () => {
      expect(fgColor('brightRed')).toBe(`${CSI}91m`)
      expect(fgColor('brightGreen')).toBe(`${CSI}92m`)
      expect(fgColor('brightWhite')).toBe(`${CSI}97m`)
    })

    it('bgColor with named colors', () => {
      expect(bgColor('black')).toBe(`${CSI}40m`)
      expect(bgColor('red')).toBe(`${CSI}41m`)
      expect(bgColor('brightBlue')).toBe(`${CSI}104m`)
    })

    it('fgColor with 256 palette', () => {
      expect(fgColor({index: 0})).toBe(`${CSI}38;5;0m`)
      expect(fgColor({index: 196})).toBe(`${CSI}38;5;196m`)
      expect(fgColor({index: 255})).toBe(`${CSI}38;5;255m`)
    })

    it('bgColor with 256 palette', () => {
      expect(bgColor({index: 232})).toBe(`${CSI}48;5;232m`)
    })

    it('fgColor with RGB', () => {
      expect(fgColor({r: 255, g: 128, b: 0})).toBe(`${CSI}38;2;255;128;0m`)
    })

    it('bgColor with RGB', () => {
      expect(bgColor({r: 0, g: 0, b: 0})).toBe(`${CSI}48;2;0;0;0m`)
    })

    it('fgColor with HSL', () => {
      // Pure red: h=0, s=100, l=50 → rgb(255, 0, 0)
      expect(fgColor({h: 0, s: 100, l: 50})).toBe(`${CSI}38;2;255;0;0m`)
      // Pure green: h=120, s=100, l=50 → rgb(0, 255, 0)
      expect(fgColor({h: 120, s: 100, l: 50})).toBe(`${CSI}38;2;0;255;0m`)
      // Pure blue: h=240, s=100, l=50 → rgb(0, 0, 255)
      expect(fgColor({h: 240, s: 100, l: 50})).toBe(`${CSI}38;2;0;0;255m`)
    })

    it('bgColor with HSL', () => {
      // White: h=0, s=0, l=100 → rgb(255, 255, 255)
      expect(bgColor({h: 0, s: 0, l: 100})).toBe(`${CSI}48;2;255;255;255m`)
      // Black: h=0, s=0, l=0 → rgb(0, 0, 0)
      expect(bgColor({h: 0, s: 0, l: 0})).toBe(`${CSI}48;2;0;0;0m`)
    })
  })

  describe('text attributes', () => {
    it('textAttr sets attributes', () => {
      expect(textAttr('bold')).toBe(`${CSI}1m`)
      expect(textAttr('dim')).toBe(`${CSI}2m`)
      expect(textAttr('italic')).toBe(`${CSI}3m`)
      expect(textAttr('underline')).toBe(`${CSI}4m`)
      expect(textAttr('blink')).toBe(`${CSI}5m`)
      expect(textAttr('inverse')).toBe(`${CSI}7m`)
      expect(textAttr('hidden')).toBe(`${CSI}8m`)
      expect(textAttr('strikethrough')).toBe(`${CSI}9m`)
    })

    it('textAttrOff clears attributes', () => {
      expect(textAttrOff('bold')).toBe(`${CSI}22m`)
      expect(textAttrOff('dim')).toBe(`${CSI}22m`)
      expect(textAttrOff('italic')).toBe(`${CSI}23m`)
      expect(textAttrOff('underline')).toBe(`${CSI}24m`)
      expect(textAttrOff('blink')).toBe(`${CSI}25m`)
      expect(textAttrOff('inverse')).toBe(`${CSI}27m`)
      expect(textAttrOff('hidden')).toBe(`${CSI}28m`)
      expect(textAttrOff('strikethrough')).toBe(`${CSI}29m`)
    })

    it('resetAll', () => {
      expect(resetAll()).toBe(`${CSI}0m`)
    })
  })

  describe('alternate buffer', () => {
    it('enter/exit alternate buffer', () => {
      expect(alternateBufferEnter()).toBe(`${CSI}?1049h`)
      expect(alternateBufferExit()).toBe(`${CSI}?1049l`)
    })
  })

  describe('mouse tracking', () => {
    it('enable/disable SGR mouse mode', () => {
      // Enable: button tracking + SGR encoding
      expect(mouseEnable()).toBe(
        `${CSI}?1000h${CSI}?1002h${CSI}?1003h${CSI}?1006h`,
      )
      expect(mouseDisable()).toBe(
        `${CSI}?1006l${CSI}?1003l${CSI}?1002l${CSI}?1000l`,
      )
    })
  })
})
