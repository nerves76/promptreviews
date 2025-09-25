import { Metadata } from 'next';
import StandardOverviewLayout from '../../components/StandardOverviewLayout';
import { Palette, Type, Droplet, Square, Eye, Sliders, CheckCircle, ArrowRight, Info, Sparkles, Paintbrush, Monitor, Smartphone } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Style Settings - Customize Your Prompt Pages | Prompt Reviews',
  description: 'Learn how to customize the appearance of your prompt pages with fonts, colors, backgrounds, and card styling to match your brand.',
  keywords: 'style settings, branding, customization, fonts, colors, gradients, prompt pages, prompt reviews',
};

export default function StyleSettingsPage() {
  // Key features for style customization
  const keyFeatures = [
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
  const howItWorks = [
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
  const bestPractices = [
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
      title="Style settings"
      description="Customize the visual appearance of your prompt pages to perfectly match your brand identity."
      categoryLabel="Customization"
      categoryIcon={Palette}
      categoryColor="purple"
      currentPage="Style Settings"
      availablePlans={['grower', 'builder', 'maven']}
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
        secondary: {
          text: 'View Prompt Pages',
          href: '/prompt-pages'
        },
        primary: {
          text: 'Open Style Editor',
          href: 'https://app.promptreviews.app/dashboard/style',
          external: true
        }
      }}
    />
  );
}