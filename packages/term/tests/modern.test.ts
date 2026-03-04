import { describe, it, expect } from 'vitest'
import {
  hyperlink,
  styledUnderline,
  underlineColor,
  setTitle,
  notification,
  bracketedPasteEnable,
  bracketedPasteDisable,
  syncStart,
  syncEnd,
} from '../src/modern.js'
import { OSC, CSI, ST } from '../src/ansi.js'

describe('modern terminal features', () => {
  describe('hyperlinks (OSC 8)', () => {
    it('wraps text in hyperlink sequence', () => {
      const result = hyperlink('https://example.com', 'click here')
      expect(result).toBe(
        `${OSC}8;;https://example.com${ST}click here${OSC}8;;${ST}`,
      )
    })

    it('supports id parameter', () => {
      const result = hyperlink('https://example.com', 'link', { id: 'link1' })
      expect(result).toBe(
        `${OSC}8;id=link1;https://example.com${ST}link${OSC}8;;${ST}`,
      )
    })
  })

  describe('styled underlines', () => {
    it('single underline', () => {
      expect(styledUnderline('single')).toBe(`${CSI}4:1m`)
    })

    it('double underline', () => {
      expect(styledUnderline('double')).toBe(`${CSI}4:2m`)
    })

    it('curly underline', () => {
      expect(styledUnderline('curly')).toBe(`${CSI}4:3m`)
    })

    it('dotted underline', () => {
      expect(styledUnderline('dotted')).toBe(`${CSI}4:4m`)
    })

    it('dashed underline', () => {
      expect(styledUnderline('dashed')).toBe(`${CSI}4:5m`)
    })
  })

  describe('underline color', () => {
    it('sets underline color with named color', () => {
      // Named colors use the SGR 58:5:index format
      expect(underlineColor('red')).toBe(`${CSI}58:2::204:0:0m`)
    })

    it('sets underline color with RGB', () => {
      expect(underlineColor({ r: 255, g: 128, b: 0 })).toBe(
        `${CSI}58:2::255:128:0m`,
      )
    })

    it('sets underline color with 256 palette', () => {
      expect(underlineColor({ index: 196 })).toBe(`${CSI}58:5:196m`)
    })
  })

  describe('window title', () => {
    it('sets terminal window title via OSC 2', () => {
      expect(setTitle('My App')).toBe(`${OSC}2;My App${ST}`)
    })
  })

  describe('notifications', () => {
    it('sends OSC 9 notification (iTerm2 growl)', () => {
      const result = notification('Build complete')
      expect(result).toBe(`${OSC}9;Build complete${ST}`)
    })

    it('sends notification with body via OSC 777', () => {
      const result = notification('Build', 'All tests passed')
      expect(result).toBe(`${OSC}777;notify;Build;All tests passed${ST}`)
    })
  })

  describe('bracketed paste', () => {
    it('enable', () => {
      expect(bracketedPasteEnable()).toBe(`${CSI}?2004h`)
    })

    it('disable', () => {
      expect(bracketedPasteDisable()).toBe(`${CSI}?2004l`)
    })
  })

  describe('synchronized output', () => {
    it('syncStart', () => {
      expect(syncStart()).toBe(`${CSI}?2026h`)
    })

    it('syncEnd', () => {
      expect(syncEnd()).toBe(`${CSI}?2026l`)
    })
  })
})
