import { Metadata } from 'next';
import Link from 'next/link';
import DocsLayout from '../docs-layout';
import PageHeader from '../components/PageHeader';
import StandardOverviewLayout from '../components/StandardOverviewLayout';
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
  const howItWorks = (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">1</div>
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Sliders className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white">Access Style Editor</h3>
        </div>
        <p className="text-white/90 ml-16">
          Navigate to Dashboard → Style → Open Style Editor to access the comprehensive customization interface with live preview capabilities.
        </p>
      </div>

      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-semibold">2</div>
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Paintbrush className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white">Customize Elements</h3>
        </div>
        <p className="text-white/90 ml-16">
          Modify fonts, colors, backgrounds, and card styles using intuitive controls. See changes instantly in the live preview panel.
        </p>
      </div>

      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-semibold">3</div>
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white">Apply Globally</h3>
        </div>
        <p className="text-white/90 ml-16">
          Save your changes to apply the new styling across all prompt pages automatically, ensuring consistent brand experience.
        </p>
      </div>
    </div>
  );

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

  // Style options section
  const styleOptionsSection = (
    <div className="max-w-4xl mx-auto mb-16">
      <h2 className="text-3xl font-bold text-white mb-8">Customization Options</h2>

      <div className="space-y-6">
        {/* Typography Settings */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
          <div className="flex items-start space-x-3 mb-4">
            <Type className="w-6 h-6 text-blue-300 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white mb-2">Typography</h3>
              <p className="text-white/80 mb-4">
                Choose from over 50 professional fonts to match your brand personality.
              </p>

              <div className="space-y-3">
                <div className="bg-white/5 rounded-lg p-3">
                  <h4 className="font-semibold text-white mb-1">Primary Font</h4>
                  <p className="text-white/80 text-sm mb-2">Used for headings and prominent text</p>
                  <p className="text-white/60 text-xs">Options: Inter, Roboto, Poppins, Montserrat, Playfair Display, and more</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <h4 className="font-semibold text-white mb-1">Secondary Font</h4>
                  <p className="text-white/80 text-sm mb-2">Used for body text and descriptions</p>
                  <p className="text-white/60 text-xs">Can be the same as primary or different for contrast</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Color Settings */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
          <div className="flex items-start space-x-3 mb-4">
            <Droplet className="w-6 h-6 text-purple-300 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white mb-2">Brand Colors</h3>
              <p className="text-white/80 mb-4">
                Define your color scheme to maintain brand consistency.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-3">
                  <h4 className="font-semibold text-white mb-1">Primary Color</h4>
                  <p className="text-white/80 text-sm">Main brand color for buttons and accents</p>
                  <p className="text-white/60 text-xs mt-1">Enter hex code: #4F46E5</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <h4 className="font-semibold text-white mb-1">Secondary Color</h4>
                  <p className="text-white/80 text-sm">Complementary color for highlights</p>
                  <p className="text-white/60 text-xs mt-1">Enter hex code: #818CF8</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Background Options */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
          <div className="flex items-start space-x-3 mb-4">
            <Sparkles className="w-6 h-6 text-pink-300 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white mb-2">Background Types</h3>
              <p className="text-white/80 mb-4">
                Choose between solid colors or eye-catching gradients.
              </p>

              <div className="space-y-3">
                <div className="bg-white/5 rounded-lg p-3">
                  <h4 className="font-semibold text-white mb-1">Solid Color</h4>
                  <p className="text-white/80 text-sm">Simple, clean background with a single color</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <h4 className="font-semibold text-white mb-1">Gradient</h4>
                  <p className="text-white/80 text-sm mb-2">Dynamic two-color gradient background</p>
                  <ul className="space-y-1 text-white/60 text-xs">
                    <li>• Gradient Start Color</li>
                    <li>• Gradient End Color</li>
                    <li>• Automatic blending</li>
                  </ul>
                </div>
              </div>

              <div className="mt-4 bg-pink-500/20 border border-pink-400/30 rounded-lg p-4">
                <p className="text-sm text-white/80">
                  <strong>Popular Gradients:</strong> Blue to Purple (#3B82F6 → #C026D3), Green to Teal (#10B981 → #14B8A6), Orange to Pink (#F97316 → #EC4899)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card Styling */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
          <div className="flex items-start space-x-3 mb-4">
            <Square className="w-6 h-6 text-green-300 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white mb-2">Card Appearance</h3>
              <p className="text-white/80 mb-4">
                Customize how content cards appear on your prompt pages.
              </p>

              <div className="space-y-3">
                <div className="bg-white/5 rounded-lg p-3">
                  <h4 className="font-semibold text-white mb-1">Background Colors</h4>
                  <p className="text-white/80 text-sm">Available card background options:</p>
                  <ul className="mt-1 space-y-1 text-white/60 text-xs">
                    <li>• Pure White (#FFFFFF)</li>
                    <li>• Off-White (#F7FAFC)</li>
                    <li>• Distinction (#F3F4F6)</li>
                    <li>• Pale Blue (#F0F6FF)</li>
                    <li>• Cream (#FFFBEA)</li>
                  </ul>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <h4 className="font-semibold text-white mb-1">Shadow & Effects</h4>
                  <ul className="space-y-1 text-white/80 text-sm">
                    <li>• Inner shadow option for depth</li>
                    <li>• Shadow color customization</li>
                    <li>• Shadow intensity (0-100%)</li>
                    <li>• Transparency control (0-100%)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Live preview section
  const livePreviewSection = (
    <div className="max-w-4xl mx-auto mb-16">
      <h2 className="text-3xl font-bold text-white mb-8">Live Preview & Testing</h2>

      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <Eye className="w-6 h-6 text-yellow-300 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Real-Time Updates</h3>
            <p className="text-white/80 mb-4">
              The style editor includes a live preview that updates as you make changes.
            </p>
            <ul className="space-y-2 text-white/80">
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-300 mt-0.5" />
                <span>See changes instantly without saving</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-300 mt-0.5" />
                <span>Test different combinations quickly</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-300 mt-0.5" />
                <span>Preview on actual prompt page layout</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-300 mt-0.5" />
                <span>Reset to defaults if needed</span>
              </li>
            </ul>
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
          currentPage="Style Settings"
          categoryLabel="Customization"
          categoryIcon={Palette}
          categoryColor="purple"
          title="Style settings"
          description="Customize the visual appearance of your prompt pages to perfectly match your brand identity."
        />

        <StandardOverviewLayout
          title="Style Settings & Brand Customization"
          description="Create a consistent brand experience with comprehensive style controls for fonts, colors, backgrounds, and visual elements."
          icon={Palette}
          iconColor="purple"
          availablePlans={['grower', 'builder', 'maven']}

          keyFeatures={keyFeatures}
          howItWorks={howItWorks}
          bestPractices={
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
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
              {styleOptionsSection}
              {livePreviewSection}
            </>
          }

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

          ctaTitle="Ready to Customize Your Brand?"
          ctaDescription="Open the style editor and create a unique visual identity that perfectly represents your business."
          ctaButtons={[
            {
              text: 'View Prompt Pages',
              href: '/prompt-pages',
              variant: 'secondary',
              icon: ArrowRight
            },
            {
              text: 'Open Style Editor',
              href: 'https://app.promptreviews.app/dashboard/style',
              variant: 'primary',
              icon: Palette
            }
          ]}
        />
      </div>
    </DocsLayout>
  );
}