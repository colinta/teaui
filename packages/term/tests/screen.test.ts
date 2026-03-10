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
    return {screen, getOutput: () => output}
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

  it('enterFullscreen writes alternate buffer + hide cursor', () => {
    const {screen, getOutput} = makeController()
    screen.enterFullscreen({hideCursor: true})
    expect(getOutput()).toContain(`${CSI}?1049h`)
    expect(getOutput()).toContain(`${CSI}?25l`)
  })

  it('enterFullscreen with mouse enables mouse tracking', () => {
    const {screen, getOutput} = makeController()
    screen.enterFullscreen({mouse: true})
    expect(getOutput()).toContain(`${CSI}?1000h`)
    expect(getOutput()).toContain(`${CSI}?1006h`)
  })

  it('exitFullscreen restores state', () => {
    const {screen, getOutput} = makeController()
    screen.enterFullscreen({hideCursor: true, mouse: true})
    const enterOutput = getOutput()
    // Clear for exit check
    let exitOutput = ''
    ;(screen as any).write = (s: string) => {
      exitOutput += s
    }
    screen.exitFullscreen()
    expect(exitOutput).toContain(`${CSI}?1049l`)
    expect(exitOutput).toContain(`${CSI}?25h`)
    expect(exitOutput).toContain(`${CSI}?1006l`)
  })

  it('returns this for chaining', () => {
    const {screen} = makeController()
    expect(screen.clear()).toBe(screen)
    expect(screen.eraseDown()).toBe(screen)
    expect(screen.eraseLine()).toBe(screen)
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
