import { Metadata } from 'next';
import Link from 'next/link';
import DocsLayout from '../../docs-layout';
import PageHeader from '../../components/PageHeader';
import { CreditCard, Check, X, ArrowRight, Info, Star, Zap, Building } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Choose Your Plan | Prompt Reviews',
  description: 'Select the perfect Prompt Reviews plan for your business. Compare features and pricing to find what works best for you.',
  keywords: 'prompt reviews pricing, plans, subscription, free trial, pricing comparison',
};

const plans = [
  {
    name: 'Grower',
    price: '$15',
    annualPrice: '$153',
    period: '/month',
    annualPeriod: '/year',
    savings: '$27',
    description: 'Perfect for small businesses just getting started',
    color: 'blue',
    features: [
      { text: '14-day free trial', included: true, highlight: true },
      { text: 'Universal prompt page', included: true },
      { text: '3 custom prompt pages', included: true },
      { text: 'Review widget', included: true },
      { text: 'Upload contacts', included: false },
      { text: 'Team members', included: false },
      { text: 'Analytics', included: false },
      { text: 'Google Business Profile management', included: false },
      { text: 'Multiple locations', included: false },
    ],
    recommended: false,
    trialAvailable: true,
  },
  {
    name: 'Builder',
    price: '$35',
    annualPrice: '$357',
    period: '/month',
    annualPeriod: '/year',
    savings: '$63',
    description: 'Ideal for growing businesses with a team',
    color: 'purple',
    features: [
      { text: '3 team members', included: true },
      { text: 'Workflow management', included: true },
      { text: 'Universal prompt page', included: true },
      { text: '50 prompt pages', included: true },
      { text: '1,000 contacts', included: true },
      { text: 'Review widget', included: true },
      { text: 'Analytics', included: true },
      { text: 'Google Business Profile management', included: true },
      { text: 'Multiple locations', included: false },
    ],
    recommended: true,
    trialAvailable: false,
  },
  {
    name: 'Maven',
    price: '$100',
    annualPrice: '$1,020',
    period: '/month',
    annualPeriod: '/year',
    savings: '$180',
    description: 'For established businesses & franchises',
    color: 'yellow',
    features: [
      { text: '5 team members', included: true },
      { text: 'Up to 10 business locations', included: true },
      { text: 'Workflow management', included: true },
      { text: '500 prompt pages', included: true },
      { text: '10,000 contacts', included: true },
      { text: 'Review widget', included: true },
      { text: 'Analytics', included: true },
      { text: 'Google Business Profile management', included: true },
      { text: 'Priority support', included: true },
    ],
    recommended: false,
    trialAvailable: false,
  },
];

