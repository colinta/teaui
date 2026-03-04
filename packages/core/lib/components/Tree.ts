import type {Viewport} from '../Viewport.js'

import {type Props as ViewProps, View} from '../View.js'
import {Stack} from './Stack.js'
import {Container} from '../Container.js'
import {Rect, Point, Size} from '../geometry.js'
import {type MouseEvent, isMouseClicked} from '../events/index.js'
import {Style} from '../Style.js'
import {System} from '../System.js'

type RenderFn<T> = (datum: T, path: string) => View
type GetChildrenFn<T> = (datum: T, path: string) => T[] | undefined

interface StyleProps<T> {
  data: T[]
  render: RenderFn<T>
  getChildren?: GetChildrenFn<T>
  titleView: View
}

type Props<T> = StyleProps<T> & ViewProps
type PathData = {hasChildren: boolean; isExpanded: boolean; isLast: boolean}
type ChildProps = ViewProps & {
  view: View
  pathData: PathData[]
  onToggle: () => void
}

// in the form `.${index0}`, `.${index0}.${index1}`, `.${index0}.${index1}.${index2}`
type Path = string

const TREE_BULLET_WIDTH = 4

export class Tree<T extends any> extends Container {
  #titleView?: View

  #data: T[] = []
  #getChildren: GetChildrenFn<T> = () => []
  #render: RenderFn<T> = () => null as unknown as View
  #expanded: Set<Path> = new Set()
  #itemViews: Map<Path, TreeChild> = new Map()
  #viewPaths: Map<TreeChild, Path> = new Map()
  #contentView = Stack.down()

  constructor(props: Props<T>) {
    super(props)

    this.#update(props)

    this.add(this.#contentView)
  }

  update(props: Props<T>) {
    this.#update(props)
    super.update(props)
  }

  #update({titleView, data, render, getChildren}: Props<T>) {
    if (titleView && titleView !== this.#titleView) {
      this.#titleView?.removeFromParent()
      this.add(titleView)
      this.#titleView = titleView
    }

    this.#data = data
    this.#getChildren = getChildren ?? (() => [])
    this.#render = render

    this.#resetViews()
  }

  #resetViews() {
    const prevChildren = new Set([...this.#itemViews].map(([, child]) => child))
    this.#addViews(this.#data, prevChildren)

    for (const view of prevChildren) {
      view.removeFromParent()
    }
  }

  #addViews(
    data: T[],
    prevChildren: Set<View>,
    count: {current: number} = {current: 0},
    pathPrefix: string = '',
    prevData: PathData[] = [],
  ) {
    for (let index = 0; index < data.length; index++) {
      const path = `${pathPrefix}.${index}`
      const datum = data[index]
      const isExpanded = this.#isChildExpanded(path)
      const children = this.#getChildren(datum, path)
      const hasChildren = children ? children.length > 0 : false
      const isLast = index === data.length - 1
      const currentPathData = {
        isLast,
        isExpanded,
        hasChildren,
      }
      const pathData = [...prevData, currentPathData]

      let view = this.#itemViews.get(path)
      if (view) {
        view.pathData = pathData
      } else {
        const itemView = this.#render(datum, path)
        view = new TreeChild({
          view: itemView,
          pathData,
          onToggle: () => {
            if (this.#expanded.has(path)) {
              this.#expanded.delete(path)
            } else {
              this.#expanded.add(path)
            }
            this.#resetViews()
            this.#contentView.invalidateSize()
          },
        })

        this.#itemViews.set(path, view)
        this.#viewPaths.set(view, path)
      }

      if (!view.parent) {
        this.#contentView.add(view, count.current)
      }

      count.current += 1

      prevChildren.delete(view)

      if (isExpanded && children) {
        this.#addViews(children, prevChildren, count, path, pathData)
      }
    }
  }

