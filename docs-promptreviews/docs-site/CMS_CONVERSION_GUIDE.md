# CMS Conversion Guide

This document provides step-by-step instructions for converting all 22 documentation pages to the CMS pattern, based on the reference implementation in `/src/app/ai-reviews/page.tsx`.

## Overview

**Pattern**: Each page should:
1. Fetch content from the `articles` table via `getArticleBySlug()`
2. Use `StandardOverviewLayout` component
3. Implement `generateMetadata()` for SEO
4. Map metadata fields to component props
5. Include icon resolution logic

**Reference**: `/src/app/ai-reviews/page.tsx`

## Prerequisites

Before converting pages, CMS articles must be created via the admin API:

```bash
POST https://app.promptreviews.app/api/admin/help-content
```

## Page Conversions

### 1. Advanced Features (`/advanced`)

**Slug**: `advanced`

**Current File**: `/src/app/advanced/page.tsx`

**Key Data Extracted**:
- Title: "Advanced features & analytics"
- Description: "Take your review management to the next level with analytics, automation, API access, and custom integrations."
- Category: "Advanced Features"
- Category Icon: `BarChart3`
- Category Color: `pink`
- Available Plans: `['builder', 'maven']`
- Key Features: 6 items (Advanced Analytics Dashboard, Automated Campaigns, REST API Access, Real-Time Webhooks, AI-Powered Optimization, White Label & Custom Domains)
- How It Works: 4 steps
- Best Practices: 4 items
- FAQs: Custom array defined in file
- Call to Action: View Troubleshooting

**CMS Article JSON**:
```json
{
  "slug": "advanced",
  "title": "Advanced features & analytics",
  "content": "# Advanced Features\n\nContent will be displayed via metadata.",
  "metadata": {
    "description": "Take your review management to the next level with analytics, automation, API access, and custom integrations.",
    "keywords": ["advanced features", "analytics", "automation", "API access", "custom integrations", "webhooks"],
    "canonical_url": "https://docs.promptreviews.app/advanced",
    "category_label": "Advanced Features",
    "category_icon": "BarChart3",
    "category_color": "pink",
    "available_plans": ["builder", "maven"],
    "seo_title": "Advanced Features - Analytics, Automation & API",
    "seo_description": "Explore advanced features in Prompt Reviews including analytics, automation, API access, and custom integrations.",
    "key_features": [
      {
        "icon": "BarChart3",
        "title": "Advanced Analytics Dashboard",
        "description": "Deep insights into review performance, customer sentiment, response rates, and platform distribution with exportable reports."
      },
      {
        "icon": "Clock",
        "title": "Automated Campaigns",
        "description": "Set up scheduled review request campaigns based on triggers like service completion or time intervals."
      },
      {
        "icon": "Code",
        "title": "REST API Access",
        "description": "Full API access for custom integrations with your existing tools and workflows, including prompt page management."
      },
      {
        "icon": "Webhook",
        "title": "Real-Time Webhooks",
        "description": "Get instant notifications when important events occur - new reviews, responses, contacts added, and campaigns completed."
      },
      {
        "icon": "Brain",
        "title": "AI-Powered Optimization",
        "description": "Let AI analyze your data to optimize request timing, messaging, and customer targeting for maximum response rates."
      },
      {
        "icon": "Globe",
        "title": "White Label & Custom Domains",
        "description": "Use your own domain for prompt pages and widgets, plus remove Prompt Reviews branding on premium plans."
      }
    ],
    "how_it_works": [
      {
        "number": 1,
        "title": "Access Advanced Tools",
        "description": "Upgrade to Builder or Maven plans to unlock analytics, automation, and API access.",
        "icon": "Settings"
      },
      {
        "number": 2,
        "title": "Set Up Automation",
        "description": "Create automated workflows and campaigns based on customer behavior and business triggers.",
        "icon": "Zap"
      },
      {
        "number": 3,
        "title": "Integrate Your Systems",
        "description": "Use our REST API and webhooks to connect Prompt Reviews with your existing business tools.",
        "icon": "Database"
      },
      {
        "number": 4,
        "title": "Analyze and Optimize",
        "description": "Use advanced analytics to understand performance and let AI optimize your review collection strategy.",
        "icon": "TrendingUp"
      }
    ],
    "best_practices": [
      {
        "icon": "Target",
        "title": "Start with Analytics",
        "description": "Before automating, understand your current performance. Use analytics to identify which prompt pages and strategies work best for your business."
      },
      {
        "icon": "Zap",
        "title": "Automate Gradually",
        "description": "Begin with simple automation like scheduled follow-ups, then expand to complex workflows as you learn what works for your customers."
      },
      {
        "icon": "CheckCircle",
        "title": "Monitor API Usage",
        "description": "Keep track of your API rate limits and webhook reliability. Set up proper error handling and monitoring for production integrations."
      },
      {
        "icon": "Globe",
        "title": "Leverage White Labeling",
        "description": "For agencies and enterprise users, white labeling creates a seamless brand experience that builds trust with your customers."
      }
    ],
    "overview_title": "Power User Features",
    "overview_markdown": "Unlock the full potential of review management with advanced analytics, automation, API access, and enterprise-grade customization options. Perfect for growing businesses and agencies.\n\n**Deep Analytics**: Comprehensive insights into performance and customer behavior\n\n**Smart Automation**: AI-powered workflows that optimize timing and messaging\n\n**API Integration**: Connect with your existing tools and build custom workflows",
    "call_to_action": {
      "primary": {
        "text": "View Troubleshooting",
        "href": "/troubleshooting"
      }
    }
  },
  "status": "published"
}
```

