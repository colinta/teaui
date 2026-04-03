import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/TestScreen.js'
import {Breadcrumb} from '../../lib/components/Breadcrumb.js'
import {Size} from '../../lib/geometry.js'

describe('Breadcrumb', () => {
  describe('brightenColor', () => {
    it('maps standard colors to bright variants', () => {
      expect(Breadcrumb.brightenColor('blue')).toBe('brightBlue')
      expect(Breadcrumb.brightenColor('red')).toBe('brightRed')
      expect(Breadcrumb.brightenColor('green')).toBe('brightGreen')
      expect(Breadcrumb.brightenColor('magenta')).toBe('brightMagenta')
      expect(Breadcrumb.brightenColor('cyan')).toBe('brightCyan')
      expect(Breadcrumb.brightenColor('yellow')).toBe('brightYellow')
      expect(Breadcrumb.brightenColor('white')).toBe('brightWhite')
      expect(Breadcrumb.brightenColor('black')).toBe('gray')
      expect(Breadcrumb.brightenColor('gray')).toBe('brightWhite')
    })

    it('passes through already-bright and non-string colors', () => {
      expect(Breadcrumb.brightenColor('brightBlue')).toBe('brightBlue')
      expect(Breadcrumb.brightenColor([128, 0, 255])).toEqual([128, 0, 255])
    })
  })

  describe('clippedTitle', () => {
    it('returns short titles unchanged', () => {
      expect(Breadcrumb.clippedTitle('Home')).toBe('Home')
    })

    it('truncates long titles with ellipsis', () => {
      const long = 'A'.repeat(30)
      const clipped = Breadcrumb.clippedTitle(long)
      expect(clipped.endsWith('…')).toBe(true)
      expect(clipped.length).toBeLessThanOrEqual(26)
    })
  })

  describe('measureSegments', () => {
    it('returns empty array for no items', () => {
      expect(Breadcrumb.measureSegments([])).toEqual([])
    })

    it('first segment has no arrow', () => {
      const segs = Breadcrumb.measureSegments([{title: 'Home'}])
      expect(segs).toHaveLength(1)
      expect(segs[0].arrowWidth).toBe(0)
      expect(segs[0].arrowX).toBe(0)
      expect(segs[0].textX).toBe(0)
      expect(segs[0].textWidth).toBeGreaterThan(0)
    })

    it('subsequent segments have arrow width of 1', () => {
      const segs = Breadcrumb.measureSegments([
        {title: 'Home'},
        {title: 'Blog'},
      ])
      expect(segs).toHaveLength(2)
      expect(segs[1].arrowWidth).toBe(1)
      expect(segs[1].textX).toBe(segs[1].arrowX + 1)
    })

    it('segments are contiguous', () => {
      const segs = Breadcrumb.measureSegments([
        {title: 'A'},
        {title: 'B'},
        {title: 'C'},
      ])
      for (let i = 1; i < segs.length; i++) {
        const prevEnd = segs[i - 1].textX + segs[i - 1].textWidth
        expect(segs[i].arrowX).toBe(prevEnd)
      }
    })
  })

  describe('highlightStyles', () => {
    const blue = {fg: 'white' as const, bg: 'blue' as const}
    const green = {fg: 'white' as const, bg: 'green' as const}

    it('returns normal styles when not hovered', () => {
      const {segmentStyle, arrowStyle, finalArrowStyle} =
        Breadcrumb.highlightStyles(blue, null, false, true, true, true, false)
      expect(segmentStyle.underline).toBeFalsy()
      expect(arrowStyle).toBeNull()
      expect(finalArrowStyle).not.toBeNull()
    })

    it('does not underline when active and hovered', () => {
      const {segmentStyle} = Breadcrumb.highlightStyles(
        blue,
        null,
        true,
        true,
        true,
        true,
        false,
      )
      expect(segmentStyle.underline).toBeFalsy()
    })

    it('underlines when inactive and hovered', () => {
      const {segmentStyle} = Breadcrumb.highlightStyles(
        blue,
        null,
        true,
        false,
        true,
        true,
        false,
      )
      expect(segmentStyle.underline).toBe(true)
    })

    it('adjusts left arrow bg when this item is hovered', () => {
      const {arrowStyle} = Breadcrumb.highlightStyles(
        green,
        blue,
        true,
        true,
        false,
        false,
        false,
      )
      expect(arrowStyle).not.toBeNull()
    })

    it('adjusts left arrow fg when previous item is hovered', () => {
      const {arrowStyle} = Breadcrumb.highlightStyles(
        green,
        blue,
        false,
        true,
        false,
        false,
        true,
      )
      expect(arrowStyle).not.toBeNull()
    })

    it('trailing arrow uses brightened bg as fg when hovered', () => {
      const {finalArrowStyle} = Breadcrumb.highlightStyles(
        blue,
        green,
        true,
        true,
        false,
        true,
        false,
      )
      expect(finalArrowStyle).not.toBeNull()
    })
  })

  describe('rendering', () => {
    it('renders empty when no items', () => {
      const breadcrumb = new Breadcrumb({items: []})
      const t = testRender(breadcrumb, {width: 20, height: 1})
      expect(t.terminal.textContent().trim()).toBe('')
    })

    it('renders single item with home icon', () => {
      const breadcrumb = new Breadcrumb({
        items: [{title: 'Home'}],
      })
      const t = testRender(breadcrumb, {width: 20, height: 1})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders multiple items with separators', () => {
      const breadcrumb = new Breadcrumb({
        items: [{title: 'Home'}, {title: 'Blog'}, {title: 'Post'}],
      })
      const t = testRender(breadcrumb, {width: 30, height: 1})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('calculates natural size correctly', () => {
      const breadcrumb = new Breadcrumb({
        items: [{title: 'Home'}, {title: 'Blog'}, {title: 'Post'}],
      })
      const size = breadcrumb.naturalSize(new Size(100, 100))
      expect(size.height).toBe(1)
      expect(size.width).toBeGreaterThan(15)
      expect(size.width).toBeLessThan(35)
    })

    it('renders inactive state', () => {
      const breadcrumb = new Breadcrumb({
        items: [{title: 'Home'}, {title: 'Blog'}],
        isActive: false,
      })
      const t = testRender(breadcrumb, {width: 30, height: 1})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('uses custom palette when provided', () => {
      const breadcrumb = new Breadcrumb({
        items: [{title: 'Home'}, {title: 'Blog'}],
        palette: [
          {fg: 'red', bg: 'yellow'},
          {fg: 'green', bg: 'blue'},
        ],
      })
      const t = testRender(breadcrumb, {width: 30, height: 1})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })
  })

  describe('mouse interaction', () => {
    it('fires onPress callback when breadcrumb item is clicked', () => {
      let homeClicked = false
      let blogClicked = false
      const breadcrumb = new Breadcrumb({
        items: [
          {
            title: 'Home',
            onPress: () => {
              homeClicked = true
            },
          },
          {
            title: 'Blog',
            onPress: () => {
              blogClicked = true
            },
          },
        ],
      })
      const t = testRender(breadcrumb, {width: 30, height: 1})

      t.sendMouse('mouse.button.down', {x: 3, y: 0})
      t.sendMouse('mouse.button.up', {x: 3, y: 0})
      expect(homeClicked).toBe(true)
      expect(blogClicked).toBe(false)

      homeClicked = false

      t.sendMouse('mouse.button.down', {x: 15, y: 0})
      t.sendMouse('mouse.button.up', {x: 15, y: 0})
      expect(homeClicked).toBe(false)
      expect(blogClicked).toBe(true)
    })

    it('underlines hovered breadcrumb item when inactive', () => {
      const breadcrumb = new Breadcrumb({
        items: [{title: 'Home'}, {title: 'Blog'}, {title: 'Post'}],
        isActive: false,
      })
      const t = testRender(breadcrumb, {width: 30, height: 1})

      t.sendMouse('mouse.move.in', {x: 15, y: 0})
      t.render()

      expect(t.terminal.styleOf('Blog')?.underline).toBe(true)
      expect(t.terminal.styleOf('Home')?.underline).toBeFalsy()
    })

    it('does not underline hovered breadcrumb item when active', () => {
      const breadcrumb = new Breadcrumb({
        items: [{title: 'Home'}, {title: 'Blog'}, {title: 'Post'}],
        isActive: true,
      })
      const t = testRender(breadcrumb, {width: 30, height: 1})

      t.sendMouse('mouse.move.in', {x: 15, y: 0})
      t.render()

      expect(t.terminal.styleOf('Blog')?.underline).toBeFalsy()
    })

    it('clears hover when mouse exits', () => {
      const breadcrumb = new Breadcrumb({
        items: [{title: 'Home'}, {title: 'Blog'}],
        isActive: false,
      })
      const t = testRender(breadcrumb, {width: 30, height: 1})

      t.sendMouse('mouse.move.in', {x: 3, y: 0})
      t.render()
      expect(t.terminal.styleOf('Home')?.underline).toBe(true)

      t.sendMouse('mouse.move.in', {x: 3, y: 5})
      t.render()
      expect(t.terminal.styleOf('Home')?.underline).toBeFalsy()
    })

    it('handles missing onPress callbacks gracefully', () => {
      const breadcrumb = new Breadcrumb({
        items: [{title: 'Home'}, {title: 'Blog'}],
      })
      const t = testRender(breadcrumb, {width: 30, height: 1})

      t.sendMouse('mouse.button.down', {x: 5, y: 0})
      t.sendMouse('mouse.button.up', {x: 5, y: 0})

      expect(t.terminal.textContent()).toContain('Home')
    })
  })

  describe('updates', () => {
    it('updates items when props change', () => {
      const breadcrumb = new Breadcrumb({
        items: [{title: 'Home'}],
      })
      let t = testRender(breadcrumb, {width: 30, height: 1})
      expect(t.terminal.textContent()).toContain('Home')
      expect(t.terminal.textContent()).not.toContain('Blog')

      breadcrumb.update({
        items: [{title: 'Home'}, {title: 'Blog'}],
      })
      t.render()
      expect(t.terminal.textContent()).toContain('Home')
      expect(t.terminal.textContent()).toContain('Blog')
    })

    it('updates active state when props change', () => {
      const breadcrumb = new Breadcrumb({
        items: [{title: 'Home'}],
        isActive: true,
      })
      const t = testRender(breadcrumb, {width: 30, height: 1})

      breadcrumb.update({
        items: [{title: 'Home'}],
        isActive: false,
      })
      t.render()

      expect(t.terminal.textContent()).toContain('Home')
    })
  })
})
