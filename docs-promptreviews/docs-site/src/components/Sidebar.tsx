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
  Star,
  BarChart3,
  Settings,
  Target,
  CreditCard
} from 'lucide-react'
import { clsx } from 'clsx'

interface NavItem {
  title: string
  href: string
  icon?: any
  children?: NavItem[]
  isExpandable?: boolean
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
      { title: 'Account Setup', href: '/getting-started/account-setup' },
      { title: 'Business Profile Setup', href: '/business-profile' },
      { title: 'Adding Contacts', href: '/getting-started/adding-contacts' },
      { title: 'Choosing a Plan', href: '/getting-started/choosing-plan' },
      { title: 'First Prompt Page', href: '/getting-started/first-prompt-page' },
      { title: 'First Review Request', href: '/getting-started/first-review-request' },
      { title: 'Review Widget Setup', href: '/getting-started/review-widget' },
    ]
  },
  {
    title: 'Prompt Pages',
    href: '/prompt-pages',
    icon: PromptPagesIcon,
    children: [
      { title: 'Prompt Page Settings', href: '/prompt-pages/settings' },
      {
        title: 'Page Types',
        href: '/prompt-pages/types',
        isExpandable: true,
        children: [
          { title: 'Universal', href: '/prompt-pages/types/universal' },
          { title: 'Service', href: '/prompt-pages/types/service' },
          { title: 'Event', href: '/prompt-pages/types/event' },
          { title: 'Employee', href: '/prompt-pages/types/employee' },
          { title: 'Product', href: '/prompt-pages/types/product' },
          { title: 'Photo', href: '/prompt-pages/types/photo' },
          { title: 'Video', href: '/prompt-pages/types/video' },
        ]
      },
      {
        title: 'Features',
        href: '/prompt-pages/features',
        isExpandable: true,
        children: [
          { title: 'Emoji Sentiment Flow', href: '/prompt-pages/features/emoji-sentiment' },
          { title: 'AI-Powered Content', href: '/prompt-pages/features/ai-powered' },
          { title: 'QR Code Generation', href: '/prompt-pages/features/qr-codes' },
          { title: 'Customization', href: '/prompt-pages/features/customization' },
          { title: 'Analytics & Insights', href: '/prompt-pages/features/analytics' },
          { title: 'Multi-Platform Sharing', href: '/prompt-pages/features/multi-platform' },
          { title: 'Mobile Optimization', href: '/prompt-pages/features/mobile' },
          { title: 'Security & Privacy', href: '/prompt-pages/features/security' },
          { title: 'Platform Integration', href: '/prompt-pages/features/integration' },
        ]
      },
      { title: 'Style Settings', href: '/style-settings' },
    ]
  },
  {
    title: 'Strategies',
    href: '/strategies',
    icon: Target,
    children: [
      { title: 'Double-Dip', href: '/strategies/double-dip' },
      { title: 'Reciprocity', href: '/strategies/reciprocity' },
      { title: 'Personal Outreach', href: '/strategies/personal-outreach' },
      { title: 'Non-AI Strategies', href: '/strategies/non-ai-strategies' },
      { title: 'Novelty Factor', href: '/strategies/novelty' },
      { title: 'Reviews on the Fly', href: '/strategies/reviews-on-fly' },
    ]
  },
  {
    title: 'AI-Assisted Reviews',
    href: '/ai-reviews',
    icon: Star
  },
  {
    title: 'Contact Management',
    href: '/contacts',
    icon: Users
  },
  {
    title: 'Review Management',
    href: '/reviews',
    icon: MessageSquare
  },
  {
    title: 'Google Business Profile',
    href: '/google-business',
    icon: Building2,
    children: [
      { title: 'Business Info', href: '/google-business/business-info' },
      { title: 'Image Upload', href: '/google-business/image-upload' },
      { title: 'Categories & Services', href: '/google-business/categories-services' },
      { title: 'Scheduling', href: '/google-business/scheduling' },
      { title: 'Bulk Updates', href: '/google-business/bulk-updates' },
      { title: 'Review Import', href: '/google-business/review-import' },
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
    title: 'Billing & Plans',
    href: '/billing',
    icon: CreditCard,
    children: [
      { title: 'Overview', href: '/billing' },
      { title: 'Upgrades & Downgrades', href: '/billing/upgrades-downgrades' },
      { title: 'Choosing a Plan', href: '/getting-started/choosing-plan' },
    ]
  },
  {
    title: 'Team & Account',
    href: '/team',
    icon: Settings
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    title: 'Help & Support',
    href: '/troubleshooting',
    icon: HelpCircle,
    children: [
      { title: 'Troubleshooting', href: '/troubleshooting' },
      { title: 'FAQ', href: '/faq' },
    ]
  },
]

