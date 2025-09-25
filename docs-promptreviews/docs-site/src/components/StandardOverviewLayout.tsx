import { LucideIcon } from 'lucide-react'
import { CheckCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import DocsLayout from '../app/docs-layout'
import PageHeader from '../app/components/PageHeader'
import PageFAQs from '../app/components/PageFAQs'

interface Feature {
  icon: LucideIcon
  title: string
  description: string
  href?: string
}

interface Step {
  number: number
  title: string
  description: string
  icon: LucideIcon
}

interface BestPractice {
  icon: LucideIcon
  title: string
  description: string
}

interface CallToAction {
  primary?: {
    text: string
    href: string
    external?: boolean
  }
  secondary?: {
    text: string
    href: string
    external?: boolean
  }
}

interface StandardOverviewLayoutProps {
  // Page metadata
  title: string
  description: string
  categoryLabel: string
  categoryIcon: LucideIcon
  categoryColor: string
  breadcrumbs?: { label: string; href?: string }[]
  currentPage: string

  // Plan availability
  availablePlans: ('grower' | 'builder' | 'maven')[]

  // Content sections
  keyFeatures: Feature[]
  howItWorks: Step[]
  bestPractices: BestPractice[]
  faqs: { question: string; answer: string }[]

  // Call to action
  callToAction: CallToAction

  // Optional overview section
  overview?: {
    title: string
    content: React.ReactNode
  }
}

const planLabels = {
  grower: { label: 'Grower', color: 'bg-green-500/20 text-green-300' },
  builder: { label: 'Builder', color: 'bg-purple-500/20 text-purple-300' },
  maven: { label: 'Maven', color: 'bg-yellow-500/20 text-yellow-300' }
}

export default function StandardOverviewLayout({
  title,
  description,
  categoryLabel,
  categoryIcon,
  categoryColor,
  breadcrumbs = [],
  currentPage,
  availablePlans,
  keyFeatures,
  howItWorks,
  bestPractices,
  faqs,
  callToAction,
  overview
}: StandardOverviewLayoutProps) {
  return (
    <DocsLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <PageHeader
          breadcrumbs={breadcrumbs.length > 0 ? breadcrumbs : [{ label: 'Help', href: '/' }]}
          currentPage={currentPage}
          categoryLabel={categoryLabel}
          categoryIcon={categoryIcon}
          categoryColor={categoryColor}
          title={title}
          description={description}
        />

        {/* Plan Indicator - Moved directly under title, left aligned */}
        <div className="mb-12 -mt-8">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-white/60">Available on:</span>
            {availablePlans.map((plan) => (
              <span key={plan} className={`text-xs px-2 py-1 rounded-full font-medium ${planLabels[plan].color}`}>
                {planLabels[plan].label}
              </span>
            ))}
          </div>
        </div>

        {/* Overview Section (Optional) */}
        {overview && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">{overview.title}</h2>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
              {overview.content}
            </div>
          </div>
        )}

        {/* Key Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Key Features</h2>

          <div className="grid md:grid-cols-2 gap-6">
            {keyFeatures.map((feature) => (
              <div key={feature.title} className="group bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 hover:border-white/30 hover:bg-white/15 transition-all duration-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white group-hover:text-yellow-300 transition-colors">{feature.title}</h3>
                </div>

                <p className="text-white/80 mb-4">{feature.description}</p>

                {feature.href && (
                  <Link href={feature.href} className="inline-flex items-center text-yellow-300 hover:underline font-medium text-sm">
                    Learn more
                    <ArrowRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">How It Works</h2>

          <div className="space-y-6">
            {howItWorks.map((step) => (
              <div key={step.number} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">{step.number}</div>
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <step.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                </div>
                <p className="text-white/90 ml-16">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Best Practices */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Best Practices</h2>

          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
            <div className="space-y-6">
              {bestPractices.map((practice) => (
                <div key={practice.title} className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <practice.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-2">{practice.title}</h3>
                    <p className="text-white/80">{practice.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FAQs */}
        <PageFAQs
          faqs={faqs}
          pageTitle={currentPage}
          pageUrl={`https://docs.promptreviews.app/${currentPage.toLowerCase().replace(/\s+/g, '-')}`}
        />

        {/* Call to Action */}
        <div className="mt-16">
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Ready to Get Started?</h2>
            <p className="text-white/80 mb-6 max-w-2xl mx-auto">
              Take advantage of these powerful features to grow your business.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {callToAction.secondary && (
                <Link
                  href={callToAction.secondary.href}
                  className="inline-flex items-center space-x-2 bg-white/10 text-white px-6 py-3 rounded-lg hover:bg-white/20 border border-white/30 transition-colors font-medium backdrop-blur-sm"
                >
                  <span>{callToAction.secondary.text}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}

              {callToAction.primary && (
                <Link
                  href={callToAction.primary.href}
                  className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  {...(callToAction.primary.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  <span>{callToAction.primary.text}</span>
                  <CheckCircle className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </DocsLayout>
  )
}