import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/testing.js'
import {Separator} from '../../lib/components/Separator.js'
import {Stack} from '../../lib/components/Stack.js'
import {Text} from '../../lib/components/Text.js'

describe('Separator', () => {
  it('renders horizontal separator in vertical stack', () => {
    const t = testRender(
      new Stack({
        children: [
          new Text({text: 'Above'}),
          new Separator({}),
          new Text({text: 'Below'}),
        ],
        direction: 'down',
      }),
      {width: 10, height: 3},
    )
    expect(t.terminal.textAtRow(0)).toBe('Above')
    // Separator should be a line of horizontal chars
    const sepRow = t.terminal.getRow(1)
    expect(sepRow).toMatch(/[─━═⠒]/)
    expect(t.terminal.textAtRow(2)).toBe('Below')
  })
})
