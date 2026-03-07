import {
  Alignment,
  Container,
  define,
  FontFamily,
  Rect,
  Screen,
  Size,
  Style,
  Text,
  type ViewProps,
  View,
  Viewport,
} from '@teaui/core'

/**
 * Used by the React Reconciler to provide default text styles for descendant
 * TextLiteral nodes. Does not layout its children - TextContainer does that work.
 *
 * @example
 *     <Text>
 *       hello!
 *     </Text>
 *
 * - `<Text>` node creates `TextProvider`
 * - "hello!" creates `TextLiteral`
 * - `TextLiteral` is added to a `TextContainer`, which is added to `TextProvider`
 *
 *     <Stack.down>
 *       hello!<br />
 *       <Box height={5} width={5} />
 *       goodbye!<br />
 *     </Stack.down>
 *
 * - "hello!" and <br/> create instances of `TextLiteral`
 * - Both are added to the same `TextContainer`, and added to `Stack.down`
 * - `<Box/>` is added to `Stack.down`
 * - When the "goodbye!" `TextLiteral` is added, the _last child_ of `Stack.down` is
 *   not a `TextContainer`, so a new `TextContainer` is created.
 * - no `TextProvider` here, so default text styles are used (left align, default
 *   font)
 *
 *     <Text wrap={false}>
 *       {`good news everyone,\n`}
 *       tomorrow you'll be making a delivery to…
 *       <Box height={5} width={5} />
 *       goodbye!<br />
 *       I {happy ? 'hope you had fun' : 'wish you would leave'}.
 *     </Text>
 *
 * - The first two text nodes create `TextLiteral`-s, which are rendered together to
 *   become:
 *       good news everyone,⤦
 *       tomorrow you'll be making a delivery to…
 * - `<Box />` is not a TextLiteral, so it is rendered _below_ the text (regardless
 *   of `alignment`)
 * - The last nodes are turned into `TextLiteral`-s as well.
 */
namespace TextReact {}
// yeah I don't care about this namespace I just needed something to attach the JSDoc to

const DEFAULTS = {
  alignment: 'left',
  wrap: true,
  font: 'default',
} as const

/**
 * Used in the React reconciler for literal text JSX elements. They don't have any
 * props.
 */
export class TextLiteral extends View {
  #text: string

  constructor(text: string) {
    super({})
    this.#text = text
    define(this, 'text', {enumerable: true})
  }

  update({text, ...props}: ViewProps & {text?: string}) {
    super.update(props)
    this.#update({text})
  }

  #update({text}: {text?: string}) {
    this.#text = text ?? ''
  }

  styledText(): string {
    let style: Style | undefined
    for (
      let ancestorView: Container | undefined = this.parent;
      Boolean(ancestorView);
      ancestorView = ancestorView && ancestorView.parent
    ) {
      if (ancestorView instanceof TextStyle) {
        style = ancestorView.style
        break
      }

      if (ancestorView instanceof TextContainer) {
        break
      }
    }

    if (style) {
      return style.toSGR(Style.NONE, this.#text)
    }

    return this.#text
  }

  get text() {
    return this.#text
  }

  set text(value: string) {
    this.#text = String(value)
    this.#invalidateTextContainer()
    this.invalidateSize()
  }

  #invalidateTextContainer() {
    let textContainer: TextContainer | undefined
    for (
      let ancestorView: Container | undefined = this.parent;
      Boolean(ancestorView);
      ancestorView = ancestorView && ancestorView.parent
    ) {
      if (ancestorView instanceof TextContainer) {
        textContainer = ancestorView
        break
      }
    }

    textContainer?.invalidateText()
  }

  naturalSize() {
    return Size.zero
  }

  render() {}
}

/**
 * Subsequent TextLiteral nodes are grouped into a TextContainer, which handles the
 * layout of child nodes. It gets its style, font, and alignment from the nearest
 * parent TextProvider.
 */
export class TextContainer extends Container {
  #nodes: View[] = []

  constructor() {
    super({})
  }

  get nodes() {
    return this.#nodes
  }

  add(child: View, at?: number) {
    if (child instanceof TextLiteral || child instanceof TextStyle) {
      child.parent = this
    }

    this.#nodes.splice(at ?? this.#nodes.length, 0, child)

    if (this.screen) {
      this.#invalidateNodes()
    }
  }

  removeChild(child: View) {
    if (child instanceof TextLiteral) {
      child.parent = undefined
    }

    const index = this.#nodes.indexOf(child)
    if (~index && index >= 0 && index < this.#nodes.length) {
      this.#nodes.splice(index, 1)

      if (this.screen) {
        this.#invalidateNodes()
      }
    }
  }

  didMount(screen: Screen) {
    super.didMount(screen)
    this.#invalidateNodes()
  }

  invalidateText() {
    let childIndex = 0
    for (const nextChild of this.#nodesToChildren()) {
      const childView = this.children.at(childIndex)

      if (nextChild instanceof View) {
        childIndex += 1
      } else {
        if (!(childView instanceof Text)) {
          this.#invalidateNodes()
          return
        }

        childView.text = nextChild
      }
    }
  }

  #invalidateNodes() {
    // ideally, we would not remove/add views that are in children and this.#nodes,
    // but in reality that turns out to be tedious, and it's hardly any trouble to
    // remove and re-add those views.
    super.removeAllChildren()

