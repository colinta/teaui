import {Breadcrumb, Screen} from '@teaui/core'

const breadcrumb = new Breadcrumb({
  items: [{title: 'Home'}, {title: 'Products'}, {title: 'Electronics'}],
})

await Screen.start(breadcrumb)
