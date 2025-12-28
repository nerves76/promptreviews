'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChevronDown,
  ChevronRight,
  // Default & General
  BookOpen,
  Rocket,
  FileText,
  Star,
  Layout,
  Plug,
  Settings,
  Lightbulb,
  Code2,
  Wrench,
  // Additional icons for navigation
  Home,
  Search,
  Bell,
  CheckCircle,
  Clock,
  Eye,
  Gift,
  Globe,
  Heart,
  HelpCircle,
  Info,
  Key,
  Link as LinkIcon,
  Lock,
  Zap,
  Target,
  Shield,
  Sparkles,
  // Documents
  File,
  Folder,
  Book,
  Bookmark,
  Newspaper,
  // Charts
  BarChart,
  LineChart,
  TrendingUp,
  Activity,
  // Communication
  Mail,
  MessageCircle,
  Send,
  Phone,
  // Users
  User,
  Users,
  UserPlus,
  // Faces
  Smile,
  // Business
  Building,
  Store,
  Briefcase,
  CreditCard,
  Award,
  Trophy,
  // Location
  Map,
  MapPin,
  Navigation,
  Compass,
  // Tech
  Monitor,
  Smartphone,
  Cloud,
  Database,
  Terminal,
  Code,
  // AI
  Bot,
  Brain,
  Wand2,
  // Actions
  Download,
  Upload,
  Edit,
  Pencil,
  Copy,
  Play,
  // Arrows
  ArrowRight,
  ExternalLink,
  // Calendar
  Calendar,
  // Media
  Image,
  Camera,
  // Grid
  Grid,
  LayoutGrid,
  LayoutDashboard,
  Table,
  // Misc
  Package,
  Flame,
  QrCode
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
              'flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 transition-colors flex-1 min-w-0',
              isActive
                ? 'bg-white text-slate-900'
                : isAncestorActive
                ? 'bg-white/10 text-white'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            )}
          >
            <IconComponent className="h-4 w-4 flex-shrink-0" />
            <span className="break-words text-sm font-medium">{node.title}</span>
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
    // Original icons
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
    // General
    'Home': Home,
    'Search': Search,
    'Bell': Bell,
    'CheckCircle': CheckCircle,
    'Clock': Clock,
    'Eye': Eye,
    'Gift': Gift,
    'Globe': Globe,
    'Heart': Heart,
    'HelpCircle': HelpCircle,
    'Info': Info,
    'Key': Key,
    'Link': LinkIcon,
    'Lock': Lock,
    'Zap': Zap,
    'Target': Target,
    'Shield': Shield,
    'Sparkles': Sparkles,
    // Documents
    'File': File,
    'Folder': Folder,
    'Book': Book,
    'Bookmark': Bookmark,
    'Newspaper': Newspaper,
    // Charts
    'BarChart': BarChart,
    'LineChart': LineChart,
    'TrendingUp': TrendingUp,
    'Activity': Activity,
    // Communication
    'Mail': Mail,
    'MessageCircle': MessageCircle,
    'Send': Send,
    'Phone': Phone,
    // Users
    'User': User,
    'Users': Users,
    'UserPlus': UserPlus,
    // Faces
    'Smile': Smile,
    // Business
    'Building': Building,
    'Store': Store,
    'Briefcase': Briefcase,
    'CreditCard': CreditCard,
    'Award': Award,
    'Trophy': Trophy,
    // Location
    'Map': Map,
    'MapPin': MapPin,
    'Navigation': Navigation,
    'Compass': Compass,
    // Tech
    'Monitor': Monitor,
    'Smartphone': Smartphone,
    'Cloud': Cloud,
    'Database': Database,
    'Terminal': Terminal,
    'Code': Code,
    // AI
    'Bot': Bot,
    'Brain': Brain,
    'Wand2': Wand2,
    // Actions
    'Download': Download,
    'Upload': Upload,
    'Edit': Edit,
    'Pencil': Pencil,
    'Copy': Copy,
    'Play': Play,
    // Arrows
    'ArrowRight': ArrowRight,
    'ExternalLink': ExternalLink,
    // Calendar
    'Calendar': Calendar,
    // Media
    'Image': Image,
    'Camera': Camera,
    // Grid
    'Grid': Grid,
    'LayoutGrid': LayoutGrid,
    'LayoutDashboard': LayoutDashboard,
    'Table': Table,
    // Misc
    'Package': Package,
    'Flame': Flame,
    'QrCode': QrCode,
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
