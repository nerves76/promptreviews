/**
 * Features Comparison Widget Demo
 *
 * Preview page for the features comparison widget
 */

import FeaturesComparisonWidget from '@/components/marketing/FeaturesComparisonWidget';

export default function FeaturesWidgetDemo() {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            Features Comparison Widget
          </h1>
          <p className="text-white/90 drop-shadow">
            Preview of the glassmorphic features widget for your marketing site
          </p>
        </div>

        {/* Widget Demo - Shows gradient background */}
        <div className="mb-8">
          <FeaturesComparisonWidget />
        </div>

        {/* Usage Instructions - Glassmorphic Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8 border-2 border-white">
          <h2 className="text-xl font-bold text-gray-900 mb-4">How to Use</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">1. Import the component:</h3>
              <pre className="bg-white/60 backdrop-blur-xl p-4 rounded-lg overflow-x-auto text-sm border border-white/30">
{`import FeaturesComparisonWidget from '@/components/marketing/FeaturesComparisonWidget';`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">2. Use in your page:</h3>
              <pre className="bg-white/60 backdrop-blur-xl p-4 rounded-lg overflow-x-auto text-sm border border-white/30">
{`<FeaturesComparisonWidget />`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">3. Optional className prop:</h3>
              <pre className="bg-white/60 backdrop-blur-xl p-4 rounded-lg overflow-x-auto text-sm border border-white/30">
{`<FeaturesComparisonWidget className="my-8" />`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Features:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-800">
                <li>Glassmorphic design matching your app aesthetic</li>
                <li>Responsive two-column layout (stacks on mobile)</li>
                <li>Uses your app's existing Icon component ([P], Google G, etc.)</li>
                <li>Circular icon backgrounds with backdrop blur</li>
                <li>Green icons for features you have, red for features you don't</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
