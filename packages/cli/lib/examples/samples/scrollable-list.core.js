import {Screen, ScrollableList, Stack, Text} from '@teaui/core'

const tasks = [
  {name: 'Draft', active: true, detail: 'Write the proposal'},
  {name: 'Archive', active: false, detail: 'Store old notes'},
  {name: 'Review', active: true, detail: 'Collect feedback'},
  {name: 'Build', active: true, detail: 'Implement the plan'},
  {name: 'Pause', active: false, detail: 'Wait for approval'},
  {name: 'Test', active: true, detail: 'Check the result'},
  {name: 'Ship', active: true, detail: 'Publish the release'},
  {name: 'Follow up', active: true, detail: 'Gather lessons'},
]
const active = new ScrollableList({
  width: 36,
  height: 4,
  data: tasks,
  filter: task => task.active,
  renderItem: (task, row) => new Text(`${row + 1}. ${task.name}`),
  showScrollbars: true,
})
const details = new ScrollableList({
  width: 36,
  height: 4,
  data: tasks.filter(task => task.active),
  renderItem: task =>
    new Text({text: `${task.name}\n  ${task.detail}`, wrap: false}),
  showScrollbars: false,
})
const events = ['Queued', 'Started', 'Reviewed', 'Tested', 'Published']
const tail = new ScrollableList({
  width: 36,
  height: 2,
  data: events,
  renderItem: event => new Text(event),
  keepAtBottom: true,
})
const examples = Stack.down({
  width: 36,
  height: 13,
  children: [
    new Text('Active tasks: filtered row indices'),
    active,
    new Text('Details: page down, no scrollbar'),
    details,
    new Text('Events: follow the bottom'),
    tail,
  ],
})

const [screen] = await Screen.start(examples)

// Scroll only after the screen has laid out the viewport; no timers needed.
active.scrollToRow(4)
details.advancePage(1)
tail.updateData([...events, 'Complete'])
screen.render()
