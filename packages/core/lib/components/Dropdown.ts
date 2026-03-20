import * as unicode from '@teaui/term'

import type {Viewport} from '../Viewport.js'
import {type Props as ViewProps, View} from '../View.js'
import {Container} from '../Container.js'
import {Point, Size, Rect} from '../geometry.js'
import {
  type BorderChars as BoxBorderChars,
  Box,
  Button,
  Checkbox,
  Modal,
  Stack,
  ScrollableList,
  Separator,
  Text,
} from '../components/index.js'
import {type MouseEvent, isMouseClicked} from '../events/index.js'
import {System} from '../System.js'

interface BorderChars {
  control: BoxBorderChars
  hover: BoxBorderChars
  above: BoxBorderChars
  below: BoxBorderChars
}

type Choices<T> = [string, T][]

interface SharedProps<T> extends ViewProps {
  choices: Choices<T>
  title?: string
}

type SelectMultipleFn<T> = (value: T[]) => void
type SelectOneFn<T> = (value: T) => void

interface SelectMultiple<T> {
  selected: readonly T[]
  onSelect?: SelectMultipleFn<T>
}

interface SelectOne<T> {
  selected?: T
  onSelect?: SelectOneFn<T>
}

type Props<T, M extends boolean | undefined> = SharedProps<T> &
  (M extends true ? SelectMultiple<T> : SelectOne<T>)

type ConstructorProps<T, M extends boolean | undefined> = Props<T, M> & {
  multiple?: M
}

export class Dropdown<T, M extends boolean> extends View {
  dropdownSelector: DropdownSelector<T>
  #title?: string[]
  #showModal = false
  #modal: Modal
  readonly #multiple: boolean
  #onSelectCallback?: SelectMultipleFn<T> | SelectOneFn<T>

