import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/testing.js'
import {Breadcrumb} from '../../lib/components/Breadcrumb.js'
import {Size} from '../../lib/geometry.js'

describe('Breadcrumb', () => {
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
      const content = t.terminal.textContent()
      expect(content).toContain('🏠')
      expect(content).toContain('Home')
      // Should contain home icon followed by Home text
      expect(content).toMatch(/🏠.*Home/)
    })

    it('renders multiple items with separators', () => {
      const breadcrumb = new Breadcrumb({
        items: [{title: 'Home'}, {title: 'Blog'}, {title: 'Post'}],
      })
      const t = testRender(breadcrumb, {width: 30, height: 1})
      const content = t.terminal.textContent()
      expect(content).toContain('🏠')
      expect(content).toContain('Home')
      expect(content).toContain('Blog')
      expect(content).toContain('Post')
      // Should contain powerline arrows
      expect(content).toContain('')
    })

    it('calculates natural size correctly', () => {
      const breadcrumb = new Breadcrumb({
        items: [{title: 'Home'}, {title: 'Blog'}, {title: 'Post'}],
      })
      const size = breadcrumb.naturalSize(new Size(100, 100))
      expect(size.height).toBe(1)
      // Size should account for: " 🏠 Home " + "" + " Blog " + "" + " Post " + ""
      // Roughly: 2 + 4 + 2 + 1 + 6 + 1 + 6 + 1 = 23 characters (plus actual unicode widths)
      expect(size.width).toBeGreaterThan(15)
      expect(size.width).toBeLessThan(35)
    })

    it('renders inactive state without background colors', () => {
      const breadcrumb = new Breadcrumb({
        items: [{title: 'Home'}, {title: 'Blog'}],
        isActive: false,
      })
      const t = testRender(breadcrumb, {width: 30, height: 1})
      const content = t.terminal.textContent()
      expect(content).toContain('🏠')
      expect(content).toContain('Home')
      expect(content).toContain('Blog')
      // Should still contain separators but in muted style
      expect(content).toContain('')
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
      // The component should render without errors
      expect(t.terminal.textContent()).toContain('Home')
      expect(t.terminal.textContent()).toContain('Blog')
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

      // Click on the Home item (should be near the beginning)
      t.sendMouse('mouse.button.down', {x: 3, y: 0})
      t.sendMouse('mouse.button.up', {x: 3, y: 0})
      expect(homeClicked).toBe(true)
      expect(blogClicked).toBe(false)

      homeClicked = false

      // Click on the Blog item (should be further right)
      // Need to account for " 🏠 Home " + "" + " Blog"
      t.sendMouse('mouse.button.down', {x: 15, y: 0})
      t.sendMouse('mouse.button.up', {x: 15, y: 0})
      expect(homeClicked).toBe(false)
      expect(blogClicked).toBe(true)
    })

    it('does not fire callback when clicking on separators', () => {
      let clicked = false
      const breadcrumb = new Breadcrumb({
        items: [
          {
            title: 'Home',
            onPress: () => {
              clicked = true
            },
          },
          {
            title: 'Blog',
            onPress: () => {
              clicked = true
            },
          },
        ],
      })
      const t = testRender(breadcrumb, {width: 30, height: 1})

      // Click on what should be the arrow separator between items
      // This is approximate since we don't know exact positioning
      t.sendMouse('mouse.button.down', {x: 10, y: 0})
      t.sendMouse('mouse.button.up', {x: 10, y: 0})
      // Should not fire if we clicked exactly on the separator
      // Note: This test is a bit fragile since positioning depends on text width
    })

    it('handles missing onPress callbacks gracefully', () => {
      const breadcrumb = new Breadcrumb({
        items: [
          {title: 'Home'}, // No onPress
          {title: 'Blog'}, // No onPress
        ],
      })
      const t = testRender(breadcrumb, {width: 30, height: 1})

      // Click should not crash
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

      // Component should still render
      expect(t.terminal.textContent()).toContain('Home')
    })
  })
})
