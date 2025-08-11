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
    name: 'Starter',
    price: '$15',
    period: '/month',
    description: 'Perfect for small businesses just getting started',
    color: 'blue',
    features: [
      { text: '1 Prompt Page', included: true },
      { text: '100 Review Requests/month', included: true },
      { text: 'Basic Analytics', included: true },
      { text: 'Email Support', included: true },
      { text: 'Standard Templates', included: true },
      { text: 'QR Code Generation', included: true },
      { text: 'Google Business Integration', included: false },
      { text: 'Custom Branding', included: false },
      { text: 'API Access', included: false },
      { text: 'Priority Support', included: false },
    ],
    recommended: false,
  },
  {
    name: 'Professional',
    price: '$49',
    period: '/month',
    description: 'Most popular choice for growing businesses',
    color: 'purple',
    features: [
      { text: '5 Prompt Pages', included: true },
      { text: '500 Review Requests/month', included: true },
      { text: 'Advanced Analytics', included: true },
      { text: 'Priority Email Support', included: true },
      { text: 'All Templates', included: true },
      { text: 'QR Code Generation', included: true },
      { text: 'Google Business Integration', included: true },
      { text: 'Custom Branding', included: true },
      { text: 'API Access', included: false },
      { text: 'Phone Support', included: false },
    ],
    recommended: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large businesses with advanced needs',
    color: 'green',
    features: [
      { text: 'Unlimited Prompt Pages', included: true },
      { text: 'Unlimited Review Requests', included: true },
      { text: 'Enterprise Analytics', included: true },
      { text: '24/7 Priority Support', included: true },
      { text: 'Custom Templates', included: true },
      { text: 'Advanced QR Features', included: true },
      { text: 'All Integrations', included: true },
      { text: 'White Label Options', included: true },
      { text: 'Full API Access', included: true },
      { text: 'Dedicated Account Manager', included: true },
    ],
    recommended: false,
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
          title="Choose Your Plan"
          description="Select the subscription plan that best fits your business size and review collection needs."
        />

        {/* Free Trial Banner */}
        <div className="mb-8 bg-green-500/20 border border-green-400/30 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <Star className="w-6 h-6 text-green-300 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">14-Day Free Trial</h3>
              <p className="text-white/80">
                All plans come with a 14-day free trial. No credit card required to start.
                Experience the full power of Prompt Reviews before committing.
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
                  <div className="flex items-baseline justify-center mb-2">
                    <span className="text-3xl font-bold text-white">{plan.price}</span>
                    <span className="text-white/60 ml-1">{plan.period}</span>
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
                      <span className={`text-sm ${feature.included ? 'text-white/80' : 'text-white/40'}`}>
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
                  {plan.name === 'Enterprise' ? 'Contact Sales' : 'Start Free Trial'}
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
                Prompt Pages
              </h3>
              <p className="text-white/80 text-sm">
                Customizable review request pages with AI-powered content. Each page can be tailored for different 
                services, products, or customer segments.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2 flex items-center">
                <Building className="w-5 h-5 mr-2 text-blue-300" />
                Google Business Integration
              </h3>
              <p className="text-white/80 text-sm">
                Direct integration with Google Business Profile for automatic review syncing, management, and 
                response capabilities.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2 flex items-center">
                <Star className="w-5 h-5 mr-2 text-green-300" />
                Review Requests
              </h3>
              <p className="text-white/80 text-sm">
                Monthly allocation for sending personalized review requests via email, SMS, or QR codes. 
                Unused requests don't roll over.
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
                After 14 days, you'll be prompted to enter payment information to continue. If you don't, your account 
                will be downgraded to a limited free version.
              </p>
            </details>
            
            <details className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <summary className="font-semibold text-white cursor-pointer">Do you offer discounts for annual billing?</summary>
              <p className="text-white/80 text-sm mt-3">
                Yes! Save 20% when you pay annually. Contact our sales team for custom enterprise pricing.
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
                <h3 className="text-lg font-semibold text-white mb-2">Not Sure Which Plan?</h3>
                <ul className="space-y-2 text-white/80 text-sm">
                  <li>• <strong>Starter:</strong> Great for solo entrepreneurs and small local businesses</li>
                  <li>• <strong>Professional:</strong> Ideal for established businesses with multiple services</li>
                  <li>• <strong>Enterprise:</strong> Perfect for franchises and multi-location businesses</li>
                </ul>
                <p className="text-white/80 text-sm mt-3">
                  Start with the Professional plan during your free trial to experience all features, 
                  then adjust based on your needs.
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