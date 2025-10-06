import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import StandardOverviewLayout from '../../components/StandardOverviewLayout'
import MarkdownRenderer from '../../components/MarkdownRenderer'
import { pageFAQs } from '../utils/faqData'
import { getArticleBySlug } from '@/lib/docs/articles'
import { CreditCard, Check, X, ArrowUp, ArrowDown, DollarSign, Calendar, Shield, AlertCircle, ArrowRight, Clock, Users, Percent, RefreshCw } from 'lucide-react'

const fallbackDescription = 'Comprehensive guide to managing your Prompt Reviews subscription, upgrading/downgrading plans, billing history, and payment methods.'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const article = await getArticleBySlug('billing')
    if (!article) {
      return {
        title: 'Billing & Plans Management | Prompt Reviews',
        description: fallbackDescription,
        keywords: ['billing', 'plans', 'subscription', 'upgrade', 'downgrade', 'payment methods', 'pricing', 'prompt reviews'],
        alternates: {
          canonical: 'https://docs.promptreviews.app/billing',
        },
      }
    }

    const seoTitle = article.metadata?.seo_title || article.title
    const seoDescription = article.metadata?.seo_description || article.metadata?.description || fallbackDescription

    return {
      title: `${seoTitle} | Prompt Reviews`,
      description: seoDescription,
      keywords: article.metadata?.keywords ?? ['billing', 'plans', 'subscription', 'upgrade', 'downgrade', 'payment methods', 'pricing', 'prompt reviews'],
      alternates: {
        canonical: article.metadata?.canonical_url ?? 'https://docs.promptreviews.app/billing',
      },
    }
  } catch (error) {
    console.error('generateMetadata billing error:', error)
    return {
      title: 'Billing & Plans Management | Prompt Reviews',
      description: fallbackDescription,
      alternates: {
        canonical: 'https://docs.promptreviews.app/billing',
      },
    }
  }
}

export default async function BillingPage() {
  let article = null

  try {
    article = await getArticleBySlug('billing')
  } catch (error) {
    console.error('Error fetching billing article:', error)
  }

  if (!article) {
    notFound()
  }

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
  const howItWorks = [
    {
      number: 1,
      title: 'Choose Your Plan',
      description: 'Select from Grower ($15/month), Builder ($35/month), or Maven ($100/month) based on your business needs and team size.',
      icon: Users
    },
    {
      number: 2,
      title: 'Add Payment Method',
      description: 'Securely add your payment information through our Stripe integration. We accept all major credit cards and ACH transfers.',
      icon: CreditCard
    },
    {
      number: 3,
      title: 'Automatic Billing',
      description: 'Subscriptions renew automatically on your billing date. Receive email confirmations and invoices within 24 hours of payment.',
      icon: Calendar
    }
  ];

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

  return (
    <StandardOverviewLayout
      title="Billing & plans management"
      description="Everything you need to know about managing your Prompt Reviews subscription, changing plans, and handling billing."
      categoryLabel="Account Management"
      categoryIcon={CreditCard}
      categoryColor="green"
      currentPage="Billing & Plans"
      availablePlans={['grower', 'builder', 'maven']}
      keyFeatures={keyFeatures}
      howItWorks={howItWorks}
      bestPractices={bestPractices}
      faqs={pageFAQs['billing']}
      callToAction={{
        primary: {
          text: 'Upgrade or Downgrade',
          href: '/billing/upgrades-downgrades'
        }
      }}
      overview={{
        title: 'Billing Overview',
        content: <MarkdownRenderer content={article.content} />
      }}
    />
  );
}
