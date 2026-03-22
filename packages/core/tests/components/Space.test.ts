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
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('fills remaining space between siblings', () => {
    const t = testRender(
      new Stack({
        children: [new Text({text: 'A'}), new Space({}), new Text({text: 'B'})],
        direction: 'down',
      }),
      {width: 5, height: 3},
    )
    expect(t.terminal.textContent()).toMatchSnapshot()
  })
})