---

### 2. Analytics (`/analytics`)

**Slug**: `analytics`

**Current File**: `/src/app/analytics/page.tsx`

**Key Data Extracted**:
- Title: "Analytics & insights"
- Description: "Track your review collection performance, understand customer sentiment, and make data-driven decisions to improve your review strategy."
- Category: "Insights"
- Category Icon: `BarChart3`
- Category Color: `indigo`
- Available Plans: `['grower', 'builder', 'maven']`
- Key Features: 4 items
- How It Works: 3 steps
- Best Practices: 4 items
- FAQs: From `pageFAQs['analytics']`
- Call to Action: Optimize Prompt Pages

**CMS Article JSON**:
```json
{
  "slug": "analytics",
  "title": "Analytics & insights",
  "content": "# Analytics & Insights\n\nContent will be displayed via metadata.",
  "metadata": {
    "description": "Track your review collection performance, understand customer sentiment, and make data-driven decisions to improve your review strategy.",
    "keywords": ["analytics", "metrics", "review tracking", "performance insights", "data analysis", "prompt reviews"],
    "canonical_url": "https://docs.promptreviews.app/analytics",
    "category_label": "Insights",
    "category_icon": "BarChart3",
    "category_color": "indigo",
    "available_plans": ["grower", "builder", "maven"],
    "seo_title": "Analytics & Insights Guide",
    "seo_description": "Understand your review collection performance with comprehensive analytics, metrics tracking, and actionable insights in Prompt Reviews.",
    "key_features": [
      {
        "icon": "BarChart3",
        "title": "Review Performance Tracking",
        "description": "Monitor review volume trends, platform distribution, and conversion rates across all your prompt pages with comprehensive visual charts."
      },
      {
        "icon": "Smile",
        "title": "Sentiment Analysis",
        "description": "Track customer satisfaction through emoji feedback and sentiment trends. Identify patterns in positive and negative responses over time."
      },
      {
        "icon": "MousePointer",
        "title": "Engagement Metrics",
        "description": "Analyze prompt page performance with detailed metrics on views, clicks, and conversion rates to optimize your review collection strategy."
      },
      {
        "icon": "Filter",
        "title": "Advanced Filtering",
        "description": "Segment data by time periods, locations, prompt pages, and review platforms to get granular insights into your performance."
      }
    ],
    "how_it_works": [
      {
        "number": 1,
        "title": "Data Collection",
        "description": "Analytics automatically track all customer interactions with your prompt pages, review submissions, and sentiment feedback in real-time.",
        "icon": "Activity"
      },
      {
        "number": 2,
        "title": "Visual Insights",
        "description": "View comprehensive dashboards with charts, graphs, and metrics that make it easy to understand your review collection performance at a glance.",
        "icon": "PieChart"
      },
      {
        "number": 3,
        "title": "Actionable Optimization",
        "description": "Use data insights to identify top-performing content, optimize underperforming pages, and make informed decisions to improve your review strategy.",
        "icon": "Target"
      }
    ],
    "best_practices": [
      {
        "icon": "Calendar",
        "title": "Regular Monitoring",
        "description": "Check analytics weekly to identify trends early and adjust your review collection strategy based on performance data."
      },
      {
        "icon": "Filter",
        "title": "Use Time Comparisons",
        "description": "Compare month-over-month and year-over-year performance to understand seasonal patterns and long-term growth trends."
      },
      {
        "icon": "Target",
        "title": "Focus on Conversion Rates",
        "description": "Track not just page views but actual review submissions to optimize the pages that drive the most valuable outcomes."
      },
      {
        "icon": "Users",
        "title": "Share Insights with Team",
        "description": "Keep team members informed about performance metrics and use data to guide collaborative improvement efforts."
      }
    ],
    "call_to_action": {
      "primary": {
        "text": "Optimize Prompt Pages",
        "href": "/prompt-pages"
      }
    }
  },
  "status": "published"
}
```

