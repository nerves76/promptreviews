import { Metadata } from 'next';
import Link from 'next/link';
import DocsLayout from '../docs-layout';
import PageHeader from '../components/PageHeader';
import StandardOverviewLayout from '../components/StandardOverviewLayout';
import { pageFAQs } from '../utils/faqData';
import { CreditCard, Check, X, ArrowUp, ArrowDown, DollarSign, Calendar, Shield, AlertCircle, ArrowRight, Clock, Users, Percent, RefreshCw } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Billing & Plans Management | Prompt Reviews',
  description: 'Comprehensive guide to managing your Prompt Reviews subscription, upgrading/downgrading plans, billing history, and payment methods.',
  keywords: 'billing, plans, subscription, upgrade, downgrade, payment methods, pricing, prompt reviews',
};

export default function BillingPage() {
  // Key features for billing management
  const keyFeatures = [
    {
      icon: CreditCard,
      title: 'Secure Payment Processing',
      description: 'All payments processed securely through Stripe with industry-standard encryption. Supports credit cards, debit cards, and ACH transfers.',
    },
    {
      icon: RefreshCw,
      title: 'Flexible Plan Changes',
      description: 'Upgrade or downgrade your plan anytime with immediate access to new features. Prorated billing ensures you only pay for what you use.',
    },
    {
      icon: Percent,
      title: 'Annual Billing Discount',
      description: 'Save 15% on any plan when you choose annual billing. Get almost 2 months free and simplify your business expenses.',
    },
    {
      icon: Shield,
      title: 'Billing Security & Privacy',
      description: 'We never store your payment details. Full PCI DSS compliance with OAuth security and transparent billing practices.',
    }
  ];

  // How billing works
  const howItWorks = (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">1</div>
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white">Choose Your Plan</h3>
        </div>
        <p className="text-white/90 ml-16">
          Select from Grower ($15/month), Builder ($35/month), or Maven ($100/month) based on your business needs and team size.
        </p>
      </div>

      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-semibold">2</div>
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white">Add Payment Method</h3>
        </div>
        <p className="text-white/90 ml-16">
          Securely add your payment information through our Stripe integration. We accept all major credit cards and ACH transfers.
        </p>
      </div>

      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-semibold">3</div>
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white">Automatic Billing</h3>
        </div>
        <p className="text-white/90 ml-16">
          Subscriptions renew automatically on your billing date. Receive email confirmations and invoices within 24 hours of payment.
        </p>
      </div>
    </div>
  );

  // Best practices for billing management
  const bestPractices = [
    {
      icon: Calendar,
      title: 'Choose Annual Billing',
      description: 'Save 15% and reduce administrative overhead by choosing annual billing. Perfect for businesses with predictable needs.'
    },
    {
      icon: CreditCard,
      title: 'Keep Payment Methods Current',
      description: 'Update your payment information before expiration to avoid service interruptions and maintain uninterrupted access.'
    },
    {
      icon: Users,
      title: 'Review Plan Usage Regularly',
      description: 'Monitor your usage of team members, contacts, and prompt pages to ensure your current plan meets your needs.'
    },
    {
      icon: ArrowUp,
      title: 'Upgrade Before Limits',
      description: 'Upgrade your plan before hitting limits to maintain smooth operations and avoid any potential service restrictions.'
    }
  ];

  // Plans overview section
  const plansOverviewSection = (
    <div className="max-w-4xl mx-auto mb-16">
      <h2 className="text-3xl font-bold text-white mb-8">Available Plans</h2>

      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 mb-8">
        <p className="text-white/90 mb-6">
          Prompt Reviews offers flexible plans designed to grow with your business. All plans include a 14-day free trial.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Grower Plan */}
          <div className="bg-blue-500/20 border border-blue-400/30 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-2">Grower</h3>
            <div className="text-3xl font-bold text-blue-300">$15<span className="text-lg text-white/70">/month</span></div>
            <div className="text-sm text-white/60 mb-3">or $153/year <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full ml-2">Save $27</span></div>
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
              <li className="flex items-center text-sm text-white/80">
                <Check className="w-4 h-4 text-green-300 mr-2" />
                Analytics
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
            <div className="text-3xl font-bold text-purple-300">$35<span className="text-lg text-white/70">/month</span></div>
            <div className="text-sm text-white/60 mb-3">or $357/year <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full ml-2">Save $63</span></div>
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
            <div className="text-3xl font-bold text-yellow-300">$100<span className="text-lg text-white/70">/month</span></div>
            <div className="text-sm text-white/60 mb-3">or $1,020/year <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full ml-2">Save $180</span></div>
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
  );

  // Plan management section
  const planManagementSection = (
    <div className="max-w-4xl mx-auto mb-16">
      <h2 className="text-3xl font-bold text-white mb-8">Managing Your Subscription</h2>

      <div className="space-y-6">
        {/* Upgrading Plans */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
          <div className="flex items-start space-x-3 mb-4">
            <ArrowUp className="w-6 h-6 text-green-300 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white mb-2">Upgrading Your Plan</h3>
              <p className="text-white/80 mb-4">
                Upgrade anytime to access more features and higher limits. Changes are immediate with prorated billing.
              </p>

              <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Upgrade Benefits:</h4>
                <ul className="space-y-1 text-white/80 text-sm">
                  <li>• Immediate access to new features</li>
                  <li>• Prorated billing for current cycle</li>
                  <li>• Higher limits for team, contacts, and pages</li>
                  <li>• Access to premium integrations</li>
                </ul>
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
                Downgrade to a lower plan if your needs have changed. Review limitations carefully before confirming.
              </p>

              <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-white mb-2">Important Considerations:</h4>
                <ul className="space-y-1 text-white/80 text-sm">
                  <li>• Review features you'll lose before confirming</li>
                  <li>• Excess data may need cleanup before downgrading</li>
                  <li>• Changes take effect at next billing cycle</li>
                  <li>• Current features remain until billing date</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Owner Permissions */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <Users className="w-6 h-6 text-blue-300 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Account Owner Permissions</h3>
              <p className="text-white/80 mb-3">
                Only account owners can change billing plans and payment methods.
              </p>
              <div className="text-sm text-white/70">
                Team members can view plan information but cannot make billing changes. Contact your account owner if you need to modify the subscription.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto">
        <PageHeader
          breadcrumbs={[
            { label: 'Help', href: '/' }
          ]}
          currentPage="Billing & Plans"
          categoryLabel="Account Management"
          categoryIcon={CreditCard}
          categoryColor="green"
          title="Billing & plans management"
          description="Everything you need to know about managing your Prompt Reviews subscription, changing plans, and handling billing."
        />

        <StandardOverviewLayout
          title="Billing & Subscription Management"
          description="Manage your subscription, billing details, and payment methods with secure, flexible options designed for businesses."
          icon={CreditCard}
          iconColor="green"
          availablePlans={['grower', 'builder', 'maven']}

          keyFeatures={keyFeatures}
          howItWorks={howItWorks}
          bestPractices={
            <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
              <div className="space-y-6">
                {bestPractices.map((practice, index) => (
                  <div key={index} className="flex items-start space-x-4">
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
          }

          customSections={
            <>
              {plansOverviewSection}
              {planManagementSection}
            </>
          }

          faqs={pageFAQs['billing']}

          ctaTitle="Ready to Manage Your Subscription?"
          ctaDescription="Access your billing settings to upgrade, downgrade, or manage payment methods with our secure portal."
          ctaButtons={[
            {
              text: 'View All Plans',
              href: '/getting-started/choosing-plan',
              variant: 'secondary',
              icon: ArrowRight
            },
            {
              text: 'Manage Billing',
              href: 'https://app.promptreviews.app/dashboard/plan',
              variant: 'primary',
              icon: CreditCard
            }
          ]}
        />
      </div>
    </DocsLayout>
  );
}