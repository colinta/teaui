import React, {forwardRef, useCallback, useMemo, useState} from 'react'
import type {
  Accordion as WrAccordion,
  Alert as WrAlert,
  Box as WrBox,
  Breadcrumb as WrBreadcrumb,
  Button as WrButton,
  Callout as WrCallout,
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
  Legend as WrLegend,
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
  Page as WrPage,
  Tabs as WrTabs,
  ToggleGroup as WrToggleGroup,
  Logo as WrLogo,
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

type WithRef<Props, T> = Props & {ref?: React.Ref<T>}

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
type HeaderProps = {text?: string; children?: string}
type HotKeyProps = TUIView<typeof WrHotKey>
type KeyboardProps = TUIContainer<typeof WrKeyboard>
type MouseProps = TUIContainer<typeof WrMouse>
type InputProps = TUIView<typeof WrInput>
type LegendProps = TUIView<typeof WrLegend>
type ProgressProps = TUIView<typeof WrProgress>
type SeparatorProps = TUIView<typeof WrSeparator>
type SliderProps = TUIView<typeof WrSlider>
type SpaceProps = TUIView<typeof WrSpace>
type SpinnerProps = TUIView<typeof WrSpinner>
type LogoProps = TUIView<typeof WrLogo>
type ZStackProps = TUIContainer<typeof WrZStack>
type ToggleGroupProps = TUIView<typeof WrToggleGroup>

// Table uses its own prop types since it's generic and TUIView doesn't work well with generics

type AlertProps = TUIContainer<typeof WrAlert>
type CalloutProps = TUIContainer<typeof WrCallout>
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
type PageProps = TUIContainer<typeof WrPage>
type PageSectionProps = TUIContainer<typeof WrPage.Section>
type TabsProps = TUIContainer<typeof WrTabs>
type TabsSectionProps = TUIContainer<typeof WrTabs.Section>

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      // views
      'tui-br': {}
      'tui-breadcrumb': WithRef<BreadcrumbProps, WrBreadcrumb>
      'tui-calendar': WithRef<CalendarProps, WrCalendar>
      'tui-canvas': WithRef<CanvasProps, WrCanvas>
      'tui-checkbox': WithRef<CheckboxProps, WrCheckbox>
      'tui-collapsible-text': WithRef<CollapsibleTextProps, WrCollapsibleText>
      'tui-console': WithRef<ConsoleProps, WrConsoleLog>
      'tui-digits': WithRef<DigitsProps, WrDigits>
      'tui-dropdown': WithRef<DropdownProps, WrDropdown<any, any>>
      'tui-geometry': WithRef<GeometryProps, WrGeometry>
      'tui-hotkey': WithRef<HotKeyProps, WrHotKey>
      'tui-keyboard': WithRef<KeyboardProps, WrKeyboard>
      'tui-mouse': WithRef<MouseProps, WrMouse>
      'tui-h1': WithRef<HeaderProps, WrHeader>
      'tui-h2': WithRef<HeaderProps, WrHeader>
      'tui-h3': WithRef<HeaderProps, WrHeader>
      'tui-h4': WithRef<HeaderProps, WrHeader>
      'tui-h5': WithRef<HeaderProps, WrHeader>
      'tui-h6': WithRef<HeaderProps, WrHeader>
      'tui-input': WithRef<InputProps, WrInput>
      'tui-legend': WithRef<LegendProps, WrLegend>
      'tui-progress': WithRef<ProgressProps, WrProgress>
      'tui-separator': WithRef<SeparatorProps, WrSeparator>
      'tui-slider': WithRef<SliderProps, WrSlider>
      'tui-space': WithRef<SpaceProps, WrSpace>
      'tui-spinner': WithRef<SpinnerProps, WrSpinner>
      'tui-logo': WithRef<LogoProps, WrLogo>
      'tui-zstack': WithRef<ZStackProps, WrZStack>
      'tui-table': any
      'tui-toggle-group': WithRef<ToggleGroupProps, WrToggleGroup>

      'tui-tree': WithRef<ViewProps, WrTree<any>>

      'tui-modal': WithRef<ModalProps, WrModal>
      'tui-pane': WithRef<PaneProps, WrPane>

      // "simple" containers
      'tui-alert': WithRef<AlertProps, WrAlert>
      'tui-box': WithRef<BoxProps, WrBox>
      'tui-callout': WithRef<CalloutProps, WrCallout>
      'tui-button': WithRef<ButtonProps, WrButton>
      'tui-collapsible': WithRef<CollapsibleProps, WrCollapsible>

      'tui-scrollable': WithRef<ScrollableProps, WrScrollable>
      'tui-stack': WithRef<StackProps, WrStack>
      'tui-style': WithRef<StyleProps, TextStyle>
      'tui-text': WithRef<TextProps, TextProvider>

      // "complex" containers
      'tui-accordion': WithRef<AccordionProps, WrAccordion>
      'tui-accordion-section': WithRef<
        AccordionSectionProps,
        InstanceType<typeof WrAccordion.Section>
      >
      'tui-drawer': WithRef<DrawerProps, WrDrawer>

      'tui-page': WithRef<PageProps, WrPage>
      'tui-page-section': WithRef<
        PageSectionProps,
        InstanceType<typeof WrPage.Section>
      >
      'tui-tabs': WithRef<TabsProps, WrTabs>
      'tui-tabs-section': WithRef<
        TabsSectionProps,
        InstanceType<typeof WrTabs.Section>
      >
    }
  }
}

