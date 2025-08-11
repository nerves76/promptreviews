import { Metadata } from 'next';
import { Video, Play, Mic, Award, TrendingUp, Users } from 'lucide-react';
import DocsLayout from '../../../docs-layout';

export const metadata: Metadata = {
  title: 'Video Prompt Pages - Video Testimonials Guide | Prompt Reviews',
  description: 'Learn how to create Video prompt pages for collecting powerful video testimonials and reviews from customers.',
  keywords: 'video prompt pages, video testimonials, video reviews, customer testimonials, video feedback',
  openGraph: {
    title: 'Video Prompt Pages - Collect Video Testimonials',
    description: 'Create Video prompt pages to collect authentic video testimonials that build trust and credibility.',
  },
};

export default function VideoPromptPages() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
              <Video className="w-6 h-6 text-red-300" />
            </div>
            <h1 className="text-4xl font-bold text-white">
              Video Prompt Pages
            </h1>
          </div>
          <p className="text-xl text-white/80">
            Collect powerful video testimonials that showcase authentic customer experiences. Perfect for 
            high-value services, personal brands, and businesses where trust is paramount.
          </p>
        </div>

        {/* Why Choose Video Pages */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Why Choose Video Prompt Pages?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Award className="w-6 h-6 text-blue-300" />
              </div>
              <h3 className="font-semibold text-white mb-2">Maximum Authenticity</h3>
              <p className="text-white/70 text-sm">Video testimonials are the most trusted form of social proof</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-green-300" />
              </div>
              <h3 className="font-semibold text-white mb-2">Higher Conversion</h3>
              <p className="text-white/70 text-sm">Video testimonials increase conversion rates by up to 80%</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-purple-300" />
              </div>
              <h3 className="font-semibold text-white mb-2">Personal Connection</h3>
              <p className="text-white/70 text-sm">Viewers connect emotionally with video testimonials</p>
            </div>
          </div>
        </div>

        {/* Perfect For */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Perfect For These Businesses</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <h3 className="text-lg font-bold text-white mb-3">High-Value Services</h3>
              <ul className="space-y-2 text-white/80 text-sm mb-4">
                <li>• Business consultants</li>
                <li>• Financial advisors</li>
                <li>• Real estate agents</li>
                <li>• Legal services</li>
              </ul>
              <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-3">
                <p className="text-white/80 text-sm">
                  <strong className="text-blue-300">Why:</strong> Build trust for high-stakes decisions
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <h3 className="text-lg font-bold text-white mb-3">Personal Brands</h3>
              <ul className="space-y-2 text-white/80 text-sm mb-4">
                <li>• Life coaches</li>
                <li>• Personal trainers</li>
                <li>• Course creators</li>
                <li>• Speakers & authors</li>
              </ul>
              <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-3">
                <p className="text-white/80 text-sm">
                  <strong className="text-green-300">Why:</strong> Show transformation and impact
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <h3 className="text-lg font-bold text-white mb-3">Healthcare & Wellness</h3>
              <ul className="space-y-2 text-white/80 text-sm mb-4">
                <li>• Medical practices</li>
                <li>• Therapy services</li>
                <li>• Wellness centers</li>
                <li>• Alternative medicine</li>
              </ul>
              <div className="bg-purple-500/20 border border-purple-400/30 rounded-lg p-3">
                <p className="text-white/80 text-sm">
                  <strong className="text-purple-300">Why:</strong> Share patient success stories
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <h3 className="text-lg font-bold text-white mb-3">Education & Training</h3>
              <ul className="space-y-2 text-white/80 text-sm mb-4">
                <li>• Online courses</li>
                <li>• Bootcamps</li>
                <li>• Workshops</li>
                <li>• Certification programs</li>
              </ul>
              <div className="bg-orange-500/20 border border-orange-400/30 rounded-lg p-3">
                <p className="text-white/80 text-sm">
                  <strong className="text-orange-300">Why:</strong> Showcase student outcomes
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Video Recording Features */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Video Recording Features</h2>
          <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Play className="w-5 h-5 mr-2" />
                  Recording Options
                </h3>
                <ul className="space-y-2 text-white/80">
                  <li className="flex items-start space-x-2">
                    <span className="text-green-300">✓</span>
                    <span>In-browser recording</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-300">✓</span>
                    <span>Mobile device support</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-300">✓</span>
                    <span>Upload existing videos</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-300">✓</span>
                    <span>Time limits (30s-5min)</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Mic className="w-5 h-5 mr-2" />
                  Production Quality
                </h3>
                <ul className="space-y-2 text-white/80">
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-300">✓</span>
                    <span>HD video quality</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-300">✓</span>
                    <span>Clear audio capture</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-300">✓</span>
                    <span>Background blur option</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-300">✓</span>
                    <span>Preview before submit</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Tips for Success */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Tips for Getting Great Video Reviews</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <h3 className="font-semibold text-white mb-2">Provide Prompts</h3>
              <p className="text-white/80 text-sm">
                Give customers 3-5 questions to answer in their video to guide their testimonial.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <h3 className="font-semibold text-white mb-2">Keep It Short</h3>
              <p className="text-white/80 text-sm">
                Request 30-60 second videos for higher completion rates and better engagement.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <h3 className="font-semibold text-white mb-2">Timing Matters</h3>
              <p className="text-white/80 text-sm">
                Request videos when customers are most excited about their results.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <h3 className="font-semibold text-white mb-2">Make It Easy</h3>
              <p className="text-white/80 text-sm">
                Ensure one-click recording with no downloads or sign-ups required.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <h3 className="font-semibold text-white mb-2">Show Examples</h3>
              <p className="text-white/80 text-sm">
                Display sample videos so customers know what you're looking for.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <h3 className="font-semibold text-white mb-2">Offer Incentives</h3>
              <p className="text-white/80 text-sm">
                Consider offering discounts or bonuses for video testimonials.
              </p>
            </div>
          </div>
        </div>

        {/* Using Video Testimonials */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">How to Use Video Testimonials</h2>
          <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-8">
            <ul className="space-y-4">
              <li className="flex items-start space-x-3">
                <span className="text-yellow-300 text-xl">→</span>
                <div>
                  <p className="font-medium text-white">Website Homepage</p>
                  <p className="text-white/70 text-sm">Feature video testimonials prominently above the fold</p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-yellow-300 text-xl">→</span>
                <div>
                  <p className="font-medium text-white">Sales Pages</p>
                  <p className="text-white/70 text-sm">Include relevant testimonials near calls-to-action</p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-yellow-300 text-xl">→</span>
                <div>
                  <p className="font-medium text-white">Social Media</p>
                  <p className="text-white/70 text-sm">Share video testimonials as social proof content</p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-yellow-300 text-xl">→</span>
                <div>
                  <p className="font-medium text-white">Email Marketing</p>
                  <p className="text-white/70 text-sm">Include video testimonials in nurture sequences</p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-yellow-300 text-xl">→</span>
                <div>
                  <p className="font-medium text-white">Ad Campaigns</p>
                  <p className="text-white/70 text-sm">Use testimonials in video ads for higher conversion</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-red-500 to-orange-600 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to Collect Video Testimonials?
          </h2>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            Start collecting powerful video testimonials that build trust and drive conversions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://app.promptreviews.com/dashboard"
              className="inline-flex items-center px-6 py-3 bg-white/20 text-white backdrop-blur-sm font-medium rounded-lg hover:bg-white/30 transition-colors"
            >
              Create Video Page
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