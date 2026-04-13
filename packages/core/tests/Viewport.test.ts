import {describe, it, expect} from 'vitest'
import {testRender} from '../lib/TestScreen.js'
import {View} from '../lib/View.js'
import {Container} from '../lib/Container.js'
import {Text} from '../lib/components/Text.js'
import {Rect, Point, Size} from '../lib/geometry.js'
import type {Viewport} from '../lib/Viewport.js'

/**
 * A test container that draws a '#' border, then uses inset() so children
 * can optionally draw on top of it via availableRect.
 */
class InsetBox extends Container {
  naturalSize(availableSize: Size): Size {
    const childSize =
      this.children[0]?.naturalSize(
        new Size(
          Math.max(0, availableSize.width - 2),
          Math.max(0, availableSize.height - 2),
        ),
      ) ?? Size.zero
    return new Size(childSize.width + 2, childSize.height + 2)
  }

  render(viewport: Viewport) {
    const maxX = viewport.contentSize.width
    const maxY = viewport.contentSize.height
    const innerWidth = maxX - 2
    const innerHeight = maxY - 2

    // Draw a '#' border
    for (let x = 0; x < maxX; x++) {
      viewport.write('#', new Point(x, 0))
      viewport.write('#', new Point(x, maxY - 1))
    }
    for (let y = 1; y < maxY - 1; y++) {
      viewport.write('#', new Point(0, y))
      viewport.write('#', new Point(maxX - 1, y))
    }

    const outerRect = new Rect(Point.zero, [maxX, maxY])
    const innerRect = new Rect(new Point(1, 1), [innerWidth, innerHeight])

    viewport.clipped(outerRect, inside => {
      inside.inset(innerRect, inset => {
        super.render(inset)
      })
    })
  }
}

/**
 * A container that uses inset and draws into the availableRect (negative
 * coordinates) to draw on top of the border.
 */
class OverflowBox extends Container {
  naturalSize(availableSize: Size): Size {
    return new Size(
      Math.max(0, availableSize.width),
      Math.max(0, availableSize.height),
    )
  }

  render(viewport: Viewport) {
    const maxX = viewport.contentSize.width
    const maxY = viewport.contentSize.height

    // Draw a '#' border
    for (let x = 0; x < maxX; x++) {
      viewport.write('#', new Point(x, 0))
      viewport.write('#', new Point(x, maxY - 1))
    }
    for (let y = 1; y < maxY - 1; y++) {
      viewport.write('#', new Point(0, y))
      viewport.write('#', new Point(maxX - 1, y))
    }

    const outerRect = new Rect(Point.zero, [maxX, maxY])
    const innerRect = new Rect(new Point(1, 1), [maxX - 2, maxY - 2])

    viewport.clipped(outerRect, inside => {
      inside.inset(innerRect, inset => {
        const avail = inset.availableRect
        // Write 'L' at the left border
        inset.write('L', new Point(avail.origin.x, 0))
        // Write 'R' at the right border
        inset.write('R', new Point(avail.origin.x + avail.size.width - 1, 0))
        // Render children normally inside the inset area
        super.render(inset)
      })
    })
  }
}

describe('Viewport.inset', () => {
  it('children render inside the inset area', () => {
    const t = testRender(new InsetBox({children: [new Text({text: 'Hi'})]}), {
      width: 6,
      height: 3,
    })
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('availableRect extends beyond contentRect', () => {
    const t = testRender(
      new OverflowBox({children: [new Text({text: 'ok'})]}),
      {width: 7, height: 3},
    )
    // OverflowBox writes 'L' and 'R' on top of the border
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('contentSize reflects the inset dimensions', () => {
    let capturedContentSize: Size | undefined
    let capturedAvailableRect: Rect | undefined

    class ProbeView extends View {
      naturalSize() {
        return new Size(1, 1)
      }
      render(viewport: Viewport) {
        capturedContentSize = viewport.contentSize
        capturedAvailableRect = viewport.availableRect
      }
    }

    testRender(new InsetBox({children: [new ProbeView()]}), {
      width: 8,
      height: 5,
    })

    // Inner area is 6x3 (8-2, 5-2)
    expect(capturedContentSize).toEqual(new Size(6, 3))
    // Available rect origin is (-1,-1), size is (8,5) — the full outer area
    expect(capturedAvailableRect).toEqual(
      new Rect(new Point(-1, -1), new Size(8, 5)),
    )
  })

  it('state is restored after inset callback', () => {
    let outerContentSize: Size | undefined
    let outerAvailableRect: Rect | undefined

    class CheckRestoreContainer extends Container {
      naturalSize(availableSize: Size) {
        return availableSize
      }

      render(viewport: Viewport) {
        const outerRect = new Rect(Point.zero, viewport.contentSize)
        const innerRect = new Rect(
          new Point(1, 1),
          new Size(
            viewport.contentSize.width - 2,
            viewport.contentSize.height - 2,
          ),
        )

        viewport.clipped(outerRect, inside => {
          inside.inset(innerRect, _inset => {
            // do nothing inside
          })
          // After inset callback, state should be restored
          outerContentSize = inside.contentSize
          outerAvailableRect = inside.availableRect
        })
      }
    }

    testRender(new CheckRestoreContainer({children: []}), {
      width: 10,
      height: 6,
    })

    expect(outerContentSize).toEqual(new Size(10, 6))
    expect(outerAvailableRect).toEqual(new Rect(Point.zero, new Size(10, 6)))
  })
})
