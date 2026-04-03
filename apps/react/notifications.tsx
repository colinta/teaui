import React, {useState} from 'react'
import {interceptConsoleLog} from '@teaui/core'
import {
  Alert,
  Button,
  Callout,
  Scrollable,
  Separator,
  Space,
  Stack,
  Style,
  Text,
  run,
} from '@teaui/react'

export function NotificationsTab() {
  const [showDelete, setShowDelete] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  return (
    <Scrollable flex={1} gap={1}>
      <Text pin="horizontal">
        <Style bold>Callout Examples</Style>
      </Text>

      <Callout title="Note" purpose="primary">
        <Text wrap>Remember to save your work before closing.</Text>
      </Callout>

      <Callout purpose="cancel">
        <Text wrap>This action cannot be undone.</Text>
      </Callout>

      <Callout title="Success" purpose="proceed">
        <Text wrap>Your changes have been saved.</Text>
      </Callout>

      <Callout title="Warning" purpose="secondary">
        <Text wrap>
          You are running low on disk space. Consider freeing up some room.
        </Text>
      </Callout>

      <Callout>
        <Text wrap>A plain callout with no title or purpose.</Text>
      </Callout>

      <Separator.horizontal pin="horizontal" />

      <Text pin="horizontal">
        <Style bold>Alert Examples</Style>
      </Text>

      <Stack.right pin="horizontal" gap={1}>
        <Button theme="cancel" onClick={() => setShowDelete(true)}>
          Delete Item
        </Button>
        <Button theme="primary" onClick={() => setShowInfo(true)}>
          Show Info
        </Button>
        <Button theme="green" onClick={() => setShowSuccess(true)}>
          Show Success
        </Button>
      </Stack.right>

      <Alert
        visible={showDelete}
        title="Confirm Delete"
        purpose="cancel"
        onDismiss={() => setShowDelete(false)}
      >
        <Text wrap>Are you sure you want to delete this item?</Text>
        <Space height={1} />
        <Stack.right gap={1}>
          <Button
            theme="cancel"
            onClick={() => {
              console.info('Deleted!')
              setShowDelete(false)
            }}
          >
            Delete
          </Button>
          <Button theme="plain" onClick={() => setShowDelete(false)}>
            Cancel
          </Button>
        </Stack.right>
      </Alert>

      <Alert
        visible={showInfo}
        title="Information"
        purpose="primary"
        onDismiss={() => setShowInfo(false)}
      >
        <Text wrap>The operation completed successfully.</Text>
        <Space height={1} />
        <Button theme="primary" onClick={() => setShowInfo(false)}>
          OK
        </Button>
      </Alert>

      <Alert
        visible={showSuccess}
        title="All Done!"
        purpose="proceed"
        onDismiss={() => setShowSuccess(false)}
      >
        <Text wrap>Your changes have been saved and deployed.</Text>
        <Space height={1} />
        <Button theme="green" onClick={() => setShowSuccess(false)}>
          Great!
        </Button>
      </Alert>
    </Scrollable>
  )
}

if (import.meta.url === `file://${process.argv[1]}`) {
  interceptConsoleLog()

  run(<NotificationsTab />)
}
