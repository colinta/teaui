import {describe, expect, it} from 'vitest'

import {testRender} from '../../lib/TestScreen.js'
import type {View} from '../../lib/View.js'
import {
  Calendar,
  Checkbox,
  Dropdown,
  FontStyle,
  type FormField,
  type FormInput,
  Input,
  Radio,
  RadioGroup,
  Slider,
  Space,
  Stack,
  Toggle,
  ToggleGroup,
} from '../../lib/components/index.js'

type TestScreen = ReturnType<typeof testRender>

interface InputProps {
  formName?: string
  isEnabled?: boolean
}

interface Case {
  name: string
  create(props: InputProps): View & FormInput
  /** the view to render, defaults to the input */
  root?(input: View): View
  size: {width: number; height: number}
  /** something that changes the value of an enabled input */
  interact(t: TestScreen): void
  /** whether `interact` had an effect, defaults to comparing formData */
  didInteract?(t: TestScreen, input: View & FormInput, before: string): boolean
  formData: FormField[]
}

function click(t: TestScreen, x: number, y: number) {
  t.sendMouse('mouse.button.down', {x, y})
  t.sendMouse('mouse.button.up', {x, y})
}

const CASES: Case[] = [
  {
    name: 'Checkbox',
    create: props => new Checkbox({title: 'Agree', value: false, ...props}),
    size: {width: 12, height: 1},
    interact: t => click(t, 0, 0),
    formData: [{name: 'field', type: 'boolean', value: false}],
  },
  {
    name: 'Input',
    create: props => new Input({value: 'abc', ...props}),
    size: {width: 12, height: 1},
    interact: t => t.sendKey('d'),
    formData: [{name: 'field', type: 'string', value: 'abc'}],
  },
  {
    name: 'RadioGroup',
    create: props =>
      new RadioGroup({
        value: 'one',
        child: Stack.down([
          new Radio({title: 'One', value: 'one'}),
          new Radio({title: 'Two', value: 'two'}),
        ]),
        ...props,
      }),
    size: {width: 12, height: 2},
    interact: t => click(t, 0, 1),
    formData: [{name: 'field', type: 'string', value: 'one'}],
  },
  {
    name: 'Toggle',
    create: props => new Toggle({value: false, ...props}),
    size: {width: 12, height: 2},
    interact: t => click(t, 2, 1),
    formData: [{name: 'field', type: 'boolean', value: false}],
  },
  {
    name: 'Slider',
    create: props => new Slider({range: [0, 10], value: 5, ...props}),
    size: {width: 12, height: 1},
    interact: t => {
      t.sendKey('tab')
      t.sendKey('right')
    },
    formData: [{name: 'field', type: 'number', value: 5}],
  },
  {
    name: 'ToggleGroup',
    create: props =>
      new ToggleGroup({titles: ['x', 'y'], selected: [1], ...props}),
    size: {width: 12, height: 3},
    interact: t => click(t, 1, 1),
    formData: [{name: 'field', type: 'number[]', value: [1]}],
  },
  {
    name: 'FontStyle',
    create: props =>
      new FontStyle({
        value: {
          bold: true,
          italic: false,
          underline: false,
          strikethrough: false,
        },
        ...props,
      }),
    size: {width: 20, height: 3},
    interact: t => click(t, 5, 1),
    formData: [
      {
        name: 'field',
        type: 'unknown',
        value: {
          bold: true,
          italic: false,
          underline: false,
          strikethrough: false,
        },
      },
    ],
  },
  {
    name: 'Dropdown',
    create: props =>
      new Dropdown({
        choices: [
          ['Apple', 'apple'],
          ['Banana', 'banana'],
        ],
        selected: 'apple',
        ...props,
      }),
    root: input => Stack.down([input, new Space()]),
    size: {width: 20, height: 8},
    interact: t => click(t, 2, 0),
    // clicking opens the choices
    didInteract: t => t.terminal.textContent().includes('Banana'),
    formData: [{name: 'field', type: 'string', value: 'apple'}],
  },
  {
    name: 'Calendar',
    create: props =>
      new Calendar({
        date: new Date(2026, 5, 15),
        visibleDate: new Date(2026, 5, 1),
        now: new Date(2026, 5, 1),
        ...props,
      }),
    size: {width: 24, height: 8},
    interact: t => t.sendMouse('mouse.button.down', {x: 4, y: 2}),
    formData: [{name: 'field', type: 'date', value: new Date(2026, 5, 15)}],
  },
]

function render(testCase: Case, input: View & FormInput) {
  return testRender(testCase.root?.(input) ?? input, testCase.size)
}

function didInteract(
  testCase: Case,
  t: TestScreen,
  input: View & FormInput,
  before: string,
) {
  if (testCase.didInteract) {
    return testCase.didInteract(t, input, before)
  }
  return JSON.stringify(input.formData()) !== before
}

