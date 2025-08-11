import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  currentPage: string
}

export default function Breadcrumbs({ items, currentPage }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center space-x-2 text-sm">
        <li>
          <Link 
            href="/" 
            className="text-white/60 hover:text-white transition-colors inline-flex items-center"
          >
            <Home className="w-4 h-4" />
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center space-x-2">
            <ChevronRight className="w-4 h-4 text-white/40" />
            {item.href ? (
              <Link 
                href={item.href} 
                className="text-white/60 hover:text-white transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-white/60">{item.label}</span>
            )}
          </li>
        ))}
        <li className="flex items-center space-x-2">
          <ChevronRight className="w-4 h-4 text-white/40" />
          <span className="text-white font-medium">{currentPage}</span>
        </li>
      </ol>
    </nav>
  )
}