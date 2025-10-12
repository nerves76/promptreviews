import type { ReactNode } from 'react'
import DocsLayoutClient from '@/components/DocsLayoutClient'
import { getNavigationTree } from '@/lib/docs/articles'

interface DocsLayoutProps {
  children: ReactNode
}

// Revalidate navigation data every 5 minutes
export const revalidate = 300

export default async function DocsLayout({ children }: DocsLayoutProps) {
  const navigation = await getNavigationTree()

  return (
    <DocsLayoutClient navigation={navigation}>
      {children}
    </DocsLayoutClient>
  )
}
