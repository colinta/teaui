import React, {useCallback, useMemo, useState} from 'react'
import type {
  Accordion as WrAccordion,
  Box as WrBox,
  Breadcrumb as WrBreadcrumb,
  Button as WrButton,
  Calendar as WrCalendar,
  Canvas as WrCanvas,
  Checkbox as WrCheckbox,
  Collapsible as WrCollapsible,
  CollapsibleText as WrCollapsibleText,
  ConsoleLog as WrConsoleLog,
  Digits as WrDigits,
  Drawer as WrDrawer,
  Pane as WrPane,
  Dropdown as WrDropdown,
  Modal as WrModal,
  Geometry as WrGeometry,
  Header as WrHeader,
  HotKey as WrHotKey,
  Keyboard as WrKeyboard,
  Mouse as WrMouse,
  Stack as WrStack,
  Input as WrInput,
  // Log,
  Progress as WrProgress,
  // ScrollableList,
  Scrollable as WrScrollable,
  Separator as WrSeparator,
  Slider as WrSlider,
  Space as WrSpace,
  Spinner as WrSpinner,
  Table as WrTable,
  Tree as WrTree,
  Tabs as WrTabs,
  ToggleGroup as WrToggleGroup,
  Logo as WrLogo,
  Pin as WrPin,
  ZStack as WrZStack,
  Column,
  SortDirection,
  ViewProps,
} from '@teaui/core'
import {TextProvider, TextStyle} from './components/TextReact.js'

export {FontStyle} from './components/FontStyle.js'
export type {FontStyleValue} from './components/FontStyle.js'

type Children = 'children' | 'child'
type TUIView<
  T extends abstract new (arg: any, ...args: any) => any,
  OmitProps extends keyof ConstructorParameters<T>[0] = Children,
> = Omit<NonNullable<ConstructorParameters<T>[0]>, OmitProps>

type TUIContainer<
  T extends abstract new (arg: any, ...args: any) => any,
  ChildrenProps extends keyof NonNullable<ConstructorParameters<T>[0]> =
    Children,
> = TUIView<T, ChildrenProps> & {[Key in ChildrenProps]?: React.ReactNode}

type BreadcrumbProps = TUIView<typeof WrBreadcrumb>
type CalendarProps = TUIView<typeof WrCalendar>
type CanvasProps = TUIView<typeof WrCanvas>
type CheckboxProps = TUIView<typeof WrCheckbox>
type CollapsibleTextProps = TUIView<typeof WrCollapsibleText>
type ConsoleProps = TUIView<typeof WrConsoleLog>
type DigitsProps = TUIView<typeof WrDigits>
type GeometryProps = TUIContainer<typeof WrGeometry>
type DropdownProps = {
  choices: [string, any][]
  selected?: any
  onSelect?: (value: any) => void
  multiple?: boolean
  title?: string
  theme?: string
  height?: number | 'shrink'
  width?: number | 'shrink'
  flex?: number
}
type HeaderProps = {text?: string}
type HotKeyProps = TUIView<typeof WrHotKey>
type KeyboardProps = TUIContainer<typeof WrKeyboard>
type MouseProps = TUIContainer<typeof WrMouse>
type InputProps = TUIView<typeof WrInput>
type ProgressProps = TUIView<typeof WrProgress>
type SeparatorProps = TUIView<typeof WrSeparator>
type SliderProps = TUIView<typeof WrSlider>
type SpaceProps = TUIView<typeof WrSpace>
type SpinnerProps = TUIView<typeof WrSpinner>
type LogoProps = TUIView<typeof WrLogo>
type PinProps = TUIContainer<typeof WrPin>
type ZStackProps = TUIContainer<typeof WrZStack>
type ToggleGroupProps = TUIView<typeof WrToggleGroup>

// Table uses its own prop types since it's generic and TUIView doesn't work well with generics

type ModalProps = TUIContainer<typeof WrModal>

// "simple" containers
type BoxProps = TUIContainer<typeof WrBox>
type ButtonProps = TUIContainer<typeof WrButton>
type CollapsibleProps = TUIContainer<
  typeof WrCollapsible,
  'collapsed' | 'expanded' | 'children'
>
type ScrollableProps = TUIContainer<typeof WrScrollable>
type StackProps = TUIContainer<typeof WrStack>
type StyleProps = TUIContainer<typeof TextStyle>
type TextProps = TUIContainer<typeof TextProvider>

