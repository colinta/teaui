import {h, render as preactRender, options} from 'preact'
import type {ComponentChildren} from 'preact'
import {
  Accordion as WrAccordion,
  Box as WrBox,
  Button as WrButton,
  Checkbox as WrCheckbox,
  Collapsible as WrCollapsible,
  CollapsibleText as WrCollapsibleText,
  ConsoleLog as WrConsoleLog,
  Container,
  Digits as WrDigits,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Drawer as WrDrawer,
  Progress as WrProgress,
  Spinner as WrSpinner,
  ToggleGroup as WrToggleGroup,
  Input as WrInput,
  Screen,
  type ScreenOptions,
  Scrollable as WrScrollable,
  Separator as WrSeparator,
  Slider as WrSlider,
  Space as WrSpace,
  Spinner as WrSpinner,
  Stack as WrStack,
  Tabs as WrTabs,
  View,
  ViewProps,
  Window as WrWindow,
} from '@teaui/core'
import {
  TextContainer,
  TextLiteral,
  TextProvider,
  TextStyle,
} from './components/TextReact.js'
import type {
  CheckboxProps,
  CollapsibleTextProps,
  ConsoleProps,
  DigitsProps,
  HeaderProps,
  InputProps,
  ProgressProps,
  SeparatorProps,
  SliderProps,
  SpaceProps,
  SpinnerProps,
  ToggleGroupProps,
  BoxProps,
  ButtonProps,
  CollapsibleProps,
  ScrollableProps,
  StackProps,
  StyleProps,
  TextProps,
  AccordionProps,
  AccordionSectionProps,
  DrawerProps,
  TabsProps,
  TabsSectionProps,
} from './components.js'

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      // views
      'tui-br': {}
      'tui-checkbox': CheckboxProps
      'tui-collapsible-text': CollapsibleTextProps
      'tui-console': ConsoleProps
      'tui-digits': DigitsProps
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
      'tui-toggle-group': ToggleGroupProps

      'tui-tree': ViewProps

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

function createView(type: string, props: Props): any {
  // Strip children/child from props before passing to constructors
  const {children, child, ...viewProps} = props as any

  switch (type) {
    case 'text':
      return new TextLiteral(String(viewProps.text) ?? '')
    case 'br':
    case 'tui-br':
      return new TextLiteral('\n')
    case 'checkbox':
    case 'tui-checkbox':
      return new WrCheckbox(viewProps as any)
    case 'collapsible-text':
    case 'tui-collapsible-text':
      return new WrCollapsibleText(viewProps as any)
    case 'console':
    case 'tui-console':
      return new WrConsoleLog(viewProps as any)
    case 'digits':
    case 'tui-digits':
      return new WrDigits(viewProps as any)
    case 'h1':
    case 'tui-h1':
      return H1(((viewProps as any).text as string) ?? '')
    case 'h2':
    case 'tui-h2':
      return H2(((viewProps as any).text as string) ?? '')
    case 'h3':
    case 'tui-h3':
      return H3(((viewProps as any).text as string) ?? '')
    case 'h4':
    case 'tui-h4':
      return H4(((viewProps as any).text as string) ?? '')
    case 'h5':
    case 'tui-h5':
      return H5(((viewProps as any).text as string) ?? '')
    case 'h6':
    case 'tui-h6':
      return H6(((viewProps as any).text as string) ?? '')
    case 'progress':
    case 'tui-progress':
      return new WrProgress(viewProps as any)
    case 'spinner':
    case 'tui-spinner':
      return new WrSpinner(viewProps as any)
    case 'toggle-group':
    case 'tui-toggle-group':
      return new WrToggleGroup(viewProps as any)
    case 'input':
    case 'tui-input':
      return new WrInput(viewProps as any)
    case 'literal':
    case 'tui-literal':
      return new TextLiteral(viewProps.text ?? '')
    case 'separator':
    case 'tui-separator':
      return new WrSeparator(viewProps as any)
    case 'slider':
    case 'tui-slider':
      return new WrSlider(viewProps as any)
    case 'space':
    case 'tui-space':
      return new WrSpace(viewProps as any)
    case 'spinner':
    case 'tui-spinner':
      return new WrSpinner(viewProps as any)
    // case 'Tree':
    //   return
    case 'box':
    case 'tui-box':
      return new WrBox(viewProps as any)
    case 'button':
    case 'tui-button':
      return new WrButton(viewProps as any)
    case 'collapsible':
    case 'tui-collapsible':
      return new WrCollapsible(viewProps as any)
    case 'scrollable':
    case 'tui-scrollable':
      return new WrScrollable(viewProps as any)
    case 'stack':
    case 'tui-stack':
      return new WrStack(viewProps as any)
    case 'style':
    case 'tui-style':
      return new TextStyle(viewProps as any)
    case 'tui-text':
      return new TextProvider(viewProps as any)
    case 'accordion':
    case 'tui-accordion':
      return new WrAccordion(viewProps as any)
    case 'accordion-section':
    case 'tui-accordion-section':
      return new WrAccordion.Section(viewProps as any)
    case 'drawer':
    case 'tui-drawer':
      return new WrDrawer(viewProps as any)
    case 'tabs':
    case 'tui-tabs':
      return new WrTabs(viewProps as any)
    case 'tabs-section':
    case 'tui-tabs-section':
      return new WrTabs.Section(viewProps as any)
    case 'tui-window':
      return new WrWindow()
    default:
      throw new Error(`Unknown type: ${type}`)
  }
}

