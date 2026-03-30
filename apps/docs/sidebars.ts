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
          label: '░ Display',
          collapsed: false,
          items: [
            'components/text',
            'components/header',
            'components/table',
            'components/digits',
            'components/progress',
            'components/spinner',
            'components/log',
          ],
        },
        {
          type: 'category',
          label: '░ Input',
          collapsed: false,
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
          label: '░ Layout',
          collapsed: false,
          items: [
            'components/container',
            'components/align',
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
          label: '░ Navigation',
          collapsed: false,
          items: ['components/breadcrumb'],
        },
        {
          type: 'category',
          label: '░ Container',
          collapsed: false,
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
        {
          type: 'category',
          label: '░ Extensions',
          collapsed: false,
          items: ['components/code'],
        },
      ],
    },
    'core-api',
    'themes',
  ],
}

export default sidebars
