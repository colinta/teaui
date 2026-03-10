import {describe, it, expect} from 'vitest'
import {StyleBuilder} from '../src/style.js'
import {CSI} from '../src/ansi.js'

describe('StyleBuilder', () => {
  it('creates empty style by default', () => {
    const s = new StyleBuilder()
    expect(s.open()).toBe('')
    expect(s.close()).toBe('')
    expect(s.wrap('hello')).toBe('hello')
  })

  it('is immutable — methods return new instances', () => {
    const a = new StyleBuilder()
    const b = a.bold()
    expect(a).not.toBe(b)
    expect(a.open()).toBe('')
    expect(b.open()).toBe(`${CSI}1m`)
  })

  it('supports bold', () => {
    const s = new StyleBuilder().bold()
    expect(s.open()).toBe(`${CSI}1m`)
    expect(s.close()).toBe(`${CSI}22m`)
  })

  it('supports dim', () => {
    const s = new StyleBuilder().dim()
    expect(s.open()).toBe(`${CSI}2m`)
    expect(s.close()).toBe(`${CSI}22m`)
  })

  it('supports italic', () => {
    const s = new StyleBuilder().italic()
    expect(s.open()).toBe(`${CSI}3m`)
    expect(s.close()).toBe(`${CSI}23m`)
  })

  it('supports underline', () => {
    const s = new StyleBuilder().underline()
    expect(s.open()).toBe(`${CSI}4m`)
    expect(s.close()).toBe(`${CSI}24m`)
  })

  it('supports strikethrough', () => {
    const s = new StyleBuilder().strikethrough()
    expect(s.open()).toBe(`${CSI}9m`)
    expect(s.close()).toBe(`${CSI}29m`)
  })

  it('supports inverse', () => {
    const s = new StyleBuilder().inverse()
    expect(s.open()).toBe(`${CSI}7m`)
    expect(s.close()).toBe(`${CSI}27m`)
  })

  it('supports named fg color', () => {
    const s = new StyleBuilder().fg('red')
    expect(s.open()).toBe(`${CSI}31m`)
    expect(s.close()).toBe(`${CSI}39m`)
  })

  it('supports named bg color', () => {
    const s = new StyleBuilder().bg('blue')
    expect(s.open()).toBe(`${CSI}44m`)
    expect(s.close()).toBe(`${CSI}49m`)
  })

  it('supports RGB fg color', () => {
    const s = new StyleBuilder().fg({r: 255, g: 0, b: 128})
    expect(s.open()).toBe(`${CSI}38;2;255;0;128m`)
    expect(s.close()).toBe(`${CSI}39m`)
  })

  it('supports 256 bg color', () => {
    const s = new StyleBuilder().bg({index: 196})
    expect(s.open()).toBe(`${CSI}48;5;196m`)
    expect(s.close()).toBe(`${CSI}49m`)
  })

  it('chains multiple attributes', () => {
    const s = new StyleBuilder().bold().fg('red').bg('white')
    expect(s.open()).toBe(`${CSI}1m${CSI}31m${CSI}47m`)
    expect(s.close()).toBe(`${CSI}49m${CSI}39m${CSI}22m`)
  })

  it('wrap applies open + text + close', () => {
    const s = new StyleBuilder().bold()
    expect(s.wrap('hello')).toBe(`${CSI}1mhello${CSI}22m`)
  })

  it('wrap with multiple attributes', () => {
    const s = new StyleBuilder().bold().italic()
    expect(s.wrap('hi')).toBe(`${CSI}1m${CSI}3mhi${CSI}23m${CSI}22m`)
  })
})