////
/// Views
//

export function Br(): JSX.Element {
  return <tui-br />
}

export const Breadcrumb = forwardRef<WrBreadcrumb, BreadcrumbProps>(
  function Breadcrumb(reactProps, ref): JSX.Element {
    return <tui-breadcrumb ref={ref} {...reactProps} />
  },
)

export const Calendar = forwardRef<WrCalendar, CalendarProps>(
  function Calendar(reactProps, ref): JSX.Element {
    return <tui-calendar ref={ref} {...reactProps} />
  },
)

export const Canvas = forwardRef<WrCanvas, CanvasProps>(
  function Canvas(reactProps, ref): JSX.Element {
    return <tui-canvas ref={ref} {...reactProps} />
  },
)

export const Checkbox = forwardRef<WrCheckbox, CheckboxProps>(
  function Checkbox(reactProps, ref): JSX.Element {
    return <tui-checkbox ref={ref} {...reactProps} />
  },
)
export const CollapsibleText = forwardRef<
  WrCollapsibleText,
  CollapsibleTextProps
>(function CollapsibleText(reactProps, ref): JSX.Element {
  return <tui-collapsible-text ref={ref} {...reactProps} />
})
export const ConsoleLog = forwardRef<WrConsoleLog, ConsoleProps>(
  function ConsoleLog(reactProps, ref): JSX.Element {
    return <tui-console ref={ref} {...reactProps} />
  },
)
export const Digits = forwardRef<WrDigits, DigitsProps>(
  function Digits(reactProps, ref): JSX.Element {
    return <tui-digits ref={ref} {...reactProps} />
  },
)
export const Dropdown = forwardRef<WrDropdown<any, any>, DropdownProps>(
  function Dropdown(reactProps, ref): JSX.Element {
    return <tui-dropdown ref={ref} {...reactProps} />
  },
)
export const HotKey = forwardRef<WrHotKey, HotKeyProps>(
  function HotKey(reactProps, ref): JSX.Element {
    return <tui-hotkey ref={ref} {...reactProps} />
  },
)
export const Keyboard = forwardRef<WrKeyboard, KeyboardProps>(function Keyboard(
  {children, ...props},
  ref,
): JSX.Element {
  return (
    <tui-keyboard ref={ref} {...props}>
      {children}
    </tui-keyboard>
  )
})
export const Mouse = forwardRef<WrMouse, MouseProps>(function Mouse(
  {children, ...props},
  ref,
): JSX.Element {
  return (
    <tui-mouse ref={ref} {...props}>
      {children}
    </tui-mouse>
  )
})
export const H1 = forwardRef<WrHeader, HeaderProps>(function H1(
  {children, ...reactProps},
  ref,
): JSX.Element {
  return <tui-h1 ref={ref} text={children ?? reactProps.text} {...reactProps} />
})
export const H2 = forwardRef<WrHeader, HeaderProps>(function H2(
  {children, ...reactProps},
  ref,
): JSX.Element {
  return <tui-h2 ref={ref} text={children ?? reactProps.text} {...reactProps} />
})
export const H3 = forwardRef<WrHeader, HeaderProps>(function H3(
  {children, ...reactProps},
  ref,
): JSX.Element {
  return <tui-h3 ref={ref} text={children ?? reactProps.text} {...reactProps} />
})
export const H4 = forwardRef<WrHeader, HeaderProps>(function H4(
  {children, ...reactProps},
  ref,
): JSX.Element {
  return <tui-h4 ref={ref} text={children ?? reactProps.text} {...reactProps} />
})
export const H5 = forwardRef<WrHeader, HeaderProps>(function H5(
  {children, ...reactProps},
  ref,
): JSX.Element {
  return <tui-h5 ref={ref} text={children ?? reactProps.text} {...reactProps} />
})
export const H6 = forwardRef<WrHeader, HeaderProps>(function H6(
  {children, ...reactProps},
  ref,
): JSX.Element {
  return <tui-h6 ref={ref} text={children ?? reactProps.text} {...reactProps} />
})
export const Input = forwardRef<WrInput, InputProps>(
  function Input(reactProps, ref): JSX.Element {
    return <tui-input ref={ref} {...reactProps} />
  },
)
export const Legend = forwardRef<WrLegend, LegendProps>(
  function Legend(reactProps, ref): JSX.Element {
    return <tui-legend ref={ref} {...reactProps} />
  },
)
export const Progress = forwardRef<WrProgress, ProgressProps>(
  function Progress(reactProps, ref): JSX.Element {
    return <tui-progress ref={ref} {...reactProps} />
  },
)

