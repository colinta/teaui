import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/TestScreen.js'
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
    expect(t.terminal.textContent()).toMatchSnapshot()
  })
})
