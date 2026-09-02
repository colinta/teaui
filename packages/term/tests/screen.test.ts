import {describe, it, expect} from 'vitest'
import {ScreenController, detectColorSupport} from '../src/screen.js'
import {CSI} from '../src/ansi.js'

describe('ScreenController', () => {
  function makeController() {
    let output = ''
    const write = (s: string) => {
      output += s
    }
    const screen = new ScreenController(write)
    return {
      screen,
      getOutput: () => output,
      clearOutput: () => (output = ''),
    }
  }

  it('clear writes erase screen + cursor home', () => {
    const {screen, getOutput} = makeController()
    screen.clear()
    expect(getOutput()).toBe(`${CSI}2J${CSI}1;1H`)
  })

  it('eraseDown', () => {
    const {screen, getOutput} = makeController()
    screen.eraseDown()
    expect(getOutput()).toBe(`${CSI}0J`)
  })

  it('eraseLine', () => {
    const {screen, getOutput} = makeController()
    screen.eraseLine()
    expect(getOutput()).toBe(`${CSI}2K`)
  })

  it('reserves rows from the current line and returns to their origin', () => {
    const {screen, getOutput} = makeController()

    screen.reserveRows(3)

    expect(getOutput()).toBe(`\r${CSI}2K\n\r${CSI}2K\n\r${CSI}2K\n\r${CSI}3A`)
  })

  it('advances to a fresh line before reserving rows when requested', () => {
    const {screen, getOutput} = makeController()

    screen.reserveRows(2, {advanceToFreshLine: true})

    expect(getOutput()).toBe(`\r\n${CSI}2K\n\r${CSI}2K\n\r${CSI}2A`)
  })

  it('clears only the requested rows and returns to their origin', () => {
    const {screen, getOutput} = makeController()

    screen.clearRows(3)

    expect(getOutput()).toBe(
      `\r${CSI}2K${CSI}1B${CSI}2K${CSI}1B${CSI}2K${CSI}2A\r`,
    )
  })

  it.each([0, -1, 1.5, Number.NaN])(
    'rejects invalid reserved row height %s',
    height => {
      const {screen} = makeController()
      expect(() => screen.reserveRows(height)).toThrow(RangeError)
    },
  )

  it('controls the display buffer, cursor, and protocols independently', () => {
    const {screen, getOutput, clearOutput} = makeController()

    screen
      .hideCursor()
      .enableMouse()
      .enableFocusEvents()
      .enableKeyboardEnhancement()
      .enableBracketedPaste()

    expect(getOutput()).toBe(
      [
        `${CSI}?25l`,
        `${CSI}?1000h`,
        `${CSI}?1002h`,
        `${CSI}?1003h`,
        `${CSI}?1006h`,
        `${CSI}?1004h`,
        `${CSI}>1u`,
        `${CSI}?2004h`,
      ].join(''),
    )

    clearOutput()
    screen
      .disableBracketedPaste()
      .disableKeyboardEnhancement()
      .disableFocusEvents()
      .disableMouse()
      .showCursor()
      .enterAlternateBuffer()
      .exitAlternateBuffer()

    expect(getOutput()).toBe(
      [
        `${CSI}?2004l`,
        `${CSI}<u`,
        `${CSI}?1004l`,
        `${CSI}?1006l`,
        `${CSI}?1003l`,
        `${CSI}?1002l`,
        `${CSI}?1000l`,
        `${CSI}?25h`,
        `${CSI}?1049h`,
        `${CSI}?1049l`,
      ].join(''),
    )
  })

  it('enters application mode without changing or clearing the display buffer', () => {
    const {screen, getOutput, clearOutput} = makeController()

    screen.enterApplication({
      hideCursor: true,
      mouse: true,
      focusEvents: true,
    })
    expect(getOutput()).toBe(
      [
        `${CSI}?25l`,
        `${CSI}?1000h`,
        `${CSI}?1002h`,
        `${CSI}?1003h`,
        `${CSI}?1006h`,
        `${CSI}?1004h`,
        `${CSI}>1u`,
        `${CSI}?2004h`,
      ].join(''),
    )
    expect(getOutput()).not.toContain(`${CSI}?1049h`)
    expect(getOutput()).not.toContain(`${CSI}2J`)

    clearOutput()
    screen.exitApplication()
    expect(getOutput()).toBe(
      [
        `${CSI}?2004l`,
        `${CSI}<u`,
        `${CSI}?1004l`,
        `${CSI}?1006l`,
        `${CSI}?1003l`,
        `${CSI}?1002l`,
        `${CSI}?1000l`,
        `${CSI}?25h`,
      ].join(''),
    )
    expect(getOutput()).not.toContain(`${CSI}?1049l`)
  })

  it('captures default fullscreen setup and teardown output', () => {
    const {screen, getOutput, clearOutput} = makeController()

    screen.enterFullscreen()
    expect(getOutput()).toBe(
      [
        `${CSI}?1049h`,
        `${CSI}>1u`,
        `${CSI}?2004h`,
        `${CSI}2J`,
        `${CSI}1;1H`,
      ].join(''),
    )

    clearOutput()
    screen.exitFullscreen()
    expect(getOutput()).toBe(
      [`${CSI}?2004l`, `${CSI}<u`, `${CSI}?1049l`].join(''),
    )
  })

  it('captures fully enabled fullscreen setup and teardown output', () => {
    const {screen, getOutput, clearOutput} = makeController()

    screen.enterFullscreen({hideCursor: true, mouse: true, focusEvents: true})
    expect(getOutput()).toBe(
      [
        `${CSI}?1049h`,
        `${CSI}?25l`,
        `${CSI}?1000h`,
        `${CSI}?1002h`,
        `${CSI}?1003h`,
        `${CSI}?1006h`,
        `${CSI}?1004h`,
        `${CSI}>1u`,
        `${CSI}?2004h`,
        `${CSI}2J`,
        `${CSI}1;1H`,
      ].join(''),
    )

    clearOutput()
    screen.exitFullscreen()
    expect(getOutput()).toBe(
      [
        `${CSI}?2004l`,
        `${CSI}<u`,
        `${CSI}?1004l`,
        `${CSI}?1006l`,
        `${CSI}?1003l`,
        `${CSI}?1002l`,
        `${CSI}?1000l`,
        `${CSI}?25h`,
        `${CSI}?1049l`,
      ].join(''),
    )
  })

  it('returns this for chaining', () => {
    const {screen} = makeController()
    expect(screen.clear()).toBe(screen)
    expect(screen.eraseDown()).toBe(screen)
    expect(screen.eraseLine()).toBe(screen)
    expect(screen.reserveRows(1)).toBe(screen)
    expect(screen.clearRows(1)).toBe(screen)
    expect(screen.enterAlternateBuffer()).toBe(screen)
    expect(screen.exitAlternateBuffer()).toBe(screen)
    expect(screen.hideCursor()).toBe(screen)
    expect(screen.showCursor()).toBe(screen)
    expect(screen.enableMouse()).toBe(screen)
    expect(screen.disableMouse()).toBe(screen)
    expect(screen.enableFocusEvents()).toBe(screen)
    expect(screen.disableFocusEvents()).toBe(screen)
    expect(screen.enableKeyboardEnhancement()).toBe(screen)
    expect(screen.disableKeyboardEnhancement()).toBe(screen)
    expect(screen.enableBracketedPaste()).toBe(screen)
    expect(screen.disableBracketedPaste()).toBe(screen)
    expect(screen.enterApplication()).toBe(screen)
    expect(screen.exitApplication()).toBe(screen)
  })
})

describe('detectColorSupport', () => {
  it('detects truecolor from COLORTERM', () => {
    expect(detectColorSupport({COLORTERM: 'truecolor'})).toBe('truecolor')
    expect(detectColorSupport({COLORTERM: '24bit'})).toBe('truecolor')
  })

  it('detects 256 from TERM', () => {
    expect(detectColorSupport({TERM: 'xterm-256color'})).toBe('256')
  })

  it('detects basic from TERM', () => {
    expect(detectColorSupport({TERM: 'xterm'})).toBe('basic')
  })

  it('returns none for dumb terminal', () => {
    expect(detectColorSupport({TERM: 'dumb'})).toBe('none')
  })

  it('returns none for empty env', () => {
    expect(detectColorSupport({})).toBe('none')
  })
})
