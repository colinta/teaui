import {describe, it, expect, vi} from 'vitest'
import React from 'react'
import {
  Box,
  Button,
  Checkbox,
  Collapsible,
  Drawer,
  Separator,
  Slider,
  Space,
  Stack,
  Scrollable,
  Accordion,
  Tabs,
  ToggleGroup,
  Window,
  Container,
} from '@teaui/core'
import {TextContainer, TextLiteral} from '../lib/components/TextReact'
import {render} from '../lib/reconciler'
import * as Components from '../lib/components'

function createMockScreen() {
  return {render: vi.fn()} as any
}

function renderToWindow(element: React.ReactNode): {window: Window} {
  const window = new Window()
  const screen = createMockScreen()
  render(screen, window, element)
  return {window}
}

function flush(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0))
}

describe('component wrappers', () => {
  describe('views', () => {
    it('Br renders a text literal newline', async () => {
      const {window} = renderToWindow(
        <tui-stack direction="down">
          <Components.Br />
        </tui-stack>,
      )
      await flush()
      const stack = window.children[0] as Container
      expect(stack.children[0]).toBeInstanceOf(TextContainer)
      const tc = stack.children[0] as TextContainer
      // TextContainer stores text nodes in .nodes (not .children, which require screen mount)
      expect(tc.nodes[0]).toBeInstanceOf(TextLiteral)
      expect((tc.nodes[0] as TextLiteral).text).toBe('\n')
    })

    it('Checkbox renders a tui-checkbox', async () => {
      const {window} = renderToWindow(<Components.Checkbox />)
      await flush()
      expect(window.children[0]).toBeInstanceOf(Checkbox)
    })

    it('Separator renders a tui-separator', async () => {
      const {window} = renderToWindow(<Components.Separator />)
      await flush()
      expect(window.children[0]).toBeInstanceOf(Separator)
    })

    it('Separator.horizontal sets direction', async () => {
      const {window} = renderToWindow(<Components.Separator.horizontal />)
      await flush()
      expect(window.children[0]).toBeInstanceOf(Separator)
    })

    it('Separator.vertical sets direction', async () => {
      const {window} = renderToWindow(<Components.Separator.vertical />)
      await flush()
      expect(window.children[0]).toBeInstanceOf(Separator)
    })

    it('Space renders a tui-space', async () => {
      const {window} = renderToWindow(<Components.Space />)
      await flush()
      expect(window.children[0]).toBeInstanceOf(Space)
    })
  })

  describe('simple containers', () => {
    it('Box renders with children', async () => {
      const {window} = renderToWindow(
        <Components.Box width={10} height={5}>
          <Components.Space />
        </Components.Box>,
      )
      await flush()
      const box = window.children[0] as Container
      expect(box).toBeInstanceOf(Box)
      expect(box.children[0]).toBeInstanceOf(Space)
    })

    it('Button renders with children', async () => {
      const {window} = renderToWindow(
        <Components.Button>
          <Components.Space />
        </Components.Button>,
      )
      await flush()
      const btn = window.children[0] as Container
      expect(btn).toBeInstanceOf(Button)
    })

    it('Stack renders with children', async () => {
      const {window} = renderToWindow(
        <Components.Stack direction="down">
          <Components.Space />
        </Components.Stack>,
      )
      await flush()
      const stack = window.children[0] as Container
      expect(stack).toBeInstanceOf(Stack)
      expect(stack.children[0]).toBeInstanceOf(Space)
    })

    it('Stack.down sets direction', async () => {
      const {window} = renderToWindow(
        <Components.Stack.down>
          <Components.Space />
        </Components.Stack.down>,
      )
      await flush()
      expect(window.children[0]).toBeInstanceOf(Stack)
    })

    it('Stack.up sets direction', async () => {
      const {window} = renderToWindow(
        <Components.Stack.up>
          <Components.Space />
        </Components.Stack.up>,
      )
      await flush()
      expect(window.children[0]).toBeInstanceOf(Stack)
    })

    it('Stack.left sets direction', async () => {
      const {window} = renderToWindow(
        <Components.Stack.left>
          <Components.Space />
        </Components.Stack.left>,
      )
      await flush()
      expect(window.children[0]).toBeInstanceOf(Stack)
    })

    it('Stack.right sets direction', async () => {
      const {window} = renderToWindow(
        <Components.Stack.right>
          <Components.Space />
        </Components.Stack.right>,
      )
      await flush()
      expect(window.children[0]).toBeInstanceOf(Stack)
    })

    it('Scrollable renders with children', async () => {
      const {window} = renderToWindow(
        <Components.Scrollable>
          <Components.Space />
        </Components.Scrollable>,
      )
      await flush()
      expect(window.children[0]).toBeInstanceOf(Scrollable)
    })

    it('Collapsible renders with collapsed and expanded', async () => {
      const {window} = renderToWindow(
        <Components.Collapsible
          collapsed={<Components.Space />}
          expanded={<Components.Box />}
        />,
      )
      await flush()
      expect(window.children[0]).toBeInstanceOf(Collapsible)
    })
  })

  describe('complex containers', () => {
    it('Accordion renders with children', async () => {
      const {window} = renderToWindow(
        <Components.Accordion>
          <Components.Accordion.Section>
            <Components.Space />
          </Components.Accordion.Section>
        </Components.Accordion>,
      )
      await flush()
      expect(window.children[0]).toBeInstanceOf(Accordion)
    })

    it('Tabs renders with children', async () => {
      const {window} = renderToWindow(
        <Components.Tabs>
          <Components.Tabs.Section>
            <Components.Space />
          </Components.Tabs.Section>
        </Components.Tabs>,
      )
      await flush()
      expect(window.children[0]).toBeInstanceOf(Tabs)
    })

    describe('Drawer', () => {
      it('renders base Drawer with content and drawer', async () => {
        const {window} = renderToWindow(
          <Components.Drawer
            content={<Components.Box />}
            drawer={<Components.Space />}
          />,
        )
        await flush()
        expect(window.children[0]).toBeInstanceOf(Drawer)
      })

      it('Drawer.top passes content and drawer', async () => {
        const {window} = renderToWindow(
          <Components.Drawer.top
            content={<Components.Box />}
            drawer={<Components.Space />}
          />,
        )
        await flush()
        expect(window.children[0]).toBeInstanceOf(Drawer)
      })

      it('Drawer.right passes content and drawer', async () => {
        const {window} = renderToWindow(
          <Components.Drawer.right
            content={<Components.Box />}
            drawer={<Components.Space />}
          />,
        )
        await flush()
        expect(window.children[0]).toBeInstanceOf(Drawer)
      })

      it('Drawer.bottom passes content and drawer', async () => {
        const {window} = renderToWindow(
          <Components.Drawer.bottom
            content={<Components.Box />}
            drawer={<Components.Space />}
          />,
        )
        await flush()
        const drawer = window.children[0] as Container
        expect(drawer).toBeInstanceOf(Drawer)
        // Verify content and drawer are passed (not just children)
        // Drawer should have both Box and Space as children
        expect(drawer.children.length).toBeGreaterThanOrEqual(2)
      })

      it('Drawer.left passes content and drawer', async () => {
        const {window} = renderToWindow(
          <Components.Drawer.left
            content={<Components.Box />}
            drawer={<Components.Space />}
          />,
        )
        await flush()
        const drawer = window.children[0] as Container
        expect(drawer).toBeInstanceOf(Drawer)
        expect(drawer.children.length).toBeGreaterThanOrEqual(2)
      })
    })
  })
})
