'use client'

import React from 'react'
import Link from 'next/link'
import PageFAQs from './PageFAQs'
import ContextualFAQs from './ContextualFAQs'
import { LucideIcon, ArrowRight, CheckCircle } from 'lucide-react'

interface Feature {
  icon: LucideIcon
  title: string
  description: string
  link?: string
}

interface KeyPoint {
  title: string
  description: string
}

interface StandardOverviewLayoutProps {
  // Basic Info
  title: string
  description: string
  icon: LucideIcon
  iconColor: string

  // Plan availability
  availablePlans: ('grower' | 'builder' | 'maven')[]

  // Main content sections
  introduction?: React.ReactNode
  keyFeatures?: Feature[]
  howItWorks?: React.ReactNode
  keyPoints?: KeyPoint[]
  bestPractices?: React.ReactNode

  // FAQs - Updated to support new pattern
  faqs?: any[] // Legacy support
  faqPageKey?: string // New: page key for contextual FAQs
  faqTitle?: string // Custom FAQ section title
  faqLimit?: number // Number of FAQs to show
  showFAQPlans?: boolean // Whether to show plan indicators

  // Call to action
  ctaTitle?: string
  ctaDescription?: string
  ctaButtons?: {
    text: string
    href: string
    variant?: 'primary' | 'secondary'
    icon?: LucideIcon
  }[]

  // Additional custom sections
  customSections?: React.ReactNode
}

export default function StandardOverviewLayout({
  title,
  description,
  icon: Icon,
  iconColor,
  availablePlans,
  introduction,
  keyFeatures,
  howItWorks,
  keyPoints,
  bestPractices,
  faqs,
  faqPageKey,
  faqTitle,
  faqLimit = 5,
  showFAQPlans = false,
  ctaTitle,
  ctaDescription,
  ctaButtons,
  customSections
}: StandardOverviewLayoutProps) {
  return (
    <>
      {/* Plan Availability Indicator */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-white/60">Available on:</span>
          {availablePlans.includes('grower') && (
            <span className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded-full font-medium">
              Grower
            </span>
          )}
          {availablePlans.includes('builder') && (
            <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded-full font-medium">
              Builder
            </span>
          )}
          {availablePlans.includes('maven') && (
            <span className="bg-yellow-500/20 text-yellow-300 text-xs px-2 py-1 rounded-full font-medium">
              Maven
            </span>
          )}
        </div>
      </div>

      {/* Introduction Section */}
      {introduction && (
        <div className="max-w-4xl mx-auto mb-12">
          {introduction}
        </div>
      )}

      {/* Key Features Grid */}
      {keyFeatures && keyFeatures.length > 0 && (
        <div className="max-w-4xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-white mb-8">Key Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {keyFeatures.map((feature, index) => {
              const FeatureIcon = feature.icon
              return (
                <div key={index} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                  <FeatureIcon className={`w-8 h-8 mb-4 ${getIconColor(iconColor)}`} />
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-white/80 mb-3">{feature.description}</p>
                  {feature.link && (
                    <Link
                      href={feature.link}
                      className="inline-flex items-center text-blue-300 hover:text-blue-200 text-sm"
                    >
                      Learn more <ArrowRight className="w-3 h-3 ml-1" />
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* How It Works Section */}
      {howItWorks && (
        <div className="max-w-4xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-white mb-8">How It Works</h2>
          {howItWorks}
        </div>
      )}

      {/* Key Points */}
      {keyPoints && keyPoints.length > 0 && (
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
            <div className="space-y-4">
              {keyPoints.map((point, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-300 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white font-medium mb-1">{point.title}</p>
                    <p className="text-white/70 text-sm">{point.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Best Practices */}
      {bestPractices && (
        <div className="max-w-4xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-white mb-8">Best Practices</h2>
          {bestPractices}
        </div>
      )}

      {/* Custom Sections */}
      {customSections}

      {/* FAQs Section */}
      {(faqs && faqs.length > 0) || faqPageKey ? (
        <div className="max-w-4xl mx-auto mb-12">
          {faqPageKey ? (
            <ContextualFAQs
              pageKey={faqPageKey}
              title={faqTitle}
              limit={faqLimit}
              showPlans={showFAQPlans}
              showViewAll={true}
            />
          ) : (
            faqs && faqs.length > 0 && (
              <PageFAQs
                faqs={faqs}
                pageTitle={faqTitle || title}
                pageUrl=""
              />
            )
          )}
        </div>
      ) : null}

      {/* Call to Action */}
      {ctaButtons && ctaButtons.length > 0 && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-8 text-center">
            {ctaTitle && (
              <h2 className="text-2xl font-bold text-white mb-4">{ctaTitle}</h2>
            )}
            {ctaDescription && (
              <p className="text-white/80 mb-6 max-w-2xl mx-auto">{ctaDescription}</p>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {ctaButtons.map((button, index) => {
                const ButtonIcon = button.icon
                const isPrimary = button.variant === 'primary' || index === ctaButtons.length - 1

                return (
                  <Link
                    key={index}
                    href={button.href}
                    className={`inline-flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors font-medium ${
                      isPrimary
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-white/10 text-white hover:bg-white/20 border border-white/30 backdrop-blur-sm'
                    }`}
                  >
                    <span>{button.text}</span>
                    {ButtonIcon && <ButtonIcon className="w-4 h-4" />}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function getIconColor(color: string): string {
  const colorMap: { [key: string]: string } = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    purple: 'text-purple-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400',
    orange: 'text-orange-400',
    pink: 'text-pink-400',
    cyan: 'text-cyan-400',
  }
  return colorMap[color] || 'text-blue-400'
}