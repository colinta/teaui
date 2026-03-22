import React, {useState} from 'react'
import {Alert, Button, Stack, Text} from '@teaui/react'

function App() {
  const [showAlert, setShowAlert] = useState(false)

  return (
    <Stack.down>
      <Button theme="cancel" onClick={() => setShowAlert(true)}>
        Delete Item
      </Button>
      <Alert
        visible={showAlert}
        title="Confirm Delete"
        purpose="cancel"
        onDismiss={() => setShowAlert(false)}
      >
        <Text>Are you sure you want to delete this item?</Text>
        <Stack.right gap={1}>
          <Button onClick={() => setShowAlert(false)}>Delete</Button>
          <Button onClick={() => setShowAlert(false)}>Cancel</Button>
        </Stack.right>
      </Alert>
    </Stack.down>
  )
}

export default {width: 40, height: 12, title: 'Alert', App}