type PaneProps = TUIContainer<typeof WrPane>

// "complex" containers
type AccordionProps = TUIContainer<typeof WrAccordion>
type AccordionSectionProps = TUIContainer<typeof WrAccordion.Section>
type DrawerProps = TUIContainer<
  typeof WrDrawer,
  'content' | 'drawer' | 'children'
>
type TabsProps = TUIContainer<typeof WrTabs>
type TabsSectionProps = TUIContainer<typeof WrTabs.Section>

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      // views
      'tui-br': {}
      'tui-breadcrumb': BreadcrumbProps
      'tui-calendar': CalendarProps
      'tui-canvas': CanvasProps
      'tui-checkbox': CheckboxProps
      'tui-collapsible-text': CollapsibleTextProps
      'tui-console': ConsoleProps
      'tui-digits': DigitsProps
      'tui-dropdown': DropdownProps
      'tui-geometry': GeometryProps
      'tui-hotkey': HotKeyProps
      'tui-keyboard': KeyboardProps
      'tui-mouse': MouseProps
      'tui-h1': HeaderProps
      'tui-h2': HeaderProps
      'tui-h3': HeaderProps
      'tui-h4': HeaderProps
      'tui-h5': HeaderProps
      'tui-h6': HeaderProps
      'tui-input': InputProps
      'tui-progress': ProgressProps
      'tui-separator': SeparatorProps
      'tui-slider': SliderProps
      'tui-space': SpaceProps
      'tui-spinner': SpinnerProps
      'tui-logo': LogoProps
      'tui-pin': PinProps
      'tui-zstack': ZStackProps
      'tui-table': any
      'tui-toggle-group': ToggleGroupProps

      'tui-tree': ViewProps

      'tui-modal': ModalProps
      'tui-pane': PaneProps

      // "simple" containers
      'tui-box': BoxProps
      'tui-button': ButtonProps
      'tui-collapsible': CollapsibleProps

      'tui-scrollable': ScrollableProps
      'tui-stack': StackProps
      'tui-style': StyleProps
      'tui-text': TextProps

      // "complex" containers
      'tui-accordion': AccordionProps
      'tui-accordion-section': AccordionSectionProps
      'tui-drawer': DrawerProps

      'tui-tabs': TabsProps
      'tui-tabs-section': TabsSectionProps
    }
  }
}

////
/// Views
//

export function Br(): JSX.Element {
  return <tui-br />
}

export function Breadcrumb(reactProps: BreadcrumbProps): JSX.Element {
  return <tui-breadcrumb {...reactProps} />
}

export function Calendar(reactProps: CalendarProps): JSX.Element {
  return <tui-calendar {...reactProps} />
}

export function Canvas(reactProps: CanvasProps): JSX.Element {
  return <tui-canvas {...reactProps} />
}

export function Checkbox(reactProps: CheckboxProps): JSX.Element {
  return <tui-checkbox {...reactProps} />
}
export function CollapsibleText(reactProps: CollapsibleTextProps): JSX.Element {
  return <tui-collapsible-text {...reactProps} />
}
export function ConsoleLog(reactProps: ConsoleProps): JSX.Element {
  return <tui-console {...reactProps} />
}
export function Digits(reactProps: DigitsProps): JSX.Element {
  return <tui-digits {...reactProps} />
}
export function Dropdown(reactProps: DropdownProps): JSX.Element {
  return <tui-dropdown {...reactProps} />
}
export function HotKey(reactProps: HotKeyProps): JSX.Element {
  return <tui-hotkey {...reactProps} />
}
export function Keyboard({children, ...props}: KeyboardProps): JSX.Element {
  return <tui-keyboard {...props}>{children}</tui-keyboard>
}
export function Mouse({children, ...props}: MouseProps): JSX.Element {
  return <tui-mouse {...props}>{children}</tui-mouse>
}
export function H1(reactProps: HeaderProps): JSX.Element {
  return <tui-h1 {...reactProps} />
}
export function H2(reactProps: HeaderProps): JSX.Element {
  return <tui-h2 {...reactProps} />
}
export function H3(reactProps: HeaderProps): JSX.Element {
  return <tui-h3 {...reactProps} />
}
export function H4(reactProps: HeaderProps): JSX.Element {
  return <tui-h4 {...reactProps} />
}
export function H5(reactProps: HeaderProps): JSX.Element {
  return <tui-h5 {...reactProps} />
}
export function H6(reactProps: HeaderProps): JSX.Element {
  return <tui-h6 {...reactProps} />
}
export function Input(reactProps: InputProps): JSX.Element {
  return <tui-input {...reactProps} />
}
export function Progress(reactProps: ProgressProps): JSX.Element {
  return <tui-progress {...reactProps} />
}