type SeparatorDirectionProps = Omit<SeparatorProps, 'direction'>
interface Separator {
  (reactProps: SeparatorProps): JSX.Element
  horizontal: React.ForwardRefExoticComponent<
    SeparatorDirectionProps & React.RefAttributes<WrSeparator>
  >
  vertical: React.ForwardRefExoticComponent<
    SeparatorDirectionProps & React.RefAttributes<WrSeparator>
  >
}
export const Separator: Separator = forwardRef<WrSeparator, SeparatorProps>(
  function Separator(reactProps, ref): JSX.Element {
    return <tui-separator ref={ref} {...reactProps} />
  },
) as unknown as Separator
Separator.horizontal = forwardRef<WrSeparator, SeparatorDirectionProps>(
  function SeparatorHorizontal(reactProps, ref) {
    return <tui-separator ref={ref} direction="horizontal" {...reactProps} />
  },
)
Separator.vertical = forwardRef<WrSeparator, SeparatorDirectionProps>(
  function SeparatorVertical(reactProps, ref) {
    return <tui-separator ref={ref} direction="vertical" {...reactProps} />
  },
)

type SliderDirectionProps = Omit<SliderProps, 'direction'>
interface Slider {
  (reactProps: SliderProps): JSX.Element
  horizontal: React.ForwardRefExoticComponent<
    SliderDirectionProps & React.RefAttributes<WrSlider>
  >
  vertical: React.ForwardRefExoticComponent<
    SliderDirectionProps & React.RefAttributes<WrSlider>
  >
}
export const Slider: Slider = forwardRef<WrSlider, SliderProps>(
  function Slider(reactProps, ref): JSX.Element {
    return <tui-slider ref={ref} {...reactProps} />
  },
) as unknown as Slider
Slider.horizontal = forwardRef<WrSlider, SliderDirectionProps>(
  function SliderHorizontal(reactProps, ref) {
    return <tui-slider ref={ref} direction="horizontal" {...reactProps} />
  },
)
Slider.vertical = forwardRef<WrSlider, SliderDirectionProps>(
  function SliderVertical(reactProps, ref) {
    return <tui-slider ref={ref} direction="vertical" {...reactProps} />
  },
)

export const Space = forwardRef<WrSpace, SpaceProps>(
  function Space(reactProps, ref): JSX.Element {
    return <tui-space ref={ref} {...reactProps} />
  },
)
export const Spinner = forwardRef<WrSpinner, SpinnerProps>(
  function Spinner(reactProps, ref): JSX.Element {
    return <tui-spinner ref={ref} {...reactProps} />
  },
)
export const Logo = forwardRef<WrLogo, LogoProps>(
  function Logo(reactProps, ref): JSX.Element {
    return <tui-logo ref={ref} {...reactProps} />
  },
)
export const ZStack = forwardRef<WrZStack, ZStackProps>(
  function ZStack(reactProps, ref): JSX.Element {
    return <tui-zstack ref={ref} {...reactProps} />
  },
)
export const ToggleGroup = forwardRef<WrToggleGroup, ToggleGroupProps>(
  function ToggleGroup(reactProps, ref): JSX.Element {
    return <tui-toggle-group ref={ref} {...reactProps} />
  },
)

