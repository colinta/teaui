import React from 'react'
import {ScrollableList, Stack, Text, run} from '@teaui/react'

interface Task {
  name: string
  active: boolean
  detail: string
}

const tasks: Task[] = [
  {name: 'Draft', active: true, detail: 'Write the proposal'},
  {name: 'Archive', active: false, detail: 'Store old notes'},
  {name: 'Review', active: true, detail: 'Collect feedback'},
  {name: 'Build', active: true, detail: 'Implement the plan'},
  {name: 'Pause', active: false, detail: 'Wait for approval'},
  {name: 'Test', active: true, detail: 'Check the result'},
  {name: 'Ship', active: true, detail: 'Publish the release'},
  {name: 'Follow up', active: true, detail: 'Gather lessons'},
]
const events = ['Queued', 'Started', 'Reviewed', 'Tested', 'Published']

// The public React wrapper accepts JSX rows and filters before rendering them.
// Row views determine their height; scrollbar and bottom-following props are
// currently Core-only, and this wrapper does not implement keyboard selection.
await run(
  <Stack.down width={36} height={13}>
    <Text>Active tasks: filtered row indices</Text>
    <ScrollableList<Task>
      width={36}
      height={4}
      data={tasks}
      filter={task => task.active}
      renderItem={(task, index) => <Text>{`${index + 1}. ${task.name}`}</Text>}
    />
    <Text>Details: two lines per JSX row</Text>
    <ScrollableList<Task>
      width={36}
      height={4}
      data={tasks}
      filter={task => task.active}
      renderItem={task => (
        <Text wrap={false}>{`${task.name}\n  ${task.detail}`}</Text>
      )}
    />
    <Text>Events: JSX string items</Text>
    <ScrollableList<string>
      width={36}
      height={2}
      data={events}
      renderItem={event => <Text>{event}</Text>}
    />
  </Stack.down>,
)
