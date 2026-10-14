import React from 'react'
import {Breadcrumb, run} from '@teaui/react'

await run(
  <Breadcrumb
    items={[{title: 'Home'}, {title: 'Products'}, {title: 'Electronics'}]}
  />,
)
