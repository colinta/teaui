import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/TestScreen.js'
import {Slider} from '../../lib/components/Slider.js'
import {Scrollable} from '../../lib/components/Scrollable.js'
import {Pressable} from '../../lib/components/Pressable.js'
import {Box} from '../../lib/components/Box.js'
import {Text} from '../../lib/components/Text.js'
import {ZStack} from '../../lib/components/ZStack.js'
import {Stack} from '../../lib/components/Stack.js'
import {Button} from '../../lib/components/Button.js'
import {Point} from '../../lib/geometry.js'
import type {View} from '../../lib/View.js'

describe('Slider', () => {
  describe('focus', () => {
    it('does not receive focus by default', () => {
      const slider = new Slider({range: [0, 100], value: 50})
      testRender(slider, {width: 20, height: 1})
      expect(slider.hasFocus).toBe(false)
    })

    it('receives focus via tab', () => {
      const slider = new Slider({range: [0, 100], value: 50})
      const t = testRender(slider, {width: 20, height: 1})
      t.sendKey('tab')
      expect(slider.hasFocus).toBe(true)
    })

    it('renders with focus border when focused', () => {
      const slider = new Slider({range: [0, 100], value: 50, border: true})
      const t = testRender(slider, {width: 20, height: 3})
      expect(t.terminal.textContent()).toMatchSnapshot('unfocused')
      t.sendKey('tab')
      expect(t.terminal.textContent()).toMatchSnapshot('focused')
    })

    it('renders vertical with focus border when focused', () => {
      const slider = new Slider({
        range: [0, 100],
        value: 50,
        direction: 'vertical',
        border: true,
        height: 10,
      })
      const t = testRender(slider, {width: 3, height: 10})
      expect(t.terminal.textContent()).toMatchSnapshot('unfocused')
      t.sendKey('tab')
      expect(t.terminal.textContent()).toMatchSnapshot('focused')
    })

    it('renders borderless buttons with focus brackets', () => {
      const slider = new Slider({
        range: [0, 100],
        value: 50,
        buttons: true,
        step: 10,
      })
      const t = testRender(slider, {width: 20, height: 1})
      expect(t.terminal.textContent()).toMatchSnapshot('unfocused')
      t.sendKey('tab')
      expect(t.terminal.textContent()).toMatchSnapshot('focused')
    })

    it('renders horizontal with buttons and focus border', () => {
      const slider = new Slider({
        range: [0, 100],
        value: 50,
        border: true,
        buttons: true,
        step: 10,
      })
      const t = testRender(slider, {width: 20, height: 3})
      expect(t.terminal.textContent()).toMatchSnapshot('unfocused')
      t.sendKey('tab')
      expect(t.terminal.textContent()).toMatchSnapshot('focused')
    })

    it('renders vertical with buttons and focus border', () => {
      const slider = new Slider({
        range: [0, 100],
        value: 50,
        direction: 'vertical',
        border: true,
        buttons: true,
        step: 10,
        height: 16,
      })
      const t = testRender(slider, {width: 3, height: 16})
      expect(t.terminal.textContent()).toMatchSnapshot('unfocused')
      t.sendKey('tab')
      expect(t.terminal.textContent()).toMatchSnapshot('focused')
    })
  })

  describe('keyboard interaction', () => {
    it('right arrow increases value', () => {
      let value = 50
      const slider = new Slider({
        range: [0, 100],
        value,
        step: 10,
        onChange: v => {
          value = v
        },
      })
      const t = testRender(slider, {width: 20, height: 1})
      t.sendKey('tab')
      t.sendKey('right')
      expect(value).toBe(60)
    })

    it('left arrow decreases value', () => {
      let value = 50
      const slider = new Slider({
        range: [0, 100],
        value,
        step: 10,
        onChange: v => {
          value = v
        },
      })
      const t = testRender(slider, {width: 20, height: 1})
      t.sendKey('tab')
      t.sendKey('left')
      expect(value).toBe(40)
    })

    it('does not go below minimum', () => {
      let value = 0
      const slider = new Slider({
        range: [0, 100],
        value,
        step: 10,
        onChange: v => {
          value = v
        },
      })
      const t = testRender(slider, {width: 20, height: 1})
      t.sendKey('tab')
      t.sendKey('left')
      expect(value).toBe(0)
    })

    it('does not go above maximum', () => {
      let value = 100
      const slider = new Slider({
        range: [0, 100],
        value,
        step: 10,
        onChange: v => {
          value = v
        },
      })
      const t = testRender(slider, {width: 20, height: 1})
      t.sendKey('tab')
      t.sendKey('right')
      expect(value).toBe(100)
    })

    it('home moves to minimum', () => {
      let value = 50
      const slider = new Slider({
        range: [0, 100],
        value,
        step: 10,
        onChange: v => {
          value = v
        },
      })
      const t = testRender(slider, {width: 20, height: 1})
      t.sendKey('tab')
      t.sendKey('home')
      expect(value).toBe(0)
    })

    it('end moves to maximum', () => {
      let value = 50
      const slider = new Slider({
        range: [0, 100],
        value,
        step: 10,
        onChange: v => {
          value = v
        },
      })
      const t = testRender(slider, {width: 20, height: 1})
      t.sendKey('tab')
      t.sendKey('end')
      expect(value).toBe(100)
    })

    it('up/down arrows work for vertical slider', () => {
      let value = 50
      const slider = new Slider({
        range: [0, 100],
        value,
        step: 10,
        direction: 'vertical',
        onChange: v => {
          value = v
        },
      })
      const t = testRender(slider, {width: 1, height: 10})
      t.sendKey('tab')
      t.sendKey('down')
      expect(value).toBe(60)
      t.sendKey('up')
      expect(value).toBe(50)
    })
  })

  describe('inside scrollable viewport', () => {
    it('renders horizontal slider at offset 0', () => {
      const scrollable = new Scrollable({
        showScrollbars: false,
        contentSize: {width: 20},
        children: [new Slider({range: [0, 100], value: 50})],
      })
      const t = testRender(scrollable, {width: 10, height: 1})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders horizontal slider scrolled right', () => {
      const scrollable = new Scrollable({
        showScrollbars: false,
        contentSize: {width: 20},
        offset: new Point(10, 0),
        children: [new Slider({range: [0, 100], value: 50})],
      })
      const t = testRender(scrollable, {width: 10, height: 1})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders horizontal slider with border in wide scrollable', () => {
      const scrollable = new Scrollable({
        showScrollbars: false,
        contentSize: {width: 20},
        children: [new Slider({range: [0, 100], value: 50, border: true})],
      })
      const t = testRender(scrollable, {width: 10, height: 3})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders horizontal slider with buttons in wide scrollable', () => {
      const scrollable = new Scrollable({
        showScrollbars: false,
        contentSize: {width: 30},
        children: [
          new Slider({range: [0, 100], value: 50, buttons: true, step: 10}),
        ],
      })
      const t = testRender(scrollable, {width: 15, height: 1})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders vertical slider in tall scrollable', () => {
      const scrollable = new Scrollable({
        showScrollbars: false,
        contentSize: {height: 10},
        children: [
          new Slider({
            flex: 1,
            range: [0, 100],
            value: 50,
            direction: 'vertical',
          }),
        ],
      })
      const t = testRender(scrollable, {width: 1, height: 5})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders vertical slider scrolled down', () => {
      const scrollable = new Scrollable({
        showScrollbars: false,
        contentSize: {height: 10},
        offset: new Point(0, 5),
        children: [
          new Slider({
            flex: 1,
            range: [0, 100],
            value: 50,
            direction: 'vertical',
          }),
        ],
      })
      const t = testRender(scrollable, {width: 1, height: 5})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders vertical slider with border in tall scrollable', () => {
      const scrollable = new Scrollable({
        showScrollbars: false,
        contentSize: {height: 10},
        children: [
          new Slider({
            flex: 1,
            range: [0, 100],
            value: 50,
            direction: 'vertical',
            border: true,
          }),
        ],
      })
      const t = testRender(scrollable, {width: 3, height: 5})
      expect(t.terminal.textContent()).toMatchSnapshot()
    })
  })

  describe('subviews', () => {
    const names = (view: View) => view.children.map(c => c.constructor.name)

    it('is just the control without buttons', () => {
      const slider = new Slider({range: [0, 100], value: 50})
      testRender(slider, {width: 20, height: 1})
      expect(names(slider)).toEqual(['SliderControl'])
    })

    it('is Pressable, control, Pressable with buttons', () => {
      const slider = new Slider({
        range: [0, 100],
        value: 50,
        buttons: true,
        step: 10,
      })
      testRender(slider, {width: 20, height: 1})
      expect(names(slider)).toEqual([
        'SliderButton',
        'SliderControl',
        'SliderButton',
      ])
      expect(slider.children[0]).toBeInstanceOf(Pressable)
      expect(slider.children[2]).toBeInstanceOf(Pressable)
    })

    it('each button is Pressable > Box > centered Text', () => {
      const slider = new Slider({
        range: [0, 100],
        value: 50,
        buttons: true,
        step: 10,
      })
      testRender(slider, {width: 20, height: 1})
      for (const button of [slider.children[0], slider.children[2]]) {
        const [box] = button.children
        expect(box).toBeInstanceOf(Box)
        const [center] = box.children
        expect(center).toBeInstanceOf(ZStack)
        expect(center.children[0]).toBeInstanceOf(Text)
      }
    })

    it('adds and removes the buttons on update', () => {
      const slider = new Slider({range: [0, 100], value: 50})
      const t = testRender(slider, {width: 20, height: 1})
      expect(t.terminal.textContent()).toBe('─────────╴█╶────────')

      slider.update({range: [0, 100], value: 50, buttons: true, step: 10})
      t.render()
      expect(names(slider)).toEqual([
        'SliderButton',
        'SliderControl',
        'SliderButton',
      ])
      expect(t.terminal.textContent()).toBe('[◃]──────╴█╶─────[▹]')

      slider.update({range: [0, 100], value: 50})
      t.render()
      expect(names(slider)).toEqual(['SliderControl'])
      expect(t.terminal.textContent()).toBe('─────────╴█╶────────')
    })

    it('the buttons are not part of the focus ring', () => {
      const slider = new Slider({
        range: [0, 100],
        value: 50,
        buttons: true,
        step: 10,
        height: 1,
      })
      const after = new Button({title: 'After', height: 1})
      const t = testRender(Stack.down([slider, after]), {width: 20, height: 2})

      t.sendKey('tab')
      expect(slider.hasFocus).toBe(true)
      t.sendKey('tab')
      expect(slider.hasFocus).toBe(false)
      expect(after.hasFocus).toBe(true)
    })

    it('does not draw a border when there is not enough room', () => {
      const slider = new Slider({range: [0, 100], value: 50, border: true})
      const t = testRender(slider, {width: 10, height: 1})
      expect(t.terminal.textContent()).toBe('────╴█╶───')
    })
  })

  describe('mouse: track', () => {
    const make = (
      props: Partial<ConstructorParameters<typeof Slider>[0]> = {},
    ) => {
      const changes: number[] = []
      const slider = new Slider({
        range: [0, 100],
        value: 50,
        onChange: (v: number) => changes.push(v),
        ...props,
      } as any)
      return {slider, changes}
    }
    const click = (t: ReturnType<typeof testRender>, x: number, y = 0) => {
      t.sendMouse('mouse.button.down', {x, y})
      t.sendMouse('mouse.button.up', {x, y})
    }

    it('click sets the value at that position', () => {
      const {slider, changes} = make()
      const t = testRender(slider, {width: 21, height: 1})

      click(t, 0)
      click(t, 20)
      click(t, 10)
      click(t, 5)

      // 21 columns: each column is 5
      expect(changes).toEqual([0, 100, 50, 25])
      expect(slider.value).toBe(25)
      expect(t.terminal.textContent()).toBe('────╴█╶──────────────')
    })

    it('does not call onChange if the value does not change', () => {
      const {slider, changes} = make()
      const t = testRender(slider, {width: 21, height: 1})

      click(t, 10)
      expect(changes).toEqual([])
      expect(slider.value).toBe(50)
    })

    it('dragging follows the mouse', () => {
      const {slider, changes} = make()
      const t = testRender(slider, {width: 21, height: 1})

      t.sendMouse('mouse.button.down', {x: 2, y: 0})
      t.sendMouse('mouse.button.down', {x: 6, y: 0})
      t.sendMouse('mouse.button.down', {x: 12, y: 0})
      t.sendMouse('mouse.button.up', {x: 12, y: 0})

      expect(changes).toEqual([10, 30, 60])
    })

    it('dragging outside the slider clamps to the ends', () => {
      const {slider, changes} = make()
      const t = testRender(slider, {width: 21, height: 3})

      t.sendMouse('mouse.button.down', {x: 10, y: 0})
      t.sendMouse('mouse.button.down', {x: 60, y: 10})
      expect(slider.value).toBe(100)
      t.sendMouse('mouse.button.down', {x: -5, y: 10})
      expect(slider.value).toBe(0)
      t.sendMouse('mouse.button.up', {x: -5, y: 10})
      expect(changes).toEqual([100, 0])
    })

    it('stops following the mouse after release', () => {
      const {slider} = make()
      const t = testRender(slider, {width: 21, height: 1})

      t.sendMouse('mouse.button.down', {x: 2, y: 0})
      t.sendMouse('mouse.button.up', {x: 2, y: 0})
      t.sendMouse('mouse.move.in', {x: 15, y: 0})
      expect(slider.value).toBe(10)
    })

    it('release outside also stops tracking', () => {
      const {slider} = make()
      const t = testRender(slider, {width: 21, height: 1})

      t.sendMouse('mouse.button.down', {x: 2, y: 0})
      t.sendMouse('mouse.button.up', {x: 50, y: 0})
      t.sendMouse('mouse.move.in', {x: 15, y: 0})
      expect(slider.value).toBe(10)
    })

    it('snaps to the step', () => {
      const {slider, changes} = make({step: 10})
      const t = testRender(slider, {width: 21, height: 1})

      click(t, 3) // 15 => 20 (rounds half up)
      click(t, 4) // 20
      click(t, 8) // 40
      expect(changes).toEqual([20, 40])
      expect(slider.value).toBe(40)
    })

    it('works vertically', () => {
      const {slider, changes} = make({direction: 'vertical', height: 21})
      const t = testRender(slider, {width: 1, height: 21})

      click(t, 0, 5)
      click(t, 0, 20)
      expect(changes).toEqual([25, 100])
    })

    it('the end caps of a border scrub to the ends', () => {
      const {slider, changes} = make({border: true})
      const t = testRender(slider, {width: 22, height: 3})

      click(t, 0, 1)
      click(t, 21, 1)
      expect(changes).toEqual([0, 100])
    })

    it('maps positions inside the border', () => {
      const {slider, changes} = make({border: true})
      // the bar is 20 wide, from x = 1 to 20
      const t = testRender(slider, {width: 22, height: 3})

      click(t, 1, 1)
      click(t, 20, 1)
      expect(changes).toEqual([0, 100])
    })

    it('the track highlights while hovering and dragging', () => {
      const {slider} = make()
      const t = testRender(slider, {width: 21, height: 1})
      const background = () => t.terminal.styleAt(0, 0).background

      const normal = background()
      t.sendMouse('mouse.move.in', {x: 5, y: 0})
      const hover = background()
      expect(hover).not.toEqual(normal)

      // still highlighted while dragging outside of the slider
      t.sendMouse('mouse.button.down', {x: 5, y: 0})
      t.sendMouse('mouse.button.down', {x: 50, y: 0})
      expect(background()).toEqual(hover)

      t.sendMouse('mouse.button.up', {x: 50, y: 0})
      t.sendMouse('mouse.move.in', {x: 50, y: 0})
      expect(background()).toEqual(normal)
    })

    it('clicking the track does not take focus', () => {
      const {slider} = make()
      const t = testRender(slider, {width: 21, height: 1})
      click(t, 5)
      expect(slider.hasFocus).toBe(false)
    })

    it('value can be set programmatically', () => {
      const {slider} = make()
      const t = testRender(slider, {width: 21, height: 1})

      slider.value = 0
      t.render()
      expect(t.terminal.textContent()).toBe('█╶───────────────────')
      // and drags continue from there
      t.sendMouse('mouse.button.down', {x: 4, y: 0})
      expect(slider.value).toBe(20)
    })

    it('update() sets the value', () => {
      const {slider} = make()
      const t = testRender(slider, {width: 21, height: 1})

      slider.update({range: [0, 100], value: 100})
      t.render()
      expect(slider.value).toBe(100)
      expect(t.terminal.textContent()).toBe('───────────────────╴█')
    })
  })

  describe('mouse: buttons', () => {
    const make = (props: Record<string, unknown> = {}) => {
      const changes: number[] = []
      const slider = new Slider({
        range: [0, 100],
        value: 50,
        buttons: true,
        step: 10,
        onChange: (v: number) => changes.push(v),
        ...props,
      } as any)
      return {slider, changes}
    }
    const click = (t: ReturnType<typeof testRender>, x: number, y = 0) => {
      t.sendMouse('mouse.button.down', {x, y})
      t.sendMouse('mouse.button.up', {x, y})
    }

    it.each([
      ['borderless', {}, 0],
      ['bordered', {border: true}, 1],
    ])(
      '%s: clicking decrease and increase step the value',
      (_name, props, y) => {
        const {slider, changes} = make(props)
        const t = testRender(slider, {width: 20, height: 3})

        click(t, 1, y)
        click(t, 1, y)
        click(t, 18, y)
        expect(changes).toEqual([40, 30, 40])
      },
    )

    it('every column of a button is part of the button', () => {
      const {slider, changes} = make()
      const t = testRender(slider, {width: 20, height: 1})

      click(t, 0)
      click(t, 1)
      click(t, 2)
      click(t, 17)
      click(t, 18)
      click(t, 19)
      expect(changes).toEqual([40, 30, 20, 30, 40, 50])
    })

    it('stops at the ends of the range', () => {
      const {slider, changes} = make({value: 5})
      const t = testRender(slider, {width: 20, height: 1})

      click(t, 1)
      click(t, 1)
      expect(changes).toEqual([0])
      expect(slider.value).toBe(0)

      slider.value = 95
      t.render()
      click(t, 18)
      click(t, 18)
      expect(changes).toEqual([0, 100])
    })

    it('moves a value outside the range back in range', () => {
      const {slider, changes} = make({value: 150})
      const t = testRender(slider, {width: 20, height: 1})

      click(t, 1)
      expect(changes).toEqual([100])
    })

    it('works vertically', () => {
      const {slider, changes} = make({direction: 'vertical', height: 16})
      const t = testRender(slider, {width: 1, height: 16})

      click(t, 0, 0) // up decreases
      click(t, 0, 15) // down increases
      click(t, 0, 15)
      expect(changes).toEqual([40, 50, 60])
    })

    it('works vertically with a border', () => {
      const {slider, changes} = make({
        direction: 'vertical',
        border: true,
        height: 16,
      })
      const t = testRender(slider, {width: 3, height: 16})

      click(t, 1, 1)
      click(t, 1, 14)
      expect(changes).toEqual([40, 50])
    })

    it('releasing outside of a button does not step', () => {
      const {slider, changes} = make()
      const t = testRender(slider, {width: 20, height: 1})

      t.sendMouse('mouse.button.down', {x: 1, y: 0})
      t.sendMouse('mouse.button.up', {x: 10, y: 0})
      expect(changes).toEqual([])
    })

    it('dragging from a button onto the track does not change the value', () => {
      const {slider, changes} = make()
      const t = testRender(slider, {width: 20, height: 1})

      t.sendMouse('mouse.button.down', {x: 1, y: 0})
      t.sendMouse('mouse.button.down', {x: 12, y: 0})
      t.sendMouse('mouse.button.up', {x: 12, y: 0})
      expect(changes).toEqual([])
    })

    it('pressing the track away from the buttons does not press them', () => {
      const {slider, changes} = make()
      const t = testRender(slider, {width: 20, height: 1})

      click(t, 10)
      expect(changes).toEqual([])
      expect(slider.value).toBe(50)
    })

    it('the track maps positions between the buttons', () => {
      const {slider, changes} = make()
      // the track is x = 3 to 16
      const t = testRender(slider, {width: 20, height: 1})

      click(t, 3)
      click(t, 16)
      expect(changes).toEqual([0, 100])
    })

    it('shows a filled arrow while hovering a button', () => {
      const {slider} = make()
      const t = testRender(slider, {width: 20, height: 1})
      expect(t.terminal.textContent()).toBe('[◃]──────╴█╶─────[▹]')

      t.sendMouse('mouse.move.in', {x: 1, y: 0})
      expect(t.terminal.textContent()).toBe('[◂]──────╴█╶─────[▹]')

      t.sendMouse('mouse.move.in', {x: 18, y: 0})
      expect(t.terminal.textContent()).toBe('[◃]──────╴█╶─────[▸]')

      t.sendMouse('mouse.move.in', {x: 10, y: 0})
      expect(t.terminal.textContent()).toBe('[◃]──────╴█╶─────[▹]')
    })

    it('shows filled arrows vertically', () => {
      const {slider} = make({direction: 'vertical', height: 10})
      const t = testRender(slider, {width: 1, height: 10})
      expect(t.terminal.textContent().split('\n')[0]).toBe('▵')

      t.sendMouse('mouse.move.in', {x: 0, y: 0})
      expect(t.terminal.textContent().split('\n')[0]).toBe('▴')
      t.sendMouse('mouse.move.in', {x: 0, y: 9})
      expect(t.terminal.textContent().split('\n').at(-1)).toBe('▾')
    })

    it('a button highlights on hover and press, the track does not', () => {
      const {slider} = make()
      const t = testRender(slider, {width: 20, height: 1})
      const bg = (x: number) => t.terminal.styleAt(x, 0).background

      const normal = bg(0)
      t.sendMouse('mouse.move.in', {x: 1, y: 0})
      const hover = bg(0)
      expect(hover).not.toEqual(normal)
      // the whole button, but not the other button or the track
      expect(bg(2)).toEqual(hover)
      expect(bg(19)).toEqual(normal)
      expect(bg(10)).toEqual(normal)

      t.sendMouse('mouse.button.down', {x: 1, y: 0})
      const pressed = bg(0)
      expect(pressed).not.toEqual(hover)
      expect(pressed).not.toEqual(normal)
      t.sendMouse('mouse.button.up', {x: 1, y: 0})
    })

    it('draws the focus border of the buttons only when the slider has focus', () => {
      const {slider} = make({border: true})
      const t = testRender(slider, {width: 20, height: 3})
      expect(t.terminal.textContent().split('\n')[0]).toBe(
        '╭─┬──────────────┬─╮',
      )
      t.sendKey('tab')
      expect(t.terminal.textContent().split('\n')[0]).toBe(
        '╔═╦══════════════╦═╗',
      )
      t.sendKey('tab')
      expect(t.terminal.textContent().split('\n')[0]).toBe(
        '╭─┬──────────────┬─╮',
      )
    })

    it('stays in sync after moving between focus states and hover', () => {
      const {slider} = make()
      const t = testRender(slider, {width: 20, height: 1})

      t.sendKey('tab')
      t.sendMouse('mouse.move.in', {x: 1, y: 0})
      expect(t.terminal.textContent()).toBe('⟦◂⟧──────╴█╶─────⟦▹⟧')
      t.sendKey('tab')
      expect(t.terminal.textContent()).toBe('[◂]──────╴█╶─────[▹]')
    })
  })
})
