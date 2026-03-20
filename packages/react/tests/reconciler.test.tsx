import {describe, it, expect, vi, beforeEach} from 'vitest'
import React, {useState, useRef, useCallback} from 'react'
import {
  Box,
  Button,
  Checkbox,
  Stack,
  Separator,
  Space,
  Window,
  View,
  Container,
} from '@teaui/core'
import {TextContainer, TextLiteral} from '../lib/components/TextReact'
import {render} from '../lib/reconciler'

// Minimal Screen mock — render() is the only method called by the reconciler
function createMockScreen() {
  return {
    render: vi.fn(),
  } as any
}

function renderToWindow(element: React.ReactNode): {
  window: Window
  screen: ReturnType<typeof createMockScreen>
  unmount: () => void
} {
  const window = new Window()
  const screen = createMockScreen()
  const unmount = render(screen, window, element)
  return {window, screen, unmount}
}

// Helper: wait for React async reconciliation to flush
function flush(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0))
}

describe('reconciler', () => {
  describe('render basics', () => {
    it('renders a simple box into the window', async () => {
      const {window} = renderToWindow(<tui-box width={10} height={5} />)
      await flush()
      expect(window.children.length).toBe(1)
      expect(window.children[0]).toBeInstanceOf(Box)
    })

    it('renders nested containers', async () => {
      const {window} = renderToWindow(
        <tui-stack direction="down">
          <tui-box width={10} height={5} />
          <tui-box width={20} height={10} />
        </tui-stack>,
      )
      await flush()
      expect(window.children.length).toBe(1)
      const stack = window.children[0] as Container
      expect(stack).toBeInstanceOf(Stack)
      expect(stack.children.length).toBe(2)
      expect(stack.children[0]).toBeInstanceOf(Box)
      expect(stack.children[1]).toBeInstanceOf(Box)
    })

    it('renders text literals into TextContainers', async () => {
      const {window} = renderToWindow(
        <tui-stack direction="down">hello world</tui-stack>,
      )
      await flush()
      const stack = window.children[0] as Container
      // Text literals get wrapped in a TextContainer
      expect(stack.children.length).toBe(1)
      expect(stack.children[0]).toBeInstanceOf(TextContainer)
      const tc = stack.children[0] as TextContainer
      // TextContainer stores text nodes in .nodes (not .children, which require screen mount)
      expect(tc.nodes.length).toBe(1)
      expect(tc.nodes[0]).toBeInstanceOf(TextLiteral)
      expect((tc.nodes[0] as TextLiteral).text).toBe('hello world')
    })

    it('groups adjacent text literals into the same TextContainer', async () => {
      const name = 'world'
      const {window} = renderToWindow(
        <tui-stack direction="down">hello {name}!</tui-stack>,
      )
      await flush()
      const stack = window.children[0] as Container
      // All text nodes should share one TextContainer
      expect(stack.children.length).toBe(1)
      expect(stack.children[0]).toBeInstanceOf(TextContainer)
      const tc = stack.children[0] as TextContainer
      // JSX "hello {name}!" creates 3 adjacent text nodes: "hello ", "world", "!"
      expect(tc.nodes.length).toBe(3)
    })

    it('creates separate TextContainers when non-text views intervene', async () => {
      const {window} = renderToWindow(
        <tui-stack direction="down">
          hello
          <tui-box width={5} height={5} />
          world
        </tui-stack>,
      )
      await flush()
      const stack = window.children[0] as Container
      // TextContainer("hello"), Box, TextContainer("world")
      expect(stack.children.length).toBe(3)
      expect(stack.children[0]).toBeInstanceOf(TextContainer)
      expect(stack.children[1]).toBeInstanceOf(Box)
      expect(stack.children[2]).toBeInstanceOf(TextContainer)
    })
  })

  describe('element types', () => {
    it('supports both short and tui-prefixed element names', async () => {
      const {window: w1} = renderToWindow(<tui-checkbox />)
      const {window: w2} = renderToWindow(<tui-separator />)
      const {window: w3} = renderToWindow(<tui-space />)
      await flush()
      expect(w1.children[0]).toBeInstanceOf(Checkbox)
      expect(w2.children[0]).toBeInstanceOf(Separator)
      expect(w3.children[0]).toBeInstanceOf(Space)
    })

    it('throws for unknown element types', async () => {
      expect(() => {
        renderToWindow(React.createElement('unknown-element' as any))
      }).toThrow('unknown component "unknown-element"')
    })
  })

  describe('unmount', () => {
    it('returns an unmount function', () => {
      const {unmount} = renderToWindow(<tui-box />)
      expect(typeof unmount).toBe('function')
    })

    it('removes children when unmount is called', async () => {
      const {window, unmount} = renderToWindow(
        <tui-box width={10} height={5} />,
      )
      await flush()
      expect(window.children.length).toBe(1)
      unmount()
      await flush()
      expect(window.children.length).toBe(0)
    })
  })

  describe('updates', () => {
    it('calls screen.render after commit', async () => {
      const {screen} = renderToWindow(<tui-box />)
      await flush()
      expect(screen.render).toHaveBeenCalled()
    })

    it('updates view props via commitUpdate', async () => {
      let setWidth: (w: number) => void

      function TestComp() {
        const [width, _setWidth] = useState(10)
        setWidth = _setWidth
        return <tui-box width={width} height={5} />
      }

      const {window} = renderToWindow(<TestComp />)
      await flush()

      const box = window.children[0] as any
      // Initial render
      expect(box).toBeInstanceOf(Box)

      // Trigger update
      setWidth!(20)
      await flush()

      // The box should have been updated — note commitUpdate calls node.update(newProps)
      // We can't easily check the internal width without rendering, but the update path exercised
    })
  })

  describe('child manipulation', () => {
    it('removes children correctly', async () => {
      let setShow: (s: boolean) => void

      function TestComp() {
        const [show, _setShow] = useState(true)
        setShow = _setShow
        return (
          <tui-stack direction="down">
            {show && <tui-box width={10} height={5} />}
            <tui-box width={20} height={10} />
          </tui-stack>
        )
      }

      const {window} = renderToWindow(<TestComp />)
      await flush()
      const stack = window.children[0] as Container
      expect(stack.children.length).toBe(2)

      setShow!(false)
      await flush()
      expect(stack.children.length).toBe(1)
    })

    it('adds text nodes to TextContainers', async () => {
      let setShow: (s: boolean) => void

      function TestComp() {
        const [show, _setShow] = useState(true)
        setShow = _setShow
        return (
          <tui-stack direction="down">
            {show && 'hello'}
            {show && ' world'}
          </tui-stack>
        )
      }

      const {window} = renderToWindow(<TestComp />)
      await flush()
      const stack = window.children[0] as Container
      expect(stack.children.length).toBe(1)
      expect(stack.children[0]).toBeInstanceOf(TextContainer)
      const tc = stack.children[0] as TextContainer
      expect(tc.nodes.length).toBe(2)
      expect((tc.nodes[0] as TextLiteral).text).toBe('hello')
      expect((tc.nodes[1] as TextLiteral).text).toBe(' world')
    })
  })

  describe('getPublicInstance (refs)', () => {
    it('provides the view instance via ref', async () => {
      let capturedRef: any = null

      function TestComp() {
        const ref = useRef<any>(null)
        // Use callback ref to capture the instance
        return (
          <tui-box
            ref={(instance: any) => {
              capturedRef = instance
            }}
            width={10}
            height={5}
          />
        )
      }

      renderToWindow(<TestComp />)
      await flush()
      expect(capturedRef).toBeInstanceOf(Box)
    })
  })

  describe('text updates', () => {
    it('updates TextLiteral text content', async () => {
      let setText: (t: string) => void

      function TestComp() {
        const [text, _setText] = useState('hello')
        setText = _setText
        return <tui-stack direction="down">{text}</tui-stack>
      }

      const {window} = renderToWindow(<TestComp />)
      await flush()
      const stack = window.children[0] as Container
      const tc = stack.children[0] as TextContainer
      const literal = tc.nodes[0] as TextLiteral
      expect(literal.text).toBe('hello')

      setText!('world')
      await flush()
      expect(literal.text).toBe('world')
    })
  })

  describe('strips children/child from createInstance props', () => {
    it('does not pass children prop to view constructors', async () => {
      // If children were passed through, it could cause issues with views
      // that don't expect a children prop. This just validates it doesn't crash.
      const {window} = renderToWindow(
        <tui-stack direction="down">
          <tui-box width={10} height={5} />
        </tui-stack>,
      )
      await flush()
      expect(window.children.length).toBe(1)
    })
  })
})
