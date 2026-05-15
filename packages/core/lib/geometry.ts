export class Point {
  readonly x: number
  readonly y: number

  static zero = new Point(0, 0)

  constructor(point: Point)
  constructor(_: {x: number; y: number})
  constructor(_: [number, number])
  constructor(x: number, y: number)
  constructor(...args: PointArgs)
  constructor(...args: PointArgs) {
    const [x, y] = toXY(args)
    this.x = x
    this.y = y
  }

  copy() {
    return new Point(this.x, this.y)
  }

  mutableCopy() {
    return this.copy() as MutablePoint
  }

  offset(point: Point): Point
  offset(_: {x: number; y: number}): Point
  offset(_: [number, number]): Point
  offset(x: number, y: number): Point
  offset(...args: PointArgs) {
    const [x, y] = toXY(args)
    return new Point(this.x + x, this.y + y)
  }

  isEqual(point: Point): boolean
  isEqual(_: {x: number; y: number}): boolean
  isEqual(_: [number, number]): boolean
  isEqual(x: number, y: number): boolean
  isEqual(...args: PointArgs) {
    const [x, y] = toXY(args)
    return this.x === x && this.y === y
  }
}

export interface MutablePoint extends Point {
  x: number
  y: number
}

export class Size {
  readonly width: number
  readonly height: number

  static zero = new Size(0, 0)
  static one = new Size(1, 1)

  constructor(size: Size)
  constructor(_: {width: number; height: number})
  constructor(_: [number, number])
  constructor(width: number, height: number)
  constructor(...args: SizeArgs) {
    const [width, height] = toWH(args)
    this.width = Math.max(0, width)
    this.height = Math.max(0, height)
  }

  copy() {
    return new Size(this.width, this.height)
  }

  mutableCopy() {
    const copy = this.copy() as MutableSize
    Object.defineProperty(copy, 'width', {
      enumerable: true,
      writable: true,
    })
    Object.defineProperty(copy, 'height', {
      enumerable: true,
      writable: true,
    })
    return copy
  }

  isEqual(size: Size): boolean
  isEqual(_: {width: number; height: number}): boolean
  isEqual(_: [number, number]): boolean
  isEqual(width: number, height: number): boolean
  isEqual(...args: SizeArgs) {
    const [w, h] = toWH(args)
    return this.width === w && this.height === h
  }

  shrink(size: Size): Size
  shrink(_: {width: number; height: number}): Size
  shrink(_: [number, number]): Size
  shrink(width: number, height: number): Size
  shrink(...args: SizeArgs): Size {
    const [w, h] = toWH(args)
    return this.grow(-w, -h)
  }

  grow(size: Size): Size
  grow(_: {width: number; height: number}): Size
  grow(_: [number, number]): Size
  grow(width: number, height: number): Size
  grow(...args: SizeArgs): Size {
    const [w, h] = toWH(args)
    return new Size(Math.max(0, this.width + w), Math.max(0, this.height + h))
  }

  /**
   * Expand the width, but only increase the height if the new height is taller than
   * the previous height.
   */
  growWidth(size: Size): Size
  growWidth(_: {width: number; height: number}): Size
  growWidth(_: [number, number]): Size
  growWidth(width: number): Size
  growWidth(...args: SizeArgs | [number]): Size {
    if (args.length === 1 && typeof args[0] === 'number') {
      return this.grow(args[0], 0)
    }

    const [w, h] = toWH(args as SizeArgs)
    return new Size(Math.max(this.width + w), Math.max(this.height, h))
  }

  /**
   * Expand the height, but only increase the width if the new width is taller than
   * the previous width.
   */
  growHeight(size: Size): Size
  growHeight(_: {width: number; height: number}): Size
  growHeight(_: [number, number]): Size
  growHeight(height: number): Size
  growHeight(...args: SizeArgs | [number]): Size {
    if (args.length === 1 && typeof args[0] === 'number') {
      return this.grow(0, args[0])
    }

    const [w, h] = toWH(args as SizeArgs)
    return new Size(Math.max(this.width, w), Math.max(this.height + h))
  }

