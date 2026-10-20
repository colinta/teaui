import {describe, it, expect, vi} from 'vitest'
import React from 'react'
import {
  Box,
  Button,
  Pressable,
  Checkbox,
  Radio,
  RadioGroup,
  Collapsible,
  Drawer,
  FontStyle,
  Header,
  Separator,
  Skeleton,
  Space,
  Stack,
  Scrollable,
  Accordion,
  Tabs,
  Toggle,
  Palette,
  Root,
  Container,
  testRender,
} from '@teaui/core'
import {TextContainer, TextLiteral} from '../lib/components/TextReact'
import {render} from '../lib/reconciler'
import * as Components from '../lib/components'

function createMockScreen() {
  return {render: vi.fn()} as any
}

function renderToRoot(element: React.ReactNode): {root: Root} {
  const root = new Root()
  const screen = createMockScreen()
  render(screen, root, element)
  return {root}
}

function flush(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0))
}

describe('component wrappers', () => {
  describe('views', () => {
    it('Br renders a text literal newline', async () => {
      const {root} = renderToRoot(
        <tui-stack direction="down">
          <Components.Br />
        </tui-stack>,
      )
      await flush()
      const stack = root.children[0] as Container
      expect(stack.children[0]).toBeInstanceOf(TextContainer)
      const tc = stack.children[0] as TextContainer
      // TextContainer stores text nodes in .nodes (not .children, which require screen mount)
      expect(tc.nodes[0]).toBeInstanceOf(TextLiteral)
      expect((tc.nodes[0] as TextLiteral).text).toBe('\n')
    })

    it('Checkbox renders a tui-checkbox', async () => {
      const {root} = renderToRoot(<Components.Checkbox />)
      await flush()
      expect(root.children[0]).toBeInstanceOf(Checkbox)
    })

    it('Radio renders a tui-radio', async () => {
      const {root} = renderToRoot(<Components.Radio value="one" />)
      await flush()
      expect(root.children[0]).toBeInstanceOf(Radio)
    })

    it('Toggle renders a tui-toggle', async () => {
      const {root} = renderToRoot(<Components.Toggle />)
      await flush()
      expect(root.children[0]).toBeInstanceOf(Toggle)
    })

    it('FontStyle renders a core FontStyle', async () => {
      const {root} = renderToRoot(
        <Components.FontStyle
          value={{
            bold: false,
            italic: false,
            underline: false,
            strikethrough: false,
          }}
        />,
      )
      await flush()
      expect(root.children[0]).toBeInstanceOf(FontStyle)
    })

    it('Header renders a configurable core Header', async () => {
      const {root} = renderToRoot(
        <Components.Header border="double" font="double-struck" dim>
          Custom font
        </Components.Header>,
      )
      await flush()
      expect(root.children[0]).toBeInstanceOf(Header)

      const t = testRender(root.children[0], {width: 20, height: 2})
      expect(t.terminal.textContent()).toContain('ℂ𝕦𝕤𝕥𝕠𝕞 𝕗𝕠𝕟𝕥')
      expect(t.terminal.textContent()).toContain('═════════════')
      expect(t.terminal.styleOf('ℂ')).toMatchObject({dim: true})
    })

    it('Separator renders a tui-separator', async () => {
      const {root} = renderToRoot(<Components.Separator />)
      await flush()
      expect(root.children[0]).toBeInstanceOf(Separator)
    })

    it('Separator.horizontal sets direction', async () => {
      const {root} = renderToRoot(<Components.Separator.horizontal />)
      await flush()
      expect(root.children[0]).toBeInstanceOf(Separator)
    })

    it('Separator.vertical sets direction', async () => {
      const {root} = renderToRoot(<Components.Separator.vertical />)
      await flush()
      expect(root.children[0]).toBeInstanceOf(Separator)
    })

    it('Space renders a tui-space', async () => {
      const {root} = renderToRoot(<Components.Space />)
      await flush()
      expect(root.children[0]).toBeInstanceOf(Space)
    })

    it('Skeleton renders a tui-skeleton', async () => {
      const {root} = renderToRoot(<Components.Skeleton shape="circle" />)
      await flush()
      expect(root.children[0]).toBeInstanceOf(Skeleton)
    })
  })

  describe('simple containers', () => {
    it('RadioGroup renders with nested Radio children', async () => {
      const {root} = renderToRoot(
        <Components.RadioGroup value="one">
          <Components.Stack.down>
            <Components.Radio value="one" title="One" />
            <Components.Radio value="two" title="Two" />
          </Components.Stack.down>
        </Components.RadioGroup>,
      )
      await flush()
      const group = root.children[0] as RadioGroup<string>
      expect(group).toBeInstanceOf(RadioGroup)
      expect(group.children[0]).toBeInstanceOf(Stack)
      expect((group.children[0] as Stack).children[0]).toBeInstanceOf(Radio)
    })

    it('RadioGroup controls selection through onChange', async () => {
      function App() {
        const [value, setValue] = React.useState('one')
        return (
          <Components.RadioGroup value={value} onChange={setValue}>
            <Components.Stack.down>
              <Components.Radio value="one" title="One" />
              <Components.Radio value="two" title="Two" />
            </Components.Stack.down>
          </Components.RadioGroup>
        )
      }

      const {root} = renderToRoot(<App />)
      await flush()
      const t = testRender(root, {width: 12, height: 2})
      expect(t.terminal.textContent()).toBe('⦿ One\n◯ Two')

      t.sendMouse('mouse.button.down', {x: 0, y: 1})
      t.sendMouse('mouse.button.up', {x: 0, y: 1})
      await flush()
      t.render()

      expect(t.terminal.textContent()).toBe('◯ One\n⦿ Two')
    })

    it('Box renders with children', async () => {
      const {root} = renderToRoot(
        <Components.Box width={10} height={5}>
          <Components.Space />
        </Components.Box>,
      )
      await flush()
      const box = root.children[0] as Container
      expect(box).toBeInstanceOf(Box)
      expect(box.children[0]).toBeInstanceOf(Space)
    })

    it('Button renders with children', async () => {
      const {root} = renderToRoot(
        <Components.Button>
          <Components.Space />
        </Components.Button>,
      )
      await flush()
      const btn = root.children[0] as Container
      expect(btn).toBeInstanceOf(Button)
    })

    it('Button accepts purpose', async () => {
      const {root} = renderToRoot(<Components.Button purpose="primary" />)
      await flush()
      const btn = root.children[0] as Button
      expect(btn.purpose).toBe(Palette.primary)
    })

    it('Pressable renders with children, and is not a Button', async () => {
      const {root} = renderToRoot(
        <Components.Pressable>
          <Components.Space />
        </Components.Pressable>,
      )
      await flush()
      const pressable = root.children[0] as Container
      expect(pressable).toBeInstanceOf(Pressable)
      expect(pressable).not.toBeInstanceOf(Button)
      expect(pressable.children[0]).toBeInstanceOf(Space)
    })

    it('Pressable calls onClick and honors focusable', async () => {
      const onClick = vi.fn()
      const {root} = renderToRoot(
        <Components.Pressable onClick={onClick} focusable={false} />,
      )
      await flush()
      const t = testRender(root.children[0], {width: 6, height: 1})
      t.sendMouse('mouse.button.down', {x: 1, y: 0})
      t.sendMouse('mouse.button.up', {x: 1, y: 0})
      expect(onClick).toHaveBeenCalledOnce()
    })

    it('Stack renders with children', async () => {
      const {root} = renderToRoot(
        <Components.Stack direction="down">
          <Components.Space />
        </Components.Stack>,
      )
      await flush()
      const stack = root.children[0] as Container
      expect(stack).toBeInstanceOf(Stack)
      expect(stack.children[0]).toBeInstanceOf(Space)
    })

    it('Stack.down sets direction', async () => {
      const {root} = renderToRoot(
        <Components.Stack.down>
          <Components.Space />
        </Components.Stack.down>,
      )
      await flush()
      expect(root.children[0]).toBeInstanceOf(Stack)
    })

    it('Stack.up sets direction', async () => {
      const {root} = renderToRoot(
        <Components.Stack.up>
          <Components.Space />
        </Components.Stack.up>,
      )
      await flush()
      expect(root.children[0]).toBeInstanceOf(Stack)
    })

    it('Stack.left sets direction', async () => {
      const {root} = renderToRoot(
        <Components.Stack.left>
          <Components.Space />
        </Components.Stack.left>,
      )
      await flush()
      expect(root.children[0]).toBeInstanceOf(Stack)
    })

    it('Stack.right sets direction', async () => {
      const {root} = renderToRoot(
        <Components.Stack.right>
          <Components.Space />
        </Components.Stack.right>,
      )
      await flush()
      expect(root.children[0]).toBeInstanceOf(Stack)
    })

    it('Scrollable renders with children', async () => {
      const {root} = renderToRoot(
        <Components.Scrollable>
          <Components.Space />
        </Components.Scrollable>,
      )
      await flush()
      expect(root.children[0]).toBeInstanceOf(Scrollable)
    })

    it('Collapsible renders with collapsed and expanded', async () => {
      const {root} = renderToRoot(
        <Components.Collapsible
          collapsed={<Components.Space />}
          expanded={<Components.Box />}
        />,
      )
      await flush()
      expect(root.children[0]).toBeInstanceOf(Collapsible)
    })
  })

  describe('complex containers', () => {
    it('Accordion renders with children', async () => {
      const {root} = renderToRoot(
        <Components.Accordion>
          <Components.Accordion.Section>
            <Components.Space />
          </Components.Accordion.Section>
        </Components.Accordion>,
      )
      await flush()
      expect(root.children[0]).toBeInstanceOf(Accordion)
    })

    it('Tabs renders with children', async () => {
      const {root} = renderToRoot(
        <Components.Tabs>
          <Components.Tabs.Section>
            <Components.Space />
          </Components.Tabs.Section>
        </Components.Tabs>,
      )
      await flush()
      expect(root.children[0]).toBeInstanceOf(Tabs)
    })

    it('Tree toggles child rows on click', async () => {
      const {root} = renderToRoot(
        <Components.Tree
          title="Tree"
          data={[{name: 'Parent', children: [{name: 'Child'}]}]}
          getChildren={item => item.children}
          render={item => <Components.Text>{item.name}</Components.Text>}
        />,
      )
      await flush()
      const t = testRender(root, {width: 20, height: 4})
      expect(t.terminal.textContent()).toContain('Parent')
      expect(t.terminal.textContent()).not.toContain('Child')

      t.sendMouse('mouse.button.down', {x: 1, y: 1})
      t.sendMouse('mouse.button.up', {x: 1, y: 1})
      await flush()
      t.render()

      expect(t.terminal.textContent()).toContain('Child')
    })

    it('Table renders renderItem rows', async () => {
      const rows = [{name: 'Alice'}, {name: 'Bob'}]
      const {root} = renderToRoot(
        <Components.Table
          data={rows}
          columns={[{key: 'name', title: 'Name', width: '100%'}]}
          renderItem={row => <Components.Text>{row.name}</Components.Text>}
        />,
      )
      await flush()
      const t = testRender(root, {width: 20, height: 5})

      expect(t.terminal.textContent()).toContain('Alice')
      expect(t.terminal.textContent()).toContain('Bob')
    })

    describe('Drawer', () => {
      it('renders base Drawer with content and drawer', async () => {
        const {root} = renderToRoot(
          <Components.Drawer
            content={<Components.Box />}
            drawer={<Components.Space />}
          />,
        )
        await flush()
        expect(root.children[0]).toBeInstanceOf(Drawer)
      })

      it('supports hiding the drawer entirely when closed', async () => {
        const {root} = renderToRoot(
          <Components.Drawer
            isOpen={false}
            hidesWhenClosed
            content={<Components.Text>XXXXXXXXXXXXXXXXXXXX</Components.Text>}
            drawer={<Components.Text>Drawer</Components.Text>}
          />,
        )
        await flush()
        const t = testRender(root, {width: 20, height: 5})

        expect(t.terminal.textContent()).toBe('XXXXXXXXXXXXXXXXXXXX')
      })

      it('Drawer.top passes content and drawer', async () => {
        const {root} = renderToRoot(
          <Components.Drawer.top
            content={<Components.Box />}
            drawer={<Components.Space />}
          />,
        )
        await flush()
        expect(root.children[0]).toBeInstanceOf(Drawer)
      })

      it('Drawer.right passes content and drawer', async () => {
        const {root} = renderToRoot(
          <Components.Drawer.right
            content={<Components.Box />}
            drawer={<Components.Space />}
          />,
        )
        await flush()
        expect(root.children[0]).toBeInstanceOf(Drawer)
      })

      it('Drawer.bottom passes content and drawer', async () => {
        const {root} = renderToRoot(
          <Components.Drawer.bottom
            content={<Components.Box />}
            drawer={<Components.Space />}
          />,
        )
        await flush()
        const drawer = root.children[0] as Container
        expect(drawer).toBeInstanceOf(Drawer)
        // Verify content and drawer are passed (not just children)
        // Drawer should have both Box and Space as children
        expect(drawer.children.length).toBeGreaterThanOrEqual(2)
      })

      it('Drawer.left passes content and drawer', async () => {
        const {root} = renderToRoot(
          <Components.Drawer.left
            content={<Components.Box />}
            drawer={<Components.Space />}
          />,
        )
        await flush()
        const drawer = root.children[0] as Container
        expect(drawer).toBeInstanceOf(Drawer)
        expect(drawer.children.length).toBeGreaterThanOrEqual(2)
      })
    })
  })
})
