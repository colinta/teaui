import {EventEmitter} from 'node:events'
import {describe, expect, it, vi} from 'vitest'
import {CSI} from '../src/ansi.js'
import {FullscreenTerminal, InlineTerminal} from '../src/application.js'

function makeOutput() {
  let output = ''
  return {
    stream: {
      columns: 80,
      rows: 24,
      write(value: string) {
        output += value
        return true
      },
    },
    getOutput: () => output,
    clearOutput: () => {
      output = ''
    },
  }
}

function makeInput(): NodeJS.ReadableStream {
  return new EventEmitter() as NodeJS.ReadableStream
}

describe('application terminals', () => {
  it('owns the fullscreen application lifecycle', () => {
    const output = makeOutput()
    const terminal = new FullscreenTerminal({
      stdout: output.stream as NodeJS.WriteStream,
      stdin: makeInput(),
    })

    terminal.setup()

    expect(output.getOutput()).toContain(`${CSI}?1049h`)
    expect(output.getOutput()).toContain(`${CSI}2J`)

    output.clearOutput()
    terminal.teardown()

    expect(output.getOutput()).toContain(`${CSI}?1049l`)
  })

  it('owns inline setup, logical movement, and teardown', async () => {
    const output = makeOutput()
    const terminal = new InlineTerminal({
      stdout: output.stream as NodeJS.WriteStream,
      stdin: makeInput(),
      height: 9,
    })
    vi.spyOn(terminal, 'startInput').mockReturnValue(terminal)
    vi.spyOn(terminal, 'reserveRows').mockResolvedValue({x: 0, y: 12})
    const enterApplication = vi
      .spyOn(terminal, 'enterApplication')
      .mockReturnValue(terminal)
    vi.spyOn(terminal, 'flushWrites').mockReturnValue(terminal)

    await terminal.setup()

    expect(terminal.rows).toBe(9)
    expect(terminal.region).toEqual({
      originY: 12,
      originKnown: true,
      height: 9,
      configuredHeight: 9,
    })
    expect(enterApplication).toHaveBeenCalledWith({
      mouse: true,
      hideCursor: true,
      focusEvents: true,
    })

    terminal.moveTo(3, 2)
    expect(output.getOutput()).toBe(`${CSI}15;4H`)

    const exitApplication = vi
      .spyOn(terminal, 'exitApplication')
      .mockReturnValue(terminal)
    const moveTo = vi.spyOn(terminal, 'moveTo').mockReturnValue(terminal)
    const clearRows = vi.spyOn(terminal, 'clearRows').mockReturnValue(terminal)
    const stopInput = vi.spyOn(terminal, 'stopInput').mockReturnValue(terminal)

    terminal.teardown()

    expect(exitApplication).toHaveBeenCalledOnce()
    expect(moveTo).toHaveBeenCalledWith(0, 0)
    expect(clearRows).toHaveBeenCalledWith(9)
    expect(stopInput).toHaveBeenCalledOnce()
  })

  it('reclamps height and refreshes the origin after resize', async () => {
    const output = makeOutput()
    const terminal = new InlineTerminal({
      stdout: output.stream as NodeJS.WriteStream,
      stdin: makeInput(),
      height: 9,
    })
    vi.spyOn(terminal, 'startInput').mockReturnValue(terminal)
    const reserveRows = vi
      .spyOn(terminal, 'reserveRows')
      .mockResolvedValueOnce({x: 0, y: 12})
      .mockResolvedValueOnce({x: 0, y: 3})
      .mockResolvedValueOnce({x: 0, y: 7})
    vi.spyOn(terminal, 'enterApplication').mockReturnValue(terminal)
    vi.spyOn(terminal, 'flushWrites').mockReturnValue(terminal)

    await terminal.setup()
    const onResize = vi.fn()
    const unsubscribe = terminal.onResize(onResize)

    output.stream.rows = 5
    process.stdout.emit('resize')
    await vi.waitFor(() => expect(onResize).toHaveBeenCalledTimes(1))

    expect(terminal.rows).toBe(5)
    expect(terminal.region.originY).toBe(3)
    expect(reserveRows).toHaveBeenLastCalledWith(
      9,
      undefined,
      expect.any(Function),
    )

    output.stream.rows = 20
    process.stdout.emit('resize')
    await vi.waitFor(() => expect(onResize).toHaveBeenCalledTimes(2))

    expect(terminal.rows).toBe(9)
    expect(terminal.region.originY).toBe(7)

    unsubscribe()
  })

  it('recomputes a dynamic height when the terminal is resized', async () => {
    const output = makeOutput()
    const height = vi.fn(({columns}: {columns: number}) =>
      columns >= 80 ? 3 : 6,
    )
    const terminal = new InlineTerminal({
      stdout: output.stream as NodeJS.WriteStream,
      stdin: makeInput(),
      height,
    })
    vi.spyOn(terminal, 'startInput').mockReturnValue(terminal)
    const reserveRows = vi
      .spyOn(terminal, 'reserveRows')
      .mockResolvedValueOnce({x: 0, y: 12})
      .mockResolvedValueOnce({x: 0, y: 8})
      .mockResolvedValueOnce({x: 0, y: 10})
    const clearRows = vi.spyOn(terminal, 'clearRows').mockReturnValue(terminal)
    vi.spyOn(terminal, 'enterApplication').mockReturnValue(terminal)
    vi.spyOn(terminal, 'flushWrites').mockReturnValue(terminal)

    await terminal.setup()
    expect(terminal.rows).toBe(3)
    expect(reserveRows).toHaveBeenLastCalledWith(
      3,
      undefined,
      expect.any(Function),
    )

    const onResize = vi.fn()
    const unsubscribe = terminal.onResize(onResize)
    output.stream.columns = 40
    process.stdout.emit('resize')
    await vi.waitFor(() => expect(onResize).toHaveBeenCalledOnce())

    expect(height).toHaveBeenLastCalledWith({columns: 40, rows: 24})
    expect(terminal.rows).toBe(6)
    expect(reserveRows).toHaveBeenLastCalledWith(
      6,
      undefined,
      expect.any(Function),
    )
    expect(clearRows).not.toHaveBeenCalled()

    output.stream.columns = 80
    process.stdout.emit('resize')
    await vi.waitFor(() => expect(onResize).toHaveBeenCalledTimes(2))

    expect(terminal.rows).toBe(3)
    expect(clearRows).toHaveBeenCalledWith(6)

    unsubscribe()
  })

  it('refreshes a dynamic height without a terminal resize', async () => {
    const output = makeOutput()
    let resolvedHeight = 2
    const terminal = new InlineTerminal({
      stdout: output.stream as NodeJS.WriteStream,
      stdin: makeInput(),
      height: () => resolvedHeight,
    })
    vi.spyOn(terminal, 'startInput').mockReturnValue(terminal)
    const reserveRows = vi
      .spyOn(terminal, 'reserveRows')
      .mockResolvedValue({x: 0, y: 12})
    const clearRows = vi.spyOn(terminal, 'clearRows').mockReturnValue(terminal)
    vi.spyOn(terminal, 'enterApplication').mockReturnValue(terminal)
    vi.spyOn(terminal, 'flushWrites').mockReturnValue(terminal)

    await terminal.setup()
    reserveRows.mockClear()

    expect(await terminal.refreshHeight()).toBe(false)
    expect(reserveRows).not.toHaveBeenCalled()

    resolvedHeight = 5
    expect(await terminal.refreshHeight()).toBe(true)
    expect(terminal.rows).toBe(5)
    expect(reserveRows).toHaveBeenLastCalledWith(
      5,
      undefined,
      expect.any(Function),
    )

    resolvedHeight = 3
    expect(await terminal.refreshHeight()).toBe(true)
    expect(terminal.rows).toBe(3)
    expect(clearRows).toHaveBeenCalledWith(5)
  })

  it('refreshes the origin without reserving rows on width-only resize', async () => {
    const output = makeOutput()
    const terminal = new InlineTerminal({
      stdout: output.stream as NodeJS.WriteStream,
      stdin: makeInput(),
      height: 9,
    })
    vi.spyOn(terminal, 'startInput').mockReturnValue(terminal)
    const reserveRows = vi
      .spyOn(terminal, 'reserveRows')
      .mockResolvedValue({x: 0, y: 12})
    const queryCursorPosition = vi
      .spyOn(terminal, 'queryCursorPosition')
      .mockResolvedValue({x: 0, y: 10})
    vi.spyOn(terminal, 'enterApplication').mockReturnValue(terminal)
    vi.spyOn(terminal, 'flushWrites').mockReturnValue(terminal)

    await terminal.setup()
    const onResize = vi.fn()
    const unsubscribe = terminal.onResize(onResize)

    output.stream.columns = 100
    process.stdout.emit('resize')
    await vi.waitFor(() => expect(onResize).toHaveBeenCalledOnce())

    expect(reserveRows).toHaveBeenCalledOnce()
    expect(queryCursorPosition).toHaveBeenCalledOnce()
    expect(terminal.region.originY).toBe(10)

    unsubscribe()
  })

  it('serializes a resize that arrives during setup', async () => {
    const output = makeOutput()
    const terminal = new InlineTerminal({
      stdout: output.stream as NodeJS.WriteStream,
      stdin: makeInput(),
      height: 9,
    })
    let finishSetupReservation: (origin: {
      x: number
      y: number
    }) => void = () => {}
    vi.spyOn(terminal, 'startInput').mockReturnValue(terminal)
    const reserveRows = vi
      .spyOn(terminal, 'reserveRows')
      .mockImplementationOnce(
        () =>
          new Promise(resolve => {
            finishSetupReservation = resolve
          }),
      )
      .mockResolvedValue({x: 0, y: 8})
    vi.spyOn(terminal, 'enterApplication').mockReturnValue(terminal)
    vi.spyOn(terminal, 'flushWrites').mockReturnValue(terminal)
    const onResize = vi.fn()
    const unsubscribe = terminal.onResize(onResize)

    const setup = terminal.setup()
    output.stream.rows = 10
    process.stdout.emit('resize')
    await Promise.resolve()

    expect(reserveRows).toHaveBeenCalledOnce()

    finishSetupReservation({x: 0, y: 12})
    await setup
    await vi.waitFor(() => expect(onResize).toHaveBeenCalledOnce())

    expect(reserveRows).toHaveBeenCalledTimes(2)
    unsubscribe()
  })

  it('does not reactivate after teardown interrupts setup', async () => {
    const output = makeOutput()
    const terminal = new InlineTerminal({
      stdout: output.stream as NodeJS.WriteStream,
      stdin: makeInput(),
      height: 9,
    })
    let finishReservation: (origin: {x: number; y: number}) => void = () => {}
    vi.spyOn(terminal, 'startInput').mockReturnValue(terminal)
    vi.spyOn(terminal, 'reserveRows').mockImplementation(
      () =>
        new Promise(resolve => {
          finishReservation = resolve
        }),
    )
    const enterApplication = vi.spyOn(terminal, 'enterApplication')
    const stopInput = vi.spyOn(terminal, 'stopInput').mockReturnValue(terminal)

    const setup = terminal.setup()
    terminal.teardown()
    finishReservation({x: 0, y: 12})
    await setup

    expect(enterApplication).not.toHaveBeenCalled()
    expect(stopInput).toHaveBeenCalledOnce()
  })

  it('does not clear unreserved rows after setup failure', async () => {
    const output = makeOutput()
    const terminal = new InlineTerminal({
      stdout: output.stream as NodeJS.WriteStream,
      stdin: makeInput(),
      height: 9,
    })
    const setupError = new Error('reservation failed')
    vi.spyOn(terminal, 'startInput').mockReturnValue(terminal)
    vi.spyOn(terminal, 'reserveRows').mockRejectedValue(setupError)
    const clearRows = vi.spyOn(terminal, 'clearRows')
    const stopInput = vi.spyOn(terminal, 'stopInput').mockReturnValue(terminal)

    await expect(terminal.setup()).rejects.toBe(setupError)
    terminal.teardown()
    terminal.teardown()

    expect(clearRows).not.toHaveBeenCalled()
    expect(stopInput).toHaveBeenCalledOnce()
  })

  it('tears fullscreen down only once', () => {
    const output = makeOutput()
    const terminal = new FullscreenTerminal({
      stdout: output.stream as NodeJS.WriteStream,
      stdin: makeInput(),
    })

    terminal.setup()
    terminal.teardown()
    output.clearOutput()
    terminal.teardown()

    expect(output.getOutput()).toBe('')
  })

  it('preserves the inline frame and starts a new line below it', async () => {
    const output = makeOutput()
    const terminal = new InlineTerminal({
      stdout: output.stream as NodeJS.WriteStream,
      stdin: makeInput(),
      height: 9,
      clearOnExit: false,
    })
    vi.spyOn(terminal, 'startInput').mockReturnValue(terminal)
    vi.spyOn(terminal, 'reserveRows').mockResolvedValue({x: 0, y: 12})
    vi.spyOn(terminal, 'enterApplication').mockReturnValue(terminal)
    const flushWrites = vi
      .spyOn(terminal, 'flushWrites')
      .mockReturnValue(terminal)

    await terminal.setup()
    flushWrites.mockClear()

    const exitApplication = vi
      .spyOn(terminal, 'exitApplication')
      .mockReturnValue(terminal)
    const moveTo = vi.spyOn(terminal, 'moveTo').mockReturnValue(terminal)
    const write = vi.spyOn(terminal, 'write').mockReturnValue(terminal)
    const clearRows = vi.spyOn(terminal, 'clearRows')
    const stopInput = vi.spyOn(terminal, 'stopInput').mockReturnValue(terminal)

    terminal.teardown()

    expect(exitApplication).toHaveBeenCalledOnce()
    expect(clearRows).not.toHaveBeenCalled()
    expect(moveTo).toHaveBeenCalledWith(0, 8)
    expect(write).toHaveBeenCalledWith('\r\n')
    expect(flushWrites).toHaveBeenCalledOnce()
    expect(stopInput).toHaveBeenCalledOnce()

    terminal.teardown()
    expect(exitApplication).toHaveBeenCalledOnce()
    expect(write).toHaveBeenCalledOnce()
    expect(stopInput).toHaveBeenCalledOnce()
  })
})
