export type Framework = 'react' | 'core'

export type Availability = Framework | 'both'

export interface ExampleProp {
  name: string
  type: string
  description: string
  availability: Availability
}

export interface ComponentDefinition {
  name: string
  availability: Availability
}

type FrameworkHandlers<A extends Availability, Handler> = A extends 'both'
  ? Record<Framework, Handler>
  : Partial<Record<Framework, Handler>> & Record<A, Handler>

export interface ComponentExample<
  A extends Availability = 'both',
> extends ComponentDefinition {
  availability: A
  description: string
  props: readonly ExampleProp[]
  source: FrameworkHandlers<A, () => string>
  render: FrameworkHandlers<A, () => Promise<string>>
}
