import type {Viewport} from '../Viewport.js'

import {View} from '../View.js'
import {type Props as ContainerProps, Container} from '../Container.js'
import {Text} from './Text.js'
import {Rect, Point, Size} from '../geometry.js'
import {type MouseEvent, isMouseClicked} from '../events/index.js'
import {System} from '../System.js'

interface StyleProps {
  /**
   * @default true
   */
  isCollapsed?: boolean
  /**
   * If true, the collapsed view is always shown. Usually the expanded view
   * *replaces* the collapsed view.
   * @default false
   */
  showCollapsed?: boolean
  collapsed?: View
  expanded?: View
}

type Props = StyleProps & ContainerProps

export class Collapsible extends Container {
  /**
   * Also assignable as child-view 0 (this is a React support hack)
   */
  #collapsedView?: View
  /**
   * Also assignable as child-view 1 (this is a React support hack)
   */
  #expandedView?: View

  #isCollapsed = true
  #showCollapsed = false

  constructor(props: Props) {
    super(props)

    this.#update(props)
  }

  update(props: Props) {
    this.#update(props)
    super.update(props)
  }

  add(child: View, at?: number) {
    super.add(child, at)
    this.#collapsedView = this.children.at(0)
    this.#expandedView = this.children.at(1)
  }

  removeChild(child: View) {
    super.removeChild(child)
    this.#collapsedView = this.children.at(0)
    this.#expandedView = this.children.at(1)
  }

  #update({
    isCollapsed,
    showCollapsed,
    collapsed: collapsedView,
    expanded: expandedView,
  }: Props) {
    this.#isCollapsed = isCollapsed ?? true
    this.#showCollapsed = showCollapsed ?? false

    // edge case: expandedView is being assigned, but not collapsedView
    if (expandedView && !collapsedView) {
      collapsedView = this.#collapsedView ?? new Text()
    }

    if (collapsedView && collapsedView !== this.#collapsedView) {
      this.#collapsedView?.removeFromParent()

      this.add(collapsedView, 0)
    }

    if (expandedView && expandedView !== this.#expandedView) {
      this.#expandedView?.removeFromParent()

      this.add(expandedView, 1)
    }
  }

  naturalSize(available: Size): Size {
    let size: Size
    if (this.#isCollapsed) {
      size = this.#collapsedView?.naturalSize(available) ?? Size.zero
    } else if (this.#showCollapsed) {
      let collapsedSize =
        this.#collapsedView?.naturalSize(available) ?? Size.zero
      const remaining = available.shrink(0, collapsedSize.height)
      size = this.#expandedView?.naturalSize(remaining) ?? Size.zero
      size = size.growHeight(collapsedSize)
    } else {
      size = this.#expandedView?.naturalSize(available) ?? Size.zero
    }

    return size.grow(2, 0)
  }

  receiveMouse(event: MouseEvent, system: System) {
    super.receiveMouse(event, system)

    if (isMouseClicked(event)) {
      this.#isCollapsed = !this.#isCollapsed
      this.invalidateSize()
    }
  }

  render(viewport: Viewport) {
    if (viewport.isEmpty) {
      return super.render(viewport)
    }

    viewport.registerMouse(['mouse.button.left', 'mouse.move'])

    const textStyle = this.theme.text({
      isPressed: this.isPressed,
      isHover: this.isHover,
    })

    viewport.paint(textStyle)

    const offset = new Point(2, 0)
    viewport.write(
      this.#isCollapsed ? '►' : '▼',
      new Point(0, offset.y),
      textStyle,
    )

    const contentSize = viewport.contentSize.shrink(2, 0)
    viewport.clipped(new Rect(offset, contentSize), inside => {
      if (this.#isCollapsed) {
        this.#collapsedView?.render(inside)
      } else if (this.#showCollapsed) {
        const collapsedSize =
          this.#collapsedView?.naturalSize(contentSize) ?? Size.zero
        let remaining = contentSize
        remaining = remaining.shrink(0, collapsedSize.height)
        this.#collapsedView?.render(inside)
        viewport.clipped(
          new Rect([0, collapsedSize.height], remaining),
          inside => {
            this.#expandedView?.render(inside)
          },
        )
      } else {
        this.#expandedView?.render(inside)
      }
    })
  }
}
