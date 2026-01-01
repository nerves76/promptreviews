'use client';

import Icon from '@/components/Icon';
import ButtonSpinner from '@/components/ButtonSpinner';

interface MoreTabProps {
  isConnected: boolean;
  isLoading: boolean;
  onConnect: () => void;
  onShowProductsHelp: () => void;
}

export function MoreTab({
  isConnected,
  isLoading,
  onConnect,
  onShowProductsHelp,
}: MoreTabProps) {
  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <Icon name="FiMoreHorizontal" className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Google Business Profile</h3>
        <p className="text-gray-600 mb-4">
          Connect your Google Business Profile to learn about additional features.
        </p>
        <button
          onClick={onConnect}
          disabled={isLoading}
          className="px-6 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 mx-auto"
        >
          {isLoading ? (
            <>
              <ButtonSpinner />
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <Icon name="FaGoogle" className="w-4 h-4" />
              <span>Connect Google Business</span>
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Icon name="FaInfoCircle" className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-blue-900 font-medium mb-2">
              Additional Google Business Features
            </p>
            <p className="text-blue-800 text-sm mb-2">
              These features are not available through the API but can be managed directly in your Google Business Profile account. Each feature below includes instructions on how to use it effectively.
            </p>
            <p className="text-blue-700 text-xs italic">
              Note: Offer posts can be created through the API - use the "Post" tab to create special offers and promotions.
            </p>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Icon name="FaBoxOpen" className="w-6 h-6 text-slate-blue" />
            <h3 className="text-lg font-semibold text-gray-900">Products</h3>
          </div>
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Recommended</span>
        </div>

        <p className="text-gray-700 mb-4">
          Showcase a photo, product description, and a link. If you are a service business that has productized services (e.g. brand design package, or moss removal and gutter cleaning), you can also create products.
        </p>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-gray-900 mb-2">How to Add Products:</h4>
          <ol className="space-y-2 text-sm text-gray-700">
            <li>1. Go to your Google Business Profile</li>
            <li>2. Click "Products" in the menu</li>
            <li>3. Add product name, photo, price, and description</li>
            <li>4. For services, create "productized" offerings (e.g., "1-Hour Consultation - $99")</li>
          </ol>
        </div>

        <button
          onClick={onShowProductsHelp}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium underline"
        >
          View Complete Products Guide →
        </button>
      </div>

      {/* Q&A Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Icon name="FaQuestionCircle" className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Questions & Answers</h3>
          </div>
          <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">High impact</span>
        </div>

        <p className="text-gray-700 mb-4">
          Answer customer questions to build trust and improve your visibility in search results. Q&A appears prominently in your listing.
        </p>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-gray-900 mb-2">Best Practices:</h4>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start space-x-2">
              <Icon name="FaCheck" className="w-4 h-4 text-green-600 mt-0.5" />
              <span>Monitor questions daily and respond within 24 hours</span>
            </li>
            <li className="flex items-start space-x-2">
              <Icon name="FaCheck" className="w-4 h-4 text-green-600 mt-0.5" />
              <span>Add your own FAQs proactively (have a colleague ask common questions)</span>
            </li>
            <li className="flex items-start space-x-2">
              <Icon name="FaCheck" className="w-4 h-4 text-green-600 mt-0.5" />
              <span>Include keywords naturally in your answers for SEO</span>
            </li>
            <li className="flex items-start space-x-2">
              <Icon name="FaCheck" className="w-4 h-4 text-green-600 mt-0.5" />
              <span>Upvote helpful questions to make them more visible</span>
            </li>
          </ul>
        </div>

        <a
          href="https://business.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-2 text-sm text-purple-600 hover:text-purple-800 font-medium"
        >
          <span>Manage Q&A in Google Business</span>
          <Icon name="FaLink" className="w-3 h-3" />
        </a>
      </div>

      {/* Booking/Appointments Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Icon name="FaCalendarAlt" className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Booking & Appointments</h3>
          </div>
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Integration required</span>
        </div>

        <p className="text-gray-700 mb-4">
          Let customers book appointments directly from your Google listing. Requires integration with a supported booking provider.
        </p>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-gray-900 mb-2">Supported Booking Providers:</h4>
          <ul className="grid grid-cols-2 gap-2 text-sm text-gray-700">
            <li>• Square Appointments</li>
            <li>• Booksy</li>
            <li>• SimplyBook.me</li>
            <li>• Setmore</li>
            <li>• Appointy</li>
            <li>• And many more...</li>
          </ul>
        </div>

        <a
          href="https://support.google.com/business/answer/7087150"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          <span>Learn about booking setup</span>
          <Icon name="FaLink" className="w-3 h-3" />
        </a>
      </div>

      {/* Messaging Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Icon name="FaComments" className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Messaging</h3>
          </div>
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Mobile only</span>
        </div>

        <p className="text-gray-700 mb-4">
          Enable customers to message you directly from Google Search and Maps. Manage conversations through the Google Business app.
        </p>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-gray-900 mb-2">Setup Tips:</h4>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start space-x-2">
              <Icon name="FaCheck" className="w-4 h-4 text-green-600 mt-0.5" />
              <span>Enable messaging in your Business Profile settings</span>
            </li>
            <li className="flex items-start space-x-2">
              <Icon name="FaCheck" className="w-4 h-4 text-green-600 mt-0.5" />
              <span>Set up welcome messages and FAQs</span>
            </li>
            <li className="flex items-start space-x-2">
              <Icon name="FaCheck" className="w-4 h-4 text-green-600 mt-0.5" />
              <span>Download the Google Business app for notifications</span>
            </li>
            <li className="flex items-start space-x-2">
              <Icon name="FaCheck" className="w-4 h-4 text-green-600 mt-0.5" />
              <span>Respond within 24 hours to maintain responsiveness badge</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Attributes Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Icon name="FaTags" className="w-6 h-6 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">Attributes</h3>
          </div>
          <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">High value</span>
        </div>

        <p className="text-gray-700 mb-4">
          Special badges and features that help customers understand what makes your business unique. These appear as icons and filters in search results.
        </p>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-gray-900 mb-2">Important Attributes to Add:</h4>
          <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
            <div>
              <p className="font-medium text-gray-900 mb-1">Identity Attributes:</p>
              <ul className="space-y-1">
                <li>• Women-owned</li>
                <li>• Black-owned</li>
                <li>• Veteran-owned</li>
                <li>• LGBTQ+ friendly</li>
                <li>• Family-owned</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-gray-900 mb-1">Accessibility & Features:</p>
              <ul className="space-y-1">
                <li>• Wheelchair accessible</li>
                <li>• Outdoor seating</li>
                <li>• Free Wi-Fi</li>
                <li>• Pet friendly</li>
                <li>• Contactless payments</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800">
            <strong>Pro Tip:</strong> Attributes help you appear in filtered searches. When someone searches for "Black-owned restaurants near me" or filters for "wheelchair accessible," your business will show up if you've added these attributes.
          </p>
        </div>

        <a
          href="https://business.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          <span>Manage Attributes in Google Business</span>
          <Icon name="FaLink" className="w-3 h-3" />
        </a>
      </div>

      {/* Menu/Services List Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Icon name="FaFileAlt" className="w-6 h-6 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Menu (Restaurants Only)</h3>
          </div>
          <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">Industry specific</span>
        </div>

        <p className="text-gray-700 mb-4">
          Add your full menu with prices, descriptions, and dietary information. Helps customers find specific dishes they're looking for.
        </p>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-gray-900 mb-2">Menu Best Practices:</h4>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start space-x-2">
              <Icon name="FaCheck" className="w-4 h-4 text-green-600 mt-0.5" />
              <span>Include popular dishes with photos</span>
            </li>
            <li className="flex items-start space-x-2">
              <Icon name="FaCheck" className="w-4 h-4 text-green-600 mt-0.5" />
              <span>Mark dietary restrictions (vegan, gluten-free, etc.)</span>
            </li>
            <li className="flex items-start space-x-2">
              <Icon name="FaCheck" className="w-4 h-4 text-green-600 mt-0.5" />
              <span>Keep prices updated</span>
            </li>
            <li className="flex items-start space-x-2">
              <Icon name="FaCheck" className="w-4 h-4 text-green-600 mt-0.5" />
              <span>Add seasonal items promptly</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Access Google Business Button */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 text-center">
        <Icon name="FaGoogle" className="w-12 h-12 text-blue-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage All Features in Google</h3>
        <p className="text-gray-700 mb-4">
          Access your Google Business Profile to manage these features and more.
        </p>
        <a
          href="https://business.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Icon name="FaLink" className="w-4 h-4" />
          <span>Open Google Business Profile</span>
        </a>
      </div>
    </div>
  );
}
