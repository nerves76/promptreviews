import { Metadata } from 'next';
import Link from 'next/link';
import { Smile, ChevronRight, Heart, ThumbsUp, Meh, ThumbsDown, Frown } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Emoji Sentiment Flow - Interactive Review Collection | Prompt Reviews',
  description: 'Learn how Emoji Sentiment Flow makes review collection fun and engaging with interactive emoji reactions that guide customers to appropriate review platforms.',
  keywords: ['emoji sentiment', 'interactive reviews', 'customer feedback', 'emoji reactions'],
};

export default function EmojiSentimentPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-white/60 mb-6">
        <Link href="/" className="hover:text-white">Home</Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <Link href="/prompt-pages" className="hover:text-white">Prompt Pages</Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <Link href="/prompt-pages/features" className="hover:text-white">Features</Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-white">Emoji Sentiment Flow</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-orange-500 to-pink-600 rounded-xl">
            <Smile className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white">Emoji sentiment flow</h1>
        </div>
        <p className="text-xl text-white/80">
          Interactive emoji-based review collection that makes leaving reviews fun, engaging, and guides customers to the right platform based on their satisfaction level.
        </p>
      </div>

      {/* Overview */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">What is emoji sentiment flow?</h2>
        <p className="text-white/80 mb-4">
          The Emoji Sentiment Flow feature allows customers to express their satisfaction through emoji reactions before leaving a detailed review. This creates a quick, engaging way for customers to provide feedback while intelligently routing them to the most appropriate platform.
        </p>
        <p className="text-white/80">
          Instead of asking customers to immediately write a review, we first ask them to select an emoji that represents their experience. This simple interaction increases engagement and helps you direct positive reviews to public platforms while gathering constructive feedback from less satisfied customers privately.
        </p>
      </div>

      {/* Emoji Options */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Emoji options</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Heart className="w-6 h-6 text-green-300 fill-green-300" />
              <h3 className="font-semibold text-green-300">Excellent</h3>
            </div>
            <p className="text-sm text-white/70">Extremely satisfied customers → Public platforms</p>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <ThumbsUp className="w-6 h-6 text-blue-300" />
              <h3 className="font-semibold text-blue-300">Satisfied</h3>
            </div>
            <p className="text-sm text-white/70">Happy customers → Public platforms</p>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Meh className="w-6 h-6 text-yellow-300" />
              <h3 className="font-semibold text-yellow-300">Neutral</h3>
            </div>
            <p className="text-sm text-white/70">Okay experience → Private feedback</p>
          </div>

          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <ThumbsDown className="w-6 h-6 text-orange-300" />
              <h3 className="font-semibold text-orange-300">Unsatisfied</h3>
            </div>
            <p className="text-sm text-white/70">Disappointed → Private feedback</p>
          </div>

          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Frown className="w-6 h-6 text-red-300" />
              <h3 className="font-semibold text-red-300">Frustrated</h3>
            </div>
            <p className="text-sm text-white/70">Very unhappy → Direct to you</p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">How it works</h2>
        <ol className="space-y-4">
          <li className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
            <div>
              <h4 className="font-semibold text-white mb-1">Customer sees emoji question</h4>
              <p className="text-white/70 text-sm">Your prompt page displays a question like "How was your experience?" with 5 emoji options</p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
            <div>
              <h4 className="font-semibold text-white mb-1">Customer selects emoji</h4>
              <p className="text-white/70 text-sm">They click the emoji that best represents their satisfaction level</p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
            <div>
              <h4 className="font-semibold text-white mb-1">Smart routing happens</h4>
              <p className="text-white/70 text-sm">Positive sentiments (Excellent/Satisfied) → Public review platforms like Google, Facebook<br/>
              Negative sentiments (Neutral/Unsatisfied/Frustrated) → Private feedback form sent to you</p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
            <div>
              <h4 className="font-semibold text-white mb-1">Customer completes their feedback</h4>
              <p className="text-white/70 text-sm">They're guided to the appropriate platform to share their full experience</p>
            </div>
          </li>
        </ol>
      </div>

      {/* Benefits */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Key benefits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Increases engagement</h4>
              <p className="text-sm text-white/70">Fun, visual interface encourages more customers to participate</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Protects your reputation</h4>
              <p className="text-sm text-white/70">Negative feedback goes to you privately, not public platforms</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Quick emotional feedback</h4>
              <p className="text-sm text-white/70">Instantly gauge customer satisfaction levels</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Lower barrier to entry</h4>
              <p className="text-sm text-white/70">Starting with an emoji is easier than writing a full review</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Mobile-friendly</h4>
              <p className="text-sm text-white/70">Emojis are perfect for touch interfaces on phones</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Customizable messages</h4>
              <p className="text-sm text-white/70">Personalize all the questions and responses to match your brand</p>
            </div>
          </div>
        </div>
      </div>

      {/* Use Cases */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Perfect for</h2>
        <ul className="space-y-3">
          <li className="flex gap-3">
            <span className="text-purple-400">•</span>
            <span className="text-white/80"><strong className="text-white">Restaurants</strong> wanting to gauge dining experience satisfaction</span>
          </li>
          <li className="flex gap-3">
            <span className="text-purple-400">•</span>
            <span className="text-white/80"><strong className="text-white">Service businesses</strong> collecting quick feedback after appointments</span>
          </li>
          <li className="flex gap-3">
            <span className="text-purple-400">•</span>
            <span className="text-white/80"><strong className="text-white">Retail stores</strong> making review collection more engaging and fun</span>
          </li>
          <li className="flex gap-3">
            <span className="text-purple-400">•</span>
            <span className="text-white/80"><strong className="text-white">Healthcare providers</strong> wanting to filter positive vs constructive feedback</span>
          </li>
          <li className="flex gap-3">
            <span className="text-purple-400">•</span>
            <span className="text-white/80"><strong className="text-white">Any business</strong> wanting to protect their online reputation while still collecting feedback</span>
          </li>
        </ul>
      </div>

      {/* Customization */}
      <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Customization options</h2>
        <p className="text-white/80 mb-4">
          You can customize every aspect of the emoji sentiment flow:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">Main Question</h4>
            <p className="text-sm text-white/70">E.g., "How was your dining experience?"</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">Feedback Messages</h4>
            <p className="text-sm text-white/70">Custom prompts for each emoji level</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">Thank You Messages</h4>
            <p className="text-sm text-white/70">Personalized appreciation for feedback</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">Popup Headers</h4>
            <p className="text-sm text-white/70">Custom headers for feedback collection</p>
          </div>
        </div>
      </div>

      {/* Related Features */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Related features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/prompt-pages/features/ai-powered"
            className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors group"
          >
            <div className="flex-1">
              <div className="font-semibold text-white group-hover:underline">AI-Powered Content</div>
              <div className="text-xs text-white/60">Help customers write better reviews</div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/60" />
          </Link>

          <Link
            href="/prompt-pages/features"
            className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors group"
          >
            <div className="flex-1">
              <div className="font-semibold text-white group-hover:underline">All Features</div>
              <div className="text-xs text-white/60">View all prompt page features</div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/60" />
          </Link>
        </div>
      </div>
    </div>
  );
}
