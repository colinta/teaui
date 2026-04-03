import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/TestScreen.js'
import {Align, AlignRow} from '../../lib/components/Align.js'
import {Text} from '../../lib/components/Text.js'
import {Size} from '../../lib/geometry.js'

describe('Align', () => {
  describe('row layout (down)', () => {
    it('aligns columns across rows', () => {
      const t = testRender(
        new Align({
          children: [
            Align.row([
              new Text({text: 'Actors'}),
              new Text({text: 'Keanu Reeves, Lori Petty'}),
            ]),
            Align.row([new Text({text: 'Released'}), new Text({text: '1991'})]),
          ],
        }),
        {width: 40, height: 2},
      )
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('aligns three columns', () => {
      const t = testRender(
        new Align({
          children: [
            Align.row([
              new Text({text: 'A'}),
              new Text({text: 'BB'}),
              new Text({text: 'CCC'}),
            ]),
            Align.row([
              new Text({text: 'DDD'}),
              new Text({text: 'E'}),
              new Text({text: 'F'}),
            ]),
          ],
        }),
        {width: 20, height: 2},
      )
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('non-AlignRow children span full width', () => {
      const t = testRender(
        new Align({
          children: [
            new Text({text: 'Title Line'}),
            Align.row([new Text({text: 'Key'}), new Text({text: 'Value'})]),
          ],
        }),
        {width: 20, height: 2},
      )
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders with custom separator', () => {
      const t = testRender(
        new Align({
          separator: '|',
          children: [
            Align.row([new Text({text: 'Left'}), new Text({text: 'Right'})]),
          ],
        }),
        {width: 20, height: 1},
      )
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders single row', () => {
      const t = testRender(
        new Align({
          children: [
            Align.row([new Text({text: 'Only'}), new Text({text: 'Row'})]),
          ],
        }),
        {width: 20, height: 1},
      )
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('handles empty Align', () => {
      const t = testRender(new Align({}), {width: 10, height: 3})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })
  })

  describe('up direction', () => {
    it('renders rows bottom to top', () => {
      const t = testRender(
        Align.up({
          children: [
            Align.row([new Text({text: 'First'}), new Text({text: 'A'})]),
            Align.row([new Text({text: 'Second'}), new Text({text: 'B'})]),
          ],
        }),
        {width: 20, height: 2},
      )
      expect(t.terminal.textContent()).toMatchSnapshot()
    })
  })

  describe('column layout (right)', () => {
    it('lays out columns left to right', () => {
      const t = testRender(
        Align.right({
          children: [
            Align.row([new Text({text: 'A'}), new Text({text: 'B'})]),
            Align.row([new Text({text: 'C'}), new Text({text: 'D'})]),
          ],
        }),
        {width: 10, height: 5},
      )
      expect(t.terminal.textContent()).toMatchSnapshot()
    })
  })

  describe('column layout (left)', () => {
    it('lays out columns right to left', () => {
      const t = testRender(
        Align.left({
          children: [
            Align.row([new Text({text: 'A'}), new Text({text: 'B'})]),
            Align.row([new Text({text: 'C'}), new Text({text: 'D'})]),
          ],
        }),
        {width: 10, height: 5},
      )
      expect(t.terminal.textContent()).toMatchSnapshot()
    })
  })

  describe('static constructors', () => {
    it('Align.down creates down-direction', () => {
      const t = testRender(
        Align.down({
          children: [Align.row([new Text({text: 'X'}), new Text({text: 'Y'})])],
        }),
        {width: 10, height: 1},
      )
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('Align.column is an alias for Align.right', () => {
      expect(Align.column).toBe(Align.right)
    })
  })

  describe('naturalSize', () => {
    it('computes natural size for row layout', () => {
      const align = new Align({
        children: [
          Align.row([
            new Text({text: 'Actors'}),
            new Text({text: 'Keanu Reeves'}),
          ]),
          Align.row([new Text({text: 'Released'}), new Text({text: '1991'})]),
        ],
      })
      const size = align.naturalSize(new Size(100, 100))
      // 'Released' (8) + ' │ ' (3) + 'Keanu Reeves' (12) = 23
      expect(size.width).toBe(23)
      expect(size.height).toBe(2)
    })
  })

  describe('mixed content', () => {
    it('renders AlignRows and plain views interleaved', () => {
      const t = testRender(
        new Align({
          children: [
            new Text({text: 'Header'}),
            Align.row([new Text({text: 'Name'}), new Text({text: 'Alice'})]),
            Align.row([new Text({text: 'Age'}), new Text({text: '30'})]),
            new Text({text: 'Footer'}),
          ],
        }),
        {width: 20, height: 4},
      )
      expect(t.terminal.textContent()).toMatchSnapshot()
    })
  })

  describe('update', () => {
    it('updates children via update()', () => {
      const align = new Align({
        children: [Align.row([new Text({text: 'A'}), new Text({text: 'B'})])],
      })
      const t = testRender(align, {width: 10, height: 2})
      expect(t.terminal.textContent()).toMatchSnapshot()

      align.update({
        children: [Align.row([new Text({text: 'CC'}), new Text({text: 'DD'})])],
      })
      t.render()
      expect(t.terminal.textContent()).toMatchSnapshot()
    })
  })
})