interface TreeProps<T> extends ViewProps {
  data: T[]
  render: (datum: T) => React.ReactNode
  getChildren?: (datum: T) => T[] | undefined
  title: React.ReactNode | string
}

interface AncestorInfo {
  isLast: boolean
}

function TreeItems<T>({
  items,
  render,
  getChildren,
  expanded,
  toggle,
  prefix,
  ancestors,
}: {
  items: T[]
  render: (datum: T) => React.ReactNode
  getChildren?: (datum: T) => T[] | undefined
  expanded: Set<string>
  toggle: (path: string) => void
  prefix: string
  ancestors: AncestorInfo[]
}): JSX.Element {
  return (
    <>
      {items.map((item, index) => {
        const path = `${prefix}.${index}`
        const children = getChildren?.(item)
        const hasChildren = children != null && children.length > 0
        const isExpanded = expanded.has(path)
        const isLast = index === items.length - 1

        let line = ''
        for (const ancestor of ancestors) {
          line += ancestor.isLast ? '    ' : TREE_VLINE
        }

        if (hasChildren) {
          line += isLast ? TREE_LAST_BRANCH : TREE_BRANCH
          line += isExpanded ? TREE_EXPANDED : TREE_COLLAPSED
        } else {
          line += isLast ? TREE_LAST_LEAF : TREE_LEAF
        }

        return (
          <React.Fragment key={path}>
            <tui-stack direction="right">
              <tui-text>{line}</tui-text>
              {render(item)}
            </tui-stack>
            {isExpanded && hasChildren && children && (
              <TreeItems
                items={children}
                render={render}
                getChildren={getChildren}
                expanded={expanded}
                toggle={toggle}
                prefix={path}
                ancestors={[...ancestors, {isLast}]}
              />
            )}
          </React.Fragment>
        )
      })}
    </>
  )
}

const TREE_VLINE = '│   '
const TREE_BRANCH = '├'
const TREE_LAST_BRANCH = '└'
const TREE_LEAF = '├──╴'
const TREE_LAST_LEAF = '└──╴'
const TREE_COLLAPSED = '─╴▹'
const TREE_EXPANDED = '─╴▿'

export function Tree<T>(reactProps: TreeProps<T>): JSX.Element {
  const {title, data, render, getChildren, ...viewProps} = reactProps
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggle = useCallback((path: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }, [])

  return (
    <tui-stack direction="down" {...viewProps}>
      {typeof title === 'string' ? <tui-text>{title}</tui-text> : title}
      <TreeItems
        items={data}
        render={render}
        getChildren={getChildren}
        expanded={expanded}
        toggle={toggle}
        prefix=""
        ancestors={[]}
      />
    </tui-stack>
  )
}

export const Modal = forwardRef<WrModal, ModalProps>(function Modal(
  {children, ...props},
  ref,
): JSX.Element {
  return (
    <tui-modal ref={ref} {...props}>
      {children}
    </tui-modal>
  )
})

////
/// "Simple" containers
//

export function Alert({
  children,
  ...props
}: AlertProps & {children?: React.ReactNode}): JSX.Element {
  return <tui-alert {...props}>{children}</tui-alert>
}

export const Callout = forwardRef<WrCallout, CalloutProps>(function Callout(
  {children, ...props},
  ref,
): JSX.Element {
  return (
    <tui-callout ref={ref} {...props}>
      {children}
    </tui-callout>
  )
})

export const Box = forwardRef<WrBox, BoxProps>(function Box(
  {children, ...props},
  ref,
): JSX.Element {
  return (
    <tui-box ref={ref} {...props}>
      {children}
    </tui-box>
  )
})
export const Button = forwardRef<WrButton, ButtonProps>(function Button(
  {children, ...props},
  ref,
): JSX.Element {
  return (
    <tui-button ref={ref} {...props}>
      {children}
    </tui-button>
  )
})
export const Collapsible = forwardRef<WrCollapsible, CollapsibleProps>(
  function Collapsible({collapsed, expanded, ...props}, ref): JSX.Element {
    return (
      <tui-collapsible ref={ref} {...props}>
        {collapsed}
        {expanded}
      </tui-collapsible>
    )
  },
)

type StackDirectionProps = Omit<StackProps, 'direction'>
type StackDirectionComponent = React.ForwardRefExoticComponent<
  StackDirectionProps & React.RefAttributes<WrStack>
