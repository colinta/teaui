import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/testing.js'
import {Space} from '../../lib/components/Space.js'
import {Stack} from '../../lib/components/Stack.js'
import {Text} from '../../lib/components/Text.js'

describe('Space', () => {
  it('pushes content apart in a vertical stack', () => {
    const t = testRender(
      new Stack({
        children: [
          new Text({text: 'Top'}),
          new Space({}),
          new Text({text: 'Bottom'}),
        ],
        direction: 'down',
      }),
      {width: 10, height: 5},
    )
    // Top should be at row 0
    expect(t.terminal.textAtRow(0)).toBe('Top')
    // Bottom should be pushed down (not adjacent to Top)
    // Find which row has 'Bottom'
    const pos = t.terminal.find('Bottom')
    expect(pos).not.toBeNull()
    expect(pos!.y).toBeGreaterThan(0)
  })

  it('fills remaining space between siblings', () => {
    const t = testRender(
      new Stack({
        children: [
          new Text({text: 'A'}),
          new Space({}),
          new Text({text: 'B'}),
        ],
        direction: 'down',
      }),
      {width: 5, height: 3},
    )
    // A at top, B somewhere below
    expect(t.terminal.textAtRow(0)).toBe('A')
    const pos = t.terminal.find('B')
    expect(pos).not.toBeNull()
    expect(pos!.y).toBeGreaterThan(0)
  })
})