---

### 3. API Documentation (`/api`)

**Slug**: `api`

**Current File**: `/src/app/api/page.tsx`

**Key Data Extracted**:
- Title: "PromptReviews API: Build powerful review integrations"
- Description: "Complete REST API for integrating review collection, management, and display into your applications. Webhooks, bulk operations, and real-time updates included."
- Category: "Developer API"
- Category Icon: `Code2`
- Category Color: `blue`
- Available Plans: `['grower', 'builder', 'maven']`
- Key Features: 6 items (with hrefs)
- How It Works: 4 steps
- Best Practices: 4 items
- FAQs: From `pageFAQs['api']`
- Call to Action: View API Reference
- Overview: Custom JSX with code examples

**CMS Article JSON**:
```json
{
  "slug": "api",
  "title": "PromptReviews API: Build powerful review integrations",
  "content": "# API Documentation\n\nContent will be displayed via metadata.",
  "metadata": {
    "description": "Complete REST API for integrating review collection, management, and display into your applications. Webhooks, bulk operations, and real-time updates included.",
    "keywords": ["PromptReviews API", "review collection API", "widget API", "webhook integration", "developer documentation", "REST API", "review management API"],
    "canonical_url": "https://docs.promptreviews.app/api",
    "category_label": "Developer API",
    "category_icon": "Code2",
    "category_color": "blue",
    "available_plans": ["grower", "builder", "maven"],
    "seo_title": "API Documentation - Integrate with PromptReviews",
    "seo_description": "Complete API documentation for PromptReviews. Learn how to integrate review collection, manage widgets, handle webhooks, and automate your review process.",
    "key_features": [
      {
        "icon": "Code2",
        "title": "RESTful API Design",
        "description": "Clean, intuitive REST endpoints with JSON responses. Follow standard HTTP methods and status codes for predictable integration.",
        "href": "#rest-endpoints"
      },
      {
        "icon": "Shield",
        "title": "Secure Authentication",
        "description": "OAuth 2.0 and API key authentication with fine-grained permissions. Your data stays secure with industry-standard practices.",
        "href": "#authentication"
      },
      {
        "icon": "Webhook",
        "title": "Real-time Webhooks",
        "description": "Get instant notifications when reviews are submitted, updated, or responded to. Perfect for automated workflows.",
        "href": "#webhooks"
      },
      {
        "icon": "Globe",
        "title": "Public Review APIs",
        "description": "Display reviews on your website with public APIs. No authentication required for reading approved reviews.",
        "href": "#public-apis"
      },
      {
        "icon": "Database",
        "title": "Bulk Operations",
        "description": "Import contacts, export review data, and manage multiple resources efficiently with batch endpoints.",
        "href": "#bulk-operations"
      },
      {
        "icon": "Zap",
        "title": "Rate Limiting",
        "description": "Fair usage policies with generous limits. Scale your integration without hitting unexpected barriers.",
        "href": "#rate-limiting"
      }
    ],
    "how_it_works": [
      {
        "number": 1,
        "title": "Get Your API Keys",
        "description": "Generate API keys in your PromptReviews dashboard. Choose between read-only or full access permissions based on your needs.",
        "icon": "Key"
      },
      {
        "number": 2,
        "title": "Make Your First Request",
        "description": "Start with a simple GET request to fetch your business profile or reviews. All endpoints return JSON with consistent structure.",
        "icon": "Terminal"
      },
      {
        "number": 3,
        "title": "Handle Responses",
        "description": "Process JSON responses with standardized error handling. All endpoints follow the same response format for easy parsing.",
        "icon": "FileText"
      },
      {
        "number": 4,
        "title": "Set Up Webhooks",
        "description": "Configure webhooks to receive real-time updates. Perfect for triggering automated workflows or updating your systems.",
        "icon": "Settings"
      }
    ],
    "best_practices": [
      {
        "icon": "Shield",
        "title": "Secure Your API Keys",
        "description": "Never expose API keys in client-side code. Use environment variables and rotate keys regularly. Consider using read-only keys when possible."
      },
      {
        "icon": "Clock",
        "title": "Implement Proper Error Handling",
        "description": "Handle rate limits, network errors, and API failures gracefully. Implement exponential backoff for retries and log errors appropriately."
      },
      {
        "icon": "Monitor",
        "title": "Cache Strategically",
        "description": "Cache public data like reviews and business profiles to reduce API calls. Respect cache-control headers and implement reasonable TTLs."
      },
      {
        "icon": "Zap",
        "title": "Use Webhooks for Real-time Updates",
        "description": "Instead of polling for changes, use webhooks to get instant notifications. This reduces API usage and improves user experience."
      }
    ],
    "overview_title": "What is the PromptReviews API?",
    "overview_markdown": "The PromptReviews API enables you to integrate review collection and management directly into your applications, websites, and workflows. Build custom solutions that fit perfectly with your business processes.\n\n**Developer-Friendly**: RESTful design with comprehensive documentation and code examples\n\n**Public & Private APIs**: Public endpoints for displaying reviews, private APIs for management\n\n**Real-time Events**: Webhook notifications for instant updates and automated workflows\n\n### Available Endpoints\n\n**Authentication & Account**\n- `GET /api/auth/me` - Get current user\n- `GET /api/businesses` - List businesses\n- `PUT /api/businesses/:id` - Update business\n\n**Prompt Pages**\n- `GET /api/prompt-pages` - List pages\n- `POST /api/prompt-pages` - Create page\n- `PUT /api/prompt-pages/:id` - Update page\n\n**Reviews**\n- `GET /api/reviews` - List reviews\n- `POST /api/reviews` - Submit review\n- `PUT /api/reviews/:id/respond` - Respond to review\n\n**Widgets**\n- `GET /api/widgets` - List widgets\n- `POST /api/widgets` - Create widget\n- `GET /api/widgets/:id/embed` - Get embed code\n\n### Quick Start Example\n\n```bash\n# Get your business profile\ncurl -H \"Authorization: Bearer YOUR_API_KEY\" \\\n     -H \"Content-Type: application/json\" \\\n     https://api.promptreviews.app/api/businesses/me\n\n# List your reviews\ncurl -H \"Authorization: Bearer YOUR_API_KEY\" \\\n     -H \"Content-Type: application/json\" \\\n     https://api.promptreviews.app/api/reviews?limit=10\n```",
    "call_to_action": {
      "primary": {
        "text": "View API Reference",
        "href": "/api/reference"
      }
    }
  },
  "status": "published"
}
```

---

### 4. API Reference (`/api/reference`)

**Slug**: `api-reference`

**Current File**: `/src/app/api/reference/page.tsx`

**Note**: This page uses `DocsLayout` instead of `StandardOverviewLayout`. This is a special case that may need custom handling.

**Recommendation**: Convert to a dedicated API reference page using a different pattern, or keep as-is with static content.

---

### 5. Billing (`/billing`)

**Slug**: `billing`

**Current File**: `/src/app/billing/page.tsx`

**Key Data Extracted**:
- Title: "Billing & plans management"
- Description: "Everything you need to know about managing your Prompt Reviews subscription, changing plans, and handling billing."
- Category: "Account Management"
- Category Icon: `CreditCard`
- Category Color: `green`
- Available Plans: `['grower', 'builder', 'maven']`
- Key Features: 4 items
- How It Works: 3 steps
- Best Practices: 4 items
- FAQs: From `pageFAQs['billing']`
- Call to Action: Upgrade or Downgrade

**CMS Article JSON**:
```json
{
  "slug": "billing",
  "title": "Billing & plans management",
  "content": "# Billing & Plans\n\nContent will be displayed via metadata.",
  "metadata": {
    "description": "Everything you need to know about managing your Prompt Reviews subscription, changing plans, and handling billing.",
    "keywords": ["billing", "plans", "subscription", "upgrade", "downgrade", "payment methods", "pricing", "prompt reviews"],
    "canonical_url": "https://docs.promptreviews.app/billing",
    "category_label": "Account Management",
    "category_icon": "CreditCard",
    "category_color": "green",
    "available_plans": ["grower", "builder", "maven"],
    "seo_title": "Billing & Plans Management",
    "seo_description": "Comprehensive guide to managing your Prompt Reviews subscription, upgrading/downgrading plans, billing history, and payment methods.",
    "key_features": [
      {
        "icon": "CreditCard",
        "title": "Secure Payment Processing",
        "description": "All payments processed securely through Stripe with industry-standard encryption. Supports credit cards, debit cards, and ACH transfers."
      },
      {
        "icon": "RefreshCw",
        "title": "Flexible Plan Changes",
        "description": "Upgrade or downgrade your plan anytime with immediate access to new features. Prorated billing ensures you only pay for what you use."
      },
      {
        "icon": "Percent",
        "title": "Annual Billing Discount",
        "description": "Save 15% on any plan when you choose annual billing. Get almost 2 months free and simplify your business expenses."
      },
      {
        "icon": "Shield",
        "title": "Billing Security & Privacy",
        "description": "We never store your payment details. Full PCI DSS compliance with OAuth security and transparent billing practices."
      }
    ],
    "how_it_works": [
      {
        "number": 1,
        "title": "Choose Your Plan",
        "description": "Select from Grower ($15/month), Builder ($35/month), or Maven ($100/month) based on your business needs and team size.",
        "icon": "Users"
      },
      {
        "number": 2,
        "title": "Add Payment Method",
        "description": "Securely add your payment information through our Stripe integration. We accept all major credit cards and ACH transfers.",
        "icon": "CreditCard"
      },
      {
        "number": 3,
        "title": "Automatic Billing",
        "description": "Subscriptions renew automatically on your billing date. Receive email confirmations and invoices within 24 hours of payment.",
        "icon": "Calendar"
      }
    ],
    "best_practices": [
      {
        "icon": "Calendar",
        "title": "Choose Annual Billing",
        "description": "Save 15% and reduce administrative overhead by choosing annual billing. Perfect for businesses with predictable needs."
      },
      {
        "icon": "CreditCard",
        "title": "Keep Payment Methods Current",
        "description": "Update your payment information before expiration to avoid service interruptions and maintain uninterrupted access."
      },
      {
        "icon": "Users",
        "title": "Review Plan Usage Regularly",
        "description": "Monitor your usage of team members, contacts, and prompt pages to ensure your current plan meets your needs."
      },
      {
        "icon": "ArrowUp",
        "title": "Upgrade Before Limits",
        "description": "Upgrade your plan before hitting limits to maintain smooth operations and avoid any potential service restrictions."
      }
    ],
    "call_to_action": {
      "primary": {
        "text": "Upgrade or Downgrade",
        "href": "/billing/upgrades-downgrades"
      }
    }
  },
  "status": "published"
}
```

---

## Remaining Pages (6-22)

Due to the length of this document, the remaining pages follow the same pattern. For each page:

1. Extract all metadata from the existing `page.tsx`
2. Create a CMS article JSON with the extracted data
3. Update `page.tsx` to use the CMS pattern from `ai-reviews`

### Quick Reference for Remaining Pages:

6. `/billing/upgrades-downgrades` → slug: `billing-upgrades-downgrades`
7. `/business-profile` → slug: `business-profile`
8. `/contacts` → slug: `contacts`
9. `/faq` → slug: `faq`
10. `/faq-comprehensive` → slug: `faq-comprehensive`
11. `/features` → slug: `features`
12. `/google-biz-optimizer` → slug: `google-biz-optimizer`
13. `/help` → slug: `help`
14. `/integrations` → slug: `integrations`
15. `/prompt-pages` → slug: `prompt-pages`
16. `/prompt-pages/settings` → slug: `prompt-pages-settings`
17. `/reviews` → slug: `reviews`
18. `/settings` → slug: `settings`
19. `/style-settings` → slug: `style-settings`
20. `/team` → slug: `team`
21. `/troubleshooting` → slug: `troubleshooting`
22. `/widgets` → slug: `widgets`

## Standard page.tsx Template

```typescript
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import * as Icons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import StandardOverviewLayout from '../../components/StandardOverviewLayout'
import MarkdownRenderer from '../../components/MarkdownRenderer'
import { pageFAQs } from '../utils/faqData'
import { getArticleBySlug } from '@/lib/docs/articles'

