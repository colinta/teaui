import {View} from '../View.js'

export class TickManager {
  #onRender: () => void
  #tickTimer: ReturnType<typeof setInterval> | undefined
  #tickViews: Set<View> = new Set()
  #needsRender = false

  constructor(onRender: () => void) {
    this.#onRender = onRender
  }

  reset() {
    this.#tickViews = new Set()
  }

  beginRender() {
    this.#needsRender = false
  }

  endRender() {
    if (this.#tickViews.size || this.#needsRender) {
      this.#start()
    } else {
      this.#stop()
    }
  }

  stop() {
    this.#needsRender = false
    this.#stop()
  }

  #start() {
    if (this.#tickTimer) {
      return
    }

    let prevTime = Date.now()
    this.#tickTimer = setInterval(() => {
      const nextTime = Date.now()
      this.triggerTick(nextTime - (prevTime ?? nextTime))
      prevTime = nextTime
    }, 16)
  }

  #stop() {
    if (!this.#tickTimer) {
      return
    }

    clearInterval(this.#tickTimer)
    this.#tickTimer = undefined
  }

  registerTick(view: View) {
    this.#tickViews.add(view)
  }

  needsRender() {
    this.#needsRender = true
    this.#start()
  }

  triggerTick(dt: number) {
    let needsRender = this.#needsRender
    for (const view of this.#tickViews) {
      needsRender = view.receiveTick(dt) || needsRender
    }

    if (needsRender) {
      this.#onRender()
    }
  }
}
