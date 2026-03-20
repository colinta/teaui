import React from 'react'
import {Button} from '@teaui/react'

function App() {
  return (
    <Button theme="primary" onClick={() => console.log('clicked!')}>
      Click Me
    </Button>
  )
}

export default {width: 30, height: 3, title: 'Button', App}
