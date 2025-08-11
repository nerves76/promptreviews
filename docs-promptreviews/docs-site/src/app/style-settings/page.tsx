import { Metadata } from 'next';
import Link from 'next/link';
import DocsLayout from '../docs-layout';
import PageHeader from '../components/PageHeader';
import { Palette, Type, Droplet, Square, Eye, Sliders, CheckCircle, ArrowRight, Info, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Style Settings - Customize Your Prompt Pages | Prompt Reviews',
  description: 'Learn how to customize the appearance of your prompt pages with fonts, colors, backgrounds, and card styling to match your brand.',
  keywords: 'style settings, branding, customization, fonts, colors, gradients, prompt pages, prompt reviews',
};

export default function StyleSettingsPage() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto">
        <PageHeader
          breadcrumbs={[
            { label: 'Help', href: '/' },
            { label: 'Advanced', href: '/advanced' }
          ]}
          currentPage="Style Settings"
          categoryLabel="Customization"
          categoryIcon={Palette}
          categoryColor="purple"
          title="Style Settings"
          description="Customize the visual appearance of your prompt pages to perfectly match your brand identity."
        />

        {/* Overview */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Style Your Prompt Pages</h2>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <p className="text-white/90 mb-6">
              The Style Settings editor gives you complete control over how your prompt pages look. Create a consistent 
              brand experience that resonates with your customers and stands out from the competition.
            </p>
            
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <Type className="w-8 h-8 text-blue-300 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-white">Typography</h4>
                <p className="text-xs text-white/70 mt-1">50+ font options</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <Droplet className="w-8 h-8 text-purple-300 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-white">Colors</h4>
                <p className="text-xs text-white/70 mt-1">Full color control</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <Sparkles className="w-8 h-8 text-pink-300 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-white">Gradients</h4>
                <p className="text-xs text-white/70 mt-1">Dynamic backgrounds</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <Square className="w-8 h-8 text-green-300 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-white">Cards</h4>
                <p className="text-xs text-white/70 mt-1">Shadow & transparency</p>
              </div>
            </div>
          </div>
        </div>

        {/* Accessing Style Settings */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">How to Access Style Settings</h2>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <ol className="space-y-4 text-white/80">
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-semibold">1</span>
                <div>
                  <p className="font-semibold text-white">Navigate to Dashboard</p>
                  <p className="text-sm">Log in to your Prompt Reviews account</p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-semibold">2</span>
                <div>
                  <p className="font-semibold text-white">Click "Style" in the sidebar</p>
                  <p className="text-sm">Find it under the customization section</p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-semibold">3</span>
                <div>
                  <p className="font-semibold text-white">Open the Style Editor</p>
                  <p className="text-sm">Click "Open style editor" button</p>
                </div>
              </li>
            </ol>
          </div>
        </div>

        {/* Typography Settings */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Typography Settings</h2>
          
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-start space-x-3 mb-4">
                <Type className="w-6 h-6 text-blue-300 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">Font Selection</h3>
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
                  
                  <div className="mt-4 bg-blue-500/20 border border-blue-400/30 rounded-lg p-4">
                    <p className="text-sm text-white/80">
                      <strong>Pro Tip:</strong> Use a serif font for headings and sans-serif for body text to create 
                      elegant contrast, or stick with one font family for a clean, modern look.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Color Settings */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Color Configuration</h2>
          
          <div className="space-y-6">
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
          </div>
        </div>

        {/* Background Settings */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Background Options</h2>
          
          <div className="space-y-6">
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
                      <strong>Popular Gradients:</strong> Blue to Purple (#3B82F6 → #C026D3), 
                      Green to Teal (#10B981 → #14B8A6), Orange to Pink (#F97316 → #EC4899)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card Styling */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Card Styling</h2>
          
          <div className="space-y-6">
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
                      <h4 className="font-semibold text-white mb-1">Background Color</h4>
                      <p className="text-white/80 text-sm">Card background color options:</p>
                      <ul className="mt-1 space-y-1 text-white/60 text-xs">
                        <li>• Pure White (#FFFFFF)</li>
                        <li>• Off-White (#F7FAFC)</li>
                        <li>• Distinction (#F3F4F6)</li>
                        <li>• Pale Blue (#F0F6FF)</li>
                        <li>• Cream (#FFFBEA)</li>
                      </ul>
                    </div>
                    
                    <div className="bg-white/5 rounded-lg p-3">
                      <h4 className="font-semibold text-white mb-1">Text Color</h4>
                      <p className="text-white/80 text-sm">Card text color for optimal readability</p>
                    </div>
                    
                    <div className="bg-white/5 rounded-lg p-3">
                      <h4 className="font-semibold text-white mb-1">Shadow Settings</h4>
                      <ul className="space-y-1 text-white/80 text-sm">
                        <li>• Inner shadow option for depth</li>
                        <li>• Shadow color customization</li>
                        <li>• Shadow intensity (0-100%)</li>
                      </ul>
                    </div>
                    
                    <div className="bg-white/5 rounded-lg p-3">
                      <h4 className="font-semibold text-white mb-1">Transparency</h4>
                      <p className="text-white/80 text-sm">Adjust card opacity (0-100%)</p>
                      <p className="text-white/60 text-xs mt-1">Lower values create a glass-morphism effect</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Live Preview</h2>
          
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

        {/* Best Practices */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Design Best Practices</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2">Maintain Readability</h3>
              <p className="text-white/80 text-sm">
                Ensure sufficient contrast between text and backgrounds. Test with different screen brightness levels.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2">Brand Consistency</h3>
              <p className="text-white/80 text-sm">
                Use your official brand colors and fonts. Import hex codes from your brand guidelines.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2">Less is More</h3>
              <p className="text-white/80 text-sm">
                Avoid overly complex gradients or too many colors. Simple, clean designs often perform best.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2">Mobile Testing</h3>
              <p className="text-white/80 text-sm">
                Preview your design on mobile devices. Most customers will view on phones.
              </p>
            </div>
          </div>
        </div>

        {/* Common Questions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Common Questions</h2>
          
          <div className="space-y-4">
            <details className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <summary className="font-semibold text-white cursor-pointer">
                Do style changes apply to all prompt pages?
              </summary>
              <p className="text-white/80 text-sm mt-3">
                Yes, style settings are global and apply to all your prompt pages. This ensures consistent branding 
                across all customer touchpoints.
              </p>
            </details>
            
            <details className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <summary className="font-semibold text-white cursor-pointer">
                Can I use custom fonts not in the list?
              </summary>
              <p className="text-white/80 text-sm mt-3">
                Currently, you can choose from our curated list of 50+ fonts. These are optimized for web performance 
                and readability. Contact support if you need a specific font added.
              </p>
            </details>
            
            <details className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <summary className="font-semibold text-white cursor-pointer">
                How do I match my exact brand colors?
              </summary>
              <p className="text-white/80 text-sm mt-3">
                Use hex color codes from your brand guidelines. You can find these in your logo files, brand documents, 
                or use a color picker tool on your existing website.
              </p>
            </details>
            
            <details className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <summary className="font-semibold text-white cursor-pointer">
                Can I save multiple style presets?
              </summary>
              <p className="text-white/80 text-sm mt-3">
                Currently, you have one active style configuration. You can reset to defaults or manually note your 
                settings if you want to experiment with different looks.
              </p>
            </details>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to Customize Your Brand Experience?
          </h2>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            Open the style editor and create a unique look that represents your brand perfectly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard/style"
              className="inline-flex items-center px-6 py-3 bg-white/20 text-white backdrop-blur-sm font-medium rounded-lg hover:bg-white/30 transition-colors"
            >
              Open Style Editor
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
            <Link
              href="/prompt-pages"
              className="inline-flex items-center px-6 py-3 border border-white text-white font-medium rounded-lg hover:bg-white/10 transition-colors"
            >
              View Prompt Pages
            </Link>
          </div>
        </div>
      </div>
    </DocsLayout>
  );
}