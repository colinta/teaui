import React from 'react'
import type {ReactNode} from 'react'
import ReactReconciler from 'react-reconciler'
import {DefaultEventPriority} from 'react-reconciler/constants.js'
import {
  Accordion,
  Align,
  AlignRow,
  At,
  Alert,
  Box,
  Breadcrumb,
  Button,
  Callout,
  Calendar,
  Canvas,
  Checkbox,
  Collapsible,
  CollapsibleText,
  ConsoleLog,
  Container,
  Digits,
  Drawer,
  Dropdown,
  Geometry,
  H1,
  HotKey,
  Modal,
  Keyboard,
  Mouse,
  Pane,
  H2,
  H3,
  H4,
  H5,
  H6,
  Input,
  Legend,
  AutoLegend,
  Progress,
  Screen,
  type ScreenOptions,
  Scrollable,
  Separator,
  Slider,
  Space,
  Spinner,
  Logo,
  Page,
  ZStack,
  Stack,
  ScrollableList,
  Table,
  Tabs,
  ToggleGroup,
  Tree,
  View,
  Window,
} from '@teaui/core'
import {
  TextContainer,
  TextLiteral,
  TextProvider,
  TextStyle,
} from './components/TextReact.js'

import {isSame} from './isSame.js'

type Props = {}
interface HostContext {
  screen: Screen
  window: Window
}

type ViewFactory = (props: any) => any
const customElements = new Map<string, ViewFactory>()

/**
 * Register a custom element type for the React reconciler.
 * External packages (e.g. @teaui/subprocess) can call this to add new JSX elements.
 *
 * @example
 * registerElement('tui-subprocess', (props) => new SubprocessView(props))
 */
export function registerElement(type: string, factory: ViewFactory) {
  customElements.set(type, factory)
}

function createInstance(type: string, props: Props): any {
  const factory = customElements.get(type)
  if (factory) {
    return factory(props)
  }

  switch (type) {
    // views
    case 'at':
    case 'tui-at':
      return new At(props as any)
    case 'align':
    case 'tui-align':
      return new Align(props as any)
    case 'align-row':
    case 'tui-align-row':
      return new AlignRow(props as any)
    case 'br':
    case 'tui-br':
      return new TextLiteral('\n')
    case 'breadcrumb':
    case 'tui-breadcrumb':
      return new Breadcrumb(props as any)
    case 'calendar':
    case 'tui-calendar':
      return new Calendar(props as any)
    case 'canvas':
    case 'tui-canvas':
      return new Canvas(props as any)
    case 'checkbox':
    case 'tui-checkbox':
      return new Checkbox(props as any)
    case 'collapsible-text':
    case 'tui-collapsible-text':
      return new CollapsibleText(props as any)
    case 'console':
    case 'tui-console':
      return new ConsoleLog(props as any)
    case 'digits':
    case 'tui-digits':
      return new Digits(props as any)
    case 'dropdown':
    case 'tui-dropdown':
      return new Dropdown(props as any)
    case 'geometry':
    case 'tui-geometry':
      return new Geometry(props as any)
    case 'hotkey':
    case 'tui-hotkey':
      return new HotKey(props as any)
    case 'keyboard':
    case 'tui-keyboard':
      return new Keyboard(props as any)
    case 'mouse':
    case 'tui-mouse':
      return new Mouse(props as any)
    case 'h1':
    case 'tui-h1':
      return H1(((props as any).text as string) ?? '')
    case 'h2':
    case 'tui-h2':
      return H2(((props as any).text as string) ?? '')
    case 'h3':
    case 'tui-h3':
      return H3(((props as any).text as string) ?? '')
    case 'h4':
    case 'tui-h4':
      return H4(((props as any).text as string) ?? '')
    case 'h5':
    case 'tui-h5':
      return H5(((props as any).text as string) ?? '')
    case 'h6':
    case 'tui-h6':
      return H6(((props as any).text as string) ?? '')
    case 'input':
    case 'tui-input':
      return new Input(props as any)
    case 'legend':
    case 'tui-legend':
      return new Legend(props as any)
    case 'tui-auto-legend':
      return new AutoLegend(props as any)
    case 'separator':
    case 'tui-separator':
      return new Separator(props as any)
    case 'slider':
    case 'tui-slider':
      return new Slider(props as any)
    case 'space':
    case 'tui-space':
      return new Space(props as any)
    case 'progress':
    case 'tui-progress':
      return new Progress(props as any)
    case 'spinner':
    case 'tui-spinner':
      return new Spinner(props as any)
    case 'tui-logo':
      return new Logo(props as any)
    case 'tui-zstack':
      return new ZStack(props as any)
    case 'toggle-group':
    case 'tui-toggle-group':
      return new ToggleGroup(props as any)

    case 'tree':
    case 'tui-tree':
      return new Tree(props as any)

    // "simple" containers
    case 'alert':
    case 'tui-alert':
      return new Alert(props as any)
    case 'box':
    case 'tui-box':
      return new Box(props as any)
    case 'callout':
    case 'tui-callout':
      return new Callout(props as any)
    case 'button':
    case 'tui-button':
      return new Button(props as any)
    case 'collapsible':
    case 'tui-collapsible':
      return new Collapsible(props as any)
    case 'modal':
    case 'tui-modal':
      return new Modal(props as any)
    case 'stack':
    case 'tui-stack':
      return new Stack(props as any)
    case 'scrollable':
    case 'tui-scrollable':
      return new Scrollable(props as any)
    case 'style':
    case 'tui-style':
      return new TextStyle(props as any)
    case 'tui-list':
      return new ScrollableList(props as any)
    case 'table':
    case 'tui-table':
      return new Table(props as any)
    case 'tui-text':
      return new TextProvider(props as any)

    // "complex" containers
    case 'accordion':
    case 'tui-accordion':
      return new Accordion(props as any)
    case 'accordion-section':
    case 'tui-accordion-section':
      return new Accordion.Section(props as any)
    case 'pane':
    case 'tui-pane':
      return new Pane(props as any)
    case 'drawer':
    case 'tui-drawer':
      return new Drawer(props as any)
    case 'tabs':
    case 'tui-tabs':
      return new Tabs(props as any)
    case 'tabs-section':
    case 'tui-tabs-section':
      return new Tabs.Section(props as any)
    case 'page':
    case 'tui-page':
      return new Page(props as any)
    case 'page-section':
    case 'tui-page-section':
      return new Page.Section(props as any)

    default:
      throw new Error(`unknown component "${type}"`)
  }
}

