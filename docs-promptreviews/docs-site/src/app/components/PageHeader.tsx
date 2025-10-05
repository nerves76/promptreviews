import Breadcrumbs from './Breadcrumbs'
import { LucideIcon } from 'lucide-react'

interface PageHeaderProps {
  breadcrumbs?: { label: string; href?: string }[]
  currentPage: string
  categoryLabel: string
  categoryIcon: LucideIcon
  categoryColor?: string
  title: string
  description: string
}

export default function PageHeader({
  breadcrumbs = [],
  currentPage,
  categoryLabel,
  categoryIcon: Icon,
  categoryColor = 'orange',
  title,
  description
}: PageHeaderProps) {
  const colorClasses = {
    orange: 'bg-orange-500/20 text-orange-300',
    blue: 'bg-blue-500/20 text-yellow-300',
    green: 'bg-green-500/20 text-green-300',
    purple: 'bg-purple-500/20 text-purple-300',
    pink: 'bg-pink-500/20 text-pink-300',
    yellow: 'bg-yellow-500/20 text-yellow-300',
    red: 'bg-red-500/20 text-red-300',
  }

  return (
    <div className="max-w-4xl mx-auto mb-16">
      <Breadcrumbs items={breadcrumbs} currentPage={currentPage} />
      
      <div className={`inline-flex items-center space-x-2 ${colorClasses[categoryColor as keyof typeof colorClasses] || colorClasses.orange} px-4 py-2 rounded-full text-sm font-medium mb-6`}>
        <Icon className="w-4 h-4" />
        <span>{categoryLabel}</span>
      </div>
      
      <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6 text-balance">
        {title}
      </h1>
      
      <p className="text-xl text-white/90 mb-8 text-balance">
        {description}
      </p>
    </div>
  )
}