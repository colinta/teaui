import {describe, expect, it} from 'vitest'
import {View, type Props} from '../lib/View.js'
import {Size} from '../lib/geometry.js'
import {Stack} from '../lib/components/Stack.js'

class MeasuredView extends View {
  measurements = 0
  length = 30

  naturalSize(available: Size) {
    this.measurements++
    const width = Math.max(1, Math.min(this.length, available.width))
    return new Size(width, Math.ceil(this.length / width))
  }

  render() {}
}

describe('View natural-size cache', () => {
  it.each<Props>([
    {padding: 1},
    {paddingLeft: 2, width: 9, height: 'natural'},
    {x: 2, y: 1, maxWidth: 8, minHeight: 3},
    {padding: 1, width: 'fill', height: 'natural'},
  ])('caches caller dimensions, not adjusted dimensions: %j', props => {
    const view = new MeasuredView(props)
    const wide = new Size(20, 10)
    const narrow = new Size(18, 8)
    const expected = (size: Size) => new MeasuredView(props).naturalSize(size)

    expect(view.naturalSize(wide)).toEqual(expected(wide))
    expect(view.naturalSize(wide.copy())).toEqual(expected(wide))
    expect(view.measurements).toBe(1)
    // For padding: 1, this was the old stored key and could return a result
    // measured for the wider caller instead of measuring this request.
    expect(view.naturalSize(narrow)).toEqual(expected(narrow))
    expect(view.naturalSize(narrow.copy())).toEqual(expected(narrow))
    expect(view.naturalSize(wide)).toEqual(expected(wide))
    expect(view.measurements).toBe(2)
  })

  it('uses the size values at call time, even if a MutableSize is reused', () => {
    const view = new MeasuredView({paddingLeft: 2})
    const size = new Size(20, 10).mutableCopy()
    const first = view.naturalSize(size)
    size.width = 10
    expect(view.naturalSize(size)).not.toEqual(first)
    size.width = 20
    expect(view.naturalSize(size)).toEqual(first)
    expect(view.measurements).toBe(2)
  })

  it('invalidates all sizes and ancestors after content, props or visibility changes', () => {
    const view = new MeasuredView({padding: 1})
    const stack = Stack.down([view])
    const available = new Size(20, 10)
    const initial = stack.naturalSize(available)
    view.length = 100
    view.invalidateSize()
    expect(stack.naturalSize(available).height).toBeGreaterThan(initial.height)
    view.update({padding: 2, maxWidth: 10})
    expect(stack.naturalSize(available)).toEqual(view.naturalSize(available))
    view.isVisible = false
    expect(stack.naturalSize(available)).toEqual(Size.zero)
    view.isVisible = true
    expect(stack.naturalSize(available)).toEqual(view.naturalSize(available))
  })
})