  /**
   * Restricts width to a maximum size (width must be <= maxWidth)
   */
  maxWidth(maxWidth: number): Size {
    return new Size(Math.min(maxWidth, this.width), this.height)
  }

  /**
   * Restricts height to a maximum size (height must be <= maxHeight)
   */
  maxHeight(maxHeight: number): Size {
    return new Size(this.width, Math.min(maxHeight, this.height))
  }

  /**
   * Restricts width to a minimum size (width must be >= minWidth)
   */
  minWidth(minWidth: number): Size {
    return new Size(Math.max(minWidth, this.width), this.height)
  }

  /**
   * Restricts height to a minimum size (height must be >= minHeight)
   */
  minHeight(minHeight: number): Size {
    return new Size(this.width, Math.max(minHeight, this.height))
  }

  /**
   * Assigns width
   */
  withWidth(value: number): Size {
    return new Size(value, this.height)
  }

  /**
   * Assigns height
   */
  withHeight(value: number): Size {
    return new Size(this.width, value)
  }

  /**
   * Restricts size to a maximum size (size must be <= maxSize)
   */

  max(...args: SizeArgs): Size {
    const [w, h] = toWH(args)
    return new Size(Math.min(w, this.width), Math.min(h, this.height))
  }

  /**
   * Restricts size to a minimum size (size must be >= minSize)
   */

  min(...args: SizeArgs): Size {
    const [w, h] = toWH(args)
    return new Size(Math.max(w, this.width), Math.max(h, this.height))
  }

  abs(): Size {
    if (this.width >= 0 && this.height >= 0) {
      return this
    } else {
      return new Size(Math.abs(this.width), Math.abs(this.height))
    }
  }

  get isEmpty() {
    return this.width === 0 || this.height === 0
  }
}

interface MutableSize extends Size {
  width: number
  height: number
}

export class Rect {
  readonly origin: Point
  readonly size: Size

  static zero = new Rect(Point.zero, Size.zero)

  constructor(origin: PointArg, size: SizeArg) {
    let [x, y] = toXY([origin])
    let [width, height] = toWH([size])
    if (width < 0) {
      x = x + width
      width = -width
    }
    if (height < 0) {
      y = y + height
      height = -height
    }
    this.origin = new Point(x, y)
    this.size = new Size(width, height)
  }

  atX(value: number): Rect {
    return new Rect([value, this.origin.y], this.size)
  }

  atY(value: number): Rect {
    return new Rect([this.origin.x, value], this.size)
  }

  at(...value: PointArgs): Rect {
    return new Rect(toXY(value), this.size)
  }

  offset(point: Point): Rect
  offset(_: {x: number; y: number}): Rect
  offset(_: [number, number]): Rect
  offset(x: number, y: number): Rect
  offset(...args: PointArgs) {
    const [x, y] = toXY(args)
    return new Rect(this.origin.offset(x, y), this.size)
  }

  withWidth(value: number): Rect {
    return new Rect(this.origin, [value, this.size.height])
  }

  withHeight(value: number): Rect {
    return new Rect(this.origin, [this.size.width, value])
  }

  withSize(...value: SizeArgs): Rect {
    return new Rect(this.origin, toWH(value))
  }

  copy() {
    return new Rect(this.origin.copy(), this.size.copy())
  }

  mutableCopy() {
    return this.copy() as MutableRect
  }

  isEqual(rect: Rect) {
    return this.origin.isEqual(rect.origin) && this.size.isEqual(rect.size)
  }

  get isEmpty() {
    return this.size.isEmpty
  }

  includes(point: Point) {
    return (
      point.x >= this.minX() &&
      point.x < this.maxX() &&
      point.y >= this.minY() &&
      point.y < this.maxY()
    )
  }

  intersection(rect: Rect): Rect {
    const minX = Math.max(this.minX(), rect.minX())
    const minY = Math.max(this.minY(), rect.minY())
    const width = Math.min(this.maxX(), rect.maxX()) - minX
    const height = Math.min(this.maxY(), rect.maxY()) - minY
    return new Rect(new Point(minX, minY), new Size(width, height))
  }