export default function ChoosingPlanPage() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto">
        <PageHeader
          breadcrumbs={[
            { label: 'Help', href: '/' },
            { label: 'Getting Started', href: '/getting-started' }
          ]}
          currentPage="Choose Your Plan"
          categoryLabel="Step 2"
          categoryIcon={CreditCard}
          categoryColor="purple"
          title="Choose your plan"
          description="Select the subscription plan that best fits your business size and review collection needs."
        />

        {/* Free Trial Banner */}
        <div className="mb-8 bg-green-500/20 border border-green-400/30 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <Star className="w-6 h-6 text-green-300 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">14-Day Free Trial Available</h3>
              <p className="text-white/80">
                Start with the Grower plan and get a 14-day free trial - no credit card required! 
                Perfect for testing the waters before upgrading to a paid plan with more features.
              </p>
            </div>
          </div>
        </div>

        {/* Annual Billing Banner */}
        <div className="mb-8 bg-blue-500/20 border border-blue-400/30 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <Zap className="w-6 h-6 text-blue-300 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Save 15% with Annual Billing</h3>
              <p className="text-white/80">
                Choose annual billing and save 15% on any plan! Pay yearly and get the equivalent of almost 2 months free. 
                Perfect for businesses ready to commit to growing their online reputation.
              </p>
            </div>
          </div>
        </div>

        {/* Plan Comparison */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Compare Plans</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-white/10 backdrop-blur-md border ${
                  plan.recommended ? 'border-purple-400' : 'border-white/20'
                } rounded-xl p-6 hover:shadow-lg transition-shadow`}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-purple-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      MOST POPULAR
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center mb-1">
                    <span className="text-3xl font-bold text-white">{plan.price}</span>
                    <span className="text-white/60 ml-1">{plan.period}</span>
                  </div>
                  <div className="flex items-center justify-center mb-2">
                    <span className="text-sm text-white/70">or {plan.annualPrice}{plan.annualPeriod}</span>
                    <span className="ml-2 text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full">
                      Save {plan.savings}
                    </span>
                  </div>
                  <p className="text-white/80 text-sm">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      ) : (
                        <X className="w-5 h-5 text-red-400 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${
                        feature.highlight 
                          ? 'text-yellow-300 font-semibold' 
                          : feature.included 
                            ? 'text-white/80' 
                            : 'text-white/40'
                      }`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    plan.recommended
                      ? 'bg-purple-500 text-white hover:bg-purple-600'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {plan.trialAvailable ? 'Start Free Trial' : 'Get Started'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Details */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Key Features Explained</h2>
          
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-yellow-300" />
                Universal vs Custom Prompt Pages
              </h3>
              <p className="text-white/80 text-sm">
                <strong>Universal prompt page:</strong> A single page to collect reviews from any platform, perfect for QR codes and general use.<br/>
                <strong>Custom prompt pages:</strong> Personalized pages for individual customers with AI-powered assistance for writing reviews.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2 flex items-center">
                <Building className="w-5 h-5 mr-2 text-blue-300" />
                Google Business Profile Management
              </h3>
              <p className="text-white/80 text-sm">
                Direct integration with Google Business Profile for importing reviews, managing responses, and 
                handling multiple business locations (Maven plan only).
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2 flex items-center">
                <Star className="w-5 h-5 mr-2 text-green-300" />
                Contact Management & Workflow
              </h3>
              <p className="text-white/80 text-sm">
                Upload and organize customer contacts (Builder & Maven plans), send personalized review requests, 
                and automate your review collection workflow with team collaboration features.
              </p>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            <details className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <summary className="font-semibold text-white cursor-pointer">Can I change plans later?</summary>
              <p className="text-white/80 text-sm mt-3">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect at the next billing cycle.
              </p>
            </details>
            
            <details className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <summary className="font-semibold text-white cursor-pointer">What happens after the free trial?</summary>
              <p className="text-white/80 text-sm mt-3">
                After your 14-day Grower plan trial ends, you can choose to upgrade to Builder or Maven for more features, 
                or continue with the Grower plan at $15/month. Your data and settings will be preserved.
              </p>
            </details>
            
            <details className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <summary className="font-semibold text-white cursor-pointer">What's the difference between the plans?</summary>
              <p className="text-white/80 text-sm mt-3">
                <strong>Grower:</strong> Basic features for solo businesses, no contact uploads or team features.<br/>
                <strong>Builder:</strong> Adds team collaboration, contact management, and analytics.<br/>
                <strong>Maven:</strong> Everything in Builder plus support for multiple locations and higher limits.
              </p>
            </details>
          </div>
        </div>

        {/* Tips */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Choosing the Right Plan</h2>
          
          <div className="bg-blue-500/20 border border-blue-400/30 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <Info className="w-6 h-6 text-blue-300 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Which Plan Is Right for You?</h3>
                <ul className="space-y-2 text-white/80 text-sm">
                  <li>• <strong>Grower ($15/mo):</strong> Perfect for solo entrepreneurs and small businesses just starting with review collection</li>
                  <li>• <strong>Builder ($35/mo):</strong> Ideal for growing businesses that need team collaboration and contact management</li>
                  <li>• <strong>Maven ($100/mo):</strong> Best for established businesses, franchises, or multi-location operations</li>
                </ul>
                <p className="text-white/80 text-sm mt-3">
                  Start with the free 14-day Grower trial to test the platform, then upgrade to Builder or Maven 
                  when you need more advanced features like team management and analytics.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to Create Your First Prompt Page?
          </h2>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            Now that you've selected your plan, let's create your first prompt page to start collecting reviews.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/getting-started/first-prompt-page"
              className="inline-flex items-center px-6 py-3 bg-white/20 text-white backdrop-blur-sm font-medium rounded-lg hover:bg-white/30 transition-colors"
            >
              Create First Prompt Page
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
            <Link
              href="/getting-started"
              className="inline-flex items-center px-6 py-3 border border-white text-white font-medium rounded-lg hover:bg-white/10 transition-colors"
            >
              Back to Overview
            </Link>
          </div>
        </div>
      </div>
    </DocsLayout>
  );
}