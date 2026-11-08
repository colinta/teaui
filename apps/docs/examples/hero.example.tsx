import React, {useState} from 'react'
import {
  Box,
  Button,
  Calendar,
  CollapsibleText,
  Drawer,
  Dropdown,
  Form,
  FormSubmitButton,
  Input,
  Label,
  Radio,
  RadioGroup,
  Separator,
  Slider,
  Stack,
  Style,
  Tabs,
  Text,
} from '@teaui/react'

const DOCS_URL = 'https://colinta.github.io/teaui/docs/'
const API_URL = 'https://colinta.github.io/teaui/docs/core-api'

function App() {
  const [rating, setRating] = useState(9)

  return (
    <Tabs border flex={1}>
      <Tabs.Section title="Home">
        <Drawer.left
          flex={1}
          purpose="orange"
          isOpen
          drawer={
            <Stack.down width={14}>
              <Text>
                <Style bold>Navigation</Style>
              </Text>
              <Separator.horizontal />
              <CollapsibleText
                text={'Dashboard\nOverview\nAnalytics\nReports'}
              />
              <Text>{'  Components'}</Text>
              <Text>{'  Themes'}</Text>
              <Text>{'  Settings'}</Text>
            </Stack.down>
          }
          content={
            <Box border="rounded" flex={1}>
              <Stack.down flex={1}>
                <Stack.right gap={1}>
                  <Input value="Search…" flex={1} />
                  <Dropdown
                    purpose="green"
                    choices={[
                      ['React', 'react'],
                      ['Core', 'core'],
                    ]}
                    selected="react"
                    height={1}
                  />
                </Stack.right>
                <Separator.horizontal />
                <Text wrap>
                  <Style bold foreground="cyan">
                    TeaUI
                  </Style>
                  {' — Build beautiful terminal apps with '}
                  <Style bold>React JSX</Style>
                  {'. Full layout, input, mouse & focus.'}
                </Text>
                <Stack.right gap={1}>
                  <Slider
                    flex={1}
                    direction="horizontal"
                    range={[0, 10]}
                    step={1}
                    value={rating}
                    onChange={setRating}
                  />
                  <Text>
                    <Style bold>{rating}</Style>/10★
                  </Text>
                </Stack.right>
                <Button title="Get Started" height={3} purpose="primary" />
              </Stack.down>
            </Box>
          }
        />
      </Tabs.Section>
      <Tabs.Section title="Form">
        <TastingForm />
      </Tabs.Section>
      <Tabs.Section title="Docs">
        <LinkPage
          description="Guides for layout, styling, focus, and every component, with live examples."
          title="Read the docs"
          url={DOCS_URL}
        />
      </Tabs.Section>
      <Tabs.Section title="API">
        <LinkPage
          description="Reference for Screen, View, Container, Style, and the React reconciler."
          title="Core API reference"
          url={API_URL}
        />
      </Tabs.Section>
    </Tabs>
  )
}

function TastingForm() {
  const [name, setName] = useState('')
  const [date, setDate] = useState(new Date(2026, 5, 29))
  const [visibleDate, setVisibleDate] = useState(new Date(2026, 5, 1))
  const [tea, setTea] = useState('oolong')
  const [booked, setBooked] = useState('')

  return (
    <Form
      onValidate={formData =>
        formData.flatMap(field =>
          field.name === 'name' && !field.value
            ? [{name: 'name', message: 'Who is coming to tea?'}]
            : [],
        )
      }
      onSubmit={async () => {
        setBooked('')
        await sleep(1000)
        setBooked(`${name}, ${date.toDateString()}`)
        return undefined
      }}
    >
      <Stack.right gap={2}>
        <Stack.down>
          <Label for="date">Tasting date</Label>
          <Calendar
            formName="date"
            date={date}
            visibleDate={visibleDate}
            onChangeVisible={setVisibleDate}
            onChange={setDate}
          />
        </Stack.down>
        <Stack.down flex={1}>
          <Label for="name">Name</Label>
          <Input
            formName="name"
            value={name}
            onChange={setName}
            multiline="submit"
          />
          <Label for="tea">Tea</Label>
          <RadioGroup formName="tea" value={tea} onChange={setTea}>
            <Stack.down>
              <Radio value="green" title="Green" />
              <Radio value="oolong" title="Oolong" />
              <Radio value="black" title="Black" />
            </Stack.down>
          </RadioGroup>
          <FormSubmitButton title="Book a tasting" />
          {booked ? (
            <Text wrap>
              <Style foreground="green">✓ {booked}</Style>
            </Text>
          ) : null}
        </Stack.down>
      </Stack.right>
    </Form>
  )
}

function LinkPage({
  description,
  title,
  url,
}: {
  description: string
  title: string
  url: string
}) {
  return (
    <Stack.down gap={1} padding={1}>
      <Text wrap>{description}</Text>
      <Text>
        {'→ '}
        <Style link={url} underline foreground="cyan">
          {title}
        </Style>
      </Text>
      <Text>
        <Style dim>⌘/Ctrl-click the link to open it</Style>
      </Text>
    </Stack.down>
  )
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export default {width: 55, height: 16, title: 'Output', App}