export function render(screen: Screen, window: Window, rootNode: ReactNode) {
  function rerender() {
    screen.render()
  }

  function removeFromTextContainer(container: Container, child: View) {
    // find TextContainer with child in it, and remove.
    // TextContainer.add() puts TextLiterals/TextStyles into #nodes (accessed
    // via .nodes), NOT into .children (which holds generated Text views).
    // So we check child.parent === node rather than node.children.includes(child).
    for (const node of container.children) {
      if (node instanceof TextContainer && child.parent === node) {
        node.removeChild(child)
        if (node.children.length === 0) {
          container.removeChild(node)
        }
        return
      }
    }
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
      if (before) {
        if (before.parent === parentInstance) {
          const beforeIndex = parentInstance.children.indexOf(before)
          if (~beforeIndex) {
            const previousChild = parentInstance.children.at(beforeIndex - 1)
            if (previousChild instanceof TextContainer) {
              previousChild.add(child)
            } else {
              const textContainer = new TextContainer()
              parentInstance.add(textContainer, beforeIndex)
              textContainer.add(child)
            }
            return
          }
        }

        if (
          before.parent instanceof TextContainer &&
          before.parent.parent === parentInstance
        ) {
          const textContainer = before.parent
          const beforeIndex = textContainer.nodes.indexOf(before)
          if (~beforeIndex) {
            textContainer.add(child, beforeIndex)
            return
          }
        }
      }

      const lastChild = parentInstance.children.at(-1)
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

  const reconciler = ReactReconciler({
    supportsPersistence: false,
    supportsHydration: false,
    isPrimaryRenderer: true,

    getRootHostContext(rootWindow: Window): HostContext {
      return {screen, window: rootWindow}
    },
    getChildHostContext(
      _parentHostContext: HostContext,
      type: string,
      _rootWindow: Window,
    ) {
      return {type}
    },
    clearContainer(rootWindow: Window) {
      rootWindow.removeAllChildren()
    },

    createInstance(
      type: string,
      props: Props,
      _rootWindow: Window,
      _hostContext: HostContext,
      _internalInstanceHandle: Object,
    ) {
      if ('children' in props) {
        const {children, ...remainder} = props
        props = remainder
      }

      if ('child' in props) {
        const {child, ...remainder} = props
        props = remainder
      }

      return createInstance(type, props)
    },
    createTextInstance(text: string) {
      return new TextLiteral(text)
    },

    appendInitialChild(parentInstance: Container, child: View) {
      appendChild(parentInstance, child, undefined)
    },
    appendChild(parentInstance: Container, child: View) {
      appendChild(parentInstance, child, undefined)
    },
    insertBefore(parentInstance: Container, child: View, beforeChild: View) {
      appendChild(parentInstance, child, beforeChild)
    },

    appendChildToContainer(rootWindow: Window, child: View) {
      appendChild(rootWindow, child)
    },
    insertInContainerBefore(
      rootWindow: Window,
      child: View,
      beforeChild: View,
    ) {
      appendChild(rootWindow, child, beforeChild)
    },

    removeChild(container: Container, child: View) {
      removeChild(container, child)
    },
    removeChildFromContainer(container: Window, child: View) {
      removeChild(container, child)
    },
    detachDeletedInstance(node: View) {},

    finalizeInitialChildren(instance: View) {
      return false
    },
    prepareForCommit() {
      return null
    },
    resetAfterCommit() {
      rerender()
    },

    commitMount(
      _instance: View,
      _type: string,
      _newProps: Props,
      _internalInstanceHandle: Object,
    ) {
      // not needed as long as finalizeInitialChildren returns `false`
    },

    commitTextUpdate(
      textInstance: TextLiteral,
      _oldText: string,
      newText: string,
    ) {
      textInstance.text = newText
    },

    resetTextContent(instance: TextLiteral) {
      instance.text = ''
    },
    shouldSetTextContent(type: string, _props: Props) {
      return false
    },

    prepareUpdate(
      _instance: View,
      _type: string,
      oldProps: any,
      newProps: any,
      _rootContainer: unknown,
      _hostContext: unknown,
    ) {
      for (const prop in oldProps) {
        if (!Object.hasOwn(oldProps, prop)) {
          continue
        }

        if (!isSame(oldProps[prop], newProps[prop])) {
          // difference found - we just return a non-null here to indicate "difference"
          return []
        }
      }

      for (const prop in newProps) {
        // if we already checked it, or it isn't an own-prop on newProps, continue
        if (Object.hasOwn(oldProps, prop) || !Object.hasOwn(newProps, prop)) {
          continue
        }

        if (!isSame(oldProps[prop], newProps[prop])) {
          // difference found - we just return a non-null here to indicate "difference"
          return []
        }
      }

      return null
    },
    commitUpdate(
      node: View,
      _updatePayload: [PropertyKey, any][],
      _type: string,
      _oldProps: Props,
      newProps: Props,
      _internalInstanceHandle: Object,
    ) {
      const {children, ...updates} = newProps as any
      // if (children !== undefined && node instanceof TextLiteral) {
      //   updates.text = childrenToText(children)
      // }

      node.update(updates)
    },

    supportsMutation: true,
    getPublicInstance(instance: View) {
      return instance
    },
    preparePortalMount() {},
    scheduleTimeout: setTimeout,
    cancelTimeout: clearTimeout,
    noTimeout: -1,
    getCurrentEventPriority() {
      return DefaultEventPriority
    },
    getInstanceFromNode(): ReactReconciler.Fiber | null | undefined {
      throw new Error('Function not implemented.')
    },
    beforeActiveInstanceBlur() {
      throw new Error('Function not implemented.')
    },
    afterActiveInstanceBlur() {
      throw new Error('Function not implemented.')
    },
    prepareScopeUpdate() {
      throw new Error('Function not implemented.')
    },
    getInstanceFromScope() {
      throw new Error('Function not implemented.')
    },
  })

  const fiber = reconciler.createContainer(
    window,
    0,
    null,
    false,
    null,
    '',
    () => {},
    null,
  )

  reconciler.updateContainer(
    rootNode,
    fiber,
    null /* parentComponent */,
    null /* callback */,
  )

  return function unmount() {
    reconciler.updateContainer(null, fiber, null, null)
  }
}

export async function run(
  component: ReactNode,
  options?: Partial<ScreenOptions>,
): Promise<[Screen, Window, React.ReactNode, () => void]> {
  const window = new Window()
  const [screen, _] = await Screen.start(window, options)

  const unmount = render(screen, window, component)

  return [screen, window, component, unmount]
}
