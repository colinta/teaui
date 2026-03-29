import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/testing.js'
import {Dropdown, Stack, Space} from '../../lib/components/index.js'

const CHOICES: [string, string][] = [
  ['Apple', 'apple'],
  ['Banana', 'banana'],
  ['Cherry', 'cherry'],
]

/**
 * The Dropdown grows to fill available space (like most views in 'grow' mode),
 * so it must be placed inside a layout container that constrains its height.
 * Otherwise its parentRect fills the entire viewport, leaving no room for the
 * dropdown list to appear below.
 */
function dropdownInStack(dropdown: Dropdown<string, any>) {
  return Stack.down({children: [dropdown, new Space()]})
}

function click(t: ReturnType<typeof testRender>, x: number, y: number) {
  t.sendMouse('mouse.button.down', {x, y})
  t.sendMouse('mouse.button.up', {x, y})
}

describe('Dropdown', () => {
  describe('rendering', () => {
    it('renders closed with no selection', () => {
      const t = testRender(dropdownInStack(new Dropdown({choices: CHOICES})), {
        width: 30,
        height: 3,
      })
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders closed with a title', () => {
      const t = testRender(
        dropdownInStack(
          new Dropdown({choices: CHOICES, title: 'Pick a fruit'}),
        ),
        {width: 30, height: 3},
      )
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders closed with a selected value', () => {
      const t = testRender(
        dropdownInStack(new Dropdown({choices: CHOICES, selected: 'banana'})),
        {width: 30, height: 3},
      )
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('renders closed with title when nothing selected', () => {
      const t = testRender(
        dropdownInStack(
          new Dropdown({
            choices: CHOICES,
            title: 'Pick a fruit',
            selected: undefined,
          }),
        ),
        {width: 30, height: 3},
      )
      expect(t.terminal.textContent()).toMatchSnapshot()
    })
  })

  describe('opening dropdown', () => {
    it('shows choices on click', () => {
      const t = testRender(dropdownInStack(new Dropdown({choices: CHOICES})), {
        width: 30,
        height: 12,
      })
      // click on the dropdown control (row 0)
      click(t, 5, 0)
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('shows choices with selected item highlighted', () => {
      const t = testRender(
        dropdownInStack(new Dropdown({choices: CHOICES, selected: 'cherry'})),
        {width: 30, height: 12},
      )
      click(t, 5, 0)
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('shows choices with title', () => {
      const t = testRender(
        dropdownInStack(new Dropdown({choices: CHOICES, title: 'Fruit'})),
        {width: 30, height: 12},
      )
      click(t, 5, 0)
      expect(t.terminal.textContent()).toMatchSnapshot()
    })
  })

  describe('selection', () => {
    it('selects an item on click and closes', () => {
      let selected: string | undefined
      const dropdown = new Dropdown({
        choices: CHOICES,
        onSelect: (value: string) => {
          selected = value
        },
      })
      const t = testRender(dropdownInStack(dropdown), {width: 30, height: 12})

      // open dropdown
      click(t, 5, 0)
      expect(t.terminal.textContent()).toMatchSnapshot('after open')

      // click "Banana" (row 3: border=1, Apple=2, Banana=3)
      click(t, 5, 3)
      expect(selected).toBe('banana')
      expect(t.terminal.textContent()).toMatchSnapshot('after select')
    })

    it('updates displayed text after selection', () => {
      const t = testRender(
        dropdownInStack(new Dropdown({choices: CHOICES, selected: 'apple'})),
        {width: 30, height: 3},
      )
      expect(t.terminal.textContent()).toMatchSnapshot()
    })
  })

  describe('multiple selection', () => {
    it('renders closed with multiple selections', () => {
      const t = testRender(
        dropdownInStack(
          new Dropdown({
            choices: CHOICES,
            multiple: true,
            selected: ['apple', 'cherry'],
          }),
        ),
        {width: 30, height: 3},
      )
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('shows choices with checkboxes on click', () => {
      const t = testRender(
        dropdownInStack(
          new Dropdown({
            choices: CHOICES,
            multiple: true,
            selected: ['apple'],
          }),
        ),
        {width: 30, height: 12},
      )
      click(t, 5, 0)
      expect(t.terminal.textContent()).toMatchSnapshot()
    })

    it('toggles selection without closing', () => {
      let selected: string[] = ['apple']
      const dropdown = new Dropdown({
        choices: CHOICES,
        multiple: true,
        selected: ['apple'],
        onSelect: (values: string[]) => {
          selected = values
        },
      })
      const t = testRender(dropdownInStack(dropdown), {width: 30, height: 12})

      // open
      click(t, 5, 0)
      expect(t.terminal.textContent()).toMatchSnapshot('after open')

      // click on "Banana" — row depends on layout:
      // row 0: control, row 1: border, row 2: "Select all" checkbox,
      // row 3: Apple, row 4: Banana
      click(t, 5, 4)
      expect(selected).toContain('banana')
      expect(t.terminal.textContent()).toMatchSnapshot('after toggle banana')
    })
  })

  describe('many choices', () => {
    it('renders a long list of choices', () => {
      const manyChoices: [string, string][] = Array.from(
        {length: 10},
        (_, i) => [`Option ${i + 1}`, `opt${i + 1}`],
      )
      const t = testRender(
        dropdownInStack(new Dropdown({choices: manyChoices})),
        {width: 30, height: 20},
      )
      click(t, 5, 0)
      expect(t.terminal.textContent()).toMatchSnapshot()
    })
  })

  describe('background colors', () => {
    it('dropdown popup rows have consistent background color', () => {
      const t = testRender(dropdownInStack(new Dropdown({choices: CHOICES})), {
        width: 30,
        height: 12,
      })
      click(t, 5, 0)

      // The popup content rows (rows 2-4: Apple, Banana, Cherry) should have
      // a consistent background across the entire row width.
      // This catches the bug where View.background bleeds into the popup area.
      for (let row = 2; row <= 4; row++) {
        // Get the background of the first content cell as reference
        const refBg = t.terminal.styleAt(1, row).background
        expect(refBg, `row ${row} should have a background color`).toBeDefined()

        // Check that every cell in the item area has the same background
        // (from col 1 to the inner border, skipping the box border chars)
        for (let col = 2; col < 27; col++) {
          const style = t.terminal.styleAt(col, row)
          expect(
            style.background,
            `row ${row}, col ${col} should have consistent background`,
          ).toBe(refBg)
        }
      }
    })

    it('dropdown popup has no background bleed from parent view background', () => {
      // When the dropdown has a background color set,
      // the popup should NOT inherit that background — it should use
      // the same background as a dropdown without a background prop.
      const withBg = new Dropdown({choices: CHOICES, background: 'red'})
      const withoutBg = new Dropdown({choices: CHOICES})

      const tWithBg = testRender(dropdownInStack(withBg), {
        width: 30,
        height: 12,
      })
      click(tWithBg, 5, 0)

      const tWithoutBg = testRender(dropdownInStack(withoutBg), {
        width: 30,
        height: 12,
      })
      click(tWithoutBg, 5, 0)

      // The popup content rows should have the same background regardless of
      // whether the dropdown control has a background prop
      for (let row = 2; row <= 4; row++) {
        for (let col = 1; col < 27; col++) {
          const styleBg = tWithBg.terminal.styleAt(col, row)
          const styleNoBg = tWithoutBg.terminal.styleAt(col, row)
          expect(
            styleBg.background,
            `row ${row}, col ${col} popup bg should not be affected by dropdown background prop`,
          ).toEqual(styleNoBg.background)
        }
      }
    })

    it('dropdown control row has a background color', () => {
      const t = testRender(
        dropdownInStack(new Dropdown({choices: CHOICES, selected: 'apple'})),
        {width: 30, height: 3},
      )

      // The Dropdown paints with theme.ui() then writes text with the same style.
      // The text cells should carry foreground and background from the theme.
      const style = t.terminal.styleOf('Apple')
      expect(style).not.toBeNull()
      expect(style!.foreground).toBeDefined()
      expect(style!.background).toBeDefined()
    })

    it('popup border and content rows have consistent backgrounds', () => {
      const t = testRender(dropdownInStack(new Dropdown({choices: CHOICES})), {
        width: 30,
        height: 12,
      })
      click(t, 5, 0)

      // Get reference background from the top border
      const borderBg = t.terminal.styleAt(1, 1).background
      expect(borderBg, 'border should have a background').toBeDefined()

      // Top border row (row 1) should be consistent
      for (let col = 0; col < 28; col++) {
        const style = t.terminal.styleAt(col, 1)
        expect(
          style.background,
          `top border col ${col} should have consistent background`,
        ).toEqual(borderBg)
      }

      // Bottom border row (row 5) should be consistent
      for (let col = 0; col < 28; col++) {
        const style = t.terminal.styleAt(col, 5)
        expect(
          style.background,
          `bottom border col ${col} should have consistent background`,
        ).toEqual(borderBg)
      }

      // Content rows should also match the border background
      for (let row = 2; row <= 4; row++) {
        for (let col = 1; col < 27; col++) {
          const style = t.terminal.styleAt(col, row)
          expect(
            style.background,
            `content row ${row}, col ${col} should match border background`,
          ).toEqual(borderBg)
        }
      }
    })
  })
})
