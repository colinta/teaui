import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/TestScreen.js'
import {Page} from '../../lib/components/Page.js'
import {Text} from '../../lib/components/Text.js'

function makePages() {
  return Page.create([
    ['Welcome', new Text({text: 'Welcome page content'})],
    ['Settings', new Text({text: 'Settings panel'})],
    ['Help', new Text({text: 'Help documentation'})],
  ])
}

function makePagesNoTitles() {
  return Page.create([
    new Page.Section({child: new Text({text: 'Page one'})}),
    new Page.Section({child: new Text({text: 'Page two'})}),
    new Page.Section({child: new Text({text: 'Page three'})}),
  ])
}

function makePagesWithHeadings() {
  const page = new Page()
  page.add(new Text({text: 'Welcome page content', heading: 'Welcome'}))
  page.add(new Text({text: 'Settings panel', heading: 'Settings'}))
  page.add(new Text({text: 'Help documentation', heading: 'Help'}))
  return page
}

describe('Page', () => {
  it('renders first page with dot indicators and title', () => {
    const page = makePages()
    const t = testRender(page, {width: 30, height: 5})
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('renders without titles', () => {
    const page = makePagesNoTitles()
    const t = testRender(page, {width: 20, height: 4})
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('navigates to next page via PageDown', () => {
    const page = makePages()
    const t = testRender(page, {width: 30, height: 5})
    expect(t.terminal.textContent()).toMatchSnapshot()

    t.sendKey('pagedown')
    t.tick(5000)
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('navigates to previous page via PageUp', () => {
    const page = makePages()
    page.activeIndex = 2
    const t = testRender(page, {width: 30, height: 5})
    t.tick(5000)
    expect(t.terminal.textContent()).toMatchSnapshot()

    t.sendKey('pageup')
    t.tick(5000)
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('navigates to first page via Home', () => {
    const page = makePages()
    page.activeIndex = 2
    const t = testRender(page, {width: 30, height: 5})
    t.tick(5000)

    t.sendKey('home')
    t.tick(5000)
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('navigates to last page via End', () => {
    const page = makePages()
    const t = testRender(page, {width: 30, height: 5})

    t.sendKey('end')
    t.tick(5000)
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('does not navigate past first page', () => {
    const page = makePages()
    const t = testRender(page, {width: 30, height: 5})
    t.sendKey('pageup')
    t.tick(5000)
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('does not navigate past last page', () => {
    const page = makePages()
    page.activeIndex = 2
    const t = testRender(page, {width: 30, height: 5})
    t.tick(5000)
    t.sendKey('pagedown')
    t.tick(5000)
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('clicking dot navigates to that page', () => {
    const page = makePages()
    const t = testRender(page, {width: 30, height: 5})

    // dots are centered: 3 dots * 3 width = 9, startX = floor((30-9)/2) = 10
    // dot 0 at x=10..12, dot 1 at x=13..15, dot 2 at x=16..18
    // dotsY = contentHeight(3) + titleRow(1) = 4
    // Click the second dot (Settings)
    t.sendMouse('mouse.button.down', {x: 14, y: 4})
    t.sendMouse('mouse.button.up', {x: 14, y: 4})
    t.tick(5000)
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('mouse scroll accumulates to threshold of 2', () => {
    const page = makePages()
    const t = testRender(page, {width: 30, height: 5})

    // 1 scroll should not change page
    t.sendMouse('mouse.wheel.down', {x: 15, y: 2})
    t.tick(5000)
    expect(t.terminal.textContent()).toMatchSnapshot()

    // 2nd scroll should trigger navigation
    t.sendMouse('mouse.wheel.down', {x: 15, y: 2})
    t.tick(5000)
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('mouse scroll resets after timeout', () => {
    const page = makePages()
    const t = testRender(page, {width: 30, height: 5})

    // 1 scroll, then wait for timeout to expire
    t.sendMouse('mouse.wheel.down', {x: 15, y: 2})
    t.tick(500) // exceeds SCROLL_TIMEOUT (300ms)

    // 1 more scroll should not trigger (accumulator was reset)
    t.sendMouse('mouse.wheel.down', {x: 15, y: 2})
    t.tick(5000)
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('mouse scroll up navigates backward', () => {
    const page = makePages()
    page.activeIndex = 1
    const t = testRender(page, {width: 30, height: 5})
    t.tick(5000)

    for (let i = 0; i < 2; i++) {
      t.sendMouse('mouse.wheel.up', {x: 15, y: 2})
    }
    t.tick(5000)
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('animates page transition', () => {
    const page = makePages()
    const t = testRender(page, {width: 30, height: 5})
    expect(t.terminal.textContent()).toMatchSnapshot()

    t.sendKey('pagedown')
    // Early in animation — both pages visible, sliding left
    t.tick(20)
    expect(t.terminal.textContent()).toMatchSnapshot()

    // Further into animation
    t.tick(80)
    expect(t.terminal.textContent()).toMatchSnapshot()

    // Complete animation
    t.tick(5000)
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('single section renders without dots navigation issues', () => {
    const page = Page.create([['Only Page', new Text({text: 'Solo content'})]])
    const t = testRender(page, {width: 20, height: 4})
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('renders child views with heading prop (no Section wrapper)', () => {
    const page = makePagesWithHeadings()
    const t = testRender(page, {width: 30, height: 5})
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('navigates heading-based pages via PageDown', () => {
    const page = makePagesWithHeadings()
    const t = testRender(page, {width: 30, height: 5})

    t.sendKey('pagedown')
    t.tick(5000)
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('heading-based pages without headings omit title row', () => {
    const page = new Page()
    page.add(new Text({text: 'Page one'}))
    page.add(new Text({text: 'Page two'}))
    const t = testRender(page, {width: 20, height: 4})
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('onChange callback fires on navigation', () => {
    const changes: number[] = []
    const page = Page.create(
      [
        ['A', new Text({text: 'A'})],
        ['B', new Text({text: 'B'})],
        ['C', new Text({text: 'C'})],
      ],
      {onChange: index => changes.push(index)},
    )
    const t = testRender(page, {width: 20, height: 5})
    t.sendKey('pagedown')
    t.tick(5000)
    t.sendKey('end')
    t.tick(5000)
    expect(changes).toEqual([1, 2])
  })
})
