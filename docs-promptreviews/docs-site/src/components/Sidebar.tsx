'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChevronDown,
  ChevronRight,
  BookOpen,
  Rocket,
  FileText,
  Star,
  Layout,
  Plug,
  Settings,
  Lightbulb,
  Code2,
  Wrench
} from 'lucide-react'
import clsx from 'clsx'
import type { NavigationNode } from '@/lib/docs/articles'

interface SidebarProps {
  items: NavigationNode[]
  className?: string
}

export default function Sidebar({ items, className }: SidebarProps) {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState<string[]>(() => {
    const matches: string[] = []

    const traverse = (nodes: NavigationNode[], parents: string[]) => {
      nodes.forEach((node) => {
        if (!node) return
        if (node.href && pathname.startsWith(node.href)) {
          matches.push(...parents, node.id)
        }
        if (node.children && node.children.length > 0) {
          traverse(node.children, [...parents, node.id])
        }
      })
    }

    traverse(items ?? [], [])
    return Array.from(new Set(matches))
  })

  const toggleNode = (id: string) => {
    setExpanded((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id)
      }
      return [...prev, id]
    })
  }

  const renderedItems = useMemo(() => renderNodes(items, pathname, expanded, toggleNode), [items, pathname, expanded])

  if (!items || items.length === 0) {
    return (
      <div className={clsx('text-sm text-white/70', className)}>
        Navigation coming soon.
      </div>
    )
  }

  return (
    <nav className={clsx('space-y-2 text-sm text-white', className)}>
      {renderedItems}
    </nav>
  )
}

function renderNodes(
  nodes: NavigationNode[],
  pathname: string,
  expanded: string[],
  toggleNode: (id: string) => void,
  depth = 0
): JSX.Element[] {
  return nodes.map((node) => {
    const isActive = node.href ? pathname === node.href : false
    const isAncestorActive = node.href ? pathname.startsWith(node.href) : false
    const hasChildren = !!node.children && node.children.length > 0
    const open = hasChildren && expanded.includes(node.id)
    const IconComponent = resolveIcon(node.icon)

    return (
      <div key={node.id} className="space-y-1">
        <div className={clsx('flex items-center justify-between group', depth > 0 && 'pl-3')}>
          <Link
            href={node.href || '#'}
            className={clsx(
              'flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 transition-colors',
              isActive
                ? 'bg-white text-slate-900'
                : isAncestorActive
                ? 'bg-white/10 text-white'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            )}
          >
            <IconComponent className="h-4 w-4" />
            <span className="truncate text-sm font-medium">{node.title}</span>
          </Link>

          {hasChildren && (
            <button
              onClick={() => toggleNode(node.id)}
              className="p-1 text-white/60 hover:text-white"
              aria-label={open ? 'Collapse section' : 'Expand section'}
            >
              {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          )}
        </div>

        {hasChildren && open && (
          <div className="space-y-1 border-l border-white/10 pl-4">
            {renderNodes(node.children ?? [], pathname, expanded, toggleNode, depth + 1)}
          </div>
        )}
      </div>
    )
  })
}

function resolveIcon(name?: string | null) {
  if (!name) {
    return BookOpen
  }

  // Map of icon names to components
  const iconMap: Record<string, typeof BookOpen> = {
    'Rocket': Rocket,
    'FileText': FileText,
    'Star': Star,
    'Layout': Layout,
    'Plug': Plug,
    'Settings': Settings,
    'Lightbulb': Lightbulb,
    'Code2': Code2,
    'Wrench': Wrench,
    'BookOpen': BookOpen,
  }

  // Try exact match first
  if (iconMap[name]) {
    return iconMap[name]
  }

  // Try case-insensitive match
  const lowerName = name.toLowerCase()
  for (const [key, icon] of Object.entries(iconMap)) {
    if (key.toLowerCase() === lowerName) {
      return icon
    }
  }

  // Default to BookOpen
  return BookOpen
}
