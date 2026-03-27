import {Box, Canvas, Digits, Space, Stack, Style, Text} from '@teaui/core'
import type {Viewport} from '@teaui/core'

import {demo} from './demo.js'

const ANALOG_CLOCK_WIDTH = 48
const ANALOG_CLOCK_HEIGHT = ANALOG_CLOCK_WIDTH / 2
const CLOCK_PADDING = 2
const CENTER_RADIUS = 1
const FULL_TURN = Math.PI * 2
const QUARTER_TURN = Math.PI / 2
const HOUR_HAND_TIP_RATIO = 0.75
const HOUR_HAND_BASE_RATIO = 0.1
const MINUTE_HAND_WIDTH_RATIO = 0.04
const MS_HAND_LENGTH_RATIO = 0.5

function pad(n: number, len: number): string {
  return String(n).padStart(len, '0')
}

function formatClock(now: Date): string {
  const date = `${now.getFullYear()}/${pad(now.getMonth() + 1, 2)}/${pad(now.getDate(), 2)}`
  const time = `${pad(now.getHours(), 2)}:${pad(now.getMinutes(), 2)}:${pad(now.getSeconds(), 2)}.${pad(now.getMilliseconds(), 3)}`
  return `${date}\n${time}`
}

class Clock extends Digits {
  constructor() {
    super({text: formatClock(new Date())})
  }

  receiveTick(_dt: number): boolean {
    this.text = formatClock(new Date())
    return true
  }

  render(viewport: Viewport) {
    viewport.registerTick()
    super.render(viewport)
  }
}

class AnalogClock extends Canvas {
  receiveTick(_dt: number): boolean {
    return true
  }

  render(viewport: Viewport) {
    viewport.registerTick()
    super.render(viewport)
  }
}

const analogClock = new AnalogClock({
  width: ANALOG_CLOCK_WIDTH,
  height: ANALOG_CLOCK_HEIGHT,
  draw(canvas) {
    const now = new Date()
    const cx = Math.floor(canvas.pixelWidth / 2)
    const cy = Math.floor(canvas.pixelHeight / 2)
    const radius = Math.max(1, Math.min(cx, cy) - CLOCK_PADDING)

    canvas.circle(cx, cy, radius)

    const hourAngle =
      (((now.getHours() % 12) + now.getMinutes() / 60) / 12) * FULL_TURN -
      QUARTER_TURN
    const minuteAngle =
      ((now.getMinutes() + now.getSeconds() / 60) / 60) * FULL_TURN -
      QUARTER_TURN
    const secondAngle = (now.getSeconds() / 60) * FULL_TURN - QUARTER_TURN
    const msAngle = (now.getMilliseconds() / 1000) * FULL_TURN - QUARTER_TURN

    drawHourHand(canvas, cx, cy, radius, hourAngle)
    drawRectHand(canvas, cx, cy, radius, minuteAngle, MINUTE_HAND_WIDTH_RATIO)
    drawLineHand(canvas, cx, cy, radius, secondAngle)
    drawLineHand(
      canvas,
      cx,
      cy,
      Math.floor(radius * MS_HAND_LENGTH_RATIO),
      msAngle,
    )
    canvas.fillCircle(cx, cy, CENTER_RADIUS)
  },
})

function drawHourHand(
  canvas: Canvas,
  cx: number,
  cy: number,
  radius: number,
  angle: number,
) {
  const forward = pointOnRay(cx, cy, radius * HOUR_HAND_TIP_RATIO, angle)
  const base = pointOnRay(cx, cy, radius * HOUR_HAND_BASE_RATIO, angle)
  const offset = perpendicularOffset(radius * HOUR_HAND_BASE_RATIO, angle)
  const points = [
    {x: cx, y: cy},
    {x: base.x + offset.x, y: base.y + offset.y},
    forward,
    {x: base.x - offset.x, y: base.y - offset.y},
  ]

  fillPolygon(canvas, points)
}

function drawRectHand(
  canvas: Canvas,
  cx: number,
  cy: number,
  radius: number,
  angle: number,
  widthRatio: number,
) {
  const tip = pointOnRay(cx, cy, radius, angle)
  const offset = perpendicularOffset(radius * widthRatio, angle)
  const points = [
    {x: cx + offset.x, y: cy + offset.y},
    {x: tip.x + offset.x, y: tip.y + offset.y},
    {x: tip.x - offset.x, y: tip.y - offset.y},
    {x: cx - offset.x, y: cy - offset.y},
  ]

  fillPolygon(canvas, points)
}

function drawLineHand(
  canvas: Canvas,
  cx: number,
  cy: number,
  radius: number,
  angle: number,
) {
  const tip = pointOnRay(cx, cy, radius, angle)
  canvas.line(cx, cy, tip.x, tip.y)
}

type Point = {
  x: number
  y: number
}

function pointOnRay(
  cx: number,
  cy: number,
  length: number,
  angle: number,
): Point {
  return {
    x: Math.round(cx + Math.cos(angle) * length),
    y: Math.round(cy + Math.sin(angle) * length),
  }
}

function perpendicularOffset(length: number, angle: number): Point {
  return {
    x: Math.round(Math.cos(angle + QUARTER_TURN) * length),
    y: Math.round(Math.sin(angle + QUARTER_TURN) * length),
  }
}

function fillPolygon(canvas: Canvas, points: Point[]) {
  const minX = Math.floor(Math.min(...points.map(point => point.x)))
  const maxX = Math.ceil(Math.max(...points.map(point => point.x)))
  const minY = Math.floor(Math.min(...points.map(point => point.y)))
  const maxY = Math.ceil(Math.max(...points.map(point => point.y)))

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (isPointInPolygon(x, y, points)) {
        canvas.set(x, y)
      }
    }
  }

  for (let index = 0; index < points.length; index++) {
    const start = points[index]
    const end = points[(index + 1) % points.length]
    canvas.line(start.x, start.y, end.x, end.y)
  }
}

function isPointInPolygon(x: number, y: number, points: Point[]): boolean {
  let inside = false

  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i]
    const b = points[j]
    const intersects =
      a.y > y !== b.y > y &&
      x <= ((b.x - a.x) * (y - a.y)) / (b.y - a.y || 1) + a.x

    if (intersects) {
      inside = !inside
    }
  }

  return inside
}

const label = new Text({
  text: 'Press ⌃q to quit',
  style: new Style({foreground: 'white'}),
})

demo(
  Stack.down({
    children: [
      Stack.right({
        children: [
          Stack.down([
            new Box({
              border: 'rounded',
              child: new Clock(),
              width: 'natural',
              height: 'natural',
            }),
            new Space({flex: 1}),
          ]),
          new Box({
            border: 'rounded',
            child: analogClock,
            width: 'natural',
            height: 'natural',
          }),
        ],
      }),
      label,
    ],
  }),
  false,
)