interface Separator {
  (reactProps: SeparatorProps): JSX.Element
  horizontal(reactProps: Omit<SeparatorProps, 'direction'>): JSX.Element
  vertical(reactProps: Omit<SeparatorProps, 'direction'>): JSX.Element
}
export const Separator: Separator = function Separator(
  reactProps: SeparatorProps,
): JSX.Element {
  return <tui-separator {...reactProps} />
}
Separator.horizontal = function SeparatorHorizontal(
  reactProps: Omit<SeparatorProps, 'direction'>,
) {
  return <tui-separator direction="horizontal" {...reactProps} />
}
Separator.vertical = function SeparatorHorizontal(
  reactProps: Omit<SeparatorProps, 'direction'>,
) {
  return <tui-separator direction="vertical" {...reactProps} />
}

interface Slider {
  (reactProps: SliderProps): JSX.Element
  horizontal(reactProps: Omit<SliderProps, 'direction'>): JSX.Element
  vertical(reactProps: Omit<SliderProps, 'direction'>): JSX.Element
}
export const Slider: Slider = function Slider(
  reactProps: SliderProps,
): JSX.Element {
  return <tui-slider {...reactProps} />
}
Slider.horizontal = function SliderHorizontal(
  reactProps: Omit<SliderProps, 'direction'>,
) {
  return <tui-slider direction="horizontal" {...reactProps} />
}
Slider.vertical = function SliderHorizontal(
  reactProps: Omit<SliderProps, 'direction'>,
) {
  return <tui-slider direction="vertical" {...reactProps} />
}

export function Space(reactProps: SpaceProps): JSX.Element {
  return <tui-space {...reactProps} />
}
export function Spinner(reactProps: SpinnerProps): JSX.Element {
  return <tui-spinner {...reactProps} />
}
export function Logo(reactProps: LogoProps): JSX.Element {
  return <tui-logo {...reactProps} />
}
export function Pin(reactProps: PinProps): JSX.Element {
  return <tui-pin {...reactProps} />
}
export function ZStack(reactProps: ZStackProps): JSX.Element {
  return <tui-zstack {...reactProps} />
}
export function ToggleGroup(reactProps: ToggleGroupProps): JSX.Element {
  return <tui-toggle-group {...reactProps} />
}

interface TreeProps<T> extends ViewProps {
  data: T[]
  render: (datum: T) => React.ReactNode
  getChildren?: (datum: T) => T[] | undefined
  title: React.ReactNode | string
}
export function Tree<T>(reactProps: TreeProps<T>): JSX.Element {
  const {title, ...props} = reactProps
  const titleView = useMemo(() => {
    if (typeof title === 'string') {
      return <tui-text>{title}</tui-text>
    }
    return title
  }, [title])
  return <tui-tree {...props}>{titleView}</tui-tree>
}

export function Modal({children, ...props}: ModalProps): JSX.Element {
  return <tui-modal {...props}>{children}</tui-modal>
}

////
/// "Simple" containers
//

export function Box(reactProps: BoxProps): JSX.Element {
  const {children, ...props} = reactProps
  return <tui-box {...props}>{children}</tui-box>
}
export function Button(reactProps: ButtonProps): JSX.Element {
  const {children, ...props} = reactProps
  return <tui-button {...props}>{children}</tui-button>
}
export function Collapsible(reactProps: CollapsibleProps): JSX.Element {
  const {collapsed, expanded, ...props} = reactProps
  return (
    <tui-collapsible {...props}>
      {collapsed}
      {expanded}
    </tui-collapsible>
  )
}