  inset(...args: InsetArgs) {
    const [top, right, bottom, left] = toInset(args)
    return new Rect(
      this.min().offset(left, top),
      this.size.abs().shrink(left + right, top + bottom),
    )
  }

  min(): Point {
    return new Point(this.minX(), this.minY())
  }
  max(): Point {
    return new Point(this.maxX(), this.maxY())
  }
  minX(): number {
    return this.origin.x
  }
  maxX(): number {
    return this.origin.x + this.size.width
  }
  minY(): number {
    return this.origin.y
  }
  maxY(): number {
    return this.origin.y + this.size.height
  }

  forEachPoint(fn: (point: Point) => void) {
    const minX = this.minX(),
      maxX = this.maxX(),
      minY = this.minY(),
      maxY = this.maxY()
    let pt = Point.zero.mutableCopy()
    for (let x = minX; x < maxX; ++x)
      for (let y = minY; y < maxY; ++y) {
        pt.x = x
        pt.y = y
        fn(pt)
      }
  }
}

export interface MutableRect extends Rect {
  origin: MutablePoint
  size: MutableSize
}

export function interpolate(
  x: number,
  [x0, x1]: [number, number],
  [y0, y1]: [number, number],
  clamp?: boolean,
): number {
  if (x0 === x1) {
    return y0
  }

  let ret = y0 + ((x - x0) * (y1 - y0)) / (x1 - x0)
  if (clamp) {
    const min = Math.min(y0, y1)
    const max = Math.max(y0, y1)
    ret = Math.min(max, Math.max(min, ret))
  }
  return ret
}

export type Mutable<T extends Point | Size | Rect> = T extends Point
  ? MutablePoint
  : T extends Size
    ? MutableSize
    : T extends Rect
      ? MutableRect
      : never

type PointArg = [number, number] | Pick<Point, 'x' | 'y'>
type PointArgs = [number, number] | [PointArg]

type SizeArg = [number, number] | Pick<Size, 'width' | 'height'>
type SizeArgs = [number, number] | [SizeArg]

export type Edge = 'top' | 'right' | 'bottom' | 'left'

// all | [all] | [tops, sides] | [top, sides, bottom] | [top, right, bottom, left]
// or {top?: number, bottom, left, right}
type InsetArg =
  | number
  | [number]
  | [number, number]
  | [number, number, number]
  | [number, number, number, number]
  | {[K in Edge]?: number}
type InsetArgs =
  | [InsetArg]
  | [number, number]
  | [number, number, number]
  | [number, number, number, number]

function toXY(args: PointArgs): [number, number] {
  if (args.length === 2) {
    return args
  } else {
    const [arg] = args
    if (Array.isArray(arg)) {
      return [arg[0], arg[1]]
    } else {
      return [arg.x, arg.y]
    }
  }
}

function toWH(args: SizeArgs): [number, number] {
  if (args.length === 2) {
    return args
  } else {
    const [arg] = args
    if (Array.isArray(arg)) {
      return [arg[0], arg[1]]
    } else {
      return [arg.width, arg.height]
    }
  }
}

function toInset(args: InsetArgs): [number, number, number, number] {
  if (args.length > 1) {
    return toInset([
      args as
        | [number, number]
        | [number, number, number]
        | [number, number, number, number],
    ])
  } else {
    const [arg] = args
    if (typeof arg === 'number') {
      return [arg, arg, arg, arg]
    } else if (Array.isArray(arg)) {
      const numbers = arg as number[]
      const [a, b, c, d] = numbers
      switch (numbers.length) {
        case 4:
          return [a, b, c, d]
        case 3:
          return [a, b, c, b]
        case 2:
          return [a, b, a, b]
        case 1:
          return [a, a, a, a]
        default:
          return [0, 0, 0, 0]
      }
    } else {
      return [arg.top ?? 0, arg.right ?? 0, arg.bottom ?? 0, arg.left ?? 0]
    }
  }
}
