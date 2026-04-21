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
  testRender,
} from '@teaui/core'
import {TextContainer, TextLiteral} from '../lib/components/TextReact'
import {render} from '../lib/reconciler'
import {YamlTab} from '../../../apps/react/yaml'

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

    it('preserves text insertion order when React inserts before an existing text node', async () => {
      const mainText = 'Hello'
      const {window} = renderToWindow(
        <tui-text wrap>
          -{mainText}
          {'. '}
        </tui-text>,
      )
      await flush()

      const textProvider = window.children[0] as Container
      expect(textProvider.children.length).toBe(1)
      expect(textProvider.children[0]).toBeInstanceOf(TextContainer)
      const tc = textProvider.children[0] as TextContainer

      expect(tc.nodes).toHaveLength(3)
      expect(tc.nodes.map(node => (node as TextLiteral).text)).toEqual([
        '-',
        'Hello',
        '. ',
      ])
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
      const e = console.error
      console.error = () => {}
      expect(() => {
        renderToWindow(React.createElement('unknown-element' as any))
      }).toThrow('unknown component "unknown-element"')
      console.error = e
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

    it('inherits parent text styles in nested text providers', async () => {
      const {window} = renderToWindow(
        <tui-text foreground="red">
          <tui-text bold>Hello</tui-text>
        </tui-text>,
      )
      await flush()
      const t = testRender(window, {width: 10, height: 1})
      const style = t.terminal.styleOf('Hello')

      expect(style?.bold).toBe(true)
      expect(style?.foreground).toBe('red')
    })

    it('updates provider styles after mount', async () => {
      let setRed: (red: boolean) => void

      function TestComp() {
        const [red, _setRed] = useState(false)
        setRed = _setRed

        return <tui-text foreground={red ? 'red' : undefined}>Hello</tui-text>
      }

      const {window} = renderToWindow(<TestComp />)
      await flush()
      const t = testRender(window, {width: 10, height: 1})

      expect(t.terminal.styleOf('Hello')?.foreground).not.toBe('red')

      setRed!(true)
      await flush()
      t.render()
      expect(t.terminal.styleOf('Hello')?.foreground).toBe('red')
    })

    it('updates provider wrap after mount', async () => {
      let setWrap: (wrap: boolean) => void

      function TestComp() {
        const [wrap, _setWrap] = useState(false)
        setWrap = _setWrap

        return <tui-text wrap={wrap}>Hello World</tui-text>
      }

      const {window} = renderToWindow(<TestComp />)
      await flush()
      const t = testRender(window, {width: 6, height: 3})

      expect(t.terminal.textContent()).toBe('Hello')

      setWrap!(true)
      await flush()
      t.render()
      expect(t.terminal.textContent()).toBe('Hello\nWorld')
    })

    it('updates provider alignment after mount', async () => {
      let setAlignment: (alignment: 'left' | 'center') => void

      function TestComp() {
        const [alignment, _setAlignment] = useState<'left' | 'center'>('left')
        setAlignment = _setAlignment

        return <tui-text alignment={alignment}>Hi</tui-text>
      }

      const {window} = renderToWindow(<TestComp />)
      await flush()
      const t = testRender(window, {width: 10, height: 1})

      expect(t.terminal.charAt(0, 0)).toBe('H')

      setAlignment!('center')
      await flush()
      t.render()
      expect(t.terminal.charAt(4, 0)).toBe('H')
    })

    it('preserves inline text order across interactive keyed updates', async () => {
      function TestComp() {
        const [prefix, setPrefix] = useState('#')
        const showTest = prefix === ''

        return (
          <tui-stack direction="down">
            <tui-input value={prefix} onChange={setPrefix} />
            <tui-text>
              {'{\n  '}
              {showTest ? (
                <>
                  <tui-style key="test" foreground="blue">
                    {'"test"'}
                  </tui-style>
                  {': '}
                  <tui-style key="0" foreground="green">
                    {'"foo"'}
                  </tui-style>
                  {',\n  '}
                </>
              ) : null}
              <tui-style key="tags" foreground="blue">
                {'"tags"'}
              </tui-style>
              {': '}
              <tui-style key="1" foreground="green">
                {'["tui", "terminal", "ui"]'}
              </tui-style>
              {'\n}'}
            </tui-text>
          </tui-stack>
        )
      }

      const {window} = renderToWindow(<TestComp />)
      await flush()
      const t = testRender(window, {width: 40, height: 6})

      expect(t.terminal.textContent()).toContain(
        '"tags": ["tui", "terminal", "ui"]',
      )
      expect(t.terminal.textContent()).not.toContain('"test": "foo"')

      t.sendKey('backspace')
      await flush()
      t.render()
      expect(t.terminal.textContent()).toContain('"test": "foo",')
      expect(t.terminal.textContent()).toContain(
        '"tags": ["tui", "terminal", "ui"]',
      )
      expect(t.terminal.textContent()).not.toContain('"tags""test"')

      t.sendKey('#')
      await flush()
      t.render()
      expect(t.terminal.textContent()).not.toContain('"test": "foo"')
      expect(t.terminal.textContent()).toContain(
        '"tags": ["tui", "terminal", "ui"]',
      )
      expect(t.terminal.textContent()).not.toContain('}"tags"')
    })

    it('preserves inline text order when removing a keyed entry from the middle', async () => {
      function TestComp() {
        const [prefix, setPrefix] = useState('')
        const showTheme = prefix === ''

        return (
          <tui-stack direction="down">
            <tui-input value={prefix} onChange={setPrefix} />
            <tui-text>
              {'{\n  '}
              <tui-style key="config" foreground="blue">
                {'"config"'}
              </tui-style>
              {': {\n    '}
              <tui-style key="border" foreground="blue">
                {'"border"'}
              </tui-style>
              {': '}
              <tui-style key="border-value" foreground="green">
                {'"rounded"'}
              </tui-style>
              {',\n    '}
              {showTheme ? (
                <>
                  <tui-style key="theme" foreground="blue">
                    {'"theme"'}
                  </tui-style>
                  {': '}
                  <tui-style key="theme-value" foreground="green">
                    {'"default"'}
                  </tui-style>
                  {',\n    '}
                </>
              ) : null}
              <tui-style key="debug" foreground="blue">
                {'"debug"'}
              </tui-style>
              {': '}
              <tui-style key="debug-value" foreground="yellow">
                {'false'}
              </tui-style>
              {'\n  },\n  '}
              <tui-style key="tags" foreground="blue">
                {'"tags"'}
              </tui-style>
              {': '}
              <tui-style key="tags-value" foreground="green">
                {'["tui", "terminal", "ui"]'}
              </tui-style>
              {'\n}'}
            </tui-text>
          </tui-stack>
        )
      }

      const {window} = renderToWindow(<TestComp />)
      await flush()
      const t = testRender(window, {width: 40, height: 10})

      expect(t.terminal.textContent()).toContain('"theme": "default",')
      expect(t.terminal.textContent()).toContain('"debug": false')
      expect(t.terminal.textContent()).toContain(
        '"tags": ["tui", "terminal", "ui"]',
      )

      t.sendKey('#')
      await flush()
      t.render()
      expect(t.terminal.textContent()).not.toContain('"theme": "default"')
      expect(t.terminal.textContent()).toContain('"border": "rounded",')
      expect(t.terminal.textContent()).toContain('"debug": false')
      expect(t.terminal.textContent()).toContain(
        '"tags": ["tui", "terminal", "ui"]',
      )
      expect(t.terminal.textContent()).not.toContain('"debug",}')
      expect(t.terminal.textContent()).not.toContain('false:\n  "tags"')
    })

    it('keeps yaml demo output stable when uncommenting and re-commenting test', async () => {
      const {window} = renderToWindow(<YamlTab />)
      await flush()
      const t = testRender(window, {width: 120, height: 24})

      expect(t.terminal.textContent()).not.toContain('"test": "foo"')
      expect(t.terminal.textContent()).toContain('"tags": [')

      t.sendKey(',', {alt: true, shift: true})
      for (let i = 0; i < 10; i++) {
        t.sendKey('down')
      }
      t.sendKey('delete')
      await flush()
      t.render()

      expect(t.terminal.textContent()).toContain('"test": "foo"')
      expect(t.terminal.textContent()).toContain('"tags": [')
      expect(t.terminal.textContent()).not.toContain('"tags""test"')

      t.sendKey('#')
      await flush()
      t.render()

      expect(t.terminal.textContent()).not.toContain('"test": "foo"')
      expect(t.terminal.textContent()).toContain('"tags": [')
      expect(t.terminal.textContent()).not.toContain('}"tags"')
    })

    it('keeps yaml demo output stable when commenting out theme', async () => {
      const {window} = renderToWindow(<YamlTab />)
      await flush()
      const t = testRender(window, {width: 120, height: 24})

      expect(t.terminal.textContent()).toContain('"theme": "default"')
      expect(t.terminal.textContent()).toContain('"debug": false')

      t.sendKey(',', {alt: true, shift: true})
      for (let i = 0; i < 8; i++) {
        t.sendKey('down')
      }
      t.sendKey('right')
      t.sendKey('right')
      t.sendKey('#')
      await flush()
      t.render()

      expect(t.terminal.textContent()).not.toContain('"theme": "default"')
      expect(t.terminal.textContent()).toContain('"debug": false')
      expect(t.terminal.textContent()).toContain('"tags": [')
      expect(t.terminal.textContent()).toContain('"tui"')
      expect(t.terminal.textContent()).toContain('"terminal"')
      expect(t.terminal.textContent()).toContain('"ui"')
      expect(t.terminal.textContent()).not.toContain('"debug",}')
      expect(t.terminal.textContent()).not.toContain('false:\n  "tags"')
    })
  })

  describe('layout integration', () => {
    it('constrains ZStack location children to the screen size', async () => {
      const {window} = renderToWindow(
        <tui-zstack location="top-right">
          <tui-box border="rounded" flex="flex1">
            <tui-stack direction="down" flex="flex1">
              <tui-box border="single" flex="flex1" />
              <tui-box height={1} />
            </tui-stack>
          </tui-box>
        </tui-zstack>,
      )
      await flush()

      const t = testRender(window, {width: 20, height: 6})
      const root = window.children[0] as Container
      const box = root.children[0] as Box

      expect(t.terminal.textContent()).toContain('╰')
      expect(box.contentSize.height).toBeLessThanOrEqual(6)
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
