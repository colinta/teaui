import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/TestScreen.js'
import {Badge} from '../../lib/components/Badge.js'
import {Palette} from '../../lib/Palette.js'
import {Size} from '../../lib/geometry.js'

describe('Badge', () => {
  describe('naturalSize', () => {
    it('returns zero for empty text', () => {
      const badge = new Badge()
      expect(badge.naturalSize(new Size(80, 24))).toEqual(Size.zero)
    })

    it('returns text width + 2 for caps', () => {
      const badge = new Badge({text: 'Hello'})
      const size = badge.naturalSize(new Size(80, 24))
      expect(size.width).toBe(7) // 5 chars + 2 caps
      expect(size.height).toBe(1)
    })

    it('returns width 3 for single char', () => {
      const badge = new Badge({text: 'X'})
      const size = badge.naturalSize(new Size(80, 24))
      expect(size.width).toBe(3)
      expect(size.height).toBe(1)
    })
  })

  describe('rendering', () => {
    it('renders with default purpose', () => {
      const badge = new Badge({text: 'info'})
      const t = testRender(badge, {width: 10, height: 1})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders with primary purpose', () => {
      const badge = new Badge({text: 'OK', purpose: 'primary'})
      const t = testRender(badge, {width: 10, height: 1})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders with cancel purpose', () => {
      const badge = new Badge({text: 'ERR', purpose: 'cancel'})
      const t = testRender(badge, {width: 10, height: 1})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders with proceed purpose', () => {
      const badge = new Badge({text: 'PASS', purpose: 'proceed'})
      const t = testRender(badge, {width: 10, height: 1})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders nothing for empty text', () => {
      const badge = new Badge()
      const t = testRender(badge, {width: 10, height: 1})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders in zero-size viewport', () => {
      const badge = new Badge({text: 'test'})
      const t = testRender(badge, {width: 0, height: 0})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })
  })

  describe('purpose', () => {
    it('defaults to plain palette', () => {
      const badge = new Badge({text: 'test'})
      expect(badge.purpose).toBe(Palette.plain)
    })

    it('uses primary palette', () => {
      const badge = new Badge({text: 'test', purpose: 'primary'})
      expect(badge.purpose).toBe(Palette.primary)
    })

    it('uses secondary palette', () => {
      const badge = new Badge({text: 'test', purpose: 'secondary'})
      expect(badge.purpose).toBe(Palette.secondary)
    })
  })

  describe('update', () => {
    it('updates text', () => {
      const badge = new Badge({text: 'old'})
      badge.update({text: 'new'})
      const t = testRender(badge, {width: 10, height: 1})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('updates purpose', () => {
      const badge = new Badge({text: 'test'})
      badge.update({text: 'test', purpose: 'cancel'})
      const t = testRender(badge, {width: 10, height: 1})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })
  })
})