const { [IconName] } = Icons

const fallbackDescription = '[description]'

function resolveIcon(iconName: string | undefined, fallback: LucideIcon): LucideIcon {
  if (!iconName) return fallback
  const normalized = iconName.trim()
  const lookup = Icons as Record<string, unknown>
  const candidates = [
    normalized,
    normalized.toLowerCase(),
    normalized.toUpperCase(),
    normalized.charAt(0).toUpperCase() + normalized.slice(1),
    normalized.replace(/[-_\\s]+/g, ''),
  ]

  for (const key of candidates) {
    const maybeIcon = lookup[key]
    if (typeof maybeIcon === 'function') {
      return maybeIcon as LucideIcon
    }
  }

  return fallback
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const article = await getArticleBySlug('[slug]')
    if (!article) {
      return {
        title: '[Title] | Prompt Reviews',
        description: fallbackDescription,
        alternates: {
          canonical: '[canonical-url]',
        },
      }
    }

    const seoTitle = article.metadata?.seo_title || article.title
    const seoDescription = article.metadata?.seo_description || article.metadata?.description || fallbackDescription

    return {
      title: `${seoTitle} | Prompt Reviews`,
      description: seoDescription,
      keywords: article.metadata?.keywords ?? [],
      alternates: {
        canonical: article.metadata?.canonical_url ?? '[canonical-url]',
      },
    }
  } catch (error) {
    console.error('generateMetadata [slug] error:', error)
    return {
      title: '[Title] | Prompt Reviews',
      description: fallbackDescription,
      alternates: {
        canonical: '[canonical-url]',
      },
    }
  }
}