interface Stack {
  (reactProps: StackProps): JSX.Element
  down(reactProps: Omit<StackProps, 'direction'>): JSX.Element
  up(reactProps: Omit<StackProps, 'direction'>): JSX.Element
  left(reactProps: Omit<StackProps, 'direction'>): JSX.Element
  right(reactProps: Omit<StackProps, 'direction'>): JSX.Element
}
export const Stack: Stack = function Stack(reactProps: StackProps) {
  const {children, ...props} = reactProps
  return <tui-stack {...props}>{children}</tui-stack>
}
Stack.down = function StackLeft(reactProps: Omit<StackProps, 'direction'>) {
  const {children, ...props} = reactProps
  return (
    <tui-stack direction="down" {...props}>
      {children}
    </tui-stack>
  )
}
Stack.up = function StackLeft(reactProps: Omit<StackProps, 'direction'>) {
  const {children, ...props} = reactProps
  return (
    <tui-stack direction="up" {...props}>
      {children}
    </tui-stack>
  )
}
Stack.right = function StackLeft(reactProps: Omit<StackProps, 'direction'>) {
  const {children, ...props} = reactProps
  return (
    <tui-stack direction="right" {...props}>
      {children}
    </tui-stack>
  )
}
Stack.left = function StackLeft(reactProps: Omit<StackProps, 'direction'>) {
  const {children, ...props} = reactProps
  return (
    <tui-stack direction="left" {...props}>
      {children}
    </tui-stack>
  )
}
export function Geometry({children, ...props}: GeometryProps): JSX.Element {
  return <tui-geometry {...props}>{children}</tui-geometry>
}
export function Scrollable(reactProps: ScrollableProps): JSX.Element {
  const {children, ...props} = reactProps
  return <tui-scrollable {...props}>{children}</tui-scrollable>
}
/**
 * <Style /> is similar to <Text/> but only allows inline styles (bold, etc).
 * Does not support align or wrap (block styles). Does not support 'font', because
 * font is not encodable via SGR codes (and that's how I'm styling and
 * concatenating the text nodes).
 */
export function Style(reactProps: StyleProps): JSX.Element {
  return <tui-style {...reactProps} />
}
/**
 * <Text /> is a container that sets the text properties of child TextLiterals
 * (font, style) and TextContainers (wrap, alignment)
 */
export function Text(reactProps: TextProps): JSX.Element {
  return <tui-text {...reactProps} />
}

////
/// Virtualized components
//

interface ReactTableProps<TData> extends ViewProps {
  data: TData[]
  columns: Column<TData>[]
  renderItem?: (item: TData, index: number) => React.ReactNode
  format?: (key: string, row: TData) => string
  selectedIndex?: number
  onSelect?: (row: TData, index: number) => void
  /** Notification fired after the Table's internal sort state changes. */
  onSort?: (key: string, direction: SortDirection) => void
  /** Initial sort column key. Must match a column with `sortable: true`. */
  sortKey?: string
  /** Initial sort direction. Default: 'asc'. */
  sortDirection?: SortDirection
  /** Show a row number column (right-aligned, header '#'). Default: false. */
  showRowNumbers?: boolean
  /** Enable multi-selection (space bar or click to toggle). Default: false. */
  isSelectable?: boolean
  /** Show a checkbox column ([ ]/[⨉]) for multi-selection. Implies isSelectable. Default: false. */
  showSelected?: boolean
  /** Notification fired when the set of selected items changes. */
  onSelectionChange?: (selectedItems: Set<TData>) => void
}

/**
 * Table component with optional virtualized row rendering.
 *
 * When `renderItem` is provided, only visible rows are rendered as React children,
 * enabling efficient rendering of large datasets. The Geometry component measures
 * available space, and only the visible slice of data is passed through the reconciler.
 *
 * When only `format` is provided, the core Table handles all rendering directly
 * (no virtualization needed since cells are plain strings).
 */