  constructor({multiple, ...props}: ConstructorProps<T, M>) {
    super(props)

    this.#multiple = multiple ?? false
    this.dropdownSelector = new DropdownSelector({
      theme: this.theme,
      multiple: this.#multiple,
      choices: [],
      selected: [],
      onSelect: () => this.#onSelect(),
    })

    this.#modal = new Modal({
      dim: false,
      dismissOnClick: true,
      dismissOnEsc: true,
      onDismiss: () => {
        this.#showModal = false
      },
      child: this.dropdownSelector,
    })

    this.#update(props as Props<T, M>)
  }

  update(props: Props<T, M>) {
    this.#update(props)
    super.update(props)
  }

  #update({title, choices, selected, onSelect}: Props<T, M>) {
    this.#onSelectCallback = onSelect
    this.#title = title ? title.split('\n') : undefined

    this.choices = choices
    this.selected = selected as any
    this.dropdownSelector.theme = this.theme
  }

  get choices(): Choices<T> {
    return this.dropdownSelector.choices
  }
  set choices(choices: Choices<T>) {
    this.dropdownSelector.choices = choices
  }

  #titleLines() {
    if (
      this.#title !== undefined &&
      this.dropdownSelector.selectedValues.length === 0
    ) {
      return this.#title
    }

    return this.dropdownSelector.selectedText ?? ['<select>']
  }

  dismissModal() {
    this.#showModal = false
  }

  get selected(): M extends true ? () => T[] : T | undefined {
    if (this.#multiple) {
      return this.dropdownSelector.selectedValues as any
    } else {
      return this.dropdownSelector.selectedValue as any
    }
  }

  set selected(selected: M extends true ? T[] : T | undefined) {
    this.dropdownSelector.selectedRows = dropdownSelectedRows<T>(
      selected,
      this.dropdownSelector.choices,
      this.#multiple,
    )
  }

  #onSelect() {
    if (this.#multiple) {
      ;(this.#onSelectCallback as any)?.(this.dropdownSelector.selectedValues)
    } else {
      this.dismissModal()
      const value = this.dropdownSelector.selectedValue
      if (value !== undefined) {
        ;(this.#onSelectCallback as any)?.(value)
      }
    }

    this.invalidateSize()
  }

  naturalSize(): Size {
    const size = new Size(unicode.stringSize(this.#titleLines()))
    return size.grow(8, 0)
  }

  receiveMouse(event: MouseEvent, system: System) {
    super.receiveMouse(event, system)

    if (isMouseClicked(event)) {
      this.#showModal = true
    }
  }

  render(viewport: Viewport) {
    if (viewport.isEmpty) {
      return
    }

    if (this.#showModal) {
      viewport.requestModal(this.#modal)
    }

    viewport.registerMouse(['mouse.move', 'mouse.button.left'])
    const lines = this.#titleLines()
    const textStyle = this.theme.ui({
      isHover: this.isHover && !this.#showModal,
    })

    viewport.paint(textStyle)

    const pt = new Point(0, 0).mutableCopy()
    const lineIndexOffset = ~~((viewport.contentSize.height - lines.length) / 2)
    for (; pt.y < viewport.contentSize.height; pt.y++) {
      const lineIndex = pt.y - lineIndexOffset
      if (lineIndex >= 0 && lineIndex < lines.length) {
        viewport.write(lines[lineIndex], pt.offset(1, 0), textStyle)
      }

      viewport.write(
        `▏  `,
        pt.offset(viewport.contentSize.width - 3, 0),
        textStyle,
      )
    }

    viewport.write(
      this.#showModal
        ? ARROWS.open
        : this.isHover
          ? ARROWS.hover
          : ARROWS.default,
      new Point(
        viewport.contentSize.width - 2,
        viewport.contentSize.height / 2,
      ),
      textStyle,
    )
  }
}

interface SelectorProps<T> extends SharedProps<T> {
  onSelect(): void
  selected: number[]
  multiple: boolean
}

class DropdownSelector<T> extends Container {
  #choices: [string[], T, string][]
  #selected: Set<number>
  #multiple: boolean
  #onSelect: () => void
  #scrollView: ScrollableList<T>
  #box = new Box({maxHeight: 24, border: BORDERS.below})
  #checkbox: Checkbox

  constructor({
    choices,
    selected,
    multiple,
    onSelect,
    ...viewProps
  }: SelectorProps<T>) {
    super({...viewProps})

    this.#choices = choices.map(([text, value]) => [
      text.split('\n'),
      value,
      text,
    ])
    this.#selected = new Set(selected)
    this.#multiple = multiple
    this.#onSelect = onSelect
    this.#checkbox = new Checkbox({
      title: 'Select all',
      value: false,
      onChange: value => {
        if (value) {
          this.#selected = new Set(Array(this.#choices.length).keys())
        } else {
          this.#selected = new Set()
        }
        onSelect()
        this.#scrollView.invalidateAllRows('view')
      },
    })
    this.#scrollView = new ScrollableList({
      items: this.#choices.map(([, choice]) => choice),
      cellForItem: (choice, row) => this.cellForItem(choice, row),
    })
    const content = new Stack({direction: 'down', children: []})

    if (multiple) {
      content.add(this.#checkbox)
    }
    content.add(this.#scrollView)
    this.#box.add(content)
    this.add(this.#box)

    this.#checkbox.value = this.#isAllSelected()
  }

  #isAllSelected() {
    return this.#selected.size === this.#choices.length
  }

  get selectedRows() {
    return [...this.#selected]
  }

  set selectedRows(rows: number[]) {
    new Set([...this.#selected, ...rows]).forEach(selected => {
      const item = this.#choices[selected][1]
      this.#scrollView.invalidateItem(item, 'view')
    })

    this.#selected = new Set(rows)
  }

  get selectedText(): string[] | undefined {
    if (this.#selected.size === 0) {
      return undefined
    }

    if (this.#selected.size > 1) {
      const rows = [...this.#selected]
      rows.sort()
      // honestly, it's strange to use multiple lines in your dropdown choices...
      // but we support it! When multiple items are selected, the text becomes:
      // 1. join each line with a space
      // 2. join each entry with a comma
      // e.g. "Selected\n1", "Selected\n2" becomes "Selected 1, Selected 2"
      return [rows.map(index => this.#choices[index][0].join(' ')).join(', ')]
    }

    // if only one item is selected, make that the title, preserving multiple lines
    const [row] = [...this.#selected]
    return this.#choices[row][0]
  }

  get selectedValue(): T | undefined {
    if (this.#selected.size === 0) {
      return undefined
    }
    const [row] = [...this.#selected]
    return this.#choices[row][1]
  }

  get selectedValues(): T[] {
    return [...this.#selected].map(index => this.#choices[index][1])
  }

  get choices(): [string, T][] {
    return this.#choices.map(([_, choice, text]) => [text, choice])
  }

  /**
   * Sets new choices, preserving the previously selected items.
   */
  set choices(choices: SharedProps<T>['choices']) {
    const selected = [...this.#selected].map(index => this.#choices[index][1])
    this.#choices = choices.map(([text, choice]) => [
      text.split('\n'),
      choice,
      text,
    ])
    this.#selected = new Set(
      selected.flatMap(item => {
        const index = choices.findIndex(([_, choice]) => choice === item)
        if (index === -1) {
          return []
        }

        return [index]
      }),
    )
    this.#scrollView.updateItems(choices.map(([, choice]) => choice))
  }

  cellForItem(choice: T, row: number): View {
    const button = this.#cellButton(choice, row)

    return Stack.right({
      fill: false,
      children: [
        ['flex1', button],
        new Separator({direction: 'vertical', border: 'single'}),
      ],
    })
  }

  #cellButton(choice: T, row: number) {
    const lines: string[] = this.#choices[row][0]
    const isSelected = [...this.#selected].some(index => index === row)

    return new Button({
      theme: isSelected ? 'selected' : undefined,
      border: 'none',
      align: 'left',
      child: new Text({
        lines: lines.map((line, index) => {
          return dropdownPrefix(this.#multiple, index, isSelected) + line
        }),
      }),
      onClick: () => {
        this.#selected.forEach(selected => {
          const item = this.#choices[selected][1]
          this.#scrollView.invalidateItem(item, 'view')
        })

        this.#scrollView.invalidateItem(choice, 'view')

        if (this.#multiple) {
          if (this.#selected.has(row)) {
            this.#selected.delete(row)
          } else {
            this.#selected.add(row)
          }
        } else {
          this.#selected = new Set([row])
        }

        this.#checkbox.value = this.#isAllSelected()

        this.#onSelect()
      },
    })
  }

  render(viewport: Viewport) {
    if (viewport.isEmpty) {
      return super.render(viewport)
    }

    const naturalSize = this.naturalSize(viewport.contentSize).max(
      viewport.contentSize,
    )
    const fitsBelow =
      viewport.parentRect.maxY() + naturalSize.height <
      viewport.contentSize.height
    const fitsAbove = naturalSize.height <= viewport.parentRect.minY()

    // 1. doesn't fit above or below, pick the side that has more room
    // 2. prefer below
    // 3. otherwise above
    let placement: 'above' | 'below'
    let height = naturalSize.height
    if (!fitsBelow && !fitsAbove) {
      const spaceBelow =
        viewport.contentSize.height - viewport.parentRect.maxY() + 1
      const spaceAbove = viewport.parentRect.minY() + 1
      if (spaceAbove > spaceBelow) {
        placement = 'above'
        height = spaceAbove
      } else {
        placement = 'below'
        height = spaceBelow
      }
    } else if (fitsBelow) {
      placement = 'below'
    } else {
      placement = 'above'
    }

    const width = Math.max(
      viewport.parentRect.size.width,
      Math.min(
        naturalSize.width,
        viewport.contentSize.width - viewport.parentRect.minX(),
      ),
    )
    const x = Math.max(
      0,
      viewport.parentRect.maxX() - width,
      viewport.parentRect.minX(),
    )

    let y: number
    if (placement === 'below') {
      y = viewport.parentRect.maxY()
    } else {
      y = viewport.parentRect.minY() - height
    }

    this.#box.border = BORDERS[placement]

    const rect = new Rect([x, y], [width, height])
    viewport.clipped(rect, inside => super.render(inside))
  }
}

function dropdownSelectedRows<T>(
  selected: T | readonly T[] | undefined,
  choices: Choices<T>,
  multiple: boolean,
): number[] {
  let selectedItems: T[]
  if (multiple) {
    selectedItems = selected as T[]
  } else if (selected !== undefined) {
    selectedItems = [selected as T]
  } else {
    return []
  }

  return selectedItems.flatMap(item => {
    const index = choices.findIndex(([_, choice]) => choice === item)
    if (index === -1) {
      return []
    }

    return [index]
  })
}

function dropdownPrefix(multiple: boolean, index: number, isSelected: boolean) {
  if (index !== 0) {
    return '  '
  }

  if (multiple) {
    return isSelected ? BOX.multiple.checked : BOX.multiple.unchecked
  } else {
    return isSelected ? BOX.single.checked : BOX.single.unchecked
  }
}

const ARROWS = {hover: '▼', default: '▽', open: '◇'}

const BORDERS: BorderChars = {
  control: ['─', '│', '╭', '╮', '╰', '╯'],
  hover: ['─', '│', '╭', '╮', '╰', '╯', '─', '│'],
  below: ['─', '│', '╭', '╮', '╰', '╯', '─', '│'],
  above: ['─', '│', '╭', '╮', '╰', '╯', '─', '│'],
}

const BOX: Record<
  'multiple' | 'single',
  Record<'unchecked' | 'checked', string>
> = {
  multiple: {
    unchecked: '☐ ',
    checked: '☑ ',
  },
  single: {
    unchecked: '◯ ',
    checked: '⦿ ',
  },
}
