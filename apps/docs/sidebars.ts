import type {SidebarsConfig} from '@docusaurus/plugin-content-docs'

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro',
    'getting-started',
    {
      type: 'category',
      label: '│ Components │',
      collapsed: false,
      items: [
        {
          type: 'category',
          label: '░ Layout',
          items: [
            'components/box',
            'components/stack',
            'components/space',
            'components/separator',
            'components/scrollable',
            'components/scrollable-list',
            'components/window',
          ],
        },
        {
          type: 'category',
          label: '░ Input',
          items: [
            'components/button',
            'components/checkbox',
            'components/input',
            'components/slider',
            'components/dropdown',
            'components/toggle-group',
          ],
        },
        {
          type: 'category',
          label: '░ Display',
          items: [
            'components/text',
            'components/header',
            'components/digits',
            'components/progress',
            'components/spinner',
            'components/log',
          ],
        },
        {
          type: 'category',
          label: '░ Navigation',
          items: ['components/breadcrumb'],
        },
        {
          type: 'category',
          label: '░ Container',
          items: [
            'components/accordion',
            'components/collapsible',
            'components/collapsible-text',
            'components/drawer',
            'components/tabs',
            'components/tree',
            'components/hotkey',
          ],
        },
      ],
    },
    'core-api',
    'preact',
    'themes',
  ],
}

export default sidebars
