import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/TestScreen.js'
import {Callout} from '../../lib/components/Callout.js'
import {Text} from '../../lib/components/Text.js'

describe('Callout', () => {
  it('renders with title', () => {
    const t = testRender(
      new Callout({
        title: 'Note',
        children: [new Text({text: 'Remember to save.'})],
      }),
      {width: 25, height: 5},
    )
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('renders without title', () => {
    const t = testRender(
      new Callout({
        children: [new Text({text: 'A simple callout.'})],
      }),
      {width: 25, height: 3},
    )
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('renders with purpose primary', () => {
    const t = testRender(
      new Callout({
        title: 'Info',
        purpose: 'primary',
        children: [new Text({text: 'Blue themed callout.'})],
      }),
      {width: 28, height: 5},
    )
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('renders with purpose cancel', () => {
    const t = testRender(
      new Callout({
        title: 'Danger',
        purpose: 'cancel',
        children: [new Text({text: 'This is dangerous.'})],
      }),
      {width: 28, height: 5},
    )
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('renders with purpose proceed', () => {
    const t = testRender(
      new Callout({
        title: 'Success',
        purpose: 'proceed',
        children: [new Text({text: 'All good!'})],
      }),
      {width: 28, height: 5},
    )
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('renders with multiple children', () => {
    const t = testRender(
      new Callout({
        title: 'Steps',
        children: [
          new Text({text: 'Step 1: Do this.'}),
          new Text({text: 'Step 2: Do that.'}),
        ],
      }),
      {width: 25, height: 6},
    )
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('renders with direction right', () => {
    const t = testRender(
      new Callout({
        direction: 'right',
        children: [new Text({text: 'Left'}), new Text({text: 'Right'})],
      }),
      {width: 20, height: 3},
    )
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('uses child heading as title when title is not set', () => {
    const t = testRender(
      new Callout({
        children: [new Text({text: 'Use heading prop.', heading: 'Tip'})],
      }),
      {width: 25, height: 5},
    )
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('title takes precedence over child heading', () => {
    const t = testRender(
      new Callout({
        title: 'Explicit',
        children: [new Text({text: 'Content here.', heading: 'Ignored'})],
      }),
      {width: 25, height: 5},
    )
    expect(t.terminal.textContent()).toMatchSnapshot()
  })

  it('wraps long text', () => {
    const t = testRender(
      new Callout({
        children: [
          new Text({
            text: 'This is a longer message that should wrap.',
            wrap: true,
          }),
        ],
      }),
      {width: 20, height: 5},
    )
    expect(t.terminal.textContent()).toMatchSnapshot()
  })
})