type Props = Record<string, any>
const defer: (fn: () => void) => void =
  typeof Promise == 'function'
    ? (fn: () => void) => Promise.resolve().then(fn)
    : setTimeout

interface Renderer<T> {
  create(type: string, props: Props): T
  insert(parent: T, node: T, before?: T): void
  remove(parent: T, node: T): void
  update(node: T, props: Props): void
}

function removeFromTextContainer(container: Container, child: View) {
  for (const viewChild of container.children) {
    if (viewChild === child) {
      container.removeChild(viewChild)
      return true
    } else if (viewChild instanceof TextContainer) {
      // TextContainer.add() puts TextLiterals/TextStyles into #nodes,
      // NOT into .children (which holds generated Text views).
      // Check child.parent instead of searching .children.
      if (child.parent === viewChild) {
        viewChild.removeChild(child)
        return true
      }
    }
  }
  return false
}

function removeChild(container: Container, child: View) {
  if (child.parent === container) {
    container.removeChild(child)
  } else if (child instanceof TextLiteral || child instanceof TextStyle) {
    removeFromTextContainer(container, child)
  }
}

function appendChild(parentInstance: Container, child: View, before?: View) {
  if (
    parentInstance instanceof TextStyle &&
    (child instanceof TextLiteral || child instanceof TextStyle)
  ) {
    // do not do the TextContainer song and dance
  } else if (child instanceof TextLiteral || child instanceof TextStyle) {
    // find the last child (checking 'before')
    let lastChild: View | undefined = parentInstance.children.at(-1)
    if (before) {
      const index = parentInstance.children.indexOf(before)
      if (~index) {
        lastChild = parentInstance.children.at(index - 1)
      }
    }

    let textContainer: TextContainer
    if (lastChild instanceof TextContainer) {
      textContainer = lastChild
    } else {
      textContainer = new TextContainer()
      parentInstance.add(textContainer)
    }

    textContainer.add(child)
    return
  }

  let index: number | undefined = before
    ? parentInstance.children.indexOf(before)
    : -1
  if (index === -1) {
    index = undefined
  }

  parentInstance.add(child, index)
}

class RendererElement<T> {
  parentNode: RendererElement<T> | null = null
  nextSibling: RendererElement<T> | null = null
  previousSibling: RendererElement<T> | null = null
  firstChild: RendererElement<T> | null = null
  lastChild: RendererElement<T> | null = null
  props: Props = {}
  prevProps?: Props
  node?: any
  nodeType: number

