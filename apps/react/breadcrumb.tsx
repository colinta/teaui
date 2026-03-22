import React, {useState, useCallback} from 'react'
import {interceptConsoleLog} from '@teaui/core'
import {
  Box,
  Br,
  Breadcrumb,
  Button,
  Scrollable,
  Stack,
  Style,
  Text,
  run,
} from '@teaui/react'

type ScreenName =
  | 'Main'
  | 'Home'
  | 'Products'
  | 'Electronics'
  | 'Smartphones'
  | 'Phone'

interface NavigationState {
  current: ScreenName
  breadcrumbs: ScreenName[]
}

export function BreadcrumbTab() {
  const [navigation, setNavigation] = useState<NavigationState>({
    current: 'Main',
    breadcrumbs: ['Main'],
  })

  const navigateTo = useCallback((screen: ScreenName) => {
    setNavigation(prev => ({
      current: screen,
      breadcrumbs: [...prev.breadcrumbs, screen],
    }))
  }, [])

  const navigateBack = useCallback((screen: ScreenName) => {
    setNavigation(prev => {
      const index = prev.breadcrumbs.indexOf(screen)
      if (index >= 0) {
        return {
          current: screen,
          breadcrumbs: prev.breadcrumbs.slice(0, index + 1),
        }
      }
      return prev
    })
  }, [])

  const renderScreen = (screen: ScreenName) => {
    switch (screen) {
      case 'Main':
        return (
          <Box border="single" padding={1}>
            <Stack.down gap={1}>
              <Text>
                <Style bold foreground="yellow">
                  Main Menu
                </Style>
              </Text>
              <Text>Welcome! Navigate to any section:</Text>
              <Stack.down gap={1}>
                <Button title="Go to Home" onClick={() => navigateTo('Home')} />
                <Button
                  title="Go to Products"
                  onClick={() => navigateTo('Products')}
                />
                <Button
                  title="Go to Electronics"
                  onClick={() => navigateTo('Electronics')}
                />
                <Button
                  title="Go to Smartphones"
                  onClick={() => navigateTo('Smartphones')}
                />
                <Button
                  title="Go to Phone"
                  onClick={() => navigateTo('Phone')}
                />
              </Stack.down>
            </Stack.down>
          </Box>
        )

      case 'Home':
        return (
          <Box border="single" padding={1}>
            <Stack.down gap={1}>
              <Text>
                <Style bold foreground="green">
                  Home Page
                </Style>
              </Text>
              <Text>You're at the home page. Explore our catalog:</Text>
              <Stack.down gap={1}>
                <Button
                  title="Browse Products"
                  onClick={() => navigateTo('Products')}
                />
                <Button
                  title="View Electronics"
                  onClick={() => navigateTo('Electronics')}
                />
              </Stack.down>
            </Stack.down>
          </Box>
        )

      case 'Products':
        return (
          <Box border="single" padding={1}>
            <Stack.down gap={1}>
              <Text>
                <Style bold foreground="blue">
                  Products Catalog
                </Style>
              </Text>
              <Text>Browse our wide selection of products:</Text>
              <Stack.down gap={1}>
                <Button
                  title="Electronics Section"
                  onClick={() => navigateTo('Electronics')}
                />
                <Button
                  title="View Smartphones"
                  onClick={() => navigateTo('Smartphones')}
                />
              </Stack.down>
            </Stack.down>
          </Box>
        )

      case 'Electronics':
        return (
          <Box border="single" padding={1}>
            <Stack.down gap={1}>
              <Text>
                <Style bold foreground="magenta">
                  Electronics Department
                </Style>
              </Text>
              <Text>Discover the latest in electronic devices:</Text>
              <Stack.down gap={1}>
                <Button
                  title="Smartphones & Tablets"
                  onClick={() => navigateTo('Smartphones')}
                />
                <Button
                  title="Featured Phone"
                  onClick={() => navigateTo('Phone')}
                />
              </Stack.down>
            </Stack.down>
          </Box>
        )

      case 'Smartphones':
        return (
          <Box border="single" padding={1}>
            <Stack.down gap={1}>
              <Text>
                <Style bold foreground="cyan">
                  Smartphones Collection
                </Style>
              </Text>
              <Text>Find the perfect smartphone for you:</Text>
              <Stack.down gap={1}>
                <Button
                  title="Featured Phone Model"
                  onClick={() => navigateTo('Phone')}
                />
                <Button
                  title="Back to Home"
                  onClick={() => navigateTo('Home')}
                />
              </Stack.down>
            </Stack.down>
          </Box>
        )

      case 'Phone':
        return (
          <Box border="single" padding={1}>
            <Stack.down gap={1}>
              <Text>
                <Style bold foreground="red">
                  Featured Phone
                </Style>
              </Text>
              <Text>iPhone 15 Pro - The most advanced iPhone yet</Text>
              <Text wrap>
                Features: A17 Pro chip, titanium design, advanced camera system,
                and Action Button for quick access to your favorite features.
              </Text>
              <Stack.down gap={1}>
                <Button
                  title="Browse More Smartphones"
                  onClick={() => navigateTo('Smartphones')}
                />
                <Button
                  title="All Electronics"
                  onClick={() => navigateTo('Electronics')}
                />
              </Stack.down>
            </Stack.down>
          </Box>
        )

      default:
        return <Text>Unknown screen: {screen}</Text>
    }
  }

  return (
    <Stack.down gap={2}>
      <Text>
        <Style bold foreground="cyan">
          Dynamic Breadcrumb Navigation Demo
        </Style>
      </Text>

      {/* Breadcrumb Navigation */}
      <Box border="single" padding={1}>
        <Stack.down gap={1}>
          <Text>
            <Style bold>Navigation Path:</Style>
          </Text>
          <Breadcrumb
            items={navigation.breadcrumbs.map((crumb, index) => ({
              title: crumb,
              onPress:
                index < navigation.breadcrumbs.length - 1
                  ? () => navigateBack(crumb)
                  : undefined,
            }))}
          />
          <Text>
            <Style dim>Click any breadcrumb to go back to that screen</Style>
          </Text>
        </Stack.down>
      </Box>

      {/* Current Screen Content */}
      <Scrollable.down>{renderScreen(navigation.current)}</Scrollable.down>

      {/* Instructions */}
      <Box border="single" padding={1}>
        <Stack.down gap={1}>
          <Text>
            <Style bold foreground="yellow">
              How it works:
            </Style>
          </Text>
          <Text wrap>
            • Start at Main screen with buttons to all 5 sections
          </Text>
          <Text wrap>
            • Each screen has buttons to navigate to 2 other screens
          </Text>
          <Text wrap>
            • Breadcrumbs show your navigation path and update dynamically
          </Text>
          <Text wrap>• Click any breadcrumb to go back to that screen</Text>
          <Text wrap>• Navigation creates a proper history stack</Text>
        </Stack.down>
      </Box>
    </Stack.down>
  )
}

if (import.meta.url === `file://${process.argv[1]}`) {
  interceptConsoleLog()

  run(<BreadcrumbTab />)
}
