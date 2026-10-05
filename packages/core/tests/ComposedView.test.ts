import {describe, it, expect, vi} from 'vitest'
import {testRender} from '../lib/TestScreen.js'
import {ComposedView} from '../lib/ComposedView.js'
import {Container} from '../lib/Container.js'
import {Slider} from '../lib/components/Slider.js'
import {Stack} from '../lib/components/Stack.js'
import {Text} from '../lib/components/Text.js'
import type {View} from '../lib/View.js'
import {Size} from '../lib/geometry.js'
import type {Screen} from '../lib/Screen.js'

/**
 * Builds itself out of two Text views, and swaps one of them out on demand.
 */
class Labelled extends ComposedView {
  readonly label = new Text({text: 'label'})
  readonly value = new Text({text: 'value'})
  readonly stack = Stack.right()
  removed: View[] = []

  constructor() {
    super()
    this.stack.add(this.label)
    this.stack.add(this.value)
    this.add(this.stack)
  }

  hideValue() {
    this.stack.removeChild(this.value)
  }

  clear() {
    this.removeAllChildren()
  }

  protected removeChild(child: View) {
    this.removed.push(child)
    super.removeChild(child)
  }
}

class Mounted extends Text {
  mounted: Screen[] = []
  unmounted: Screen[] = []
  didMount(screen: Screen) {
    super.didMount(screen)
    this.mounted.push(screen)
  }
  didUnmount(screen: Screen) {
    super.didUnmount(screen)
    this.unmounted.push(screen)
  }
}

class Owner extends ComposedView {
  readonly child = new Mounted({text: 'child'})

  constructor() {
    super()
    this.add(this.child)
  }

  drop() {
    this.removeChild(this.child)
  }
}

describe('ComposedView', () => {
  it('sizes and renders its children', () => {
    const view = new Labelled()
    const t = testRender(view, {width: 12, height: 1})
    expect(view.naturalSize(new Size(12, 1))).toEqual(new Size(10, 1))
    expect(t.terminal.textContent()).toBe('labelvalue')

    view.hideValue()
    t.render()
    expect(t.terminal.textContent()).toBe('label')
  })

  it('exposes its children, read-only', () => {
    const view = new Labelled()
    expect(view.children).toEqual([view.stack])
    expect(view.stack.parent).toBe(view)
  })

  it('does not expose add or removeChild', () => {
    const view = new Labelled()
    const other = new Text()
    // @ts-expect-error add is protected
    view.add?.(other)
    // @ts-expect-error removeChild is protected
    view.removeChild?.(view.stack)
    // @ts-expect-error removeAllChildren is protected
    view.removeAllChildren?.()
    // @ts-expect-error children is readonly
    view.children.push?.(other)
  })

  it('mounts and unmounts its children with it', () => {
    const owner = new Owner()
    testRender(owner, {width: 10, height: 1})
    const screen = owner.screen
    expect(screen).toBeDefined()
    expect(owner.child.mounted).toEqual([screen])
    expect(owner.child.screen).toBe(screen)

    owner.drop()
    expect(owner.child.screen).toBeUndefined()
    expect(owner.child.unmounted).toEqual([screen])
    expect(owner.child.parent).toBeUndefined()
    expect(owner.children).toEqual([])
  })

  it('child.removeFromParent() goes through removeChild()', () => {
    const view = new Labelled()
    const t = testRender(view, {width: 12, height: 1})

    view.stack.removeFromParent()
    expect(view.removed).toEqual([view.stack])
    expect(view.children).toEqual([])
    t.render()
    expect(t.terminal.textContent()).toBe('')
  })

  it('removeAllChildren() goes through removeChild()', () => {
    const view = new Labelled()
    view.clear()
    expect(view.removed).toEqual([view.stack])
  })

  it('moving one of its children into a Container detaches it', () => {
    const owner = new Owner()
    const stack = Stack.down()
    const t = testRender(Stack.down([owner, stack]), {width: 10, height: 2})

    stack.add(owner.child)
    expect(owner.children).toEqual([])
    expect(owner.child.parent).toBe(stack)
    // still mounted - it moved within the same screen
    expect(owner.child.unmounted).toEqual([])
    // (the owner is empty now, so it takes no room)
    t.render()
    expect(t.terminal.textContent()).toBe('child')
  })

  it('invalidates its size when children change', () => {
    const owner = new Owner()
    const invalidateSize = vi.spyOn(owner, 'invalidateSize')
    owner.drop()
    expect(invalidateSize).toHaveBeenCalled()
  })

  describe('Container', () => {
    it('is a ComposedView with public child management', () => {
      const container = Stack.down()
      expect(container).toBeInstanceOf(ComposedView)
      const child = new Text({text: 'hi'})
      container.add(child)
      expect(container.children).toEqual([child])
      container.removeChild(child)
      expect(container.children).toEqual([])
    })
  })

  describe('Slider', () => {
    it('is a ComposedView, not a Container', () => {
      const slider = new Slider({range: [0, 10]})
      expect(slider).toBeInstanceOf(ComposedView)
      expect(slider).not.toBeInstanceOf(Container)
    })

    it('ignores child/children props', () => {
      const slider = new Slider({range: [0, 10]})
      testRender(slider, {width: 20, height: 1})
      const children = [...slider.children]
      slider.update({range: [0, 10], children: []} as any)
      expect(slider.children).toEqual(children)
      slider.update({range: [0, 10], child: new Text()} as any)
      expect(slider.children).toEqual(children)
    })
  })
})