  #isChildExpanded(path: string) {
    return this.#expanded.has(path)
  }

  naturalSize(available: Size): Size {
    let titleSize = Size.zero
    if (this.#titleView) {
      titleSize = this.#titleView.naturalSize(available)
    }

    const remainingSize = available.shrink(0, titleSize.height)
    const contentSize = this.#contentView.naturalSize(remainingSize)
    return new Size(
      Math.max(titleSize.width, contentSize.width),
      titleSize.height + contentSize.height,
    )
  }

  render(viewport: Viewport) {
    if (viewport.isEmpty) {
      return super.render(viewport)
    }

    const titleView = this.#titleView
    const titleSize = titleView?.naturalSize(viewport.contentSize) ?? Size.zero
    if (titleView) {
      viewport.clipped(new Rect(Point.zero, titleSize), inside =>
        titleView.render(inside),
      )
    }

    viewport.clipped(
      viewport.contentRect.inset({top: titleSize.height}),
      inside => this.#contentView.render(inside),
    )
  }
}

class TreeChild extends Container {
  #pathData: PathData[] = []
  #hasChildren = false
  #onToggle = () => {}

  constructor({pathData, onToggle, ...props}: ChildProps) {
    super({...props, child: props.view})

    this.#pathData = pathData
    this.#hasChildren = pathData.at(-1)?.hasChildren ?? false
    this.#onToggle = onToggle
  }

  receiveMouse(event: MouseEvent, system: System) {
    super.receiveMouse(event, system)

    if (isMouseClicked(event) && this.#hasChildren) {
      this.#onToggle()
      this.invalidateSize()
    }
  }

  set pathData(value: PathData[]) {
    this.#pathData = value
    this.invalidateSize()
  }

  naturalSize(available: Size): Size {
    const size = super.naturalSize(available).mutableCopy()
    size.width += TREE_BULLET_WIDTH * this.#pathData.length

    return size
  }

  render(viewport: Viewport) {
    if (viewport.isEmpty) {
      return super.render(viewport)
    }

    if (this.#hasChildren) {
      viewport.registerMouse(['mouse.move', 'mouse.button.left'])
    }

    const treeSize = this.naturalSize(viewport.contentSize).shrink(
      TREE_BULLET_WIDTH * this.#pathData.length,
      0,
    )
    const treeRect = new Rect(
      new Point(TREE_BULLET_WIDTH * this.#pathData.length, 0),
      treeSize,
    )

    let textStyle: Style
    if (this.isPressed || this.isHover) {
      textStyle = new Style({bold: true})
    } else {
      textStyle = Style.NONE
    }

    let firstLine: string = '',
      middleLine: string = '',
      lastLine: string = ''
    for (let index = 0; index < this.#pathData.length; index++) {
      const {hasChildren, isExpanded, isLast} = this.#pathData[index]
      if (index === this.#pathData.length - 1) {
        if (hasChildren) {
          if (isLast) {
            firstLine += '└'
          } else {
            firstLine += '├'
          }

          if (isExpanded) {
            if (this.isHover) {
              firstLine += '─╴▾'
            } else if (this.isPressed) {
              firstLine += '━╸▾'
            } else {
              firstLine += '─╴▿'
            }
          } else {
            if (this.isHover) {
              firstLine += '─╴▸'
            } else if (this.isPressed) {
              firstLine += '━╸▸'
            } else {
              firstLine += '─╴▹'
            }
          }
        } else {
          if (isLast) {
            firstLine += '└──╴'
          } else {
            firstLine += '├──╴'
          }
        }

        if (isLast) {
          middleLine += '    '
          lastLine += '    '
        } else {
          middleLine += '│   '
          lastLine += '│   '
        }
      } else if (isLast) {
        firstLine += '    '
        middleLine += '    '
        lastLine += '    '
      } else {
        firstLine += '│   '
        middleLine += '│   '
        lastLine += '│   '
      }
    }

    const origin = Point.zero
    viewport.write(firstLine, origin, textStyle)
    for (let offsetY = 1; offsetY < treeSize.height - 1; offsetY++) {
      viewport.write(middleLine, origin.offset(0, offsetY))
    }
    if (treeSize.height > 1) {
      viewport.write(lastLine, origin.offset(0, treeSize.height - 1))
    }

    viewport.clipped(treeRect, inside => super.render(inside))
  }
}
