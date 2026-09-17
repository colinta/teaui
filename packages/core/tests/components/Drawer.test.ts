import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/TestScreen.js'
import {Drawer} from '../../lib/components/Drawer.js'
import {Text} from '../../lib/components/Text.js'
import {Size} from '../../lib/geometry.js'

describe('Drawer', () => {
  describe('content behind drawer does not bleed through', () => {
    it('left drawer covers background content', () => {
      // Use short drawer content so there's a gap where background could bleed
      const drawer = new Drawer({
        location: 'left',
        isOpen: true,
        drawer: new Text({text: 'AB'}),
        content: new Text({text: 'XXXXXXXXXXXXXXXXXXXXXXXXXX'}),
      })
      const t = testRender(drawer, {width: 20, height: 5})
      t.tick(5000)
      const lines = t.terminal.textContent().split('\n')
      // Lines 1-3 are the drawer interior (y=1..3, between top and bottom borders)
      // The drawer area (left of the button) should not contain any 'X'
      for (let i = 1; i < lines.length - 1; i++) {
        // drawerSize.width = naturalSize of 'AB' = 2
        // drawer button starts at x=2, button draws 2 chars (e.g. '‹│')
        // so content before x=4 should be drawer chrome or cleared
        const drawerArea = lines[i].slice(0, 2)
        expect(drawerArea).not.toContain('X')
      }
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('right drawer covers background content', () => {
      const drawer = new Drawer({
        location: 'right',
        isOpen: true,
        drawer: new Text({text: 'AB'}),
        content: new Text({text: 'XXXXXXXXXXXXXXXXXXXXXXXXXX'}),
      })
      const t = testRender(drawer, {width: 20, height: 5})
      t.tick(5000)
      const lines = t.terminal.textContent().split('\n')
      // The drawer area is at the right side; check the last chars
      for (let i = 1; i < lines.length - 1; i++) {
        const drawerArea = lines[i].slice(-4) // last 4 chars: 2 drawer + 2 button
        expect(drawerArea).not.toContain('X')
      }
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('top drawer covers background content', () => {
      const drawer = new Drawer({
        location: 'top',
        isOpen: true,
        drawer: new Text({text: 'AB'}),
        content: new Text({text: 'XXXXXXXXXXXXXXXXXXXXXXXXXX'}),
      })
      const t = testRender(drawer, {width: 20, height: 8})
      t.tick(5000)
      // Row 0 is the drawer content row (above the button)
      const lines = t.terminal.textContent().split('\n')
      const drawerLine = lines[0]
      expect(drawerLine).not.toContain('X')
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('bottom drawer covers background content', () => {
      const drawer = new Drawer({
        location: 'bottom',
        isOpen: true,
        drawer: new Text({text: 'AB'}),
        content: new Text({text: 'XXXXXXXXXXXXXXXXXXXXXXXXXX'}),
      })
      const t = testRender(drawer, {width: 20, height: 8})
      t.tick(5000)
      // Last row is the drawer content row (below the button)
      const lines = t.terminal.textContent().split('\n')
      const drawerLine = lines[lines.length - 1]
      expect(drawerLine).not.toContain('X')
      expect(t.terminal.textContent()).toMatchSnapshot()
    })
  })

  describe('hidesWhenClosed', () => {
    it('invalidates its cached size when assigned directly', () => {
      const drawer = new Drawer({
        location: 'left',
        isOpen: false,
        drawer: new Text({text: 'Drawer'}),
        content: new Text({text: 'Main'}),
      })
      const available = new Size(20, 8)

      expect(drawer.naturalSize(available)).toEqual(new Size(9, 3))

      drawer.hidesWhenClosed = true

      expect(drawer.hidesWhenClosed).toBe(true)
      expect(drawer.naturalSize(available)).toEqual(new Size(4, 1))
    })

    it('preserves an open drawer position when assigned directly', () => {
      const content = new Text({text: 'XXXXXXXXXXXXXXXXXXXX'})
      const drawer = new Drawer({
        location: 'left',
        isOpen: true,
        drawer: new Text({text: 'Drawer'}),
        content,
      })
      const t = testRender(drawer, {width: 20, height: 5})
      t.tick(5000)
      const before = t.terminal.textContent()

      drawer.hidesWhenClosed = true
      t.render()

      expect(t.terminal.textContent()).toBe(before)
      expect(content.contentSize.width).toBe(20)

      drawer.hidesWhenClosed = false
      t.render()

      expect(t.terminal.textContent()).toBe(before)
      expect(content.contentSize.width).toBe(18)
    })

    it.each(['top', 'right', 'bottom', 'left'] as const)(
      'hides the %s drawer chrome and gives content the full viewport',
      location => {
        const content = new Text({text: 'XXXXXXXXXXXXXXXXXXXX'})
        const drawer = new Drawer({
          location,
          isOpen: false,
          hidesWhenClosed: true,
          drawer: new Text({text: 'Drawer'}),
          content,
        })

        const t = testRender(drawer, {width: 20, height: 8})

        expect(t.terminal.textContent()).toBe('XXXXXXXXXXXXXXXXXXXX')
        expect(content.contentSize.width).toBe(20)
        expect(content.contentSize.height).toBe(8)

        drawer.open()
        t.render()
        t.tick(5000)

        expect(t.terminal.textContent()).not.toBe('XXXXXXXXXXXXXXXXXXXX')
        expect(content.contentSize.width).toBe(20)
        expect(content.contentSize.height).toBe(8)
      },
    )

    it.each(['top', 'bottom'] as const)(
      'keeps the %s drawer button visible when drawer content is too tall',
      location => {
        const drawerView = new Text({
          text: Array.from({length: 20}, () => 'Drawer').join('\n'),
        })
        const drawer = new Drawer({
          location,
          isOpen: true,
          hidesWhenClosed: true,
          drawer: drawerView,
          content: new Text({text: 'Main'}),
        })
        const t = testRender(drawer, {width: 20, height: 8})

        t.tick(5000)

        const lines = t.terminal.textContent().split('\n')
        const buttonLine = lines[location === 'top' ? 5 : 2]
        expect(buttonLine).toContain(location === 'top' ? '∧' : '∨')
        expect(drawerView.contentSize.height).toBe(5)
      },
    )

    it('hides after the closing animation completes', () => {
      const drawer = new Drawer({
        location: 'left',
        isOpen: true,
        hidesWhenClosed: true,
        drawer: new Text({text: 'Drawer'}),
        content: new Text({text: 'XXXXXXXXXXXXXXXXXXXX'}),
      })
      const t = testRender(drawer, {width: 20, height: 5})
      t.tick(5000)

      drawer.close()
      t.render()
      expect(t.terminal.textContent()).not.toBe('XXXXXXXXXXXXXXXXXXXX')

      t.tick(5000)
      expect(t.terminal.textContent()).toBe('XXXXXXXXXXXXXXXXXXXX')
    })
  })

  describe('heading', () => {
    it('renders heading on left drawer top border', () => {
      const drawer = new Drawer({
        location: 'left',
        isOpen: true,
        drawer: new Text({text: 'Sidebar', heading: 'Menu'}),
        content: new Text({text: 'Main'}),
      })
      const t = testRender(drawer, {width: 30, height: 5})
      t.tick(5000)
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders heading on right drawer top border', () => {
      const drawer = new Drawer({
        location: 'right',
        isOpen: true,
        drawer: new Text({text: 'Panel', heading: 'Details'}),
        content: new Text({text: 'Main'}),
      })
      const t = testRender(drawer, {width: 30, height: 5})
      t.tick(5000)
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders heading on top drawer', () => {
      const drawer = new Drawer({
        location: 'top',
        isOpen: true,
        drawer: new Text({text: 'Toolbar', heading: 'Tools'}),
        content: new Text({text: 'Main'}),
      })
      const t = testRender(drawer, {width: 30, height: 8})
      t.tick(5000)
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders heading on bottom drawer', () => {
      const drawer = new Drawer({
        location: 'bottom',
        isOpen: true,
        drawer: new Text({text: 'Status', heading: 'Info'}),
        content: new Text({text: 'Main'}),
      })
      const t = testRender(drawer, {width: 30, height: 8})
      t.tick(5000)
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('does not render heading when not set', () => {
      const drawer = new Drawer({
        location: 'left',
        isOpen: true,
        drawer: new Text({text: 'Sidebar'}),
        content: new Text({text: 'Main'}),
      })
      const t = testRender(drawer, {width: 30, height: 5})
      t.tick(5000)
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('does not render heading when drawer is closed', () => {
      const drawer = new Drawer({
        location: 'left',
        isOpen: false,
        drawer: new Text({text: 'Sidebar', heading: 'Menu'}),
        content: new Text({text: 'Main'}),
      })
      const t = testRender(drawer, {width: 30, height: 5})
      t.tick(5000)
      expect(t.terminal.textContent()).toMatchSnapshot()
    })
  })
})
