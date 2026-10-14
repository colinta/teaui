import React, {createRef} from 'react'
import {Scrollable, Stack, Text, run} from '@teaui/react'

const vertical = createRef<React.ElementRef<typeof Scrollable.down>>()
const target = createRef<React.ElementRef<typeof Text>>()
const horizontal = createRef<React.ElementRef<typeof Scrollable.right>>()
const both = createRef<React.ElementRef<typeof Scrollable.down>>()
const hidden = createRef<React.ElementRef<typeof Scrollable.down>>()
const grid = Array.from(
  {length: 8},
  (_, index) => `.....Row ${index + 1}: ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789`,
).join('\n')

const [screen] = await run(
  <Stack.down width={40} height={17}>
    <Text>Vertical: reveal item 7</Text>
    <Scrollable.down
      ref={vertical}
      width={40}
      height={4}
      scrollable="vertical"
      showScrollbars="vertical"
    >
      {Array.from({length: 10}, (_, index) => (
        <Text key={index} ref={index === 6 ? target : undefined}>
          {`Item ${index + 1}: scroll to reveal`}
        </Text>
      ))}
    </Scrollable.down>
    <Text>Horizontal: scrollBy(22, 0)</Text>
    <Scrollable.right
      ref={horizontal}
      width={40}
      height={2}
      gap={2}
      scrollable="horizontal"
      showScrollbars="horizontal"
    >
      <Text width={20}>One: 0123456789ABCDE</Text>
      <Text width={20}>Two: abcdefghijklmno</Text>
      <Text width={20}>Three: QRSTUVWXYZabc</Text>
    </Scrollable.right>
    <Text>Both axes: scrollBy(5, 2)</Text>
    {/* Scrollable forwards refs at runtime; its base public props omit ref. */}
    <Scrollable
      {...{ref: both}}
      width={40}
      height={4}
      direction="down"
      scrollable="both"
      showScrollbars={true}
      contentSize={{width: 60, height: 8}}
    >
      <Text width={60} height={8} wrap={false}>
        {grid}
      </Text>
    </Scrollable>
    <Text>No scrollbar: advancePage(1)</Text>
    <Scrollable.down
      ref={hidden}
      width={40}
      height={3}
      scrollable="vertical"
      showScrollbars={false}
    >
      {Array.from({length: 6}, (_, index) => (
        <Text key={index}>{`Quiet item ${index + 1}`}</Text>
      ))}
    </Scrollable.down>
  </Stack.down>,
)

// Public scrolling APIs need the initial layout; redraw without timers.
vertical.current!.scrollBy(0, 2)
vertical.current!.scrollTo(target.current!)
horizontal.current!.scrollBy(22, 0)
both.current!.scrollBy(5, 2)
hidden.current!.advancePage(1)
screen.render()