  constructor(
    private renderer: Renderer<T>,
    public localName: string,
    nodeType: number = 1,
  ) {
    this.nodeType = nodeType
    this._commit = this._commit.bind(this)
  }
  set data(text: any) {
    this.setAttribute('text', String(text))
  }
  addEventListener(event: string, func: Function) {
    this.setAttribute(`on${event}`, func)
  }
  setAttribute(name: string, value: any) {
    if (this.node && !this.prevProps) {
      this.prevProps = Object.assign({}, this.props)
      defer(this._commit)
    }
    this.props[name] = value
  }
  removeAttribute(name: string) {
    if (this.node && !this.prevProps) {
      this.prevProps = Object.assign({}, this.props)
      defer(this._commit)
    }
    delete this.props[name]
  }
  _attach() {
    return (this.node ||= this.renderer.create(this.localName, this.props))
  }
  _commit() {
    const state = this.node
    const prev = this.prevProps
    if (!state || !prev) return
    this.prevProps = undefined
    this.renderer.update(state, this.props)
  }
  insertBefore(child: RendererElement<T>, before?: RendererElement<T> | null) {
    if (child.parentNode === this) this.removeChild(child)

    if (before) {
      const prev = before.previousSibling
      child.previousSibling = prev
      before.previousSibling = child
      if (prev) {
        prev.nextSibling = child
      }
      if (before == this.firstChild) {
        this.firstChild = child
      }
    } else {
      const last = this.lastChild
      child.previousSibling = last
      this.lastChild = child
      if (last) last.nextSibling = child
      if (!this.firstChild) this.firstChild = child
    }

    child.parentNode = this
    child.nextSibling = before ?? null

    this.renderer.insert(
      this._attach(),
      child._attach(),
      before && before._attach(),
    )
  }
  appendChild(child: RendererElement<T>) {
    this.insertBefore(child)
  }
  removeChild(child: RendererElement<T>) {
    if (this.firstChild === child) this.firstChild = child.nextSibling
    if (this.lastChild === child) this.lastChild = child.previousSibling
    child.parentNode = child.nextSibling = child.previousSibling = null
    if (this.node && child.node) {
      this.renderer.remove(this.node, child.node)
    }
  }
}

function createRendererDom<T>(renderer: Renderer<T>) {
  function createElement(type: string) {
    return new RendererElement(renderer, type, 1)
  }

  function createElementNS(_: unknown, type: string) {
    return new RendererElement(renderer, type, 1)
  }

  function createTextNode(text: any) {
    const node = new RendererElement(renderer, 'text', 3)
    node.props.text = String(text)
    return node
  }

  function createRoot() {
    return createElement('tui-window')
  }

  return {createElement, createElementNS, createTextNode, createRoot}
}

let _rerender: (() => void) | undefined

// Hook into Preact's diffed option to trigger screen re-renders after commits
const prevDiffed = options.diffed
options.diffed = (vnode) => {
  prevDiffed?.(vnode)
  _rerender?.()
}

const dom = createRendererDom<View>({
  create(type, props) {
    return createView(type, props)
  },
  insert(parent, node, before) {
    if (!(parent instanceof Container)) {
      return
    }
    appendChild(parent, node, before)
  },
  remove(parent, node) {
    if (!(parent instanceof Container)) {
      return
    }
    removeChild(parent, node)
  },
  update(node, props) {
    const {children, child, ...updateProps} = props as any
    if (node instanceof TextLiteral) {
      node.text = updateProps.text ?? ''
    } else {
      node.update(updateProps)
    }
  },
})

// Preact accesses `document` directly (not ownerDocument), so we must
// provide a global document shim with our custom DOM factory methods.
const fakeDocument = Object.create(null)
Object.assign(fakeDocument, dom)
;(globalThis as any).document = fakeDocument

export function render(
  screen: Screen,
  window: WrWindow,
  component: ComponentChildren,
) {
  _rerender = () => {
    screen.render()
  }

  const root = dom.createRoot()
  // Assign the fake document so Preact can use it as a DOM context
  ;(root as any).ownerDocument = fakeDocument

  preactRender(component, root as any)

  // Reparent created views into the actual window
  if (root.node instanceof WrWindow) {
    for (const child of [...root.node.children]) {
      root.node.removeChild(child)
      window.add(child)
    }
  }

  return function unmount() {
    preactRender(null, root as any)
    _rerender = undefined
  }
}

export async function run(
  component: ComponentChildren,
  options?: Partial<ScreenOptions>,
): Promise<[Screen, WrWindow, ComponentChildren, () => void]> {
  // Start the screen first, then render (matching React package behavior)
  const window = new WrWindow()
  const [screen, _] = await Screen.start(window, options)

  const unmount = render(screen, window, component)

  return [screen, window, component, unmount]
}