export default async function [PageName]Page() {
  let article = null

  try {
    article = await getArticleBySlug('[slug]')
  } catch (error) {
    console.error('Error fetching [slug] article:', error)
  }

  if (!article) {
    notFound()
  }

  const metadata = article.metadata ?? {}

  const getString = (value: unknown): string | undefined => {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim()
    }
    return undefined
  }

  const availablePlans: ('grower' | 'builder' | 'maven' | 'enterprise')[] =
    Array.isArray(metadata.available_plans) && metadata.available_plans.length
      ? (metadata.available_plans as ('grower' | 'builder' | 'maven' | 'enterprise')[])
      : ['grower', 'builder', 'maven']

  const mappedKeyFeatures = Array.isArray(metadata.key_features) && metadata.key_features.length
    ? metadata.key_features.map((feature: any) => ({
        icon: resolveIcon(feature.icon, [IconName]),
        title: feature.title,
        description: feature.description,
        href: feature.href,
      }))
    : []

  const mappedHowItWorks = Array.isArray(metadata.how_it_works) && metadata.how_it_works.length
    ? metadata.how_it_works.map((step: any, index: number) => ({
        number: step.number ?? index + 1,
        title: step.title,
        description: step.description,
        icon: resolveIcon(step.icon, [IconName]),
      }))
    : []

  const mappedBestPractices = Array.isArray(metadata.best_practices) && metadata.best_practices.length
    ? metadata.best_practices.map((practice: any) => ({
        icon: resolveIcon(practice.icon, [IconName]),
        title: practice.title,
        description: practice.description,
      }))
    : []

  const CategoryIcon = resolveIcon(
    typeof metadata.category_icon === 'string' && metadata.category_icon.trim().length
      ? metadata.category_icon
      : '[IconName]',
    [IconName],
  )

  const overviewMarkdown = getString((metadata as Record<string, unknown>).overview_markdown)
  const overviewTitle = getString((metadata as Record<string, unknown>).overview_title) || 'Overview'

  const overviewNode = overviewMarkdown
    ? <MarkdownRenderer content={overviewMarkdown} />
    : null

  const callToActionMeta = (metadata as Record<string, unknown>).call_to_action
  const parseCTAButton = (value: any) => {
    const text = getString(value?.text)
    const href = getString(value?.href)
    if (!text || !href) return undefined
    return {
      text,
      href,
      external: Boolean(value?.external),
    }
  }

  const callToAction = (callToActionMeta && typeof callToActionMeta === 'object')
    ? {
        primary: parseCTAButton((callToActionMeta as any).primary),
        secondary: parseCTAButton((callToActionMeta as any).secondary),
      }
    : undefined

  const faqMetadata = Array.isArray((metadata as Record<string, unknown>).faqs)
    ? ((metadata as Record<string, unknown>).faqs as { question: string; answer: string }[])
    : null

  const faqsTitle = getString((metadata as Record<string, unknown>).faqs_title)
  const keyFeaturesTitle = getString((metadata as Record<string, unknown>).key_features_title)
  const howItWorksTitle = getString((metadata as Record<string, unknown>).how_it_works_title)
  const bestPracticesTitle = getString((metadata as Record<string, unknown>).best_practices_title)

  return (
    <StandardOverviewLayout
      title={article.title || '[default-title]'}
      description={metadata.description ?? fallbackDescription}
      categoryLabel={metadata.category_label || '[default-category]'}
      categoryIcon={CategoryIcon}
      categoryColor={metadata.category_color || '[default-color]'}
      currentPage="[Page Name]"
      availablePlans={availablePlans}
      keyFeatures={mappedKeyFeatures}
      keyFeaturesTitle={keyFeaturesTitle}
      howItWorks={mappedHowItWorks}
      howItWorksTitle={howItWorksTitle}
      bestPractices={mappedBestPractices}
      bestPracticesTitle={bestPracticesTitle}
      faqs={faqMetadata && faqMetadata.length ? faqMetadata : pageFAQs['[faq-key]']}
      faqsTitle={faqsTitle}
      callToAction={callToAction}
      overview={overviewNode ? {
        title: overviewTitle,
        content: overviewNode,
      } : undefined}
    />
  )
}
```

## Process for Each Page

1. **Extract Data**: Read the existing page.tsx and extract all metadata
2. **Create CMS Article**: Use curl or a REST client to POST to `/api/admin/help-content`
3. **Update page.tsx**: Replace with the CMS pattern template
4. **Test**: Verify the page loads correctly and all content displays

## Notes

- Icon names must match lucide-react exports exactly
- FAQ keys should map to existing entries in `pageFAQs`
- Canonical URLs should use `docs.promptreviews.app`
- All articles should be set to `status: "published"`
- Keep backup copies of original files before replacing

## API Reference Special Case

The `/api/reference` page uses a different layout (`DocsLayout`) and has highly structured API documentation. This page may benefit from:
1. Keeping the current static implementation, OR
2. Creating a specialized component for API documentation that still pulls from CMS

Recommend discussing this page separately.
