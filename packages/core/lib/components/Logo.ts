import type {Viewport} from '../Viewport.js'
import type {Props as ViewProps} from '../View.js'
import {View} from '../View.js'
import {Style} from '../Style.js'
import {Point, Size} from '../geometry.js'
import {define} from '../util.js'

const WARM: [number, number, number] = [240, 223, 175]
const CYAN: [number, number, number] = [140, 208, 211]
const GRAY: [number, number, number] = [128, 128, 128]

type Span = {text: string; fg: [number, number, number]}

const BODY_LINES: Span[][] = [
  [
    {text: ' ┌────────┐', fg: WARM},
    {text: '──╮', fg: GRAY},
  ],
  [
    {text: ' │', fg: WARM},
    {text: '╼╼╼╼╼╼╼╼', fg: CYAN},
    {text: '│', fg: WARM},
    {text: '  │', fg: GRAY},
  ],
  [
    {text: ' │', fg: WARM},
    {text: ' TeaUI  ', fg: CYAN},
    {text: '│', fg: WARM},
    {text: '  │', fg: GRAY},
  ],
  [
    {text: ' │', fg: WARM},
    {text: '╼╼╼╼╼╼╼╼', fg: CYAN},
    {text: '│', fg: WARM},
    {text: '──╯', fg: GRAY},
  ],
  [{text: ' ╰▄▄▄▄▄▄▄▄╯   ', fg: WARM}],
]

const WIDTH = 16
const HEIGHT = 7

// Steam simulation constants
const STEAM_ROWS = 2 // character rows for steam
const STEAM_DOT_ROWS = STEAM_ROWS * 4 // braille rows
const STEAM_DOT_COLS = WIDTH * 2 // braille columns
const TICK_INTERVAL = 80 // ms per simulation step
const MAX_PARTICLES = 24
const PARTICLE_MAX_LIFE = 10
// Spawn zone (dot-columns) — above the mug opening
const SPAWN_MIN_X = 6
const SPAWN_MAX_X = 20

interface Particle {
  x: number // dot-column
  y: number // dot-row (0 = top, STEAM_DOT_ROWS-1 = bottom)
  life: number
}

// Braille dot offsets: [row][col]
// Each braille char is 2 dots wide × 4 dots tall
const BRAILLE_DOT = [
  [0x01, 0x08],
  [0x02, 0x10],
  [0x04, 0x20],
  [0x40, 0x80],
]

function steamToString(particles: Particle[]): string {
  // Build a dot grid
  const grid: boolean[][] = []
  for (let r = 0; r < STEAM_DOT_ROWS; r++) {
    grid[r] = new Array(STEAM_DOT_COLS).fill(false)
  }
  for (const p of particles) {
    if (p.x >= 0 && p.x < STEAM_DOT_COLS && p.y >= 0 && p.y < STEAM_DOT_ROWS) {
      grid[p.y][p.x] = true
    }
  }

  // Convert to braille characters
  const lines: string[] = []
  for (let cy = 0; cy < STEAM_ROWS; cy++) {
    let line = ''
    for (let cx = 0; cx < WIDTH; cx++) {
      let code = 0x2800
      for (let dr = 0; dr < 4; dr++) {
        for (let dc = 0; dc < 2; dc++) {
          const dotRow = cy * 4 + dr
          const dotCol = cx * 2 + dc
          if (
            dotRow < STEAM_DOT_ROWS &&
            dotCol < STEAM_DOT_COLS &&
            grid[dotRow][dotCol]
          ) {
            code += BRAILLE_DOT[dr][dc]
          }
        }
      }
      line += String.fromCharCode(code)
    }
    lines.push(line)
  }
  return lines.join('\n')
}

// Simple seedable RNG (xorshift32) so tests are deterministic when seeded
function makeRng(seed: number): () => number {
  let state = seed | 0 || 1
  return () => {
    state ^= state << 13
    state ^= state >> 17
    state ^= state << 5
    return (state >>> 0) / 0x100000000
  }
}

interface Props extends ViewProps {
  isAnimating?: boolean
  seed?: number
}

export class Logo extends View {
  #isAnimating: boolean = false
  #particles: Particle[] = []
  #elapsed: number = 0
  #rng: () => number

  constructor(props: Props = {}) {
    super(props)
    this.#rng = makeRng(props.seed ?? Date.now() ^ (Math.random() * 0x7fffffff))
    this.#update(props)

    define(this, 'isAnimating', {enumerable: true})
  }

  get isAnimating() {
    return this.#isAnimating
  }
  set isAnimating(value: boolean) {
    if (value === this.#isAnimating) return
    this.#isAnimating = value
    this.invalidateRender()
  }

  update(props: Props) {
    this.#update(props)
    super.update(props)
  }

  #update({isAnimating}: Props) {
    this.#isAnimating = isAnimating ?? false
  }

  naturalSize(_available: Size): Size {
    return new Size(WIDTH, HEIGHT)
  }

  receiveTick(dt: number): boolean {
    if (!this.#isAnimating) return false

    this.#elapsed += dt
    let stepped = false
    while (this.#elapsed >= TICK_INTERVAL) {
      this.#elapsed -= TICK_INTERVAL
      this.#step()
      stepped = true
    }
    return stepped
  }

  #step() {
    const rng = this.#rng

    // Move existing particles upward with random drift
    for (const p of this.#particles) {
      const r = rng()
      if (r < 0.15) {
        // drift left
        p.x -= 1
        p.y -= 1
      } else if (r < 0.3) {
        // drift right
        p.x += 1
        p.y -= 1
      } else if (r < 0.85) {
        // straight up
        p.y -= 1
      }
      // else: stay (pause for a tick)
      p.life -= 1
    }

    // Remove dead or out-of-bounds particles
    this.#particles = this.#particles.filter(
      p => p.life > 0 && p.y >= 0 && p.x >= 0 && p.x < STEAM_DOT_COLS,
    )

    // Spawn new particles at the bottom of the steam area
    if (this.#particles.length < MAX_PARTICLES) {
      const count = 1 + Math.floor(rng() * 2)
      for (let i = 0; i < count; i++) {
        this.#particles.push({
          x: SPAWN_MIN_X + Math.floor(rng() * (SPAWN_MAX_X - SPAWN_MIN_X)),
          y: STEAM_DOT_ROWS - 1,
          life: 3 + Math.floor(rng() * (PARTICLE_MAX_LIFE - 3)),
        })
      }
    }
  }

  render(viewport: Viewport) {
    if (this.#isAnimating) {
      viewport.registerTick()
    }

    // Render steam
    const steamStyle = new Style({foreground: GRAY})
    if (this.#isAnimating) {
      const steam = steamToString(this.#particles)
      const steamLines = steam.split('\n')
      for (let y = 0; y < steamLines.length; y++) {
        viewport.write(steamLines[y], new Point(0, y), steamStyle)
      }
    } else {
      // Static steam when not animating
      viewport.write('     ) ) )      ', new Point(0, 0), steamStyle)
      viewport.write('    ( ( (       ', new Point(0, 1), steamStyle)
    }

    // Render body
    for (let y = 0; y < BODY_LINES.length; y++) {
      let x = 0
      for (const span of BODY_LINES[y]) {
        const style = new Style({foreground: span.fg})
        viewport.write(span.text, new Point(x, y + STEAM_ROWS), style)
        x += span.text.length
      }
    }
  }
}
