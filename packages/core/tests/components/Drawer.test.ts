import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/TestScreen.js'
import {Drawer} from '../../lib/components/Drawer.js'
import {Text} from '../../lib/components/Text.js'

describe('Drawer', () => {
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