    for (const child of this.#nodesToChildren()) {
      if (child instanceof View) {
        super.add(child)
      } else {
        const textView = this.#createTextNode(child)
        super.add(textView)
      }
    }
  }

  #nodesToChildren(): (string | View)[] {
    const children: (string | View)[] = []
    let textBuffer: string | undefined
    const STOP = null
    const flattenedNodes = this.#flatten(this.#nodes)
    for (const node of [...flattenedNodes, STOP]) {
      if (node instanceof TextLiteral) {
        textBuffer ??= ''
        textBuffer += node.styledText()
      } else {
        if (textBuffer !== undefined) {
          children.push(textBuffer)
          textBuffer = undefined
        }

        if (node) {
          children.push(node)
        }
      }
    }

    return children
  }

  naturalSize(available: Size): Size {
    const size = Size.zero.mutableCopy()
    const remaining = available.mutableCopy()
    for (const child of this.children) {
      const childSize = child.naturalSize(remaining)
      size.width = Math.max(size.width, childSize.width)
      size.height += childSize.height
      remaining.height = Math.max(0, remaining.height - childSize.height)
    }

    return size
  }

  render(viewport: Viewport) {
    const remaining = viewport.contentSize.mutableCopy()
    let y = 0
    for (const child of this.children) {
      if (!child.isVisible) {
        continue
      }

      const childSize = child.naturalSize(remaining).mutableCopy()
      childSize.width = viewport.contentSize.width
      remaining.height -= childSize.height

      const childViewport = new Rect([0, y], childSize)
      viewport.clipped(childViewport, inner => child.render(inner))
      y += childSize.height
    }
  }

  #createTextNode(text: string) {
    let textProvider: TextProvider | undefined
    for (
      let ancestorView = this.parent;
      Boolean(ancestorView);
      ancestorView = ancestorView && ancestorView.parent
    ) {
      if (ancestorView instanceof TextProvider) {
        textProvider = ancestorView
        break
      }
    }

    let textProps: TextProps = DEFAULTS
    if (textProvider) {
      textProps = {...textProps, ...textProvider.textProps}
    }

    return new Text({
      text,
      ...textProps,
    })
  }

  #flatten(nodes: View[]): View[] {
    return nodes.flatMap(node => {
      if (node instanceof TextContainer) {
        return this.#flatten(node.nodes)
      }

      if (node instanceof TextStyle) {
        return this.#flatten(node.children)
      }

      return [node]
    })
  }
}

interface TextProviderProps {
  style?: Partial<Style>
  font?: FontFamily
  alignment?: Alignment
  wrap?: boolean
}

type TextProps = Omit<TextProviderProps, 'style'> & {
  style?: Style
}

type ProviderProps = TextProviderProps & ViewProps & Partial<Style>

/**
 * Intended to contain a single TextContainer. Provides the styling that is used to
 * create Text views.
 *
 * @example
 *     <Text align='left' bold>text</Text>
 */
export class TextProvider extends Container {
  #style: Style = Style.NONE
  #font: TextProviderProps['font']
  #alignment: TextProviderProps['alignment']
  #wrap: TextProviderProps['wrap']

  declare wrap: FontFamily
  declare font: FontFamily
  declare alignment: Alignment

  constructor(props: ProviderProps = {}) {
    super(props)

    this.#update(props)
  }

  get style() {
    return this.parentStyle.merge(this.#style)
  }

  get parentStyle() {
    let parentStyle: Style | undefined
    for (
      let ancestorView = this.parent;
      Boolean(ancestorView);
      ancestorView = ancestorView && ancestorView.parent
    ) {
      if (ancestorView instanceof TextProvider) {
        parentStyle = ancestorView.style
        break
      }
    }

    return parentStyle ?? Style.NONE
  }

  get textProps(): TextProps {
    let parentProvider: TextProvider | undefined
    for (
      let ancestorView = this.parent;
      Boolean(ancestorView);
      ancestorView = ancestorView && ancestorView.parent
    ) {
      if (ancestorView instanceof TextProvider) {
        parentProvider = ancestorView
        break
      }
    }

    let retVal: TextProps = {}
    if (parentProvider) {
      retVal = {...parentProvider.textProps}
    } else {
      retVal = {}
    }

    retVal.style = this.#style

    if (this.#alignment !== undefined) {
      retVal.alignment = this.#alignment
    }

    if (this.#wrap !== undefined) {
      retVal.wrap = this.#wrap
    }

    if (this.#font !== undefined) {
      retVal.font = this.#font
    }

    return retVal
  }

  update(props: ProviderProps) {
    this.#update(props)
    super.update(props)
  }

  #update(props: ProviderProps) {
    const {style, alignment, wrap, font, ...styleProps} = props
    this.#style = new Style(styleProps).merge(style)
    this.#font = font
    this.#alignment = alignment ?? 'left'
    this.#wrap = wrap ?? false
  }
}

type StyledTextProps = Omit<ProviderProps, 'alignment' | 'wrap' | 'font'>

/**
 * Provides inline styles - doesn't support wrap or alignment.
 *
 * Also doesn't support 'font' because that's not encoded as an SGR code - but
 * ideally it would be supported.
 */
export class TextStyle extends TextProvider {
  constructor(props: StyledTextProps) {
    super(props)
  }

  update(props: StyledTextProps) {
    super.update(props)
    this.#invalidateTextContainer()
  }

  #invalidateTextContainer() {
    for (
      let ancestorView: Container | undefined = this.parent;
      Boolean(ancestorView);
      ancestorView = ancestorView && ancestorView.parent
    ) {
      if (ancestorView instanceof TextContainer) {
        ancestorView.invalidateText()
        return
      }
    }
  }
}
