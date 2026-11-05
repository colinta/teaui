import {describe, expect, it} from 'vitest'
import {ScrollableList} from '../../lib/components/ScrollableList.js'
import {Text} from '../../lib/components/Text.js'
import {testRender} from '../../lib/TestScreen.js'

const DATA = Array.from({length: 20}, (_, index) => `Item ${index + 1}`)

function scrollDown(t: ReturnType<typeof testRender>, count: number) {
  for (let index = 0; index < count; index++) {
    t.sendMouse('mouse.wheel.down', {x: 2, y: 2})
  }
}

describe('ScrollableList', () => {
  it('scrolls rows created by renderItem', () => {
    const list = new ScrollableList({
      data: DATA,
      renderItem: item => new Text({text: item}),
    })
    const t = testRender(list, {width: 12, height: 4})
    expect(t.terminal.textContent()).toMatchSnapshot()

    scrollDown(t, 3)
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('keeps and scrolls off-screen rows provided as children', () => {
    // Without renderItem, rows are the children (this is how the React
    // reconciler supplies them).
    const list = new ScrollableList({data: DATA})
    for (const item of DATA) {
      list.add(new Text({text: item}))
    }
    const t = testRender(list, {width: 12, height: 4})
    expect(t.terminal.textContent()).toMatchSnapshot()
    expect(list.children).toHaveLength(DATA.length)

    scrollDown(t, 3)
    expect(t.terminal.textContent()).toMatchSnapshot()
    expect(list.children).toHaveLength(DATA.length)

    scrollDown(t, 50)
    expect(t.terminal.textContent()).toMatchSnapshot()
  })
})
