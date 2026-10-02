import type {SidebarsConfig} from '@docusaurus/plugin-content-docs'

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro',
    'concepts',
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
            'components/badge',
            'components/text',
            'components/header',
            'components/digits',
            'components/progress',
            'components/spinner',
            'components/separator',
          ],
        },
        {
          type: 'category',
          label: '░ Input',
          collapsed: false,
          items: [
            'components/button',
            'components/pressable',
            'components/checkbox',
            'components/radio',
            'components/toggle',
            'components/input',
            'components/slider',
            'components/dropdown',
            'components/toggle-group',
            'components/font-style',
            'components/hotkey',
            'components/keyboard',
            'components/mouse',
            'components/legend',
          ],
        },
        {
          type: 'category',
          label: '░ Organization',
          collapsed: false,
          items: [
            'components/table',
            'components/accordion',
            'components/collapsible',
            'components/collapsible-text',
            'components/tree',
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
            'components/scrollable',
            'components/scrollable-list',
            'components/window',
          ],
        },
        {
          type: 'category',
          label: '░ Navigation',
          collapsed: false,
          items: [
            'components/breadcrumb',
            'components/tabs',
            'components/drawer',
          ],
        },
        {
          type: 'category',
          label: '░ Debugging',
          collapsed: false,
          items: ['components/log', 'components/track-mouse'],
        },
        {
          type: 'category',
          label: '░ Extensions',
          collapsed: false,
          items: [
            'components/code',
            'components/image',
            'components/subprocess',
          ],
        },
      ],
    },
    'core-api',
    'remote-control',
    'themes',
  ],
}

export default sidebars
