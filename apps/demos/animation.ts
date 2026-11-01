import {Animation, Box, Stack, Text, Toggle} from '@teaui/core'
import {demo} from './demo.js'

const DISTANCE = 30
const traveler = new Text({text: '●', purpose: 'primary'})
const animateX = new Animation<Text>({
  apply(view, progress) {
    view.x = Math.round(progress * DISTANCE)
  },
  duration: 2,
  loops: true,
  reverse: true,
  easing: 'none',
})

const boxA = new Box({
  border: 'rounded',
  title: 'A',
  width: 10,
  height: 6,
})
const animateA = new Animation<Box>({
  apply(view, progress) {
    view.y = Math.round(progress * 16)
  },
  duration: 1,
  loops: true,
  reverse: true,
  easing: 'ease-out-bounce',
})

const boxC = new Box({
  border: 'single',
  title: 'C',
})
const boxB = new Box({
  border: 'rounded',
  title: 'B',
  width: 24,
  height: 20,
  child: boxC,
})
const animatePadding = new Animation<Box>({
  apply(view, progress) {
    view.padding = {
      top: Math.round(progress * 8),
      bottom: Math.round(progress * 8),
      left: Math.round(progress * 5),
      right: Math.round(progress * 5),
    }
  },
  duration: 1,
  loops: true,
  reverse: true,
  easing: 'none',
})

traveler.addAnimation(animateX)
boxA.addAnimation(animateA)
boxC.addAnimation(animatePadding)
const animations = [animateX, animateA, animatePadding]

const paused = new Toggle({
  value: true,
  onChange(running) {
    for (const animation of animations) {
      if (running) {
        animation.start()
      } else {
        animation.stop()
      }
    }
  },
})
const reverse = new Toggle({
  value: animateX.reverse,
  onChange(value) {
    for (const animation of animations) {
      animation.reverse = value
    }
  },
})

demo(
  Stack.down({
    gap: 1,
    padding: 1,
    children: [
      new Text({text: 'Reusable Core Animation'}),
      Stack.right({
        gap: 1,
        children: [paused, new Text({text: 'Animate'})],
      }),
      Stack.right({
        gap: 1,
        children: [reverse, new Text({text: 'Reverse'})],
      }),
      Stack.down({
        width: DISTANCE + 1,
        children: [traveler],
      }),
      Stack.right({
        gap: 2,
        children: [Stack.down([boxA]), boxB],
      }),
    ],
  }),
)
