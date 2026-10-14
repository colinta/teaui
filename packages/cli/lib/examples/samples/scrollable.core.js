import {Screen, Scrollable, Stack, Text} from '@teaui/core'

const items = Array.from(
  {length: 10},
  (_, index) => new Text({text: `Item ${index + 1}: scroll to reveal`}),
)
const vertical = Scrollable.down({
  width: 40,
  height: 4,
  scrollable: 'vertical',
  showScrollbars: 'vertical',
  children: items,
})
const horizontal = Scrollable.right({
  width: 40,
  height: 2,
  gap: 2,
  scrollable: 'horizontal',
  showScrollbars: 'horizontal',
  children: [
    new Text({width: 20, text: 'One: 0123456789ABCDE'}),
    new Text({width: 20, text: 'Two: abcdefghijklmno'}),
    new Text({width: 20, text: 'Three: QRSTUVWXYZabc'}),
  ],
})
const grid = Array.from(
  {length: 8},
  (_, index) => `.....Row ${index + 1}: ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789`,
).join('\n')
const both = new Scrollable({
  width: 40,
  height: 4,
  direction: 'down',
  scrollable: 'both',
  showScrollbars: true,
  contentSize: {width: 60, height: 8},
  child: new Text({width: 60, height: 8, wrap: false, text: grid}),
})
const hidden = Scrollable.down({
  width: 40,
  height: 3,
  scrollable: 'vertical',
  showScrollbars: false,
  children: Array.from(
    {length: 6},
    (_, index) => new Text({text: `Quiet item ${index + 1}`}),
  ),
})

const examples = Stack.down({
  width: 40,
  height: 17,
  children: [
    new Text('Vertical: reveal item 7'),
    vertical,
    new Text('Horizontal: scrollBy(22, 0)'),
    horizontal,
    new Text('Both axes: scrollBy(5, 2)'),
    both,
    new Text('No scrollbar: advancePage(1)'),
    hidden,
  ],
})

const [screen] = await Screen.start(examples)

// Public scrolling APIs need the initial layout; redraw without timers.
vertical.scrollBy(0, 2)
vertical.scrollTo(items[6])
horizontal.scrollBy(22, 0)
both.scrollBy(5, 2)
hidden.advancePage(1)
screen.render()
