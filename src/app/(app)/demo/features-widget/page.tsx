/**
 * Features Comparison Widget Demo
 *
 * Preview page for the features comparison widget
 */

import FeaturesComparisonWidget from '@/components/marketing/FeaturesComparisonWidget';

export default function FeaturesWidgetDemo() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Features Comparison Widget
          </h1>
          <p className="text-gray-600">
            Preview of the embeddable features widget for your marketing site
          </p>
        </div>

        {/* Widget Demo */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <FeaturesComparisonWidget />
        </div>

        {/* Usage Instructions */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">How to Use</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">1. Import the component:</h3>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">
{`import FeaturesComparisonWidget from '@/components/marketing/FeaturesComparisonWidget';`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">2. Use in your page:</h3>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">
{`<FeaturesComparisonWidget />`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">3. Optional className prop:</h3>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">
{`<FeaturesComparisonWidget className="my-8" />`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Features:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Responsive two-column layout (stacks on mobile)</li>
                <li>Uses your app's existing Icon component</li>
                <li>Green checkmarks for features you have</li>
                <li>Red X icons for features you don't have</li>
                <li>Clean, modern design matching your app aesthetic</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
