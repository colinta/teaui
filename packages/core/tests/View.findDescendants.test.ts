import {describe, expect, it} from 'vitest'

import {Box} from '../lib/components/Box.js'
import {Checkbox} from '../lib/components/Checkbox.js'
import {Stack} from '../lib/components/Stack.js'
import {Text} from '../lib/components/Text.js'

describe('View.findDescendants', () => {
  it('returns an empty array for views without children', () => {
    expect(new Text('leaf').findDescendants(() => true)).toEqual([])
  })

  it('finds matching descendants recursively, in depth-first order', () => {
    const first = new Text('first')
    const nested = new Text('nested')
    const last = new Text('last')
    const root = Stack.down([first, new Box({child: nested}), last])

    expect(root.findDescendants(view => view instanceof Text)).toEqual([
      first,
      nested,
      last,
    ])
  })

  it('does not include the view itself', () => {
    const root = Stack.down([new Text('child')])
    expect(root.findDescendants(view => view === root)).toEqual([])
  })

  it('narrows the type with a type guard', () => {
    const checkbox = new Checkbox({title: 'a', value: true})
    const root = Stack.down([new Text('text'), checkbox])
    const found: Checkbox[] = root.findDescendants(
      (view): view is Checkbox => view instanceof Checkbox,
    )
    expect(found).toEqual([checkbox])
  })
})
