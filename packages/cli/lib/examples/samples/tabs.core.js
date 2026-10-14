import {Screen, Space, Stack, Tabs, Text} from '@teaui/core'

const bordered = Tabs.create(
  [
    new Tabs.Section({
      title: 'Info',
      child: new Text('Information panel'),
    }),
    ['Settings', new Text('Change your preferences.')],
    ['Help', new Text('Help panel')],
  ],
  {border: true, selected: 1, width: 36, height: 4},
)

const borderless = new Tabs({border: false, selected: 0, width: 36, height: 3})
borderless.addTab('Overview', new Text('Welcome to TeaUI.'))
borderless.addTab(
  new Tabs.Section({
    title: 'Details',
    child: new Text('More details here.'),
  }),
)

const examples = Stack.down(
  [
    new Text('Bordered: second tab selected'),
    bordered,
    new Space({height: 1}),
    new Text('Borderless: first tab selected'),
    borderless,
  ],
  {width: 36, height: 10},
)

await Screen.start(examples)