>
interface Stack {
  (reactProps: StackProps): JSX.Element
  down: StackDirectionComponent
  up: StackDirectionComponent
  left: StackDirectionComponent
  right: StackDirectionComponent
}
export const Stack: Stack = forwardRef<WrStack, StackProps>(function Stack(
  {children, ...props},
  ref,
) {
  return (
    <tui-stack ref={ref} {...props}>
      {children}
    </tui-stack>
  )
}) as unknown as Stack
Stack.down = forwardRef<WrStack, StackDirectionProps>(function StackDown(
  {children, ...props},
  ref,
) {
  return (
    <tui-stack ref={ref} direction="down" {...props}>
      {children}
    </tui-stack>
  )
})
Stack.up = forwardRef<WrStack, StackDirectionProps>(function StackUp(
  {children, ...props},
  ref,
) {
  return (
    <tui-stack ref={ref} direction="up" {...props}>
      {children}
    </tui-stack>
  )
})
Stack.right = forwardRef<WrStack, StackDirectionProps>(function StackRight(
  {children, ...props},
  ref,
) {
  return (
    <tui-stack ref={ref} direction="right" {...props}>
      {children}
    </tui-stack>
  )
})
Stack.left = forwardRef<WrStack, StackDirectionProps>(function StackLeft(
  {children, ...props},
  ref,
) {
  return (
    <tui-stack ref={ref} direction="left" {...props}>
      {children}
    </tui-stack>
  )
})
export const Geometry = forwardRef<WrGeometry, GeometryProps>(function Geometry(
  {children, ...props},
  ref,
): JSX.Element {
  return (
    <tui-geometry ref={ref} {...props}>
      {children}
    </tui-geometry>
  )
})
type ScrollableDirectionProps = Omit<ScrollableProps, 'direction'>
type ScrollableDirectionComponent = React.ForwardRefExoticComponent<
  ScrollableDirectionProps & React.RefAttributes<WrScrollable>
>
interface Scrollable {
  (reactProps: ScrollableProps): JSX.Element
  down: ScrollableDirectionComponent
  up: ScrollableDirectionComponent
  left: ScrollableDirectionComponent
  right: ScrollableDirectionComponent
}
export const Scrollable: Scrollable = forwardRef<WrScrollable, ScrollableProps>(
  function Scrollable({children, ...props}, ref): JSX.Element {
    return (
      <tui-scrollable ref={ref} {...props}>
        {children}
      </tui-scrollable>
    )
  },
) as unknown as Scrollable
Scrollable.down = forwardRef<WrScrollable, ScrollableDirectionProps>(
  function ScrollableDown({children, ...props}, ref) {
    return (
      <tui-scrollable ref={ref} direction="down" {...props}>
        {children}
      </tui-scrollable>
    )
  },
)
Scrollable.up = forwardRef<WrScrollable, ScrollableDirectionProps>(
  function ScrollableUp({children, ...props}, ref) {
    return (
      <tui-scrollable ref={ref} direction="up" {...props}>
        {children}
      </tui-scrollable>
    )
  },
)
Scrollable.right = forwardRef<WrScrollable, ScrollableDirectionProps>(
  function ScrollableRight({children, ...props}, ref) {
    return (
      <tui-scrollable ref={ref} direction="right" {...props}>
        {children}
      </tui-scrollable>
    )
  },
)
Scrollable.left = forwardRef<WrScrollable, ScrollableDirectionProps>(
  function ScrollableLeft({children, ...props}, ref) {
    return (
      <tui-scrollable ref={ref} direction="left" {...props}>
        {children}
      </tui-scrollable>
    )
  },
)
/**
 * <Style /> is similar to <Text/> but only allows inline styles (bold, etc).
 * Does not support align or wrap (block styles). Does not support 'font', because
 * font is not encodable via SGR codes (and that's how I'm styling and
 * concatenating the text nodes).
 */
export const Style = forwardRef<TextStyle, StyleProps>(
  function Style(reactProps, ref): JSX.Element {
    return <tui-style ref={ref} {...reactProps} />
  },
)
/**
 * <Text /> is a container that sets the text properties of child TextLiterals
 * (font, style) and TextContainers (wrap, alignment)
 */
export const Text = forwardRef<TextProvider, TextProps>(
  function Text(reactProps, ref): JSX.Element {
    return <tui-text ref={ref} {...reactProps} />
  },
)

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
  Section: React.ForwardRefExoticComponent<
    Omit<AccordionSectionProps, 'direction'> &
      React.RefAttributes<InstanceType<typeof WrAccordion.Section>>
  >
}
export const Accordion: Accordion = forwardRef<WrAccordion, AccordionProps>(
  function Accordion({children, ...props}, ref): JSX.Element {
    return (
      <tui-accordion ref={ref} {...props}>
        {children}
      </tui-accordion>
    )
  },
) as unknown as Accordion
Accordion.Section = forwardRef<
  InstanceType<typeof WrAccordion.Section>,
  Omit<AccordionSectionProps, 'direction'>
