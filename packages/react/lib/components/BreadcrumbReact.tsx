import React, {createContext, useContext, useState, useCallback, useMemo, useEffect} from 'react'
import type {Color} from '@teaui/core'
import {Stack} from '../components.js'

interface BreadcrumbItem {
  id: string
  title: string
  onPress?: () => void
}

interface BreadcrumbContextValue {
  registerBreadcrumb: (item: BreadcrumbItem) => void
  unregisterBreadcrumb: (id: string) => void
}

const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null)

interface BreadcrumbContainerProps {
  children: React.ReactNode
  isActive?: boolean
  palette?: {fg: Color; bg: Color}[]
}

export function BreadcrumbContainer({
  children,
  isActive = true,
  palette
}: BreadcrumbContainerProps) {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([])

  const registerBreadcrumb = useCallback((item: BreadcrumbItem) => {
    setBreadcrumbs(prev => {
      // Replace existing item with same id or add new one
      const existing = prev.findIndex(b => b.id === item.id)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = item
        return updated
      }
      return [...prev, item]
    })
  }, [])

  const unregisterBreadcrumb = useCallback((id: string) => {
    setBreadcrumbs(prev => prev.filter(b => b.id !== id))
  }, [])

  const contextValue = useMemo(
    () => ({
      registerBreadcrumb,
      unregisterBreadcrumb,
    }),
    [registerBreadcrumb, unregisterBreadcrumb]
  )

  // Convert breadcrumb items to the format expected by the core Breadcrumb component
  const breadcrumbItems = useMemo(
    () =>
      breadcrumbs.map(({title, onPress}) => ({
        title,
        onPress,
      })),
    [breadcrumbs]
  )

  return (
    <BreadcrumbContext.Provider value={contextValue}>
      <Stack.down>
        {breadcrumbs.length > 0 && (
          <tui-breadcrumb
            items={breadcrumbItems}
            isActive={isActive}
            palette={palette}
          />
        )}
        {children}
      </Stack.down>
    </BreadcrumbContext.Provider>
  )
}

interface BreadcrumbProps {
  title: string
  onPress?: () => void
  id?: string
}

export function BreadcrumbItem({title, onPress, id}: BreadcrumbProps) {
  const context = useContext(BreadcrumbContext)
  const itemId = id ?? title // Use title as default ID if not provided

  useEffect(() => {
    if (context) {
      // Register this breadcrumb
      context.registerBreadcrumb({
        id: itemId,
        title,
        onPress,
      })

      // Unregister on unmount
      return () => {
        context.unregisterBreadcrumb(itemId)
      }
    }
  }, [context, itemId, title, onPress])

  // If there's no context, render a standalone breadcrumb
  if (!context) {
    return (
      <tui-breadcrumb
        items={[{title, onPress}]}
      />
    )
  }

  // If context exists, this component just registers and returns null
  return null
}