import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/teaui/__docusaurus/debug',
    component: ComponentCreator('/teaui/__docusaurus/debug', '788'),
    exact: true
  },
  {
    path: '/teaui/__docusaurus/debug/config',
    component: ComponentCreator('/teaui/__docusaurus/debug/config', '27d'),
    exact: true
  },
  {
    path: '/teaui/__docusaurus/debug/content',
    component: ComponentCreator('/teaui/__docusaurus/debug/content', '0b3'),
    exact: true
  },
  {
    path: '/teaui/__docusaurus/debug/globalData',
    component: ComponentCreator('/teaui/__docusaurus/debug/globalData', '9ee'),
    exact: true
  },
  {
    path: '/teaui/__docusaurus/debug/metadata',
    component: ComponentCreator('/teaui/__docusaurus/debug/metadata', '946'),
    exact: true
  },
  {
    path: '/teaui/__docusaurus/debug/registry',
    component: ComponentCreator('/teaui/__docusaurus/debug/registry', '233'),
    exact: true
  },
  {
    path: '/teaui/__docusaurus/debug/routes',
    component: ComponentCreator('/teaui/__docusaurus/debug/routes', 'c30'),
    exact: true
  },
  {
    path: '/teaui/docs',
    component: ComponentCreator('/teaui/docs', '411'),
    routes: [
      {
        path: '/teaui/docs',
        component: ComponentCreator('/teaui/docs', 'bf9'),
        routes: [
          {
            path: '/teaui/docs',
            component: ComponentCreator('/teaui/docs', '7e5'),
            routes: [
              {
                path: '/teaui/docs/',
                component: ComponentCreator('/teaui/docs/', 'c37'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/teaui/docs/components/accordion',
                component: ComponentCreator('/teaui/docs/components/accordion', '1bd'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/teaui/docs/components/box',
                component: ComponentCreator('/teaui/docs/components/box', 'a72'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/teaui/docs/components/button',
                component: ComponentCreator('/teaui/docs/components/button', 'd4e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/teaui/docs/components/checkbox',
                component: ComponentCreator('/teaui/docs/components/checkbox', 'df0'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/teaui/docs/components/collapsible',
                component: ComponentCreator('/teaui/docs/components/collapsible', '163'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/teaui/docs/components/collapsible-text',
                component: ComponentCreator('/teaui/docs/components/collapsible-text', 'd1e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/teaui/docs/components/digits',
                component: ComponentCreator('/teaui/docs/components/digits', 'a69'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/teaui/docs/components/drawer',
                component: ComponentCreator('/teaui/docs/components/drawer', '0c5'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/teaui/docs/components/dropdown',
                component: ComponentCreator('/teaui/docs/components/dropdown', '2a9'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/teaui/docs/components/header',
                component: ComponentCreator('/teaui/docs/components/header', '675'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/teaui/docs/components/hotkey',
                component: ComponentCreator('/teaui/docs/components/hotkey', '055'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/teaui/docs/components/input',
                component: ComponentCreator('/teaui/docs/components/input', '3e0'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/teaui/docs/components/log',
                component: ComponentCreator('/teaui/docs/components/log', 'e4a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/teaui/docs/components/progress',
                component: ComponentCreator('/teaui/docs/components/progress', '7df'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/teaui/docs/components/scrollable',
                component: ComponentCreator('/teaui/docs/components/scrollable', 'c77'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/teaui/docs/components/scrollable-list',
                component: ComponentCreator('/teaui/docs/components/scrollable-list', '126'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/teaui/docs/components/separator',
                component: ComponentCreator('/teaui/docs/components/separator', '8b4'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/teaui/docs/components/slider',
                component: ComponentCreator('/teaui/docs/components/slider', '382'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/teaui/docs/components/space',
                component: ComponentCreator('/teaui/docs/components/space', '18b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/teaui/docs/components/spinner',
                component: ComponentCreator('/teaui/docs/components/spinner', '5c0'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/teaui/docs/components/stack',
                component: ComponentCreator('/teaui/docs/components/stack', '60c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/teaui/docs/components/tabs',
                component: ComponentCreator('/teaui/docs/components/tabs', '7ae'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/teaui/docs/components/text',
                component: ComponentCreator('/teaui/docs/components/text', '78d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/teaui/docs/components/toggle-group',
                component: ComponentCreator('/teaui/docs/components/toggle-group', 'a00'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/teaui/docs/components/tree',
                component: ComponentCreator('/teaui/docs/components/tree', '993'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/teaui/docs/components/window',
                component: ComponentCreator('/teaui/docs/components/window', '222'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/teaui/docs/core-api',
                component: ComponentCreator('/teaui/docs/core-api', '48a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/teaui/docs/getting-started',
                component: ComponentCreator('/teaui/docs/getting-started', '2ca'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/teaui/docs/preact',
                component: ComponentCreator('/teaui/docs/preact', '720'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/teaui/docs/themes',
                component: ComponentCreator('/teaui/docs/themes', '300'),
                exact: true,
                sidebar: "docsSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '/teaui/',
    component: ComponentCreator('/teaui/', '265'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
