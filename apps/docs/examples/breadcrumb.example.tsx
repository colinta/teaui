import React from 'react'
import {Breadcrumb} from '@teaui/react'

function App() {
  return (
    <Breadcrumb
      items={[{title: 'Home'}, {title: 'Products'}, {title: 'Electronics'}]}
    />
  )
}

export default {width: 40, height: 1, title: 'Breadcrumb', App}
