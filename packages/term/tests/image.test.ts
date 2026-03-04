import { describe, it, expect } from 'vitest'
import { itermImage, kittyImage, detectImageProtocol } from '../src/image.js'
import { OSC, ST, ESC } from '../src/ansi.js'

describe('image support', () => {
  const testData = Buffer.from('test image data')
  const b64 = testData.toString('base64')

  describe('itermImage', () => {
    it('generates OSC 1337 inline image sequence', () => {
      const result = itermImage(testData)
      expect(result).toBe(`${OSC}1337;File=inline=1:${b64}${ST}`)
    })

    it('supports width option', () => {
      const result = itermImage(testData, { width: 40 })
      expect(result).toBe(`${OSC}1337;File=inline=1;width=40:${b64}${ST}`)
    })

    it('supports height option', () => {
      const result = itermImage(testData, { height: 20 })
      expect(result).toBe(`${OSC}1337;File=inline=1;height=20:${b64}${ST}`)
    })

    it('supports width and height together', () => {
      const result = itermImage(testData, { width: 40, height: 20 })
      expect(result).toBe(
        `${OSC}1337;File=inline=1;width=40;height=20:${b64}${ST}`,
      )
    })

    it('supports preserveAspectRatio=false', () => {
      const result = itermImage(testData, { preserveAspectRatio: false })
      expect(result).toBe(
        `${OSC}1337;File=inline=1;preserveAspectRatio=0:${b64}${ST}`,
      )
    })

    it('supports string dimensions', () => {
      const result = itermImage(testData, { width: '50%' })
      expect(result).toBe(`${OSC}1337;File=inline=1;width=50%:${b64}${ST}`)
    })
  })

  describe('kittyImage', () => {
    it('generates APC kitty graphics sequence for small data', () => {
      const smallData = Buffer.from('hi')
      const b64Small = smallData.toString('base64')
      const result = kittyImage(smallData)
      // Single chunk (m=0 means no more chunks)
      expect(result).toBe(`${ESC}_Ga=T,f=100,m=0;${b64Small}${ST}`)
    })

    it('supports width and height options', () => {
      const smallData = Buffer.from('hi')
      const b64Small = smallData.toString('base64')
      const result = kittyImage(smallData, { width: 40, height: 20 })
      expect(result).toBe(`${ESC}_Ga=T,f=100,c=40,r=20,m=0;${b64Small}${ST}`)
    })

    it('chunks large data', () => {
      // Create data larger than 4096 bytes when base64 encoded
      const largeData = Buffer.alloc(4000, 0x42)
      const result = kittyImage(largeData)
      // Should contain multiple chunks
      expect(result).toContain('m=1')
      expect(result).toContain('m=0')
      // Should start with action=T
      expect(result).toMatch(
        new RegExp(`^${ESC.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}_Ga=T`),
      )
    })
  })

  describe('detectImageProtocol', () => {
    it('detects iTerm2', () => {
      expect(detectImageProtocol({ TERM_PROGRAM: 'iTerm.app' })).toBe('iterm')
    })

    it('detects WezTerm as iterm compatible', () => {
      expect(detectImageProtocol({ TERM_PROGRAM: 'WezTerm' })).toBe('iterm')
    })

    it('detects Kitty', () => {
      expect(detectImageProtocol({ TERM: 'xterm-kitty' })).toBe('kitty')
    })

    it('detects Kitty from TERM_PROGRAM', () => {
      expect(detectImageProtocol({ TERM_PROGRAM: 'kitty' })).toBe('kitty')
    })

    it('returns none for unknown terminal', () => {
      expect(detectImageProtocol({ TERM: 'xterm' })).toBe('none')
    })

    it('returns none for empty env', () => {
      expect(detectImageProtocol({})).toBe('none')
    })
  })
})
