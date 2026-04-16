import {describe, it, expect} from 'vitest'
import {testRender} from '../../lib/TestScreen.js'
import {At} from '../../lib/components/At.js'
import {Text} from '../../lib/components/Text.js'
import {Space} from '../../lib/components/Space.js'
import {ZStack} from '../../lib/components/ZStack.js'
import {TrackMouse} from '../../lib/components/utility/TrackMouse.js'
import {performance} from 'node:perf_hooks'

const WIDTH = 200
const HEIGHT = 60
const N = 100

function makeAtChildren() {
  return [
    At.topLeft([new Text({text: 'top-left'})]),
    At.topCenter([new Text({text: 'top-center'})]),
    At.topRight([new Text({text: 'top-right'})]),
    At.left([new Text({text: 'left'})]),
    At.center([new Text({text: 'center'})]),
    At.right([new Text({text: 'right'})]),
    At.bottomLeft([new Text({text: 'bottom-left'})]),
    At.bottomCenter([new Text({text: 'bottom-center'})]),
    At.bottomRight([new Text({text: 'bottom-right'})]),
  ]
}

function benchMouseMoves(view: TrackMouse): number {
  const t = testRender(view, {width: WIDTH, height: HEIGHT})

  // warm up
  for (let i = 0; i < 10; i++) {
    t.sendMouse('mouse.move.in', {x: i % WIDTH, y: i % HEIGHT})
  }

  const start = performance.now()
  for (let i = 0; i < N; i++) {
    t.sendMouse('mouse.move.in', {x: i % WIDTH, y: i % HEIGHT})
  }
  const elapsed = performance.now() - start

  return elapsed / N
}

describe('At performance', () => {
  it(`renders ${N} mouse moves at ${WIDTH}×${HEIGHT}`, () => {
    const withSpace = benchMouseMoves(
      new TrackMouse({
        child: new ZStack({
          children: [new Space({background: '#333'}), ...makeAtChildren()],
        }),
      }),
    )

    const withoutSpace = benchMouseMoves(
      new TrackMouse({
        child: new ZStack({
          children: makeAtChildren(),
        }),
      }),
    )

    console.info(`With Space:    ${withSpace.toFixed(3)} ms/move`)
    console.info(`Without Space: ${withoutSpace.toFixed(3)} ms/move`)
    console.info(`Ratio:         ${(withSpace / withoutSpace).toFixed(2)}x`)

    // The Space background should not make rendering more than 3× slower.
    expect(withSpace / withoutSpace).toBeLessThan(3)
  }, 60_000)
})
