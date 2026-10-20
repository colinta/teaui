import {describe, expect, it} from 'vitest'
import {Palette} from '../lib/Palette.js'

describe('Palette', () => {
  it("aliases 'destructive' to 'cancel' (and 'red')", () => {
    expect(Palette.destructive).toBe(Palette.cancel)
    expect(Palette.destructive).toBe(Palette.red)
  })

  describe('ui', () => {
    it('uses flat controls by default and raises controls explicitly', () => {
      expect(Palette.primary.ui().background).toBe('#273F70')
      expect(Palette.primary.ui({variant: 'raised'}).background).toBe('#3B5EA7')
    })

    it('resolves pressed, focus, hover, and rest in precedence order', () => {
      expect(Palette.primary.ui({isHover: true}).background).toBe('#5A7AC2')
      expect(
        Palette.primary.ui({isHover: true, hasFocus: true}).background,
      ).toBe('#21365F')
      expect(
        Palette.primary.ui({
          isHover: true,
          hasFocus: true,
          isPressed: true,
        }).background,
      ).toBe('#1B2C4E')
    })

    it('bolds focused controls and ornaments', () => {
      expect(Palette.primary.ui().bold).toBe(false)
      expect(Palette.primary.ui({hasFocus: true}).bold).toBe(true)
      expect(Palette.primary.ui({hasFocus: true, isSelected: true}).bold).toBe(
        true,
      )
      expect(Palette.primary.ui({hasFocus: true, isOrnament: true}).bold).toBe(
        true,
      )
    })

    it('uses explicit placeholder and selection colors', () => {
      expect(
        Palette.primary.ui({
          variant: 'flat',
          isPlaceholder: true,
        }).foreground,
      ).toBe('#8FA6D3')
      expect(Palette.primary.ui({isSelected: true}).toDebug()).toMatchObject({
        foreground: '#738CC1',
        background: '#21365F',
      })
      expect(
        Palette.primary.ui({isSelected: true, hasFocus: true}).toDebug(),
      ).toMatchObject({
        foreground: '#E2E2E2(253)',
        background: '#5A7AC2',
      })
    })
  })

  describe('text', () => {
    it('resolves semantic text tones on the passive surface', () => {
      expect(Palette.primary.text().toDebug()).toMatchObject({
        foreground: '#E2E2E2(253)',
        background: '#273F70',
      })
      expect(Palette.primary.text({tone: 'muted'}).foreground).toBe('#738CC1')
      expect(Palette.primary.text({tone: 'placeholder'}).foreground).toBe(
        '#8FA6D3',
      )
      expect(Palette.primary.text({tone: 'accent'}).foreground).toBe('#5A7AC2')
    })
  })
})
