import { Metadata } from 'next';
import { Camera, Image, Upload, Sparkles, Heart, Eye } from 'lucide-react';
import DocsLayout from '../../../docs-layout';

export const metadata: Metadata = {
  title: 'Photo Prompt Pages - Visual Reviews Guide | Prompt Reviews',
  description: 'Learn how to create Photo prompt pages for collecting visual reviews with customer photos. Perfect for showcasing real results.',
  keywords: 'photo prompt pages, visual reviews, photo testimonials, before after photos, customer photos',
  openGraph: {
    title: 'Photo Prompt Pages - Collect Visual Reviews',
    description: 'Create Photo prompt pages to collect reviews with customer photos for powerful visual testimonials.',
  },
};

export default function PhotoPromptPages() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center">
              <Camera className="w-6 h-6 text-pink-300" />
            </div>
            <h1 className="text-4xl font-bold text-white">
              Photo Prompt Pages
            </h1>
          </div>
          <p className="text-xl text-white/80">
            Collect reviews with customer photos to create powerful visual testimonials. Perfect for businesses 
            where visual results matter - hair salons, restaurants, home improvement, fitness, and more.
          </p>
        </div>

        {/* Why Choose Photo Pages */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Why Choose Photo Prompt Pages?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Image className="w-6 h-6 text-blue-300" />
              </div>
              <h3 className="font-semibold text-white mb-2">Visual Proof</h3>
              <p className="text-white/70 text-sm">Photos provide authentic proof of your work and results</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Heart className="w-6 h-6 text-green-300" />
              </div>
              <h3 className="font-semibold text-white mb-2">Higher Engagement</h3>
              <p className="text-white/70 text-sm">Visual reviews get 5x more engagement than text alone</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-purple-300" />
              </div>
              <h3 className="font-semibold text-white mb-2">Marketing Gold</h3>
              <p className="text-white/70 text-sm">Customer photos become valuable marketing content</p>
            </div>
          </div>
        </div>

        {/* Industry Examples */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Perfect For These Industries</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <h3 className="text-lg font-bold text-white mb-3">Beauty & Wellness</h3>
              <ul className="space-y-2 text-white/80 text-sm mb-4">
                <li>• Hair salons - Before/after transformations</li>
                <li>• Nail salons - Manicure/pedicure results</li>
                <li>• Makeup artists - Client makeovers</li>
                <li>• Skincare - Treatment progress photos</li>
              </ul>
              <div className="bg-pink-500/20 border border-pink-400/30 rounded-lg p-3">
                <p className="text-white/80 text-sm">
                  <strong className="text-pink-300">Example:</strong> "Show us your new hairstyle!"
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <h3 className="text-lg font-bold text-white mb-3">Food & Hospitality</h3>
              <ul className="space-y-2 text-white/80 text-sm mb-4">
                <li>• Restaurants - Dish presentations</li>
                <li>• Cafes - Coffee art and pastries</li>
                <li>• Bakeries - Custom cakes and treats</li>
                <li>• Hotels - Room and amenity photos</li>
              </ul>
              <div className="bg-orange-500/20 border border-orange-400/30 rounded-lg p-3">
                <p className="text-white/80 text-sm">
                  <strong className="text-orange-300">Example:</strong> "Share a photo of your meal!"
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <h3 className="text-lg font-bold text-white mb-3">Home Services</h3>
              <ul className="space-y-2 text-white/80 text-sm mb-4">
                <li>• Contractors - Renovation projects</li>
                <li>• Landscaping - Garden transformations</li>
                <li>• Cleaning - Before/after results</li>
                <li>• Interior design - Room makeovers</li>
              </ul>
              <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-3">
                <p className="text-white/80 text-sm">
                  <strong className="text-blue-300">Example:</strong> "Show the completed project!"
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <h3 className="text-lg font-bold text-white mb-3">Fitness & Health</h3>
              <ul className="space-y-2 text-white/80 text-sm mb-4">
                <li>• Gyms - Member transformations</li>
                <li>• Personal trainers - Client progress</li>
                <li>• Nutritionists - Diet results</li>
                <li>• Yoga studios - Class experiences</li>
              </ul>
              <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-3">
                <p className="text-white/80 text-sm">
                  <strong className="text-green-300">Example:</strong> "Share your fitness journey!"
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Photo Upload Features */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Photo Upload Features</h2>
          <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Options
                </h3>
                <ul className="space-y-2 text-white/80">
                  <li className="flex items-start space-x-2">
                    <span className="text-green-300">✓</span>
                    <span>Multiple photo uploads</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-300">✓</span>
                    <span>Before/after comparisons</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-300">✓</span>
                    <span>Direct camera capture</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-300">✓</span>
                    <span>Gallery selection</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Eye className="w-5 h-5 mr-2" />
                  Display Features
                </h3>
                <ul className="space-y-2 text-white/80">
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-300">✓</span>
                    <span>Photo galleries</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-300">✓</span>
                    <span>Lightbox viewing</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-300">✓</span>
                    <span>Social sharing</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-300">✓</span>
                    <span>Watermark options</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Best Practices */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Best Practices for Photo Reviews</h2>
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <h3 className="font-semibold text-white mb-2">Make It Easy</h3>
              <p className="text-white/80 text-sm">
                Provide clear instructions on what photos to upload. Consider adding example photos to guide customers.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <h3 className="font-semibold text-white mb-2">Respect Privacy</h3>
              <p className="text-white/80 text-sm">
                Always get permission before sharing customer photos. Include privacy options in your prompt page.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <h3 className="font-semibold text-white mb-2">Incentivize Uploads</h3>
              <p className="text-white/80 text-sm">
                Consider offering incentives for photo reviews, like discounts or entries into contests.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <h3 className="font-semibold text-white mb-2">Moderate Content</h3>
              <p className="text-white/80 text-sm">
                Review photos before displaying them publicly to ensure quality and appropriateness.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to Collect Visual Reviews?
          </h2>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            Start collecting photo reviews that showcase your work and build trust with potential customers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://app.promptreviews.com/dashboard"
              className="inline-flex items-center px-6 py-3 bg-white/20 text-white backdrop-blur-sm font-medium rounded-lg hover:bg-white/30 transition-colors"
            >
              Create Photo Page
            </a>
            <a
              href="/prompt-pages/types"
              className="inline-flex items-center px-6 py-3 border border-white text-white font-medium rounded-lg hover:bg-white/10 transition-colors"
            >
              View All Types
            </a>
          </div>
        </div>
      </div>
    </DocsLayout>
  );
}