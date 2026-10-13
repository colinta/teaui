import {At, Button, Progress, Spinner, Stack, Text, ZStack} from '@teaui/core'

import {demo} from './demo.js'

const horizontalProgressViews: Progress[] = []
const verticalProgressViews: Progress[] = []

horizontalProgressViews.push(
  new Progress({
    direction: 'horizontal',
    width: 'fill',
    height: 5,
    value: 0,
    purpose: 'cancel',
  }),
)

horizontalProgressViews.push(
  new Progress({
    direction: 'horizontal',
    width: 'fill',
    height: 2,
    value: 0,
    purpose: 'secondary',
  }),
)

horizontalProgressViews.push(
  new Progress({
    direction: 'horizontal',
    width: 'fill',
    height: 1,
    value: 0,
    purpose: 'primary',
  }),
)

verticalProgressViews.push(
  new Progress({
    direction: 'vertical',
    width: 5,
    height: 20,
    value: 0,
    purpose: 'proceed',
  }),
)

verticalProgressViews.push(
  new Progress({
    direction: 'vertical',
    width: 2,
    height: 20,
    value: 0,
  }),
)

verticalProgressViews.push(
  new Progress({
    direction: 'vertical',
    width: 1,
    height: 20,
    value: 0,
    purpose: 'selected',
  }),
)

const progressViews = [...horizontalProgressViews, ...verticalProgressViews]

class Timer {
  timerId: ReturnType<typeof setInterval> | undefined
  delta = 1
  value = 0

  constructor() {}

  toggle() {
    if (this.timerId) {
      this.stop()
    } else {
      this.start()
    }
  }

  start() {
    if (this.timerId) {
      return
    }

    this.timerId = setInterval(() => {
      this.value += this.delta
      if (this.value === 110) {
        this.delta = -1
      } else if (this.value === -10) {
        this.delta = 1
      }
      this.#update()
    }, 10)
  }

  #update() {
    for (const progress of progressViews) {
      progress.value = this.value
    }
  }

  stop() {
    if (!this.timerId) {
      return
    }

    clearInterval(this.timerId)
    this.timerId = undefined
  }

  incr() {
    this.value = Math.min(100, this.value + 1)
    this.#update()
  }

  decr() {
    this.value = Math.max(0, this.value - 1)
    this.#update()
  }
}

const timer = new Timer()
timer.start()

const spinners = Stack.right(
  [
    Stack.down([new Text({text: 'Dots'}), new Spinner({style: 'dots', padding: 1})]),
    Stack.down([new Text({text: 'Bounce'}), new Spinner({style: 'bounce', purpose: 'orange'})]),
    Stack.down([new Text({text: 'Loop'}), new Spinner({style: 'loop', purpose: 'green'})]),
    Stack.down([new Text({text: 'KITT'}), new Spinner({style: 'kitt', purpose: 'red'})]),
  ],
  {gap: 2, padding: 1},
)

const decrButton = new Button({
  title: '-',
  onClick() {
    timer.decr()
  },
})

const incrButton = new Button({
  title: '+',
  onClick() {
    timer.incr()
  },
})

const pauseButton = new Button({
  title: 'Pause',
  onClick() {
    timer.toggle()
  },
})

demo(
  Stack.down([
    ...horizontalProgressViews,
    Stack.right([
      ...verticalProgressViews,
      spinners
    ]),
    Stack.right([decrButton, pauseButton, incrButton]),
  ]),
)
