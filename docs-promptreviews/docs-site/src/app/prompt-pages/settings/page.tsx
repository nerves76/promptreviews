import { Metadata } from 'next';
import Link from 'next/link';
import {
  Settings,
  Globe,
  FileText,
  Sparkles,
  Star,
  MessageCircle,
  Gift,
  Smile,
  Wrench,
  Info,
  ChevronRight
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Prompt Page Settings - Global Defaults & AI Configuration | Prompt Reviews Help',
  description: 'Learn how to configure global settings that affect all your prompt pages, including AI guidelines, keywords, and default features for new pages.',
  keywords: [
    'prompt page settings',
    'AI guidelines',
    'prompt page defaults',
    'global settings',
    'keywords',
    'AI dos and donts'
  ],
  alternates: {
    canonical: 'https://docs.promptreviews.app/prompt-pages/settings',
  },
}

export default function PromptPageSettingsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-white/60 mb-6">
        <Link href="/" className="hover:text-white">Home</Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <Link href="/prompt-pages" className="hover:text-white">Prompt Pages</Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-white">Settings</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white">Prompt page settings</h1>
        </div>
        <p className="text-xl text-white/80">
          Configure global AI settings and default features that apply to all your prompt pages.
        </p>
      </div>

      {/* Overview */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Overview</h2>
        <p className="text-white/80 mb-4">
          The Prompt Page Settings menu is your central hub for managing how AI generates content and what
          features are enabled by default on new prompt pages. This powerful menu has two main sections:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-5 h-5 text-yellow-300" />
              <h3 className="font-semibold text-white">Global Settings</h3>
            </div>
            <p className="text-sm text-white/70">
              Apply immediately to <strong>all prompt pages</strong> (existing and new)
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-green-300" />
              <h3 className="font-semibold text-white">Default Settings</h3>
            </div>
            <p className="text-sm text-white/70">
              Only apply to <strong>new prompt pages</strong> you create
            </p>
          </div>
        </div>
      </div>

      {/* Where to Find It */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">How to access</h2>
        <ol className="space-y-3 text-white/80">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
            <span>Navigate to <strong className="text-white">Prompt Pages</strong> from your dashboard</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
            <span>Click the <strong className="text-white">Settings</strong> button in the top-right corner</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
            <span>The draggable settings modal will appear</span>
          </li>
        </ol>
      </div>

      {/* Global Settings Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Globe className="w-7 h-7 text-yellow-300" />
          <h2 className="text-3xl font-bold text-white">Global settings</h2>
        </div>

        <p className="text-white/80 mb-6">
          These settings apply <strong>immediately to all prompt pages</strong> (both existing and new).
          Changes here will affect how AI generates content across your entire account.
        </p>

        {/* Keywords */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-4">
          <div className="flex items-start gap-3 mb-3">
            <FileText className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">Keywords</h3>
              <p className="text-white/80 mb-4">
                Comma-separated keywords that help with SEO and AI-generated content across all your prompt pages.
                These keywords guide the AI in understanding your business context.
              </p>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-sm font-semibold text-white mb-2">Example:</p>
                <code className="text-sm text-green-300">
                  best therapist in Portland, amazing ADHD therapist, group sessions, works with most insurance companies, compassionate
                </code>
              </div>
              <div className="mt-4 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <div className="flex gap-2">
                  <Info className="w-5 h-5 text-yellow-300 flex-shrink-0" />
                  <p className="text-sm text-yellow-200">
                    <strong>Pro tip:</strong> Include location-specific keywords, unique selling points, and terms your customers commonly use.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Guidelines */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
          <div className="flex items-start gap-3 mb-3">
            <Sparkles className="w-6 h-6 text-purple-300 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">AI guidelines</h3>
              <p className="text-white/80 mb-4">
                Train the AI to generate content that aligns with your brand voice and messaging.
                These guidelines are crucial for maintaining consistency across all AI-generated reviews and content.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <h4 className="font-semibold text-green-300 mb-2">✓ AI dos</h4>
                  <p className="text-sm text-white/70 mb-3">Things you want the AI to emphasize or include</p>
                  <div className="bg-white/5 rounded p-2">
                    <code className="text-xs text-green-200">
                      Always mention our excellent customer service, fast response times, and personalized approach
                    </code>
                  </div>
                </div>

                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <h4 className="font-semibold text-red-300 mb-2">✗ AI don'ts</h4>
                  <p className="text-sm text-white/70 mb-3">Things you want the AI to avoid or not mention</p>
                  <div className="bg-white/5 rounded p-2">
                    <code className="text-xs text-red-200">
                      Never mention pricing or costs, don't make medical claims, avoid competitor comparisons
                    </code>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                <div className="flex gap-2">
                  <Info className="w-5 h-5 text-yellow-300 flex-shrink-0" />
                  <p className="text-sm text-yellow-200">
                    <strong>Important:</strong> Fill out at least one of these fields to complete the onboarding task and improve AI output quality.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Default Settings Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-7 h-7 text-green-300" />
          <h2 className="text-3xl font-bold text-white">Default settings</h2>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <Info className="w-6 h-6 text-yellow-300 flex-shrink-0" />
            <div>
              <p className="text-yellow-200 mb-2">
                <strong>Note:</strong> The settings below only apply to <strong>new prompt pages</strong> you create.
              </p>
              <p className="text-sm text-yellow-200/80">
                Existing prompt pages will keep their current settings. Each prompt page can override these defaults with its own custom settings.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Review Platforms */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-5">
            <div className="flex items-start gap-3">
              <Star className="w-5 h-5 text-yellow-300 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1">Review platforms</h3>
                <p className="text-sm text-white/70">
                  Choose which review platforms to display on new prompt pages (Google, Facebook, Yelp, etc.)
                </p>
              </div>
            </div>
          </div>

          {/* Special Offer */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-5">
            <div className="flex items-start gap-3">
              <Gift className="w-5 h-5 text-pink-300 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1">Special offer</h3>
                <p className="text-sm text-white/70">
                  Configure a default offer with optional timelock feature to incentivize reviews
                </p>
              </div>
            </div>
          </div>

          {/* AI Settings */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-5">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-purple-300 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1">AI generation settings</h3>
                <p className="text-sm text-white/70">
                  Enable AI review generation button and grammar fixing feature by default
                </p>
              </div>
            </div>
          </div>

          {/* Emoji Sentiment */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-5">
            <div className="flex items-start gap-3">
              <Smile className="w-5 h-5 text-orange-300 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1">Emoji sentiment flow</h3>
                <p className="text-sm text-white/70">
                  Interactive emoji-based sentiment tracking with customizable messages and headers
                </p>
              </div>
            </div>
          </div>

          {/* Falling Stars */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-5">
            <div className="flex items-start gap-3">
              <Star className="w-5 h-5 text-yellow-300 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1">Falling stars animation</h3>
                <p className="text-sm text-white/70">
                  Choose icon type and color for the animated falling elements on your pages
                </p>
              </div>
            </div>
          </div>

          {/* Friendly Note */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-5">
            <div className="flex items-start gap-3">
              <MessageCircle className="w-5 h-5 text-yellow-300 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1">Friendly note</h3>
                <p className="text-sm text-white/70">
                  Add a personalized message that appears on your prompt pages
                </p>
              </div>
            </div>
          </div>

          {/* Recent Reviews */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-5">
            <div className="flex items-start gap-3">
              <Star className="w-5 h-5 text-indigo-300 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1">Recent reviews display</h3>
                <p className="text-sm text-white/70">
                  Show recent reviews on pages (current page only or account-wide)
                </p>
              </div>
            </div>
          </div>

          {/* Kickstarters */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-5">
            <div className="flex items-start gap-3">
              <Wrench className="w-5 h-5 text-teal-300 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1">Kickstarters</h3>
                <p className="text-sm text-white/70">
                  Pre-written conversation starters to help customers begin their reviews
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Best Practices */}
      <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Best practices</h2>
        <ul className="space-y-3 text-white/80">
          <li className="flex gap-3">
            <span className="text-green-400">✓</span>
            <span><strong className="text-white">Start with keywords:</strong> Fill out your keywords first - they impact all AI-generated content</span>
          </li>
          <li className="flex gap-3">
            <span className="text-green-400">✓</span>
            <span><strong className="text-white">Be specific with AI guidelines:</strong> The more detailed your dos and don'ts, the better the AI output</span>
          </li>
          <li className="flex gap-3">
            <span className="text-green-400">✓</span>
            <span><strong className="text-white">Test default features:</strong> Enable features you want on most pages, disable those you rarely use</span>
          </li>
          <li className="flex gap-3">
            <span className="text-green-400">✓</span>
            <span><strong className="text-white">Review periodically:</strong> Update your settings as your business evolves or you learn what works best</span>
          </li>
          <li className="flex gap-3">
            <span className="text-green-400">✓</span>
            <span><strong className="text-white">Customize individual pages:</strong> Remember you can always override these defaults on specific prompt pages</span>
          </li>
        </ul>
      </div>

      {/* Related Articles */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Related articles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/prompt-pages"
            className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors group"
          >
            <MessageCircle className="w-5 h-5 text-yellow-300" />
            <div className="flex-1">
              <div className="font-semibold text-white group-hover:underline">Prompt Pages Overview</div>
              <div className="text-xs text-white/60">Learn about prompt pages</div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/60" />
          </Link>

          <Link
            href="/prompt-pages/features"
            className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors group"
          >
            <Sparkles className="w-5 h-5 text-purple-300" />
            <div className="flex-1">
              <div className="font-semibold text-white group-hover:underline">Prompt Page Features</div>
              <div className="text-xs text-white/60">Explore all available features</div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/60" />
          </Link>

          <Link
            href="/ai-reviews"
            className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors group"
          >
            <Sparkles className="w-5 h-5 text-green-300" />
            <div className="flex-1">
              <div className="font-semibold text-white group-hover:underline">AI-Assisted Reviews</div>
              <div className="text-xs text-white/60">Learn about Prompty AI</div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/60" />
          </Link>

          <Link
            href="/style-settings"
            className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors group"
          >
            <Wrench className="w-5 h-5 text-orange-300" />
            <div className="flex-1">
              <div className="font-semibold text-white group-hover:underline">Style Settings</div>
              <div className="text-xs text-white/60">Customize page appearance</div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/60" />
          </Link>
        </div>
      </div>
    </div>
  );
}
