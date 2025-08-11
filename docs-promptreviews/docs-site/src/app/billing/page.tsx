import { Metadata } from 'next';
import Link from 'next/link';
import DocsLayout from '../docs-layout';
import PageHeader from '../components/PageHeader';
import { CreditCard, Check, X, ArrowUp, ArrowDown, DollarSign, Calendar, Shield, AlertCircle, ArrowRight, Clock, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Billing & Plans Management | Prompt Reviews',
  description: 'Comprehensive guide to managing your Prompt Reviews subscription, upgrading/downgrading plans, billing history, and payment methods.',
  keywords: 'billing, plans, subscription, upgrade, downgrade, payment methods, pricing, prompt reviews',
};

export default function BillingPage() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto">
        <PageHeader
          breadcrumbs={[
            { label: 'Help', href: '/' },
            { label: 'Team & Account', href: '/team' }
          ]}
          currentPage="Billing & Plans"
          categoryLabel="Account Management"
          categoryIcon={CreditCard}
          categoryColor="green"
          title="Billing & plans management"
          description="Everything you need to know about managing your Prompt Reviews subscription, changing plans, and handling billing."
        />

        {/* Plan Overview */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Available Plans</h2>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 mb-8">
            <p className="text-white/90 mb-6">
              Prompt Reviews offers flexible plans designed to grow with your business. All plans include a 14-day free trial.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6">
              {/* Grower Plan */}
              <div className="bg-blue-500/20 border border-blue-400/30 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-2">Grower</h3>
                <div className="text-3xl font-bold text-blue-300 mb-4">$15<span className="text-lg text-white/70">/month</span></div>
                <p className="text-white/80 text-sm mb-4">Perfect for small businesses getting started</p>
                
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center text-sm text-white/80">
                    <Check className="w-4 h-4 text-green-300 mr-2" />
                    14-day free trial
                  </li>
                  <li className="flex items-center text-sm text-white/80">
                    <Check className="w-4 h-4 text-green-300 mr-2" />
                    Universal prompt page
                  </li>
                  <li className="flex items-center text-sm text-white/80">
                    <Check className="w-4 h-4 text-green-300 mr-2" />
                    3 custom prompt pages
                  </li>
                  <li className="flex items-center text-sm text-white/80">
                    <Check className="w-4 h-4 text-green-300 mr-2" />
                    Review widget
                  </li>
                  <li className="flex items-center text-sm text-red-300">
                    <X className="w-4 h-4 mr-2" />
                    Contact uploads
                  </li>
                </ul>
              </div>

              {/* Builder Plan */}
              <div className="bg-purple-500/20 border border-purple-400/30 rounded-xl p-6 relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-purple-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    MOST POPULAR
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Builder</h3>
                <div className="text-3xl font-bold text-purple-300 mb-4">$35<span className="text-lg text-white/70">/month</span></div>
                <p className="text-white/80 text-sm mb-4">Ideal for growing businesses</p>
                
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center text-sm text-white/80">
                    <Check className="w-4 h-4 text-green-300 mr-2" />
                    3 team members
                  </li>
                  <li className="flex items-center text-sm text-white/80">
                    <Check className="w-4 h-4 text-green-300 mr-2" />
                    50 prompt pages
                  </li>
                  <li className="flex items-center text-sm text-white/80">
                    <Check className="w-4 h-4 text-green-300 mr-2" />
                    1,000 contacts
                  </li>
                  <li className="flex items-center text-sm text-white/80">
                    <Check className="w-4 h-4 text-green-300 mr-2" />
                    Analytics
                  </li>
                  <li className="flex items-center text-sm text-white/80">
                    <Check className="w-4 h-4 text-green-300 mr-2" />
                    Google Business integration
                  </li>
                </ul>
              </div>

              {/* Maven Plan */}
              <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-2">Maven</h3>
                <div className="text-3xl font-bold text-yellow-300 mb-4">$100<span className="text-lg text-white/70">/month</span></div>
                <p className="text-white/80 text-sm mb-4">For established businesses & franchises</p>
                
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center text-sm text-white/80">
                    <Check className="w-4 h-4 text-green-300 mr-2" />
                    5 team members
                  </li>
                  <li className="flex items-center text-sm text-white/80">
                    <Check className="w-4 h-4 text-green-300 mr-2" />
                    10 business locations
                  </li>
                  <li className="flex items-center text-sm text-white/80">
                    <Check className="w-4 h-4 text-green-300 mr-2" />
                    500 prompt pages
                  </li>
                  <li className="flex items-center text-sm text-white/80">
                    <Check className="w-4 h-4 text-green-300 mr-2" />
                    10,000 contacts
                  </li>
                  <li className="flex items-center text-sm text-white/80">
                    <Check className="w-4 h-4 text-green-300 mr-2" />
                    All features included
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Plan Management */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Managing Your Plan</h2>
          
          <div className="space-y-6">
            {/* Accessing Plan Settings */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Accessing Plan Settings</h3>
              <ol className="space-y-3 text-white/80">
                <li className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">1</span>
                  <p>Navigate to your dashboard and click "Plan" in the sidebar</p>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">2</span>
                  <p>View your current plan details and available options</p>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">3</span>
                  <p>Select upgrade, downgrade, or manage billing options</p>
                </li>
              </ol>
            </div>

            {/* Upgrading Plans */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-start space-x-3 mb-4">
                <ArrowUp className="w-6 h-6 text-green-300 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">Upgrading Your Plan</h3>
                  <p className="text-white/80 mb-4">
                    Upgrade anytime to access more features and higher limits.
                  </p>
                  
                  <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-white mb-2">Upgrade Process:</h4>
                    <ul className="space-y-1 text-white/80 text-sm">
                      <li>• Select the plan you want to upgrade to</li>
                      <li>• Review new features and pricing</li>
                      <li>• Confirm upgrade in the modal</li>
                      <li>• Complete Stripe checkout process</li>
                      <li>• Access new features immediately</li>
                    </ul>
                  </div>
                  
                  <div className="text-sm text-white/70">
                    <strong>Note:</strong> Upgrades are processed immediately and prorated for the current billing cycle.
                  </div>
                </div>
              </div>
            </div>

            {/* Downgrading Plans */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-start space-x-3 mb-4">
                <ArrowDown className="w-6 h-6 text-yellow-300 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">Downgrading Your Plan</h3>
                  <p className="text-white/80 mb-4">
                    Downgrade to a lower plan if your needs have changed.
                  </p>
                  
                  <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-white mb-2">Important Considerations:</h4>
                    <ul className="space-y-1 text-white/80 text-sm">
                      <li>• Review features you'll lose before confirming</li>
                      <li>• Excess data (contacts, pages) may need cleanup</li>
                      <li>• Changes take effect at next billing cycle</li>
                      <li>• You keep access to current features until then</li>
                    </ul>
                  </div>
                  
                  <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-4">
                    <p className="text-sm text-white/80">
                      <AlertCircle className="w-4 h-4 inline mr-1" />
                      <strong>Warning:</strong> Downgrading may result in data loss if you exceed new plan limits.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Permission Requirements */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-start space-x-3">
                <Users className="w-6 h-6 text-blue-300 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Account Owner Permissions</h3>
                  <p className="text-white/80 mb-3">
                    Only account owners can change billing plans and payment methods.
                  </p>
                  <div className="text-sm text-white/70">
                    Team members will see plan information but cannot make changes. Contact your account owner 
                    if you need to modify the subscription.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Free Trial */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Free Trial Information</h2>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <div className="flex items-start space-x-3 mb-4">
              <Clock className="w-6 h-6 text-purple-300 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">14-Day Free Trial</h3>
                <p className="text-white/80 mb-4">
                  All paid plans come with a 14-day free trial to test all features.
                </p>
                
                <div className="space-y-3">
                  <div className="bg-white/5 rounded-lg p-3">
                    <h4 className="font-semibold text-white mb-1">What's Included</h4>
                    <ul className="space-y-1 text-white/80 text-sm">
                      <li>• Full access to all plan features</li>
                      <li>• No credit card required to start</li>
                      <li>• No commitment or cancellation fees</li>
                      <li>• Email notifications before trial ends</li>
                    </ul>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-3">
                    <h4 className="font-semibold text-white mb-1">After Trial Ends</h4>
                    <ul className="space-y-1 text-white/80 text-sm">
                      <li>• Choose a paid plan to continue</li>
                      <li>• Or downgrade to limited free version</li>
                      <li>• Your data remains safe during transition</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Billing & Payment */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Billing & Payment Methods</h2>
          
          <div className="space-y-6">
            {/* Payment Methods */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-start space-x-3 mb-4">
                <CreditCard className="w-6 h-6 text-green-300 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">Payment Methods</h3>
                  <p className="text-white/80 mb-4">
                    Prompt Reviews uses Stripe for secure payment processing.
                  </p>
                  
                  <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">Accepted Payment Methods:</h4>
                    <ul className="space-y-1 text-white/80 text-sm">
                      <li>• Credit cards (Visa, Mastercard, American Express)</li>
                      <li>• Debit cards</li>
                      <li>• ACH bank transfers (US only)</li>
                      <li>• Apple Pay and Google Pay</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Billing Cycles */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-start space-x-3">
                <Calendar className="w-6 h-6 text-blue-300 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Billing Cycles</h3>
                  <p className="text-white/80 mb-3">
                    All plans are billed monthly in advance.
                  </p>
                  <div className="space-y-2 text-white/70 text-sm">
                    <p>• <strong>Monthly billing:</strong> Charged on the same date each month</p>
                    <p>• <strong>Prorated charges:</strong> Upgrades are prorated for remaining cycle</p>
                    <p>• <strong>Automatic renewal:</strong> Subscriptions renew automatically</p>
                    <p>• <strong>Invoice delivery:</strong> Emailed within 24 hours of payment</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-start space-x-3">
                <Shield className="w-6 h-6 text-purple-300 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Payment Security</h3>
                  <p className="text-white/80 mb-3">
                    Your payment information is completely secure.
                  </p>
                  <div className="space-y-2 text-white/70 text-sm">
                    <p>• <strong>PCI DSS compliant:</strong> Industry-standard security</p>
                    <p>• <strong>No storage:</strong> We don't store your payment details</p>
                    <p>• <strong>Stripe powered:</strong> Trusted by millions of businesses</p>
                    <p>• <strong>SSL encrypted:</strong> All data transmitted securely</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Common Questions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Billing FAQ</h2>
          
          <div className="space-y-4">
            <details className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <summary className="font-semibold text-white cursor-pointer">
                Can I cancel my subscription anytime?
              </summary>
              <p className="text-white/80 text-sm mt-3">
                Yes, you can cancel your subscription anytime. You'll retain access to paid features until the end of your 
                current billing cycle, then be moved to the free plan.
              </p>
            </details>
            
            <details className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <summary className="font-semibold text-white cursor-pointer">
                What happens if my payment fails?
              </summary>
              <p className="text-white/80 text-sm mt-3">
                We'll retry failed payments automatically and send email notifications. Your account remains active for 
                a grace period. Update your payment method in the billing settings to avoid service interruption.
              </p>
            </details>
            
            <details className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <summary className="font-semibold text-white cursor-pointer">
                Do you offer annual billing discounts?
              </summary>
              <p className="text-white/80 text-sm mt-3">
                Currently, all plans are billed monthly. Contact our sales team for custom pricing on annual contracts 
                or enterprise needs.
              </p>
            </details>
            
            <details className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <summary className="font-semibold text-white cursor-pointer">
                Can I get a refund?
              </summary>
              <p className="text-white/80 text-sm mt-3">
                We offer refunds on a case-by-case basis within 30 days of purchase. Contact support with your request 
                and we'll work with you to find a solution.
              </p>
            </details>
            
            <details className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <summary className="font-semibold text-white cursor-pointer">
                How do I update my payment method?
              </summary>
              <p className="text-white/80 text-sm mt-3">
                Go to Plan settings and click "Manage Billing" to update your payment method through our secure 
                Stripe portal.
              </p>
            </details>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to Manage Your Plan?
          </h2>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            Access your billing settings to upgrade, downgrade, or manage payment methods.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard/plan"
              className="inline-flex items-center px-6 py-3 bg-white/20 text-white backdrop-blur-sm font-medium rounded-lg hover:bg-white/30 transition-colors"
            >
              Manage Plan
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
            <Link
              href="/getting-started"
              className="inline-flex items-center px-6 py-3 border border-white text-white font-medium rounded-lg hover:bg-white/10 transition-colors"
            >
              Getting Started Guide
            </Link>
          </div>
        </div>
      </div>
    </DocsLayout>
  );
}