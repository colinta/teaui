import {
  Accordion,
  AutoLegend,
  Box,
  Button,
  Checkbox,
  Collapsible,
  CollapsibleText,
  Digits,
  Drawer,
  Dropdown,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Stack,
  Input,
  Progress,
  Scrollable,
  Separator,
  Slider,
  Space,
  Spinner,
  Tabs,
  Text,
  ToggleGroup,
  Tree,
  type FontFamily,
  FontFamilies,
  bold,
  italic,
  underline,
  strikeout,
} from '@teaui/core'
import {inspect} from '@teaui/inspect'

import {demo} from './demo.js'

// Log,
// ScrollableList,

const OBJ = {
  word: 'something',
  tags: ['tag1', 'tag2', 'tag3', 'tag4'],
  sentences: {
    short: 'this is a short sentence.',
    medium: 'this is another sentence, slightly longer.',
    long: 'finally, a long sentence, one that goes on a little too long, it could be argued.',
  },
}

const inspect1 = inspect(OBJ, false)
const inspect2 = inspect(OBJ, true)

const primary1 = new Button({
  height: 3,
  theme: 'primary',
  title: 'Primary',
})
const primary2 = new Button({
  theme: 'primary',
  title: 'Primary',
})
const button1 = new Button({
  height: 3,
  title: 'Default',
})
const button2 = new Button({
  title: 'Default',
})

const progress0 = new Progress({value: 0, showPercent: true})
const progress1 = new Progress({theme: 'blue', value: 15, showPercent: true})
const progress2 = new Progress({theme: 'orange', value: 46, showPercent: true})
const progress3 = new Progress({
  theme: 'red',
  height: 2,
  value: 55,
  showPercent: true,
})
const progress4 = new Progress({
  theme: 'green',
  height: 3,
  value: 75,
  showPercent: true,
})
const progress5 = new Progress({
  theme: 'plain',
  height: 4,
  value: 100,
  showPercent: true,
})
const progress = [
  progress0,
  progress1,
  progress2,
  progress3,
  progress4,
  progress5,
]

const checkboxes = [1, 2, 3, 4].map(
  (num, index) =>
    new Checkbox({
      title: `Choice ${num}`,
      value: true,
      onChange: value => (progress[index].isVisible = value),
    }),
)

const slider0 = new Slider({
  width: 1,
  height: 'shrink',
  direction: 'vertical',
  range: [0, 100],
  value: progress0.value,
  buttons: true,
  step: 1,
  onChange: value => {
    progress0.value = value
  },
})
const slider1 = new Slider({
  direction: 'vertical',
  range: [0, 100],
  value: progress1.value,
  onChange: value => {
    progress1.value = value
  },
  buttons: true,
  step: 1,
  border: true,
})

const slider2 = new Slider({
  height: 1,
  direction: 'horizontal',
  range: [0, 100],
  value: progress2.value,
  onChange: value => {
    progress2.value = value
  },
  buttons: true,
  step: 1,
})
const slider3 = new Slider({
  direction: 'horizontal',
  range: [0, 100],
  value: progress3.value,
  onChange: value => {
    progress3.value = value
  },
  buttons: true,
  step: 1,
  border: true,
})

const summary = new Text()

const titleInput = new Input({
  value: '',
  placeholder: 'Title',
  onChange() {
    summary.text = titleInput.value + '\n' + storyInput.value
  },
})

const storyInput = new Input({
  value: '',
  placeholder: 'Story',
  wrap: true,
  multiline: true,
  onChange() {
    summary.text = titleInput.value + '\n' + storyInput.value
  },
})

const wrapCheckbox = new Checkbox({
  title: `Wrap lines?`,
  value: true,
  onChange(value) {
    storyInput.wrap = value
  },
})

const fontSelect = new Dropdown({
  theme: 'proceed',
  onSelect(value: FontFamily) {
    titleInput.font = value
    storyInput.font = value
  },
  height: 1,
  choices: FontFamilies.map(f => [f, f]),
  selected: 'default',
})

const storybox = Stack.down([
  Stack.right([wrapCheckbox, Space.horizontal(1), fontSelect]),
  titleInput,
  storyInput,
  Space.vertical(1),
  summary,
])

const tree = new Tree({
  titleView: new Text({text: 'Title view'}),
  data: [{path: '1'}, {path: '2'}, {path: '3'}],
  render({path}) {
    return new Text({text: `Item ${path}`})
  },
  getChildren({path}) {
    return [{path: `${path}.1`}, {path: `${path}.2`}, {path: `${path}.3`}]
  },
})

