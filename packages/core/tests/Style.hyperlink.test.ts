import {describe, expect, it} from 'vitest'
import {Style} from '../lib/Style.js'

const URL = 'file:///tmp/@scope+package/file'
const OPEN = `\x1b]8;;${URL}\x1b\\`
const CLOSE = '\x1b]8;;\x1b\\'

describe('Style OSC 8 links', () => {
  for (const end of ['\x1b\\', '\x07', '\x9c']) {
    it(`parses link parameters and explicit closing deltas (${JSON.stringify(end)})`, () => {
      const style = Style.fromSGR(`\x1b]8;id=entry;${URL}${end}`, Style.NONE)
      expect(style).toMatchObject({link: URL, linkParams: 'id=entry'})
      expect(
        style.merge(Style.fromSGR(`\x1b]8;;${end}`, Style.NONE)).link,
      ).toBe('')
      expect(style.toSGR(Style.NONE)).toBe(`\x1b]8;id=entry;${URL}\x1b\\`)
    })
  }

  it('preserves links through copy, merge, invert and SGR reset', () => {
    const style = new Style({
      link: URL,
      linkParams: 'id=entry',
      foreground: 'red',
    })
    expect(new Style(style).isEqual(style)).toBe(true)
    expect(style.merge({bold: true}).link).toBe(URL)
    expect(style.invert().link).toBe(URL)
    expect(style.merge(Style.fromSGR('\x1b[0m', Style.NONE)).link).toBe(URL)
    expect(style.toDebug()).toMatchObject({link: URL, linkParams: 'id=entry'})
    expect({...style}).toMatchObject({link: URL, linkParams: 'id=entry'})
    expect(style.merge({link: null}).link).toBeUndefined()
    expect(style.merge({link: ''}).link).toBe('')
    expect(style.merge({link: 'file:///other'}).linkParams).toBeUndefined()
  })

  it('includes links and parameters in style equality', () => {
    const style = new Style({link: URL})
    expect(style.isEqual(new Style({link: URL}))).toBe(true)
    expect(style.isEqual(new Style({link: 'file:///other'}))).toBe(false)
    expect(style.isEqual(new Style({link: URL, linkParams: 'id=entry'}))).toBe(
      false,
    )
    expect(style.isEqual(Style.NONE)).toBe(false)
  })

  it('emits link codes only on transitions, not when visual attributes change', () => {
    const style = new Style({link: URL})
    expect(style.toSGR(Style.NONE)).toBe(OPEN)
    expect(style.toSGR(new Style({link: URL}))).toBe('')
    expect(style.merge({bold: true}).toSGR(style)).toBe('\x1b[1m')
    expect(Style.NONE.toSGR(style)).toBe(CLOSE)
    expect(new Style({link: ''}).toSGR(style)).toBe(CLOSE)
    expect(new Style({link: 'file:///other'}).toSGR(style)).toBe(
      `${CLOSE}\x1b]8;;file:///other\x1b\\`,
    )
    expect(new Style({link: URL, linkParams: 'id=entry'}).toSGR(style)).toBe(
      `${CLOSE}\x1b]8;id=entry;${URL}\x1b\\`,
    )
  })

  it('wraps text and restores the previous link', () => {
    const style = new Style({link: URL})
    expect(style.toSGR(Style.NONE, 'label')).toBe(`${OPEN}label${CLOSE}`)
    expect(Style.NONE.toSGR(style, 'plain')).toBe(`${CLOSE}plain${OPEN}`)
    expect(style.toSGR(Style.NONE, '')).toBe(`${OPEN}${CLOSE}`)
  })
})
