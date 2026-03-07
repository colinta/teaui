import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/testing.js'
import {ToggleGroup} from '../../lib/components/ToggleGroup.js'

describe('ToggleGroup', () => {
  it('renders correctly', () => {
    const tg = new ToggleGroup({
      titles: ['A', 'B', 'C'],
      selected: [],
      multiple: true,
    })
    const t = testRender(tg, {width: 20, height: 3})
    expect(t.terminal.textContent()).toContain('A')
    expect(t.terminal.textContent()).toContain('B')
    expect(t.terminal.textContent()).toContain('C')
  })

  it('calls onChange on click (multiple)', () => {
    let changed: number | undefined
    let selected: number[] | undefined
    const tg = new ToggleGroup({
      titles: ['A', 'B', 'C'],
      selected: [],
      multiple: true,
      onChange(c, s) { changed = c; selected = s },
    })
    const t = testRender(tg, {width: 20, height: 3})
    t.sendMouse('mouse.button.down', {x: 1, y: 1})
    t.sendMouse('mouse.button.up', {x: 1, y: 1})
    expect(changed).toBe(0)
    expect(selected).toEqual([0])
  })

  it('calls onChange on click (single)', () => {
    let changed: number | undefined
    let selected: number[] | undefined
    const tg = new ToggleGroup({
      titles: ['A', 'B', 'C'],
      selected: [],
      multiple: false,
      onChange(c, s) { changed = c; selected = s },
    })
    const t = testRender(tg, {width: 20, height: 3})
    t.sendMouse('mouse.button.down', {x: 1, y: 1})
    t.sendMouse('mouse.button.up', {x: 1, y: 1})
    expect(changed).toBe(0)
    expect(selected).toEqual([0])
  })

  it('toggles off a selected button in multiple mode', () => {
    let selected: number[] | undefined
    const tg = new ToggleGroup({
      titles: ['A', 'B', 'C'],
      selected: [0],
      multiple: true,
      onChange(_c, s) { selected = s },
    })
    const t = testRender(tg, {width: 20, height: 3})
    t.sendMouse('mouse.button.down', {x: 1, y: 1})
    t.sendMouse('mouse.button.up', {x: 1, y: 1})
    expect(selected).toEqual([])
  })

  it('shows selected state with thick borders', () => {
    const tg = new ToggleGroup({
      titles: ['A', 'B', 'C'],
      selected: [1],
      multiple: true,
    })
    const t = testRender(tg, {width: 20, height: 3})
    const content = t.terminal.textContent()
    console.log('selected [1]:', JSON.stringify(content))
    expect(content).toContain('━')
    expect(content).toContain('┃')
  })

  it('shows unselected state with thin borders', () => {
    const tg = new ToggleGroup({
      titles: ['A', 'B', 'C'],
      selected: [],
      multiple: true,
    })
    const t = testRender(tg, {width: 20, height: 3})
    const content = t.terminal.textContent()
    console.log('selected []:', JSON.stringify(content))
    expect(content).not.toContain('━')
    expect(content).not.toContain('┃')
  })

  it('updates visual state after click', () => {
    let currentSelected: number[] = []
    const onChange = (c: number, s: number[]) => { currentSelected = s }
    const tg = new ToggleGroup({
      titles: ['A', 'B', 'C'],
      selected: currentSelected,
      multiple: true,
      onChange,
    })
    const t = testRender(tg, {width: 20, height: 3})

    let content = t.terminal.textContent()
    console.log('before click:', JSON.stringify(content))
    expect(content).not.toContain('━')

    // Click A
    t.sendMouse('mouse.button.down', {x: 1, y: 1})
    t.sendMouse('mouse.button.up', {x: 1, y: 1})
    expect(currentSelected).toEqual([0])

    // Simulate React update cycle
    tg.update({
      titles: ['A', 'B', 'C'],
      selected: currentSelected,
      multiple: true,
      onChange,
    })
    t.render()

    content = t.terminal.textContent()
    console.log('after click:', JSON.stringify(content))
    expect(content).toContain('━')
  })

  it('clicking second button works', () => {
    let selected: number[] | undefined
    const tg = new ToggleGroup({
      titles: ['A', 'B', 'C'],
      selected: [],
      multiple: true,
      onChange(_c, s) { selected = s },
    })
    const t = testRender(tg, {width: 20, height: 3})
    // B starts at x=4 (border + A width + border)
    // "╭───┬───┬───╮"  positions: ╭=0, ─=1,2,3, ┬=4, ─=5,6,7, ┬=8, ─=9,10,11, ╮=12
    // Click at x=5, y=1 should be in B
    t.sendMouse('mouse.button.down', {x: 5, y: 1})
    t.sendMouse('mouse.button.up', {x: 5, y: 1})
    console.log('clicked B, selected:', selected)
    expect(selected).toEqual([1])
  })
})
