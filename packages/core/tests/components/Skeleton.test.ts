import {describe, expect, it, vi} from 'vitest'
import {Skeleton, type SkeletonShape} from '../../lib/components/Skeleton.js'
import {Size} from '../../lib/geometry.js'
import {testRender} from '../../lib/TestScreen.js'

function renderShape(shape: SkeletonShape, width: number, height: number) {
  const view = new Skeleton({
    shape,
    width: 'natural',
    height: 'natural',
  })
  const t = testRender(view, {width, height})
  const rows: string[] = []

  for (let y = 0; y < height; y++) {
    let row = ''
    for (let x = 0; x < width; x++) {
      const background = t.terminal.styleAt(x, y).background
      row += background === undefined || background === 'default' ? '.' : '#'
    }
    rows.push(row)
  }

  return rows.join('\n')
}

describe('Skeleton', () => {
  describe('naturalSize', () => {
    const available = new Size(10, 4)

    it.each(['rect', 'circle', 'rounded-rect'] as const)(
      '%s fills the available space',
      shape => {
        expect(new Skeleton({shape}).naturalSize(available)).toEqual(available)
      },
    )

    it('row fills the available width and is one cell tall', () => {
      expect(new Skeleton({shape: 'row'}).naturalSize(available)).toEqual(
        new Size(10, 1),
      )
    })

    it('column fills the available height and is one cell wide', () => {
      expect(new Skeleton({shape: 'column'}).naturalSize(available)).toEqual(
        new Size(1, 4),
      )
    })
  })

  describe('shapes', () => {
    it('renders every shape', () => {
      expect({
        rect: renderShape('rect', 10, 4),
        roundedRect: renderShape('rounded-rect', 10, 4),
        circle: renderShape('circle', 4, 4),
        ellipse: renderShape('circle', 10, 4),
        circle9x6: renderShape('circle', 9, 6),
        circle13x6: renderShape('circle', 13, 6),
        row: renderShape('row', 10, 4),
        column: renderShape('column', 10, 4),
      }).toMatchSnapshot()
    })
  })

  describe('animation', () => {
    it('eases from 30% gray to 50% gray and back over three seconds', () => {
      vi.useFakeTimers()
      try {
        const t = testRender(new Skeleton(), {width: 1, height: 1})
        const background = () => t.terminal.styleAt(0, 0).background

        expect(background()).toEqual([77, 77, 77])

        t.tick(750)
        const transition = background() as [number, number, number]
        expect(transition[0]).toBeGreaterThan(77)
        expect(transition[0]).toBeLessThan(128)
        expect(transition[1]).toBe(transition[0])
        expect(transition[2]).toBe(transition[0])

        t.tick(750)
        expect(background()).toEqual([128, 128, 128])

        t.tick(1500)
        expect(background()).toEqual([77, 77, 77])
      } finally {
        vi.useRealTimers()
      }
    })

    it('requests a render when time advances', () => {
      expect(new Skeleton().receiveTick(1)).toBe(true)
    })
  })
})
