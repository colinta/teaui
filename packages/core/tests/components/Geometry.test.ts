import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/TestScreen.js'
import {Geometry} from '../../lib/components/Geometry.js'
import {Text} from '../../lib/components/Text.js'
import {Size} from '../../lib/geometry.js'

describe('Geometry', () => {
  it('fills available space by default', () => {
    const geo = new Geometry({})
    const size = geo.naturalSize(new Size(40, 20))
    expect(size.width).toBe(40)
    expect(size.height).toBe(20)
  })

  it('calls onLayout with content size', () => {
    let layoutSize: Size | null = null
    const t = testRender(
      new Geometry({
        onLayout(size) {
          layoutSize = size
        },
      }),
      {width: 30, height: 10},
    )
    expect(layoutSize).not.toBeNull()
    expect(layoutSize!.width).toBe(30)
    expect(layoutSize!.height).toBe(10)
  })

  it('renders children', () => {
    const t = testRender(
      new Geometry({
        child: new Text({text: 'Hello'}),
      }),
      {width: 20, height: 3},
    )
    expect(t.terminal.textContent()).toContain('Hello')
  })

  it('does not call onLayout when size is unchanged', () => {
    let callCount = 0
    const t = testRender(
      new Geometry({
        onLayout() {
          callCount++
        },
      }),
      {width: 30, height: 10},
    )
    expect(callCount).toBe(1)
    // re-render at the same size
    t.render()
    expect(callCount).toBe(1)
  })
})
