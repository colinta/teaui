import {afterEach, describe, expect, it, vi} from 'vitest'
import React, {useLayoutEffect, useRef, useState} from 'react'
import {Screen, Size, TestProgram, Text as CoreText, Window} from '@teaui/core'
import {render} from '../lib/reconciler.js'
import {
  TextBatch,
  TextContainer,
  TextLiteral,
  TextProvider,
} from '../lib/components/TextReact.js'

const cleanups: (() => void)[] = []
afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) {
    cleanup()
  }
  vi.restoreAllMocks()
})
function mount(element: React.ReactNode, width = 37, height = 9) {
  const program = new TestProgram({cols: width, rows: height})
  const window = new Window()
  const screen = new Screen(program, window)
  screen.start()
  const unmount = render(screen, window, element)
  cleanups.push(() => {
    unmount()
    screen.stop()
  })
  return {program, window, screen, unmount}
}
function textGroup(values: string[], textBatch?: TextBatch) {
  const container = new TextContainer(textBatch)
  const literals = values.map(value => new TextLiteral(value))
  for (const literal of literals) {
    container.add(literal)
  }
  container.invalidateNodes()
  return {container, literals}
}
const settle = () => new Promise(resolve => setTimeout(resolve, 0))

describe('text commit batching', () => {
  it('materializes a group once for many mutations, while retaining generated Text identity', () => {
    const textBatch = new TextBatch()
    const {container, literals} = textGroup(
      Array.from({length: 29}, (_, i) => `${i},`),
      textBatch,
    )
    const generated = container.children[0]
    const serialized = vi.spyOn(literals[0], 'styledText')
    const finish = textBatch.begin()
    try {
      for (const literal of literals) {
        literal.text = literal.text.toUpperCase() + '!'
      }
      expect(serialized).not.toHaveBeenCalled()
    } finally {
      finish()
    }
    expect(serialized).toHaveBeenCalledOnce()
    expect(container.children[0]).toBe(generated)
    expect((generated as CoreText).text).toBe(
      literals.map(literal => literal.text).join(''),
    )
    finish() // Closing is idempotent.
    expect(serialized).toHaveBeenCalledOnce()
  })

  it('keeps imperative changes synchronous outside a commit', () => {
    const {container, literals} = textGroup(['old'])
    const generated = container.children[0] as CoreText
    literals[0].text = 'new'
    expect(generated.text).toBe('new')
  })

  it('flushes on children/measurement reads during a commit and invalidates ancestor size caches', () => {
    const textBatch = new TextBatch()
    const {container, literals} = textGroup(['a'], textBatch)
    const parent = new TextProvider({})
    parent.add(container)
    const available = new Size(91, 7)
    expect(parent.naturalSize(available).width).toBe(1)
    const finish = textBatch.begin()
    try {
      literals[0].text = 'longer'
      expect((container.children[0] as CoreText).text).toBe('longer')
      expect(parent.naturalSize(available).width).toBe(6)
      literals[0].text = '界界'
      expect(parent.naturalSize(available).width).toBe(4)
    } finally {
      finish()
    }
  })

  it('flushes nested scopes independently without losing the outer pending work', () => {
    const textBatch = new TextBatch()
    const outer = textGroup(['a'], textBatch)
    const inner = textGroup(['b'], textBatch)
    const outerText = outer.container.children[0] as CoreText
    const innerText = inner.container.children[0] as CoreText
    const finishOuter = textBatch.begin()
    try {
      outer.literals[0].text = 'outer'
      const finishInner = textBatch.begin()
      try {
        inner.literals[0].text = 'inner'
      } finally {
        finishInner()
      }
      expect(innerText.text).toBe('inner')
      expect(outerText.text).toBe('a')
    } finally {
      finishOuter()
    }
    expect(outerText.text).toBe('outer')
  })

  it('isolates batches belonging to separate roots', () => {
    const firstBatch = new TextBatch()
    const secondBatch = new TextBatch()
    const first = textGroup(['a'], firstBatch)
    const second = textGroup(['b'], secondBatch)
    const firstText = first.container.children[0] as CoreText
    const secondText = second.container.children[0] as CoreText
    const finishFirst = firstBatch.begin()
    const finishSecond = secondBatch.begin()
    first.literals[0].text = 'first'
    second.literals[0].text = 'second'
    finishSecond()
    expect(secondText.text).toBe('second')
    expect(firstText.text).toBe('a')
    finishFirst()
    expect(firstText.text).toBe('first')
  })

  it('restores immediate updates after a materialization failure', () => {
    const textBatch = new TextBatch()
    const first = textGroup(['a'], textBatch)
    const second = textGroup(['b'], textBatch)
    const generated = second.container.children[0] as CoreText
    vi.spyOn(first.literals[0], 'styledText').mockImplementationOnce(() => {
      throw new Error('text failure')
    })
    const finish = textBatch.begin()
    first.literals[0].text = 'broken'
    second.literals[0].text = 'pending'
    expect(finish).toThrow('text failure')
    second.literals[0].text = 'recovered'
    expect(generated.text).toBe('recovered')
  })

  it('makes the final materialized children available to layout effects', async () => {
    let setValue!: (value: string) => void
    const observed: string[] = []
    function App() {
      const [value, update] = useState('before')
      setValue = update
      const ref = useRef<TextProvider>(null)
      useLayoutEffect(() => {
        const container = ref.current!.children[0] as TextContainer
        observed.push((container.children[0] as CoreText).text)
      }, [value])
      return <tui-text ref={ref}>{value}</tui-text>
    }
    const target = mount(<App />)
    await settle()
    setValue('after')
    await settle()
    expect(observed).toEqual(['before', 'after'])
    expect(target.program.terminal.textContent()).toContain('after')
  })

  it.each([17, 43, 79])(
    'matches clean renders through structural/style updates at width %i',
    async width => {
      let update!: (phase: number) => void
      function Content({phase}: {phase: number}) {
        const ids = phase % 2 ? [5, 1, 8, 3, 0] : [0, 1, 2, 3, 5, 8]
        return (
          <tui-stack direction="down">
            <tui-text
              wrap={phase % 3 !== 0}
              alignment={phase % 2 ? 'right' : 'left'}
              foreground={phase % 2 ? 'yellow' : undefined}
            >
              <tui-style
                bold={phase % 2 === 0}
                background={phase % 2 ? 'blue' : undefined}
              >
                {ids.map(id => (
                  <tui-style
                    key={id}
                    foreground={id % 2 ? 'green' : 'red'}
                    italic={phase % 3 === 0}
                  >
                    {phase === 3 && id === 1 ? '' : ` ${id}:界e\u0301🙂 `}
                  </tui-style>
                ))}
              </tui-style>
              {phase % 2 ? (
                <tui-text key="embedded" bold>
                  embedded
                </tui-text>
              ) : null}
              <tui-text foreground={phase % 2 ? undefined : 'cyan'}>
                nested {phase}
              </tui-text>
              tail {phase}
            </tui-text>
          </tui-stack>
        )
      }
      function App() {
        const [phase, setPhase] = useState(0)
        update = setPhase
        return <Content phase={phase} />
      }
      const target = mount(<App />, width, 12)
      await settle()
      for (const phase of [1, 2, 3, 4, 0]) {
        update(phase)
        await settle()
        const fresh = mount(<Content phase={phase} />, width, 12)
        await settle()
        expect(target.screen.snapshot()).toBe(fresh.screen.snapshot())
      }
    },
  )

  it('preserves generated text for child-only updates but rebuilds changed provider configuration', async () => {
    let setState!: (state: {text: string; wrap: boolean}) => void
    function App() {
      const [state, update] = useState({text: 'before', wrap: false})
      setState = update
      return <tui-text wrap={state.wrap}>{state.text}</tui-text>
    }
    const target = mount(<App />)
    await settle()
    const provider = target.window.children[0] as TextProvider
    const container = provider.children[0] as TextContainer
    const generated = container.children[0] as CoreText
    setState({text: 'after', wrap: false})
    await settle()
    expect(container.children[0]).toBe(generated)
    expect(generated.text).toBe('after')
    setState({text: 'after', wrap: true})
    await settle()
    expect(container.children[0]).not.toBe(generated)
    expect((container.children[0] as CoreText).text).toBe('after')
  })

  it('coalesces actual host mutations without rebuilding each unchanged sibling', async () => {
    let update!: (value: number) => void
    function App() {
      const [value, setValue] = useState(0)
      update = setValue
      return (
        <tui-text>
          {Array.from({length: 47}, (_, i) => (
            <tui-style
              key={i}
              foreground={value ? 'green' : 'red'}
            >{`${i}`}</tui-style>
          ))}
        </tui-text>
      )
    }
    mount(<App />, 83, 4)
    await settle()
    const serialize = vi.spyOn(TextLiteral.prototype, 'styledText')
    update(1)
    await settle()
    // The parent provider may also be refreshed. A per-cell full-group rebuild
    // would serialize 47*47 nodes; at most a few complete passes should be needed.
    expect(serialize.mock.calls.length).toBeLessThanOrEqual(47 * 3)
  })
})
