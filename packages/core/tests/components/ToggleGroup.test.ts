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
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('calls onChange on click (multiple)', () => {
    let changed: number | undefined
    let selected: number[] | undefined
    const tg = new ToggleGroup({
      titles: ['A', 'B', 'C'],
      selected: [],
      multiple: true,
      onChange(c, s) {
        changed = c
        selected = s
      },
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
      onChange(c, s) {
        changed = c
        selected = s
      },
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
      onChange(_c, s) {
        selected = s
      },
    })
    const t = testRender(tg, {width: 20, height: 3})
    t.sendMouse('mouse.button.down', {x: 1, y: 1})
    t.sendMouse('mouse.button.up', {x: 1, y: 1})
    expect(selected).toEqual([])
  })

  it('shows selected state', () => {
    const tg = new ToggleGroup({
      titles: ['A', 'B', 'C'],
      selected: [1],
      multiple: true,
    })
    const t = testRender(tg, {width: 20, height: 3})
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('shows unselected state', () => {
    const tg = new ToggleGroup({
      titles: ['A', 'B', 'C'],
      selected: [],
      multiple: true,
    })
    const t = testRender(tg, {width: 20, height: 3})
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('updates visual state after click', () => {
    let currentSelected: number[] = []
    const onChange = (c: number, s: number[]) => {
      currentSelected = s
    }
    const tg = new ToggleGroup({
      titles: ['A', 'B', 'C'],
      selected: currentSelected,
      multiple: true,
      onChange,
    })
    const t = testRender(tg, {width: 20, height: 3})

    expect(t.terminal.textContent()).toMatchSnapshot()

    // Click A
    t.sendMouse('mouse.button.down', {x: 1, y: 1})
    t.sendMouse('mouse.button.up', {x: 1, y: 1})
    expect(currentSelected).toEqual([0])

    t.render()

    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('clicking second button works', () => {
    let selected: number[] | undefined
    const tg = new ToggleGroup({
      titles: ['A', 'B', 'C'],
      selected: [],
      multiple: true,
      onChange(_c, s) {
        selected = s
      },
    })
    const t = testRender(tg, {width: 20, height: 3})
    t.sendMouse('mouse.button.down', {x: 5, y: 1})
    t.sendMouse('mouse.button.up', {x: 5, y: 1})
    expect(selected).toEqual([1])
  })
})
