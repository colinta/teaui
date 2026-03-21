import {themes as prismThemes} from 'prism-react-renderer'
import type {Config} from '@docusaurus/types'
import type * as Preset from '@docusaurus/preset-classic'

const config: Config = {
  plugins: [require.resolve('./src/plugins/auto-rebuild')],

  title: 'TeaUI',
  tagline: 'React-compatible terminal UI framework',
  favicon: 'img/favicon.ico',

  url: 'https://colinta.github.io',
  baseUrl: '/teaui/',

  organizationName: 'colinta',
  projectName: 'teaui',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/colinta/teaui/tree/main/apps/docs/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: '[ TeaUI ]',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: '[ Docs ]',
        },
        {
          href: 'https://github.com/colinta/teaui',
          label: '[ GitHub ]',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `── TeaUI ── ${new Date().getFullYear()} ──`,
    },
    prism: {
      theme: prismThemes.vsDark,
      darkTheme: prismThemes.vsDark,
    },
  } satisfies Preset.ThemeConfig,
}

export default config