interface SidebarProps {
  className?: string
}

export default function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const [expandedSections, setExpandedSections] = useState<string[]>(() => {
    // Auto-expand sections if current path matches (including nested children)
    const sectionsToExpand: string[] = []

    navigation.forEach(section => {
      if (pathname.startsWith(section.href)) {
        sectionsToExpand.push(section.href)
      }

      // Check first-level children
      section.children?.forEach(child => {
        if (pathname === child.href || pathname.startsWith(child.href)) {
          sectionsToExpand.push(section.href)
          if (child.isExpandable && child.children) {
            sectionsToExpand.push(child.href)
          }
        }

        // Check second-level children
        child.children?.forEach(grandchild => {
          if (pathname === grandchild.href) {
            sectionsToExpand.push(section.href)
            sectionsToExpand.push(child.href)
          }
        })
      })
    })

    return sectionsToExpand
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
    const checkChildren = (children?: NavItem[]): boolean => {
      if (!children) return false
      return children.some(child =>
        pathname === child.href ||
        pathname.startsWith(child.href) ||
        checkChildren(child.children)
      )
    }

    return pathname.startsWith(section.href) || checkChildren(section.children)
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
              <div className="flex items-center rounded-lg overflow-hidden">
                <Link
                  href={section.href}
                  className={clsx(
                    'flex items-center space-x-3 flex-1 px-3 py-2 text-sm font-medium transition-colors',
                    parentActive
                      ? 'bg-white/20 text-white'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  )}
                >
                  {section.icon && (
                    <section.icon className={clsx(
                      'w-4 h-4',
                      parentActive ? 'text-yellow-300' : 'text-white/60'
                    )} />
                  )}
                  <span>{section.title}</span>
                </Link>
                <button
                  onClick={() => toggleSection(section.href)}
                  className={clsx(
                    'px-2 py-2 text-sm transition-colors',
                    parentActive
                      ? 'text-white'
                      : 'text-white/60 hover:text-white'
                  )}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              </div>
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
                {section.children.map((child) => {
                  const childExpanded = expandedSections.includes(child.href)
                  const hasGrandchildren = child.children && child.children.length > 0

                  return (
                    <div key={child.href}>
                      {child.isExpandable && hasGrandchildren ? (
                        <>
                          <div className="flex items-center border-l-2 border-white/20 rounded-lg overflow-hidden">
                            <Link
                              href={child.href}
                              className={clsx(
                                'flex-1 px-3 py-1.5 text-sm transition-colors',
                                isActive(child.href)
                                  ? 'bg-white/20 text-white'
                                  : 'text-white/60 hover:text-white hover:bg-white/10'
                              )}
                            >
                              {child.title}
                            </Link>
                            <button
                              onClick={() => toggleSection(child.href)}
                              className={clsx(
                                'px-2 py-1.5 transition-colors',
                                isActive(child.href)
                                  ? 'text-white'
                                  : 'text-white/60 hover:text-white'
                              )}
                            >
                              {childExpanded ? (
                                <ChevronDown className="w-3 h-3" />
                              ) : (
                                <ChevronRight className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          {childExpanded && child.children && (
                            <div className="ml-4 mt-1 space-y-1">
                              {child.children.map((grandchild) => (
                                <Link
                                  key={grandchild.href}
                                  href={grandchild.href}
                                  className={clsx(
                                    'block px-3 py-1.5 text-sm rounded-lg transition-colors border-l-2',
                                    isActive(grandchild.href)
                                      ? 'bg-white/20 text-white border-yellow-300'
                                      : 'text-white/60 hover:text-white hover:bg-white/10 border-white/20'
                                  )}
                                >
                                  {grandchild.title}
                                </Link>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <Link
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
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}