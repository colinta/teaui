import { describe, it, expect } from 'vitest'
import { CursorController } from '../src/cursor.js'
import { CSI, ESC } from '../src/ansi.js'

describe('CursorController', () => {
  function makeController() {
    let output = ''
    const write = (s: string) => {
      output += s
    }
    const cursor = new CursorController(write)
    return { cursor, getOutput: () => output }
  }

  it('moveTo writes absolute position', () => {
    const { cursor, getOutput } = makeController()
    cursor.moveTo(5, 10)
    expect(getOutput()).toBe(`${CSI}11;6H`)
  })

  it('moveBy writes relative movement', () => {
    const { cursor, getOutput } = makeController()
    cursor.moveBy(3, -2)
    expect(getOutput()).toBe(`${CSI}2A${CSI}3C`)
  })

  it('up/down/forward/back', () => {
    const { cursor, getOutput } = makeController()
    cursor.up(2).down(3).forward(1).back(4)
    expect(getOutput()).toBe(`${CSI}2A${CSI}3B${CSI}1C${CSI}4D`)
  })

  it('nextLine/prevLine', () => {
    const { cursor, getOutput } = makeController()
    cursor.nextLine(1).prevLine(2)
    expect(getOutput()).toBe(`${CSI}1E${CSI}2F`)
  })

  it('column', () => {
    const { cursor, getOutput } = makeController()
    cursor.column(5)
    expect(getOutput()).toBe(`${CSI}6G`)
  })

  it('save/restore (DEC)', () => {
    const { cursor, getOutput } = makeController()
    cursor.save().restore()
    expect(getOutput()).toBe(`${ESC}7${ESC}8`)
  })

  it('show/hide', () => {
    const { cursor, getOutput } = makeController()
    cursor.show().hide()
    expect(getOutput()).toBe(`${CSI}?25h${CSI}?25l`)
  })

  it('shape', () => {
    const { cursor, getOutput } = makeController()
    cursor.shape('bar')
    expect(getOutput()).toBe(`${CSI}6 q`)
  })

  it('returns this for chaining', () => {
    const { cursor } = makeController()
    const result = cursor.moveTo(0, 0).up(1).down(1).save().restore()
    expect(result).toBe(cursor)
  })
})
