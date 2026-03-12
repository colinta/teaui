import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/testing.js'
import {Canvas} from '../../lib/components/Canvas.js'

describe('Canvas', () => {
  describe('braille encoding', () => {
    it('empty canvas renders braille space U+2800', () => {
      const canvas = new Canvas({width: 3, height: 2})
      const t = testRender(canvas, {width: 3, height: 2})

      expect(t.terminal.charAt(0, 0)).toBe(String.fromCharCode(0x2800))
      expect(t.terminal.charAt(1, 0)).toBe(String.fromCharCode(0x2800))
      expect(t.terminal.charAt(2, 1)).toBe(String.fromCharCode(0x2800))
    })

    it('pixel (0,0) → bit 0 → U+2801 ⠁', () => {
      const canvas = new Canvas({width: 1, height: 1})
      const t = testRender(canvas, {width: 1, height: 1})
      canvas.set(0, 0)
      t.render()
      expect(t.terminal.charAt(0, 0)).toBe('\u2801')
    })

    it('pixel (1,0) → bit 3 → U+2808 ⠈', () => {
      const canvas = new Canvas({width: 1, height: 1})
      const t = testRender(canvas, {width: 1, height: 1})
      canvas.set(1, 0)
      t.render()
      expect(t.terminal.charAt(0, 0)).toBe('\u2808')
    })

    it('pixel (0,1) → bit 1 → U+2802 ⠂', () => {
      const canvas = new Canvas({width: 1, height: 1})
      const t = testRender(canvas, {width: 1, height: 1})
      canvas.set(0, 1)
      t.render()
      expect(t.terminal.charAt(0, 0)).toBe('\u2802')
    })

    it('pixel (1,1) → bit 4 → U+2810 ⠐', () => {
      const canvas = new Canvas({width: 1, height: 1})
      const t = testRender(canvas, {width: 1, height: 1})
      canvas.set(1, 1)
      t.render()
      expect(t.terminal.charAt(0, 0)).toBe('\u2810')
    })

    it('pixel (0,2) → bit 2 → U+2804 ⠄', () => {
      const canvas = new Canvas({width: 1, height: 1})
      const t = testRender(canvas, {width: 1, height: 1})
      canvas.set(0, 2)
      t.render()
      expect(t.terminal.charAt(0, 0)).toBe('\u2804')
    })

    it('pixel (1,2) → bit 5 → U+2820 ⠠', () => {
      const canvas = new Canvas({width: 1, height: 1})
      const t = testRender(canvas, {width: 1, height: 1})
      canvas.set(1, 2)
      t.render()
      expect(t.terminal.charAt(0, 0)).toBe('\u2820')
    })

    it('pixel (0,3) → bit 6 → U+2840 ⡀', () => {
      const canvas = new Canvas({width: 1, height: 1})
      const t = testRender(canvas, {width: 1, height: 1})
      canvas.set(0, 3)
      t.render()
      expect(t.terminal.charAt(0, 0)).toBe('\u2840')
    })

    it('pixel (1,3) → bit 7 → U+2880 ⢀', () => {
      const canvas = new Canvas({width: 1, height: 1})
      const t = testRender(canvas, {width: 1, height: 1})
      canvas.set(1, 3)
      t.render()
      expect(t.terminal.charAt(0, 0)).toBe('\u2880')
    })

    it('combines multiple dots into one braille character', () => {
      const canvas = new Canvas({width: 1, height: 1})
      const t = testRender(canvas, {width: 1, height: 1})
      canvas.set(0, 0) // 0x01
      canvas.set(1, 0) // 0x08
      canvas.set(0, 3) // 0x40
      t.render()
      expect(t.terminal.charAt(0, 0)).toBe(
        String.fromCharCode(0x2800 | 0x01 | 0x08 | 0x40),
      )
    })

    it('all 8 dots set → U+28FF ⣿', () => {
      const canvas = new Canvas({width: 1, height: 1})
      const t = testRender(canvas, {width: 1, height: 1})
      for (let x = 0; x < 2; x++) {
        for (let y = 0; y < 4; y++) {
          canvas.set(x, y)
        }
      }
      t.render()
      expect(t.terminal.charAt(0, 0)).toBe('\u28FF')
    })

    it('pixels in second terminal column map to second cell', () => {
      const canvas = new Canvas({width: 2, height: 1})
      const t = testRender(canvas, {width: 2, height: 1})
      // pixel (2, 0) → cell (1, 0), bit (0,0) = 0x01
      canvas.set(2, 0)
      t.render()
      expect(t.terminal.charAt(0, 0)).toBe('\u2800') // first cell empty
      expect(t.terminal.charAt(1, 0)).toBe('\u2801') // second cell has dot
    })

    it('pixels in second terminal row map to second cell row', () => {
      const canvas = new Canvas({width: 1, height: 2})
      const t = testRender(canvas, {width: 1, height: 2})
      // pixel (0, 4) → cell (0, 1), bit (0,0) = 0x01
      canvas.set(0, 4)
      t.render()
      expect(t.terminal.charAt(0, 0)).toBe('\u2800') // first row empty
      expect(t.terminal.charAt(0, 1)).toBe('\u2801') // second row has dot
    })
  })

  describe('pixel operations', () => {
    it('set and isSet', () => {
      const canvas = new Canvas({width: 2, height: 2})
      testRender(canvas, {width: 2, height: 2})

      expect(canvas.isSet(0, 0)).toBe(false)
      canvas.set(0, 0)
      expect(canvas.isSet(0, 0)).toBe(true)
    })

    it('unset clears a pixel', () => {
      const canvas = new Canvas({width: 2, height: 2})
      testRender(canvas, {width: 2, height: 2})

      canvas.set(1, 1)
      expect(canvas.isSet(1, 1)).toBe(true)
      canvas.unset(1, 1)
      expect(canvas.isSet(1, 1)).toBe(false)
    })

    it('unset does not affect other pixels in same cell', () => {
      const canvas = new Canvas({width: 1, height: 1})
      testRender(canvas, {width: 1, height: 1})

      canvas.set(0, 0)
      canvas.set(1, 0)
      canvas.unset(0, 0)
      expect(canvas.isSet(0, 0)).toBe(false)
      expect(canvas.isSet(1, 0)).toBe(true)
    })

    it('toggle flips pixel state', () => {
      const canvas = new Canvas({width: 2, height: 2})
      testRender(canvas, {width: 2, height: 2})

      expect(canvas.isSet(0, 0)).toBe(false)
      canvas.toggle(0, 0)
      expect(canvas.isSet(0, 0)).toBe(true)
      canvas.toggle(0, 0)
      expect(canvas.isSet(0, 0)).toBe(false)
    })

    it('clear removes all pixels', () => {
      const canvas = new Canvas({width: 2, height: 2})
      testRender(canvas, {width: 2, height: 2})

      canvas.set(0, 0)
      canvas.set(1, 1)
      canvas.set(2, 5)
      canvas.clear()
      expect(canvas.isSet(0, 0)).toBe(false)
      expect(canvas.isSet(1, 1)).toBe(false)
      expect(canvas.isSet(2, 5)).toBe(false)
    })

    it('out-of-bounds set is silently ignored', () => {
      const canvas = new Canvas({width: 1, height: 1})
      testRender(canvas, {width: 1, height: 1})

      // Should not throw
      canvas.set(-1, 0)
      canvas.set(0, -1)
      canvas.set(100, 100)

      expect(canvas.isSet(-1, 0)).toBe(false)
      expect(canvas.isSet(100, 100)).toBe(false)
    })

    it('drawing before render is silently lost (buffer is 0×0)', () => {
      const canvas = new Canvas()

      // Buffer hasn't been sized yet — these go to a 0×0 buffer
      canvas.set(0, 0)
      canvas.line(0, 0, 10, 10)
      canvas.rect(0, 0, 5, 5)
      canvas.fillRect(0, 0, 3, 3)
      canvas.circle(5, 5, 3)
      canvas.fillCircle(5, 5, 3)

      // Now render — buffer gets sized but the earlier draws are gone
      const t = testRender(canvas, {width: 5, height: 5})
      expect(canvas.isSet(0, 0)).toBe(false)
      expect(t.terminal.charAt(0, 0)).toBe('\u2800')
    })
  })

  describe('drawing primitives', () => {
    it('horizontal line', () => {
      const canvas = new Canvas({width: 5, height: 1})
      testRender(canvas, {width: 5, height: 1})

      canvas.line(0, 0, 9, 0)

      // All pixels along the line should be set
      for (let x = 0; x <= 9; x++) {
        expect(canvas.isSet(x, 0)).toBe(true)
      }
      // Pixel below should not be set
      expect(canvas.isSet(0, 1)).toBe(false)
    })

    it('vertical line', () => {
      const canvas = new Canvas({width: 1, height: 3})
      testRender(canvas, {width: 1, height: 3})

      canvas.line(0, 0, 0, 11)

      for (let y = 0; y <= 11; y++) {
        expect(canvas.isSet(0, y)).toBe(true)
      }
      expect(canvas.isSet(1, 0)).toBe(false)
    })

    it('diagonal line', () => {
      const canvas = new Canvas({width: 5, height: 5})
      testRender(canvas, {width: 5, height: 5})

      canvas.line(0, 0, 8, 8)

      // Endpoints must be set
      expect(canvas.isSet(0, 0)).toBe(true)
      expect(canvas.isSet(8, 8)).toBe(true)
      // Midpoint
      expect(canvas.isSet(4, 4)).toBe(true)
    })

    it('line works in reverse direction', () => {
      const canvas = new Canvas({width: 5, height: 1})
      testRender(canvas, {width: 5, height: 1})

      canvas.line(9, 0, 0, 0)

      for (let x = 0; x <= 9; x++) {
        expect(canvas.isSet(x, 0)).toBe(true)
      }
    })

    it('rect draws outline', () => {
      const canvas = new Canvas({width: 5, height: 3})
      testRender(canvas, {width: 5, height: 3})

      canvas.rect(1, 1, 6, 8)

      // Corners
      expect(canvas.isSet(1, 1)).toBe(true)
      expect(canvas.isSet(6, 1)).toBe(true)
      expect(canvas.isSet(1, 8)).toBe(true)
      expect(canvas.isSet(6, 8)).toBe(true)

      // Edge midpoints
      expect(canvas.isSet(3, 1)).toBe(true) // top edge
      expect(canvas.isSet(3, 8)).toBe(true) // bottom edge
      expect(canvas.isSet(1, 5)).toBe(true) // left edge
      expect(canvas.isSet(6, 5)).toBe(true) // right edge

      // Interior should be empty
      expect(canvas.isSet(3, 4)).toBe(false)
      expect(canvas.isSet(4, 5)).toBe(false)
    })

    it('fillRect fills entire area', () => {
      const canvas = new Canvas({width: 3, height: 2})
      testRender(canvas, {width: 3, height: 2})

      canvas.fillRect(1, 1, 3, 3)

      for (let y = 1; y <= 3; y++) {
        for (let x = 1; x <= 3; x++) {
          expect(canvas.isSet(x, y)).toBe(true)
        }
      }
      // Outside
      expect(canvas.isSet(0, 0)).toBe(false)
      expect(canvas.isSet(4, 4)).toBe(false)
    })

    it('zero-size rect does nothing', () => {
      const canvas = new Canvas({width: 5, height: 5})
      testRender(canvas, {width: 5, height: 5})

      canvas.rect(0, 0, 0, 0)
      canvas.fillRect(0, 0, 0, 0)

      expect(canvas.isSet(0, 0)).toBe(false)
    })

    it('circle draws outline at cardinal points', () => {
      const canvas = new Canvas({width: 10, height: 10})
      testRender(canvas, {width: 10, height: 10})

      canvas.circle(10, 20, 5)

      // Cardinal points
      expect(canvas.isSet(10, 15)).toBe(true) // top
      expect(canvas.isSet(10, 25)).toBe(true) // bottom
      expect(canvas.isSet(5, 20)).toBe(true) // left
      expect(canvas.isSet(15, 20)).toBe(true) // right

      // Center should be empty
      expect(canvas.isSet(10, 20)).toBe(false)
    })

    it('fillCircle fills center', () => {
      const canvas = new Canvas({width: 10, height: 10})
      testRender(canvas, {width: 10, height: 10})

      canvas.fillCircle(10, 20, 5)

      // Center
      expect(canvas.isSet(10, 20)).toBe(true)
      // Near center
      expect(canvas.isSet(11, 20)).toBe(true)
      expect(canvas.isSet(10, 21)).toBe(true)
    })
  })

  describe('pixel dimensions', () => {
    it('pixelWidth = cols * 2 and pixelHeight = rows * 4', () => {
      const canvas = new Canvas({width: 5, height: 3})
      testRender(canvas, {width: 5, height: 3})

      expect(canvas.pixelWidth).toBe(10)
      expect(canvas.pixelHeight).toBe(12)
    })

    it('dimensions update on re-render with different size', () => {
      const canvas = new Canvas()
      const t = testRender(canvas, {width: 5, height: 3})
      expect(canvas.pixelWidth).toBe(10)
      expect(canvas.pixelHeight).toBe(12)

      // Re-render at new size by creating a new test harness
      const t2 = testRender(canvas, {width: 8, height: 4})
      expect(canvas.pixelWidth).toBe(16)
      expect(canvas.pixelHeight).toBe(16)
    })
  })

  describe('draw callback', () => {
    it('draw callback is invoked during render with correct dimensions', () => {
      let drawCalled = false
      let drawWidth = 0
      let drawHeight = 0
      const canvas = new Canvas({
        width: 5,
        height: 3,
        draw(c) {
          drawCalled = true
          drawWidth = c.pixelWidth
          drawHeight = c.pixelHeight
        },
      })
      testRender(canvas, {width: 5, height: 3})
      expect(drawCalled).toBe(true)
      expect(drawWidth).toBe(10)
      expect(drawHeight).toBe(12)
    })

    it('draw callback can set pixels that appear in output', () => {
      const canvas = new Canvas({
        draw(c) {
          c.set(0, 0)
        },
      })
      const t = testRender(canvas, {width: 1, height: 1})
      expect(t.terminal.charAt(0, 0)).toBe('\u2801')
    })

    it('canvas is cleared before each draw callback', () => {
      let callCount = 0
      const canvas = new Canvas({
        draw(c) {
          callCount++
          if (callCount === 1) {
            c.set(0, 0)
            c.set(1, 0)
          }
          // Second call draws nothing — canvas should be clear
        },
      })
      const t = testRender(canvas, {width: 1, height: 1})
      // First render has pixels
      expect(t.terminal.charAt(0, 0)).toBe(
        String.fromCharCode(0x2800 | 0x01 | 0x08),
      )

      // Re-render: draw callback is called again, draws nothing this time
      t.render()
      expect(t.terminal.charAt(0, 0)).toBe('\u2800')
    })

    it('draw callback works with lines', () => {
      const canvas = new Canvas({
        draw(c) {
          c.line(0, 0, c.pixelWidth - 1, 0) // horizontal top
        },
      })
      const t = testRender(canvas, {width: 3, height: 1})
      // All top pixels should be set
      for (let x = 0; x < 6; x++) {
        expect(canvas.isSet(x, 0)).toBe(true)
      }
    })
  })

  describe('rendering', () => {
    it('renders horizontal line as braille characters', () => {
      const canvas = new Canvas({width: 3, height: 1})
      const t = testRender(canvas, {width: 3, height: 1})

      // Set top row of pixels across 3 cells
      for (let x = 0; x < 6; x++) {
        canvas.set(x, 0)
      }
      t.render()

      // Each cell should have both top dots: 0x01 | 0x08 = 0x09
      expect(t.terminal.charAt(0, 0)).toBe(String.fromCharCode(0x2800 | 0x09))
      expect(t.terminal.charAt(1, 0)).toBe(String.fromCharCode(0x2800 | 0x09))
      expect(t.terminal.charAt(2, 0)).toBe(String.fromCharCode(0x2800 | 0x09))
    })

    it('renders vertical line in left column', () => {
      const canvas = new Canvas({width: 1, height: 2})
      const t = testRender(canvas, {width: 1, height: 2})

      // Set all y pixels in column 0
      for (let y = 0; y < 8; y++) {
        canvas.set(0, y)
      }
      t.render()

      // Cell (0,0): bits 0,1,2,6 = 0x01|0x02|0x04|0x40 = 0x47
      expect(t.terminal.charAt(0, 0)).toBe(String.fromCharCode(0x2800 | 0x47))
      // Cell (0,1): same pattern
      expect(t.terminal.charAt(0, 1)).toBe(String.fromCharCode(0x2800 | 0x47))
    })
  })
})
