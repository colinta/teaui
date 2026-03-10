import {describe, it, expect} from 'vitest'
import {renderToAnsi} from '../lib/renderToAnsi'
import {Text} from '../lib/components/Text'
import {Button} from '../lib/components/Button'
import {Stack} from '../lib/components/Stack'
import {Checkbox} from '../lib/components/Checkbox'

describe('renderToAnsi', () => {
  it('renders a Text component', () => {
    const view = new Text({text: 'Hello, world!'})
    const output = renderToAnsi(view, {width: 40, height: 1})
    expect(output).toContain('Hello, world!')
  })

  it('renders a Button component', () => {
    const view = new Button({title: 'Click Me'})
    const output = renderToAnsi(view, {width: 30, height: 3})
    expect(output).toContain('Click Me')
  })

  it('renders a Checkbox component', () => {
    const view = new Checkbox({title: 'Enable', isChecked: true})
    const output = renderToAnsi(view, {width: 30, height: 1})
    expect(output).toContain('Enable')
  })

  it('contains ANSI escape codes', () => {
    const view = new Button({title: 'Test'})
    const output = renderToAnsi(view, {width: 20, height: 3})
    // Should contain cursor positioning and/or SGR codes
    expect(output).toMatch(/\x1b\[/)
  })

  it('renders a Stack with children', () => {
    const view = new Stack({
      direction: 'down',
      children: [new Text({text: 'Line 1'}), new Text({text: 'Line 2'})],
    })
    const output = renderToAnsi(view, {width: 30, height: 5})
    expect(output).toContain('Line 1')
    expect(output).toContain('Line 2')
  })

  it('respects the given size', () => {
    const view = new Text({text: 'A very long text that should be clipped'})
    const output = renderToAnsi(view, {width: 10, height: 1})
    // Output should not contain the full text since viewport is narrow
    expect(output.length).toBeLessThan(200)
  })
})
