import { Metadata } from 'next';
import { notFound } from 'next/navigation'
import StandardOverviewLayout from '../../components/StandardOverviewLayout';
import MarkdownRenderer from '../../components/MarkdownRenderer'
import { getArticleBySlug } from '@/lib/docs/articles'
import { Palette, Type, Droplet, Square, Eye, Sliders, CheckCircle, ArrowRight, Info, Sparkles, Paintbrush, Monitor, Smartphone } from 'lucide-react';
import * as Icons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const fallbackDescription = 'Learn how to customize the appearance of your prompt pages with fonts, colors, backgrounds, and card styling to match your brand.'

function resolveIcon(iconName: string | undefined, fallback: LucideIcon): LucideIcon {
  if (!iconName) return fallback
  const lookup = Icons as Record<string, unknown>
  const maybeIcon = lookup[iconName]
  if (typeof maybeIcon === 'function') return maybeIcon as LucideIcon
  return fallback
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const article = await getArticleBySlug('style-settings')
    if (!article) {
      return {
        title: 'Style Settings - Customize Your Prompt Pages | Prompt Reviews',
        description: fallbackDescription,
        alternates: { canonical: 'https://docs.promptreviews.app/style-settings' },
      }
    }

    const seoTitle = article.metadata?.seo_title || article.title
    const seoDescription = article.metadata?.seo_description || article.metadata?.description || fallbackDescription

    return {
      title: `${seoTitle} | Prompt Reviews`,
      description: seoDescription,
      keywords: article.metadata?.keywords ?? ['style settings', 'branding', 'customization', 'fonts', 'colors', 'gradients', 'prompt pages', 'prompt reviews'],
      alternates: { canonical: article.metadata?.canonical_url ?? 'https://docs.promptreviews.app/style-settings' },
    }
  } catch (error) {
    console.error('generateMetadata style-settings error:', error)
    return {
      title: 'Style Settings - Customize Your Prompt Pages | Prompt Reviews',
      description: fallbackDescription,
      alternates: { canonical: 'https://docs.promptreviews.app/style-settings' },
    }
  }
}

export default async function StyleSettingsPage() {
  const article = await getArticleBySlug('style-settings')
  if (!article) {
    notFound()
  }

  const CategoryIcon = resolveIcon(article.metadata?.category_icon, Palette)

  // Key features for style customization
  const keyFeatures = article.metadata?.key_features?.map((feat: any) => ({
    icon: resolveIcon(feat.icon, CheckCircle),
    title: feat.title,
    description: feat.description
  })) || [
    {
      icon: Type,
      title: 'Typography Control',
      description: 'Choose from 50+ professional fonts to match your brand personality. Set primary and secondary fonts with perfect pairing combinations.',
    },
    {
      icon: Droplet,
      title: 'Brand Color Integration',
      description: 'Define your exact brand colors using hex codes. Set primary and secondary colors that maintain consistency across all prompt pages.',
    },
    {
      icon: Sparkles,
      title: 'Dynamic Backgrounds',
      description: 'Create eye-catching backgrounds with solid colors or gradient effects. Choose from popular combinations or create custom gradients.',
    },
    {
      icon: Square,
      title: 'Card Styling Options',
      description: 'Customize card appearance with background colors, shadow effects, transparency settings, and text color optimization for readability.',
    }
  ];

  // How style customization works
  const howItWorks = article.metadata?.how_it_works?.map((step: any) => ({
    number: step.number,
    title: step.title,
    description: step.description,
    icon: resolveIcon(step.icon, CheckCircle)
  })) || [
    {
      number: 1,
      title: 'Access Style Editor',
      description: 'Navigate to Dashboard → Style → Open Style Editor to access the comprehensive customization interface with live preview capabilities.',
      icon: Sliders
    },
    {
      number: 2,
      title: 'Customize Elements',
      description: 'Modify fonts, colors, backgrounds, and card styles using intuitive controls. See changes instantly in the live preview panel.',
      icon: Paintbrush
    },
    {
      number: 3,
      title: 'Apply Globally',
      description: 'Save your changes to apply the new styling across all prompt pages automatically, ensuring consistent brand experience.',
      icon: CheckCircle
    }
  ];

  // Best practices for style customization
  const bestPractices = article.metadata?.best_practices?.map((practice: any) => ({
    icon: resolveIcon(practice.icon, CheckCircle),
    title: practice.title,
    description: practice.description
  })) || [
    {
      icon: Eye,
      title: 'Maintain Readability',
      description: 'Ensure sufficient contrast between text and backgrounds. Test your designs at different screen brightness levels for optimal accessibility.'
    },
    {
      icon: Palette,
      title: 'Use Brand Guidelines',
      description: 'Import hex codes from your official brand guidelines to maintain consistency across all marketing materials and touchpoints.'
    },
    {
      icon: Monitor,
      title: 'Keep It Simple',
      description: 'Avoid overly complex gradients or too many colors. Clean, simple designs often perform better and appear more professional.'
    },
    {
      icon: Smartphone,
      title: 'Test on Mobile',
      description: 'Preview your designs on mobile devices since most customers will view prompt pages on their phones. Ensure mobile optimization.'
    }
  ];


  return (
    <StandardOverviewLayout
      title={article.title || "Style settings"}
      description={article.metadata?.description || "Customize the visual appearance of your prompt pages to perfectly match your brand identity."}
      categoryLabel={article.metadata?.category_label || "Customization"}
      categoryIcon={CategoryIcon}
      categoryColor={(article.metadata?.category_color as any) || "purple"}
      currentPage="Style Settings"
      availablePlans={article.metadata?.available_plans as any || ['grower', 'builder', 'maven']}
      keyFeatures={keyFeatures}
      howItWorks={howItWorks}
      bestPractices={bestPractices}
      faqs={[
        {
          question: 'Do style changes apply to all prompt pages?',
          answer: 'Yes, style settings are global and apply to all your prompt pages. This ensures consistent branding across all customer touchpoints.'
        },
        {
          question: 'Can I use custom fonts not in the list?',
          answer: 'Currently, you can choose from our curated list of 50+ fonts. These are optimized for web performance and readability. Contact support if you need a specific font added.'
        },
        {
          question: 'How do I match my exact brand colors?',
          answer: 'Use hex color codes from your brand guidelines. You can find these in your logo files, brand documents, or use a color picker tool on your existing website.'
        },
        {
          question: 'Can I save multiple style presets?',
          answer: 'Currently, you have one active style configuration. You can reset to defaults or manually note your settings if you want to experiment with different looks.'
        }
      ]}
      callToAction={{
        primary: {
          text: 'View Prompt Pages',
          href: '/prompt-pages'
        }
      }}
      overview={undefined}
    />
  );
}