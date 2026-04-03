import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/TestScreen.js'
import {Pane} from '../../lib/components/Pane.js'
import {Text} from '../../lib/components/Text.js'

function createPane(opts: {border?: boolean; collapsible?: boolean} = {}) {
  const left = new Text({text: 'LEFT'})
  const right = new Text({text: 'RIGHT'})
  const pane = new Pane({
    border: opts.border,
    collapsible: opts.collapsible,
    children: [left, right],
  })
  return {pane, left, right}
}

/**
 * Find the x position of the first separator ('┃') in the given row.
 */
function findSeparatorX(
  t: ReturnType<typeof testRender>,
  width: number,
  row: number = 0,
): number {
  const text = t.terminal.textRect(0, row, width, 1)
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '┃') return i
  }
  return -1
}

describe('Pane', () => {
  describe('basic layout', () => {
    it('renders two panes with separator', () => {
      const {pane} = createPane()
      const t = testRender(pane, {width: 40, height: 3})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders with border', () => {
      const {pane} = createPane({border: true})
      const t = testRender(pane, {width: 30, height: 5})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })
  })

  describe('multiple browser panes', () => {
    it('renders three panes with two separators', () => {
      const a = new Text({text: 'A'})
      const b = new Text({text: 'B'})
      const detail = new Text({text: 'DETAIL'})
      const pane = new Pane({children: [a, b, detail]})
      const t = testRender(pane, {width: 60, height: 3})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })
  })

  describe('single child', () => {
    it('renders just the detail pane with no separators', () => {
      const detail = new Text({text: 'ONLY'})
      const pane = new Pane({children: [detail]})
      const t = testRender(pane, {width: 20, height: 3})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })
  })

  describe('collapsible drag-to-collapse', () => {
    it('shows ← arrows when dragged into collapse zone', () => {
      const {pane} = createPane({collapsible: true})
      const t = testRender(pane, {width: 40, height: 5})

      const sepX = findSeparatorX(t, 40)
      expect(sepX).toBeGreaterThan(0)

      // Start drag on separator, then drag far left into collapse zone
      t.sendMouse('mouse.button.down', {x: sepX, y: 2})
      t.sendMouse('mouse.button.down', {x: 2, y: 2})

      const content = t.terminal.textContent()
      expect(content).toContain('←')
    })

    it('collapses pane when released in collapse zone', () => {
      const {pane} = createPane({collapsible: true})
      const t = testRender(pane, {width: 40, height: 5})

      const sepX = findSeparatorX(t, 40)
      expect(sepX).toBeGreaterThan(0)

      // Start drag, drag into collapse zone, release
      t.sendMouse('mouse.button.down', {x: sepX, y: 2})
      t.sendMouse('mouse.button.down', {x: 1, y: 2})
      t.sendMouse('mouse.button.up', {x: 1, y: 2})

      const content = t.terminal.textContent()
      expect(content).toContain('║')
      expect(content).not.toContain('LEFT')
    })

    it('click toggles collapse', () => {
      const {pane} = createPane({collapsible: true})
      const t = testRender(pane, {width: 40, height: 3})

      const sepX = findSeparatorX(t, 40)
      expect(sepX).toBeGreaterThan(0)

      // Click separator (down + up at same position)
      t.sendMouse('mouse.button.down', {x: sepX, y: 1})
      t.sendMouse('mouse.button.up', {x: sepX, y: 1})

      const content = t.terminal.textContent()
      expect(content).toContain('║')
      expect(content).not.toContain('LEFT')
    })
  })

  describe('non-collapsible', () => {
    it('does not collapse on click', () => {
      const {pane} = createPane({collapsible: false})
      const t = testRender(pane, {width: 40, height: 3})

      const sepX = findSeparatorX(t, 40)
      expect(sepX).toBeGreaterThan(0)

      // Click separator
      t.sendMouse('mouse.button.down', {x: sepX, y: 1})
      t.sendMouse('mouse.button.up', {x: sepX, y: 1})

      const content = t.terminal.textContent()
      expect(content).not.toContain('║')
      expect(content).toContain('LEFT')
    })

    it('enforces minimum width of 4 during drag', () => {
      const {pane} = createPane({collapsible: false})
      const t = testRender(pane, {width: 40, height: 3})

      const sepX = findSeparatorX(t, 40)
      expect(sepX).toBeGreaterThan(0)

      // Drag separator far left
      t.sendMouse('mouse.button.down', {x: sepX, y: 1})
      t.sendMouse('mouse.button.down', {x: 0, y: 1})

      const content = t.terminal.textContent()
      // No collapse arrows
      expect(content).not.toContain('←')
      // No collapsed separator
      expect(content).not.toContain('║')
      // Separator should be at position 4 (min width for non-collapsible)
      const row = t.terminal.textRect(0, 1, 10, 1)
      expect(row[4]).toBe('┃')
    })
  })
})
