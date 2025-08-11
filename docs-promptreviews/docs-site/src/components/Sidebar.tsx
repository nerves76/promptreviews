'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  BookOpen, 
  Users, 
  MessageSquare, 
  Building2, 
  Code, 
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Zap,
  Star,
  BarChart3,
  Settings
} from 'lucide-react'
import { clsx } from 'clsx'

interface NavItem {
  title: string
  href: string
  icon?: any
  children?: NavItem[]
}

// Custom [P] icon component for Prompt Pages
const PromptPagesIcon = ({ className }: { className?: string }) => (
  <span 
    className={className} 
    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 'bold' }}
  >
    [P]
  </span>
)

const navigation: NavItem[] = [
  {
    title: 'Getting Started',
    href: '/getting-started',
    icon: BookOpen,
    children: [
      { title: 'Quick Start Guide', href: '/getting-started#quick-start' },
      { title: 'Account Setup', href: '/getting-started#account-setup' },
      { title: 'Business Profile Setup', href: '/business-profile' },
      { title: 'First Prompt Page', href: '/getting-started#first-prompt-page' },
    ]
  },
  {
    title: 'Prompt Pages',
    href: '/prompt-pages',
    icon: PromptPagesIcon,
    children: [
      { title: 'Overview', href: '/prompt-pages' },
      { title: 'Page Types', href: '/prompt-pages/types' },
      { title: 'Service Pages', href: '/prompt-pages/types/service' },
      { title: 'Features', href: '/prompt-pages/features' },
    ]
  },
  {
    title: 'AI-Assisted Reviews',
    href: '/ai-reviews',
    icon: Star,
    children: [
      { title: 'Prompty AI', href: '/ai-reviews#prompty-ai' },
      { title: 'How It Works', href: '/ai-reviews#how-it-works' },
      { title: 'Best Practices', href: '/ai-reviews#best-practices' },
    ]
  },
  {
    title: 'Contact Management',
    href: '/contacts',
    icon: Users,
    children: [
      { title: 'Import Contacts', href: '/contacts#import' },
      { title: 'Organize Contacts', href: '/contacts#organize' },
      { title: 'Send Requests', href: '/contacts#send-requests' },
    ]
  },
  {
    title: 'Review Management',
    href: '/reviews',
    icon: MessageSquare,
    children: [
      { title: 'Track Reviews', href: '/reviews#track' },
      { title: 'Respond to Reviews', href: '/reviews#respond' },
      { title: 'Analytics', href: '/reviews#analytics' },
    ]
  },
  {
    title: 'Google Business Profile',
    href: '/google-business',
    icon: Building2,
    children: [
      { title: 'Connect Profile', href: '/google-business#connect' },
      { title: 'Manage Reviews', href: '/google-business#reviews' },
      { title: 'Multiple Locations', href: '/google-business#locations' },
      { title: 'Google Posts', href: '/google-business#posts' },
    ]
  },
  {
    title: 'Widgets',
    href: '/widgets',
    icon: Code,
    children: [
      { title: 'Widget Types', href: '/widgets#types' },
      { title: 'Installation', href: '/widgets#installation' },
      { title: 'Customization', href: '/widgets#customization' },
    ]
  },
  {
    title: 'Team & Account',
    href: '/team',
    icon: Settings,
    children: [
      { title: 'Team Roles', href: '/team#roles' },
      { title: 'Add Members', href: '/team#add-members' },
      { title: 'Billing & Plans', href: '/billing' },
      { title: 'Account Settings', href: '/team#settings' },
    ]
  },
  {
    title: 'Advanced Features',
    href: '/advanced',
    icon: BarChart3,
    children: [
      { title: 'Style Settings', href: '/style-settings' },
      { title: 'Analytics', href: '/analytics' },
      { title: 'Automation', href: '/advanced#automation' },
      { title: 'API Access', href: '/advanced#api' },
      { title: 'Webhooks', href: '/advanced#webhooks' },
    ]
  },
  {
    title: 'Help & Support',
    href: '/troubleshooting',
    icon: HelpCircle,
    children: [
      { title: 'Troubleshooting', href: '/troubleshooting' },
      { title: 'FAQ', href: '/faq' },
      { title: 'Contact Support', href: '/troubleshooting#support' },
    ]
  },
]

interface SidebarProps {
  className?: string
}

export default function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const [expandedSections, setExpandedSections] = useState<string[]>(() => {
    // Auto-expand section if current path matches
    const currentSection = navigation.find(section => 
      pathname.startsWith(section.href) || 
      section.children?.some(child => pathname === child.href)
    )
    return currentSection ? [currentSection.href] : []
  })

  const toggleSection = (href: string) => {
    setExpandedSections(prev => 
      prev.includes(href) 
        ? prev.filter(section => section !== href)
        : [...prev, href]
    )
  }

  const isActive = (href: string) => pathname === href

  const isParentActive = (section: NavItem) => {
    return pathname.startsWith(section.href) || 
           section.children?.some(child => pathname === child.href)
  }

  return (
    <nav className={clsx('flex flex-col space-y-1', className)}>
      {navigation.map((section) => {
        const isExpanded = expandedSections.includes(section.href)
        const hasChildren = section.children && section.children.length > 0
        const parentActive = isParentActive(section)

        return (
          <div key={section.href}>
            {hasChildren ? (
              <button
                onClick={() => toggleSection(section.href)}
                className={clsx(
                  'flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                  parentActive
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                )}
              >
                <div className="flex items-center space-x-3">
                  {section.icon && (
                    <section.icon className={clsx(
                      'w-4 h-4',
                      parentActive ? 'text-yellow-300' : 'text-white/60'
                    )} />
                  )}
                  <span>{section.title}</span>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            ) : (
              <Link
                href={section.href}
                className={clsx(
                  'flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                  isActive(section.href)
                    ? 'bg-white/20 text-white border-l-2 border-yellow-300'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                )}
              >
                {section.icon && (
                  <section.icon className={clsx(
                    'w-4 h-4',
                    isActive(section.href) ? 'text-yellow-300' : 'text-white/60'
                  )} />
                )}
                <span>{section.title}</span>
              </Link>
            )}

            {hasChildren && isExpanded && section.children && (
              <div className="ml-4 mt-1 space-y-1">
                {section.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={clsx(
                      'block px-3 py-1.5 text-sm rounded-lg transition-colors border-l-2',
                      isActive(child.href)
                        ? 'bg-white/20 text-white border-yellow-300'
                        : 'text-white/60 hover:text-white hover:bg-white/10 border-white/20'
                    )}
                  >
                    {child.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}