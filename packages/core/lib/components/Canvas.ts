import type {Viewport} from '../Viewport.js'
import type {Props as ViewProps} from '../View.js'
import {View} from '../View.js'
import {Point, Size} from '../geometry.js'

// Braille bit mapping for (px % 2, py % 4)
// Each terminal cell is a 2×4 pixel grid
const BRAILLE_BITS = [
  [0x01, 0x02, 0x04, 0x40], // dx=0: dots 1,2,3,7
  [0x08, 0x10, 0x20, 0x80], // dx=1: dots 4,5,6,8
]

interface Props extends ViewProps {
  /**
   * Called during render after the pixel buffer has been sized. Use this to draw
   * shapes that depend on the canvas dimensions (pixelWidth/pixelHeight).
   * The canvas is cleared before each call.
   */
  draw?: (canvas: Canvas) => void
}

export class Canvas extends View {
  #cellCols: number = 0
  #cellRows: number = 0
  #pixels: Uint8Array = new Uint8Array(0)
  #draw: ((canvas: Canvas) => void) | undefined

  constructor(props: Props = {}) {
    super(props)
    this.#update(props)
  }

  update(props: Props) {
    this.#update(props)
    super.update(props)
  }

  #update({draw}: Props) {
    this.#draw = draw
  }

  get pixelWidth(): number {
    return this.#cellCols * 2
  }

  get pixelHeight(): number {
    return this.#cellRows * 4
  }

  naturalSize(available: Size): Size {
    return available
  }

  /**
   * Render the canvas into the viewport. If a `draw` callback is set, the pixel
   * buffer is cleared and the callback is invoked after sizing. External callers
   * (e.g. LineChart) can also use `withContext` to draw into the canvas at a
   * specific size without needing a full render cycle.
   */
  render(viewport: Viewport) {
    if (viewport.isEmpty) {
      return
    }

    const cols = viewport.contentSize.width
    const rows = viewport.contentSize.height
    this.#ensureSize(cols, rows)

    if (this.#draw) {
      this.#pixels.fill(0)
      this.#draw(this)
    }

    const style = this.theme.text()

    viewport.visibleRect.forEachPoint(pt => {
      const cellIndex = pt.y * this.#cellCols + pt.x
      const bits = this.#pixels[cellIndex] ?? 0
      const char = String.fromCharCode(0x2800 | bits)
      viewport.write(char, pt, style)
    })
  }

  /**
   * Size the pixel buffer, clear it, and invoke the callback. This is the safe way
   * to draw into a Canvas programmatically — the buffer is guaranteed to be sized
   * before any drawing occurs.
   *
   * @param cols  Terminal columns (pixelWidth will be cols * 2)
   * @param rows  Terminal rows (pixelHeight will be rows * 4)
   * @param fn    Drawing function — call set/line/rect/circle/etc. on the canvas
   */
  withContext(cols: number, rows: number, fn: (canvas: Canvas) => void) {
    this.#ensureSize(cols, rows)
    this.#pixels.fill(0)
    fn(this)
  }

  #ensureSize(cols: number, rows: number) {
    if (cols !== this.#cellCols || rows !== this.#cellRows) {
      const newPixels = new Uint8Array(cols * rows)
      // Copy existing data
      const minCols = Math.min(cols, this.#cellCols)
      const minRows = Math.min(rows, this.#cellRows)
      for (let y = 0; y < minRows; y++) {
        for (let x = 0; x < minCols; x++) {
          newPixels[y * cols + x] = this.#pixels[y * this.#cellCols + x]
        }
      }
      this.#pixels = newPixels
      this.#cellCols = cols
      this.#cellRows = rows
    }
  }

  #setPixel(px: number, py: number): void {
    if (px < 0 || py < 0) return
    const cellX = Math.floor(px / 2)
    const cellY = Math.floor(py / 4)
    if (cellX >= this.#cellCols || cellY >= this.#cellRows) return

    const bit = BRAILLE_BITS[px % 2][py % 4]
    this.#pixels[cellY * this.#cellCols + cellX] |= bit
  }

  #unsetPixel(px: number, py: number): void {
    if (px < 0 || py < 0) return
    const cellX = Math.floor(px / 2)
    const cellY = Math.floor(py / 4)
    if (cellX >= this.#cellCols || cellY >= this.#cellRows) return

    const bit = BRAILLE_BITS[px % 2][py % 4]
    this.#pixels[cellY * this.#cellCols + cellX] &= ~bit
  }

  set(px: number, py: number): void {
    this.#setPixel(px, py)
    this.invalidateRender()
  }

  unset(px: number, py: number): void {
    this.#unsetPixel(px, py)
    this.invalidateRender()
  }

  toggle(px: number, py: number): void {
    if (this.isSet(px, py)) {
      this.#unsetPixel(px, py)
    } else {
      this.#setPixel(px, py)
    }
    this.invalidateRender()
  }

  isSet(px: number, py: number): boolean {
    if (px < 0 || py < 0) return false
    const cellX = Math.floor(px / 2)
    const cellY = Math.floor(py / 4)
    if (cellX >= this.#cellCols || cellY >= this.#cellRows) return false

    const bit = BRAILLE_BITS[px % 2][py % 4]
    return (this.#pixels[cellY * this.#cellCols + cellX] & bit) !== 0
  }

  clear(): void {
    this.#pixels.fill(0)
    this.invalidateRender()
  }

  line(x0: number, y0: number, x1: number, y1: number): void {
    this.#drawLine(x0, y0, x1, y1)
    this.invalidateRender()
  }

  rect(x: number, y: number, w: number, h: number): void {
    if (w <= 0 || h <= 0) return

    this.#drawLine(x, y, x + w - 1, y) // top
    this.#drawLine(x, y + h - 1, x + w - 1, y + h - 1) // bottom
    this.#drawLine(x, y, x, y + h - 1) // left
    this.#drawLine(x + w - 1, y, x + w - 1, y + h - 1) // right
    this.invalidateRender()
  }

  fillRect(x: number, y: number, w: number, h: number): void {
    for (let py = y; py < y + h; py++) {
      for (let px = x; px < x + w; px++) {
        this.#setPixel(px, py)
      }
    }
    this.invalidateRender()
  }

  circle(cx: number, cy: number, r: number): void {
    if (r <= 0) return
    this.#drawCircle(cx, cy, r)
    this.invalidateRender()
  }

  fillCircle(cx: number, cy: number, r: number): void {
    if (r <= 0) return
    for (let dy = -r; dy <= r; dy++) {
      const dx = Math.floor(Math.sqrt(r * r - dy * dy))
      for (let px = cx - dx; px <= cx + dx; px++) {
        this.#setPixel(px, cy + dy)
      }
    }
    this.invalidateRender()
  }

  // Bresenham's line algorithm
  #drawLine(x0: number, y0: number, x1: number, y1: number): void {
    const dx = Math.abs(x1 - x0)
    const dy = Math.abs(y1 - y0)
    const sx = x0 < x1 ? 1 : -1
    const sy = y0 < y1 ? 1 : -1
    let err = dx - dy
    let x = x0
    let y = y0

    while (true) {
      this.#setPixel(x, y)
      if (x === x1 && y === y1) break

      const e2 = 2 * err
      if (e2 > -dy) {
        err -= dy
        x += sx
      }
      if (e2 < dx) {
        err += dx
        y += sy
      }
    }
  }

  // Midpoint circle algorithm
  #drawCircle(cx: number, cy: number, r: number): void {
    let x = 0
    let y = r
    let d = 1 - r

    this.#plotCircle8(cx, cy, x, y)

    while (x < y) {
      x++
      if (d < 0) {
        d += 2 * x + 1
      } else {
        y--
        d += 2 * (x - y) + 1
      }
      this.#plotCircle8(cx, cy, x, y)
    }
  }

  #plotCircle8(cx: number, cy: number, x: number, y: number): void {
    this.#setPixel(cx + x, cy + y)
    this.#setPixel(cx - x, cy + y)
    this.#setPixel(cx + x, cy - y)
    this.#setPixel(cx - x, cy - y)
    this.#setPixel(cx + y, cy + x)
    this.#setPixel(cx - y, cy + x)
    this.#setPixel(cx + y, cy - x)
    this.#setPixel(cx - y, cy - x)
  }
}
