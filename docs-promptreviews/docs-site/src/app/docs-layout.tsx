import type { ReactNode } from 'react'
import DocsLayoutClient from '@/components/DocsLayoutClient'
import { getNavigationTree } from '@/lib/docs/articles'

interface DocsLayoutProps {
  children: ReactNode
}

export default async function DocsLayout({ children }: DocsLayoutProps) {
  const navigation = await getNavigationTree()

  return (
    <DocsLayoutClient navigation={navigation}>
      {children}
    </DocsLayoutClient>
  )
}
