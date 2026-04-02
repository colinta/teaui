export type Alignment = 'left' | 'right' | 'center'
export const FontFamilies = [
  'default',
  'serif-bold',
  'serif-italic',
  'serif-italic-bold',
  'sans',
  'sans-bold',
  'sans-italic',
  'sans-italic-bold',
  'monospace',
  'double-struck',
  'fraktur',
  'fraktur-bold',
  'script',
  'script-bold',
] as const
export type FontFamily = (typeof FontFamilies)[number]

export type Font = Map<string, string>
export type Orientation = 'horizontal' | 'vertical'
export type Direction = 'right' | 'left' | 'down' | 'up'

export interface Edges {
  top: number
  right: number
  bottom: number
  left: number
}

export interface LegendItem {
  key: string | string[]
  label: string
}