describe.each(CASES)('$name as a FormInput', testCase => {
  it('defaults to an empty formName and isEnabled', () => {
    const input = testCase.create({})
    expect(input.formName).toBe('')
    expect(input.isEnabled).toBe(true)
  })

  it('reports its formData', () => {
    const input = testCase.create({formName: 'field'})
    expect(input.formData()).toEqual(testCase.formData)
  })

  it('responds to input when enabled', () => {
    const input = testCase.create({})
    const t = render(testCase, input)
    const before = JSON.stringify(input.formData())
    testCase.interact(t)
    t.render()
    expect(didInteract(testCase, t, input, before)).toBe(true)
  })

  it('ignores input and is dimmed when disabled', () => {
    const input = testCase.create({isEnabled: false})
    const t = render(testCase, input)
    expect(t.terminal.styleAt(1, 0).dim).toBe(true)

    const before = JSON.stringify(input.formData())
    testCase.interact(t)
    t.render()
    expect(didInteract(testCase, t, input, before)).toBe(false)

    input.isEnabled = true
    t.render()
    expect(t.terminal.styleAt(1, 0).dim).not.toBe(true)
  })

  it('ignores input and is dimmed while its form is submitting', () => {
    const input = testCase.create({})
    input.setIsFormSubmitting(true)
    const t = render(testCase, input)
    expect(t.terminal.styleAt(1, 0).dim).toBe(true)

    const before = JSON.stringify(input.formData())
    testCase.interact(t)
    t.render()
    expect(didInteract(testCase, t, input, before)).toBe(false)
  })

  it('draws a red arrow when invalid', () => {
    const input = testCase.create({formName: 'field'})
    const t = render(testCase, input)
    const valid = t.terminal.textContent()

    input.setIsFormValid(false)
    t.render()
    expect(t.terminal.charAt(0, 0)).toBe('→')
    expect(t.terminal.styleAt(0, 0).foreground).toBe('red')
    expect(t.terminal.textContent()).toMatchSnapshot()

    input.setIsFormValid(true)
    t.render()
    expect(t.terminal.textContent()).toBe(valid)
  })
})

describe('form data', () => {
  it('Dropdown with no selection has no formData', () => {
    const dropdown = new Dropdown({formName: 'fruit', choices: [['Apple', 1]]})
    expect(dropdown.formData()).toEqual([])
  })

  it('Dropdown with multiple selections uses the type of its choices', () => {
    const choices: [string, number][] = [
      ['One', 1],
      ['Two', 2],
    ]
    expect(
      new Dropdown({
        formName: 'n',
        multiple: true,
        choices,
        selected: [],
      }).formData(),
    ).toEqual([{name: 'n', type: 'number[]', value: []}])
    expect(
      new Dropdown({
        formName: 'n',
        multiple: true,
        choices,
        selected: [2],
      }).formData(),
    ).toEqual([{name: 'n', type: 'number[]', value: [2]}])
  })

  it('Dropdown with object values has type unknown', () => {
    const value = {id: 1}
    const dropdown = new Dropdown({
      formName: 'object',
      choices: [['Object', value]],
      selected: value,
    })
    expect(dropdown.formData()).toEqual([
      {name: 'object', type: 'unknown', value},
    ])
  })

  it('Dropdown with Date values has type date', () => {
    const date = new Date(2026, 0, 1)
    const dropdown = new Dropdown({
      formName: 'date',
      choices: [['New Year', date]],
      selected: date,
    })
    expect(dropdown.formData()).toEqual([
      {name: 'date', type: 'date', value: date},
    ])
  })

  it('RadioGroup with no selection has no formData', () => {
    expect(new RadioGroup({formName: 'size'}).formData()).toEqual([])
  })

  it('RadioGroup with a number value has type number', () => {
    expect(new RadioGroup({formName: 'size', value: 2}).formData()).toEqual([
      {name: 'size', type: 'number', value: 2},
    ])
  })

  it('Calendar range selection reports a sorted dateRange', () => {
    const calendar = new Calendar({
      formName: 'trip',
      selection: 'range',
      date: new Date(2026, 5, 15),
      visibleDate: new Date(2026, 5, 1),
      now: new Date(2026, 5, 1),
    })
    // nothing is reported until both ends are selected
    expect(calendar.formData()).toEqual([])

    const t = testRender(calendar, {width: 22, height: 8})
    // Sun Jun 7, then Wed Jun 3 (the first row is May 31 - Jun 6)
    t.sendMouse('mouse.button.down', {x: 1, y: 3})
    t.sendMouse('mouse.button.up', {x: 1, y: 3})
    t.sendMouse('mouse.button.down', {x: 10, y: 2})
    t.sendMouse('mouse.button.up', {x: 10, y: 2})
    expect(calendar.formData()).toEqual([
      {
        name: 'trip',
        type: 'dateRange',
        value: [new Date(2026, 5, 3), new Date(2026, 5, 7)],
      },
    ])
  })
})

describe('Radio.isEnabled', () => {
  it('disables a single radio in an enabled group', () => {
    const group = new RadioGroup({
      value: 'one',
      child: Stack.down([
        new Radio({title: 'One', value: 'one'}),
        new Radio({title: 'Two', value: 'two', isEnabled: false}),
        new Radio({title: 'Three', value: 'three'}),
      ]),
    })
    const t = testRender(group, {width: 12, height: 3})
    expect(t.terminal.styleOf('Two')?.dim).toBe(true)
    expect(t.terminal.styleOf('Three')?.dim).not.toBe(true)

    click(t, 0, 1)
    expect(group.value).toBe('one')

    click(t, 0, 2)
    expect(group.value).toBe('three')
  })

  it('every radio draws the error arrow of an invalid group', () => {
    const group = new RadioGroup({
      formName: 'size',
      value: 'one',
      child: Stack.down([
        new Radio({title: 'One', value: 'one'}),
        new Radio({title: 'Two', value: 'two'}),
      ]),
    })
    const t = testRender(group, {width: 12, height: 2})
    group.setIsFormValid(false)
    t.render()
    expect(t.terminal.textContent()).toBe('→ ⦿ One\n→ ◯ Two')
  })
})
