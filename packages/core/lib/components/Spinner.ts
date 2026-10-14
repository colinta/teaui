import type {Viewport} from '../Viewport.js'
import type {Props as ViewProps} from '../View.js'
import {View} from '../View.js'
import {Point, Size} from '../geometry.js'

export type SpinnerStyle = 'dots' | 'bounce' | 'loop' | 'kitt' | 'snake'

interface Props extends ViewProps {
  isAnimating?: boolean
  style?: SpinnerStyle
}

export class Spinner extends View {
  #isAnimating = false
  #style: SpinnerStyle = 'dots'
  #tick = 0
  #frame = 0

  constructor({isAnimating, style, ...props}: Props = {}) {
    super(props)
    this.#update({isAnimating, style})
  }

  update({isAnimating, style, ...props}: Props) {
    super.update(props)
    this.#update({isAnimating, style})
  }

  get isAnimating() {
    return this.#isAnimating
  }
  set isAnimating(value: boolean) {
    if (value === this.#isAnimating) {
      return
    }

    this.#isAnimating = value
    this.invalidateRender()
  }

  get style() {
    return this.#style
  }
  set style(value: SpinnerStyle) {
    if (value === this.#style) {
      return
    }

    this.#style = value
    this.#tick = 0
    this.#frame = 0
    this.invalidateSize()
  }

  #update({isAnimating, style}: Props) {
    this.#isAnimating = isAnimating ?? true
    const nextStyle = style ?? 'dots'
    if (nextStyle !== this.#style) {
      this.#style = nextStyle
      this.#tick = 0
      this.#frame = 0
    }
  }

  naturalSize(_available: Size) {
    return SPINNER_SIZES[this.#style]
  }

  receiveTick(dt: number) {
    this.#tick = this.#tick + dt
    const HZ = this.#style === 'kitt' ? FAST_HZ : SLOW_HZ
    if (this.#tick > HZ) {
      this.#tick %= HZ
      this.#frame = (this.#frame + 1) % SPINNER_FRAMES[this.#style].length
    }

    return true
  }

  render(viewport: Viewport) {
    if (this.#isAnimating) {
      viewport.registerTick()
    }

    if (viewport.isEmpty) {
      return
    }

    const textStyle = this.purpose.text({tone: 'accent'})
    viewport.usingPen(textStyle, () => {
      const frame = SPINNER_FRAMES[this.#style][this.#frame]
      frame
        .split('\n')
        .forEach((line, y) => viewport.write(line, new Point(0, y)))
    })
  }
}

const DOTS = ['⣾', '⣷', '⣯', '⣟', '⡿', '⢿', '⣻', '⣽'] as const
const LOOP = [
  ' ▀▀▀ ',
  ' ▝▀▀▘',
  '  ▀▀▀',
  '  ▝▀▜',
  '   ▀█',
  '   ▐█',
  '   ▄█',
  '  ▗▄▟',
  '  ▄▄▄',
  ' ▗▄▄▖',
  ' ▄▄▄ ',
  '▗▄▄▖ ',
  '▄▄▄  ',
  '▙▄▖  ',
  '█▄   ',
  '█▌   ',
  '█▀   ',
  '▛▀▘  ',
  '▀▀▀  ',
  '▝▀▀▘ ',
] as const
const BOUNCE = [
  `
▄ ▄ ▄`,
  `
▀ ▄ ▄`,
  `▄
  ▄ ▄`,
  `
▀ ▀ ▄`,
  `  ▄
▄   ▄`,
  `
▄ ▀ ▀`,
  `    ▄
▄ ▄  `,
  `
▄ ▄ ▀`,
  `
▄ ▄ ▄`,
  `
▄ ▄ ▄`,
] as const

const KITT = [
  '━━     ',
  '╼━╸    ',
  '─━━    ',
  '─╼━╸   ',
  '╶─━━   ',
  ' ─╼━╸  ',
  ' ╶─━━  ',
  '  ─╼━╸ ',
  '  ╶─━━ ',
  '   ─╼━╸',
  '   ╶─━━',
  '    ─╼━',
  '    ╶╼━',
  '     ╼━',
  '     ╺━',
  '     ╺━',
  '     ╺━',
  '     ╺━',
  '     ━━',
  '    ╺━╾',
  '    ━━─',
  '   ╺━╾─',
  '   ━━─╴',
  '  ╺━╾─ ',
  '  ━━─╴ ',
  ' ╺━╾─  ',
  ' ━━─╴  ',
  '╺━╾─   ',
  '━━─╴   ',
  '━╾─    ',
  '━╾╴    ',
  '━╾     ',
  '━╸     ',
  '━╸     ',
  '━╸     ',
  '━╸     ',
] as const

const SNAKE = [
  `╶─╴\n   \n  •`,
  ` ─┐\n   \n  •`,
  ` ╶┐\n  ╵\n  •`,
  `  ┐\n  │\n  •`,
  `• ╷\n  │\n  ╵`,
  `•  \n  │\n  ┘`,
  `•  \n  ╷\n ╶┘`,
  `•  \n   \n └┘`,
  `•  \n ╷ \n └╴`,
  `•  \n ┐ \n └ `,
  `•  \n ┐ \n └ `,
  `•  \n╶┐ \n ╵ `,
  `•  \n└┐ \n   `,
  `╷  \n└╴ \n  •`,
  `┌  \n└  \n  •`,
  `┌╴ \n╵  \n  •`,
  `┌─ \n   \n  •`,
] as const

const SPINNER_FRAMES: Record<SpinnerStyle, readonly string[]> = {
  dots: DOTS,
  bounce: BOUNCE,
  loop: LOOP,
  kitt: KITT,
  snake: SNAKE,
}
const SPINNER_SIZES: Record<SpinnerStyle, Size> = {
  dots: new Size(1, 1),
  bounce: new Size(5, 2),
  loop: new Size(5, 1),
  kitt: new Size(7, 1),
  snake: new Size(3, 3),
}
const SLOW_HZ = 1000 / 10
const FAST_HZ = 1000 / 20