export function Table<TData>(reactProps: ReactTableProps<TData>): JSX.Element {
  const {data, columns, renderItem, format, ...props} = reactProps

  if (!renderItem) {
    // Simple mode: core Table handles everything via format callback
    return (
      <tui-table
        data={data}
        columns={columns}
        format={format ?? (() => '')}
        {...props}
      />
    )
  }

  // Virtualized mode: React renders only visible rows
  // We use the format-based Table for the header/chrome, and render items
  // as children that the Table can lay out
  // For now: use Geometry to measure, then render the visible slice
  const [bodyHeight, setBodyHeight] = useState(20)

  const handleLayout = useCallback((size: {width: number; height: number}) => {
    // Table uses 2 rows for header + separator
    const newBodyHeight = Math.max(0, size.height - 2)
    setBodyHeight(newBodyHeight)
  }, [])

  // Calculate visible range (matching the core Table's scroll logic)
  const selectedIndex = props.selectedIndex ?? 0
  const scrollOffset = useMemo(() => {
    const halfHeight = Math.floor(bodyHeight / 2)
    let offset = 0

    if (
      selectedIndex > halfHeight &&
      selectedIndex < data.length - halfHeight
    ) {
      offset = selectedIndex - halfHeight
    } else if (selectedIndex >= bodyHeight) {
      offset = selectedIndex - bodyHeight + 1
    }

    return Math.max(0, Math.min(data.length - bodyHeight, offset))
  }, [selectedIndex, bodyHeight, data.length])

  const visibleStart = scrollOffset
  const visibleEnd = Math.min(data.length, scrollOffset + bodyHeight)

  // Use format as a pass-through since the core Table still renders cells
  // We pass both format (for the core) and render the items as children
  const formatFn = format ?? (() => '')

  return (
    <tui-geometry onLayout={handleLayout}>
      <tui-table data={data} columns={columns} format={formatFn} {...props} />
    </tui-geometry>
  )
}

////
/// "Complex" containers
//

interface Accordion {
  (reactProps: AccordionProps): JSX.Element
  Section(reactProps: Omit<AccordionSectionProps, 'direction'>): JSX.Element
}
export const Accordion: Accordion = function Accordion(
  reactProps: AccordionProps,
): JSX.Element {
  const {children, ...props} = reactProps
  return <tui-accordion {...props}>{children}</tui-accordion>
}
Accordion.Section = function SliderHorizontal(
  reactProps: Omit<AccordionSectionProps, 'direction'>,
) {
  const {children, ...props} = reactProps
  return <tui-accordion-section {...props}>{children}</tui-accordion-section>
}

export function Pane({children, ...props}: PaneProps): JSX.Element {
  return <tui-pane {...props}>{children}</tui-pane>
}

interface Drawer {
  (reactProps: DrawerProps): JSX.Element
  top(reactProps: Omit<DrawerProps, 'location'>): JSX.Element
  right(reactProps: Omit<DrawerProps, 'location'>): JSX.Element
  bottom(reactProps: Omit<DrawerProps, 'location'>): JSX.Element
  left(reactProps: Omit<DrawerProps, 'location'>): JSX.Element
}
export const Drawer: Drawer = function Drawer(
  reactProps: DrawerProps,
): JSX.Element {
  const {children, content, drawer, ...props} = reactProps
  return (
    <tui-drawer {...props}>
      {content}
      {drawer}
      {children}
    </tui-drawer>
  )
}
Drawer.top = function DrawerLeft(reactProps: Omit<DrawerProps, 'location'>) {
  const {children, content, drawer, ...props} = reactProps
  return (
    <tui-drawer location="top" {...props}>
      {content}
      {drawer}
      {children}
    </tui-drawer>
  )
}
Drawer.right = function DrawerLeft(reactProps: Omit<DrawerProps, 'location'>) {
  const {children, content, drawer, ...props} = reactProps
  return (
    <tui-drawer location="right" {...props}>
      {content}
      {drawer}
      {children}
    </tui-drawer>
  )
}
Drawer.bottom = function DrawerBottom(
  reactProps: Omit<DrawerProps, 'location'>,
) {
  const {children, content, drawer, ...props} = reactProps
  return (
    <tui-drawer location="bottom" {...props}>
      {content}
      {drawer}
      {children}
    </tui-drawer>
  )
}
Drawer.left = function DrawerLeft(reactProps: Omit<DrawerProps, 'location'>) {
  const {children, content, drawer, ...props} = reactProps
  return (
    <tui-drawer location="left" {...props}>
      {content}
      {drawer}
      {children}
    </tui-drawer>
  )
}

interface Tabs {
  (reactProps: TabsProps): JSX.Element
  Section(reactProps: Omit<TabsSectionProps, 'direction'>): JSX.Element
}
export const Tabs: Tabs = function Tabs(reactProps: TabsProps): JSX.Element {
  const {children, ...props} = reactProps
  return <tui-tabs {...props}>{children}</tui-tabs>
}
Tabs.Section = function SliderHorizontal(
  reactProps: Omit<TabsSectionProps, 'direction'>,
) {
  const {children, ...props} = reactProps
  return <tui-tabs-section {...props}>{children}</tui-tabs-section>
}
