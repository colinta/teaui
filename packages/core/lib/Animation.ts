import type {View} from './View.js'
import {getEasingFunction, type Easing} from './Easing.js'

export type {
  EaseCurve,
  Easing,
  EasingFunction,
  EasingName,
  InOut,
} from './Easing.js'
export type AnimationDirection = 1 | -1

export interface AnimationProps<TView extends View = View> {
  /**
   * Applies an interpolated value to a view. `time` is the elapsed time in the
   * current loop, in seconds.
   */
  apply: (view: TView, value: number, time: number) => void
  /** Duration of one loop, in seconds. Defaults to 1. */
  duration?: number
  /** Whether to restart from the beginning after each loop. Defaults to false. */
  loops?: boolean
  /** Whether to alternate direction between loops. Defaults to false. */
  reverse?: boolean
  /** Initial value. Defaults to 0. */
  start?: number
  /** Final value. Defaults to 1. */
  end?: number
  /** Named or custom easing. Defaults to `'none'` (linear interpolation). */
  easing?: Easing
  /** Whether to create the animation in a stopped state. Defaults to false. */
  paused?: boolean
}

/**
 * A reusable animation that can be attached to any number of views.
 *
 * Animations start automatically unless `paused` is true. Attaching a view
 * applies the current value immediately; subsequent frames are driven by the
 * view's Screen tick loop.
 */
export class Animation<TView extends View = View> {
  #apply: AnimationProps<TView>['apply']
  readonly #views = new Set<TView>()

  #duration: number
  #loops: boolean
  #reverse: boolean
  #direction: AnimationDirection = 1
  #easing: Easing
  #start: number
  #end: number
  #current: number
  #time = 0
  #isRunning = true
  #lastTick: object | undefined

  constructor(props: AnimationProps<TView>)
  constructor(views: Iterable<TView>, props: AnimationProps<TView>)
  constructor(
    viewsOrProps: Iterable<TView> | AnimationProps<TView>,
    props?: AnimationProps<TView>,
  ) {
    const views = props ? (viewsOrProps as Iterable<TView>) : []
    const options = props ?? (viewsOrProps as AnimationProps<TView>)

    this.#apply = options.apply
    this.#duration = options.duration ?? 1
    this.#loops = options.loops ?? false
    this.#reverse = options.reverse ?? false
    this.#easing = options.easing ?? 'none'
    this.#start = options.start ?? 0
    this.#end = options.end ?? 1
    this.#current = this.#start
    this.#isRunning = !(options.paused ?? false)

    this.#assertValidDuration(this.#duration)
    for (const view of views) {
      view.addAnimation(this)
    }
  }

  get apply(): AnimationProps<TView>['apply'] {
    return this.#apply
  }

  set apply(value: AnimationProps<TView>['apply']) {
    this.#apply = value
  }

  get current(): number {
    return this.#current
  }

  /** Elapsed time in the current loop, in seconds. */
  get time(): number {
    return this.#time
  }

  get isRunning(): boolean {
    return this.#isRunning
  }

  get duration(): number {
    return this.#duration
  }

  set duration(value: number) {
    this.#assertValidDuration(value)
    this.#duration = value
  }

  get loops(): boolean {
    return this.#loops
  }

  set loops(value: boolean) {
    this.#loops = value
  }

  get reverse(): boolean {
    return this.#reverse
  }

  set reverse(value: boolean) {
    this.#reverse = value
  }

  /** The current direction of travel. Preserved when stopped and resumed. */
  get direction(): AnimationDirection {
    return this.#direction
  }

  get easing(): Easing {
    return this.#easing
  }

  set easing(value: Easing) {
    this.#easing = value
  }

  /** The numeric start value. */
  get startValue(): number {
    return this.#start
  }

  /**
   * Calling `start()` resumes from `current`; calling `start(false)` restarts
   * from `startValue`. Assigning a number resets the start value and immediately
   * applies it. The callable getter and numeric setter allow both
   * `animation.start()` and `animation.start = 0`.
   */
  get start(): (resume?: boolean) => this {
    return (resume = true) => {
      this.#isRunning = true
      if (resume) {
        this.#invalidateViews()
      } else {
        this.#time = 0
        this.#direction = 1
        this.#current = this.#start
        this.#applyToViews()
      }
      return this
    }
  }

  set start(value: number) {
    this.#start = value
    this.#time = 0
    this.#direction = 1
    this.#current = value
    this.#applyToViews()
  }

  get end(): number {
    return this.#end
  }

  /**
   * While running, retargets the animation from its current value and restarts
   * its elapsed time. While stopped, only changes the destination value.
   */
  set end(value: number) {
    if (this.#isRunning) {
      this.#start = this.#current
      this.#time = 0
      this.#direction = 1
    }
    this.#end = value
  }

  /** Pauses at the current value. */
  stop(): this {
    this.#isRunning = false
    this.#invalidateViews()
    return this
  }

  /** Stops a running animation, or resumes a stopped one from `current`. */
  toggle(): this {
    return this.#isRunning ? this.stop() : this.start()
  }

  /** @internal Use `view.addAnimation()` instead. */
  _addView(view: TView) {
    if (this.#views.has(view)) {
      return
    }

    this.#views.add(view)
    this.#applyToView(view)
  }

  /** @internal Use `view.removeAnimation()` instead. */
  _removeView(view: TView) {
    this.#views.delete(view)
    view.invalidateRender()
  }

  /**
   * Advances once per Screen tick, even when several attached views receive
   * that tick. The tick token is unique to each TickManager.triggerTick call.
   *
   * @internal
   */
  _tick(dt: number, tick: object): boolean {
    if (this.#lastTick === tick) {
      return true
    }
    this.#lastTick = tick

    this.#time += dt / 1000
    if (this.#time >= this.#duration) {
      if (this.#loops) {
        const completedLoops = Math.floor(this.#time / this.#duration)
        this.#time %= this.#duration
        if (this.#reverse && completedLoops % 2 === 1) {
          this.#direction = this.#direction === 1 ? -1 : 1
        } else if (!this.#reverse) {
          this.#direction = 1
        }
      } else {
        this.#time = this.#duration
        this.#isRunning = false
      }
    }

    const progress = this.#time / this.#duration
    const eased = getEasingFunction(this.#easing)(progress)
    const from = this.#direction === 1 ? this.#start : this.#end
    this.#current = from + this.#direction * (this.#end - this.#start) * eased
    this.#applyToViews()
    return true
  }

  #applyToViews() {
    for (const view of this.#views) {
      this.#applyToView(view)
    }
  }

  #applyToView(view: TView) {
    this.#apply(view, this.#current, this.#time)
    view.invalidateRender()
  }

  #invalidateViews() {
    for (const view of this.#views) {
      view.invalidateRender()
    }
  }

  #assertValidDuration(duration: number) {
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new RangeError(
        'Animation duration must be a positive finite number',
      )
    }
  }
}

/** An animation typed for this view, or a generic animation usable by any view. */
export type AnimationFor<TView extends View> =
  | Animation<TView>
  | Animation<View>