const collapsible = new Collapsible({
  isCollapsed: true,
  collapsed: new Text({text: inspect1}),
  expanded: new Text({text: inspect2}),
})
const expandible = new Collapsible({
  isCollapsed: true,
  showCollapsed: true,
  collapsed: new Text({text: inspect1}),
  expanded: new Text({text: inspect2}),
})

const collapsibleText = new CollapsibleText({
  text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc consectetur molestie faucibus. Phasellus iaculis pellentesque felis eu fringilla. Ut in sollicitudin nisi. Praesent in mauris tortor. Nam interdum, magna eu pellentesque scelerisque, dui ipsum adipiscing ante, vel ullamcorper nisl sapien id arcu. Nullam egestas diam eu felis mollis sit amet cursus enim vehicula. Quisque eu tellus id erat pellentesque consequat. Maecenas fermentum faucibus magna, eget dictum nisi congue sed. Quisque a justo a nisi eleifend facilisis sit amet at augue. Sed a sapien vitae augue hendrerit porta vel eu ligula. Proin enim urna, faucibus in vestibulum tincidunt, commodo sit amet orci. Vestibulum ac sem urna, quis mattis urna. Nam eget ullamcorper ligula. Nam volutpat, arcu vel auctor dignissim, tortor nisi sodales enim, et vestibulum nulla dui id ligula. Nam ullamcorper, augue ut interdum vulputate, eros mauris lobortis sapien, ac sodales dui eros ac elit.'.replaceAll(
    '. ',
    '.\n',
  ),
})

const tabs = new Box({
  height: 8,
  highlight: true,
  child: Tabs.create([
    ['Single', new Box({flex: 1})],
    ['Double', new Box({border: 'double', flex: 1})],
    ['Dotted', new Box({border: 'dotted', flex: 1})],
    ['Rounded', new Box({border: 'rounded', flex: 1})],
    [
      'Custom',
      new Box({
        border: [
          '\n╌\n─', //top
          ' ╎│', // left
          '┌╌┐\n└┐└\n ╎┌', // tl
          '┌╌┐\n┘┌┘\n┐╎', // tr
          ' ╎└\n └╌', // bl
          '┘╎\n╌┘', // br
          '─\n╌', // bottom
          '│╎', // right
        ],
        flex: 1,
      }),
    ],
  ]),
})

const digits1 = new Digits({
  text: 'Sphinx of black\nquartz, judge my vow.\n123,456.7890\n(1)[2]{3}\n+-*/ %#:!\n2^⁴',
})

const digits2 = new Digits({
  bold: true,
  text: 'How vexingly quick\ndaft zebras jump!\n123,456.7890\n(1)[2]{3}\n+-*/ %#:!\n2^⁴',
})

const scrollable = Scrollable.down([digits1, digits2], {
  width: 40,
})

const drawerView = Stack.down({
  heading: 'Drawer',
  maxWidth: 40,
  children: [
    Accordion.create(
      Array(10)
        .fill(0)
        .map((_, index) =>
          Accordion.Section.create(
            `title ${index + 1}`,
            new Text({
              text: Array(10)
                .fill(`section ${index + 1}.`)
                .map((line, index) => line + (index + 1))
                .join('\n'),
            }),
          ),
        ),
      {multiple: true},
    ),
  ],
})

const contentView = Stack.right([
  Stack.down(
    [
      Stack.right([
        Stack.down([
          Stack.right([
            Stack.down([primary1, primary2], {gap: 1}),
            Stack.down([button1, button2], {gap: 1}),
            Stack.down(checkboxes, {padding: 1}),
          ]),
          Stack.right([
            Stack.down([H1('Header 1'), H4('Header 4')]),
            Stack.down([H2('Header 2'), H5('Header 5')]),
            Stack.down([H3('Header 3'), H6('Header 6')]),
          ]),
        ]),
        Stack.down(progress, {width: 40}),
        slider0,
        storybox,
      ]),
      slider2,
      slider3,
      collapsible,
      expandible,
      collapsibleText,
      tabs,
      Stack.right([
        scrollable,
        Stack.down([
          Stack.right([
            new Spinner({
              padding: 1,
              isAnimating: false,
            }),
            new ToggleGroup({
              titles: [bold('B'), italic('I'), underline('U'), strikeout('S')],
              multiple: true,
              selected: [],
            }),
          ]),
          tree,
        ]),
      ]),
    ],
    {flex: 1},
  ),
  Stack.down([['flex1', slider1], Space.vertical(1)]),
])

demo(
  Stack.down([
    [
      'flex1',
      new Drawer({
        theme: 'secondary',
        drawer: drawerView,
        content: contentView,
      }),
    ],
    new AutoLegend(),
  ]),
  false,
)