>(function AccordionSection({children, ...props}, ref) {
  return (
    <tui-accordion-section ref={ref} {...props}>
      {children}
    </tui-accordion-section>
  )
})

interface Page {
  (reactProps: PageProps): JSX.Element
  Section: React.ForwardRefExoticComponent<
    PageSectionProps & React.RefAttributes<InstanceType<typeof WrPage.Section>>
  >
}
export const Page: Page = forwardRef<WrPage, PageProps>(function Page(
  {children, ...props},
  ref,
): JSX.Element {
  return (
    <tui-page ref={ref} {...props}>
      {children}
    </tui-page>
  )
}) as unknown as Page
Page.Section = forwardRef<
  InstanceType<typeof WrPage.Section>,
  PageSectionProps
>(function PageSection({children, ...props}, ref) {
  return (
    <tui-page-section ref={ref} {...props}>
      {children}
    </tui-page-section>
  )
})

export const Pane = forwardRef<WrPane, PaneProps>(function Pane(
  {children, ...props},
  ref,
): JSX.Element {
  return (
    <tui-pane ref={ref} {...props}>
      {children}
    </tui-pane>
  )
})

type DrawerLocationProps = Omit<DrawerProps, 'location'>
type DrawerLocationComponent = React.ForwardRefExoticComponent<
  DrawerLocationProps & React.RefAttributes<WrDrawer>
>
interface Drawer {
  (reactProps: DrawerProps): JSX.Element
  top: DrawerLocationComponent
  right: DrawerLocationComponent
  bottom: DrawerLocationComponent
  left: DrawerLocationComponent
}
export const Drawer: Drawer = forwardRef<WrDrawer, DrawerProps>(function Drawer(
  {children, content, drawer, ...props},
  ref,
): JSX.Element {
  return (
    <tui-drawer ref={ref} {...props}>
      {content}
      {drawer}
      {children}
    </tui-drawer>
  )
}) as unknown as Drawer
Drawer.top = forwardRef<WrDrawer, DrawerLocationProps>(function DrawerTop(
  {children, content, drawer, ...props},
  ref,
) {
  return (
    <tui-drawer ref={ref} location="top" {...props}>
      {content}
      {drawer}
      {children}
    </tui-drawer>
  )
})
Drawer.right = forwardRef<WrDrawer, DrawerLocationProps>(function DrawerRight(
  {children, content, drawer, ...props},
  ref,
) {
  return (
    <tui-drawer ref={ref} location="right" {...props}>
      {content}
      {drawer}
      {children}
    </tui-drawer>
  )
})
Drawer.bottom = forwardRef<WrDrawer, DrawerLocationProps>(function DrawerBottom(
  {children, content, drawer, ...props},
  ref,
) {
  return (
    <tui-drawer ref={ref} location="bottom" {...props}>
      {content}
      {drawer}
      {children}
    </tui-drawer>
  )
})
Drawer.left = forwardRef<WrDrawer, DrawerLocationProps>(function DrawerLeft(
  {children, content, drawer, ...props},
  ref,
) {
  return (
    <tui-drawer ref={ref} location="left" {...props}>
      {content}
      {drawer}
      {children}
    </tui-drawer>
  )
})

interface Tabs {
  (reactProps: TabsProps): JSX.Element
  Section: React.ForwardRefExoticComponent<
    Omit<TabsSectionProps, 'direction'> &
      React.RefAttributes<InstanceType<typeof WrTabs.Section>>
  >
}
export const Tabs: Tabs = forwardRef<WrTabs, TabsProps>(function Tabs(
  {children, ...props},
  ref,
): JSX.Element {
  return (
    <tui-tabs ref={ref} {...props}>
      {children}
    </tui-tabs>
  )
}) as unknown as Tabs
Tabs.Section = forwardRef<
  InstanceType<typeof WrTabs.Section>,
  Omit<TabsSectionProps, 'direction'>
>(function TabsSection({children, ...props}, ref) {
  return (
    <tui-tabs-section ref={ref} {...props}>
      {children}
    </tui-tabs-section>
  )
})
