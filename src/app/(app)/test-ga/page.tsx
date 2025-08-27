/**
 * Test page for Google Analytics integration
 * This page allows testing of various GA4 events and tracking functionality
 */

'use client';

import { useState } from 'react';
import { 
  trackEvent, 
  trackSignUp, 
  trackWidgetCreated, 
  trackReviewSubmitted,
  trackAdminAction,
  trackError,
  GA_EVENTS 
} from '@/utils/analytics';

export default function TestGAPage() {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testBasicEvent = () => {
    try {
      trackEvent('test_event', {
        test_parameter: 'test_value',
        timestamp: new Date().toISOString()
      });
      addResult('✅ Basic event tracked successfully');
    } catch (error) {
      addResult(`❌ Basic event failed: ${error}`);
    }
  };

  const testSignUp = () => {
    try {
      trackSignUp('email');
      addResult('✅ Sign up event tracked successfully');
    } catch (error) {
      addResult(`❌ Sign up event failed: ${error}`);
    }
  };

  const testWidgetCreated = () => {
    try {
      trackWidgetCreated('multi', 'test-business-id');
      addResult('✅ Widget created event tracked successfully');
    } catch (error) {
      addResult(`❌ Widget created event failed: ${error}`);
    }
  };

  const testReviewSubmitted = () => {
    try {
      trackReviewSubmitted('multi', 5, true);
      addResult('✅ Review submitted event tracked successfully');
    } catch (error) {
      addResult(`❌ Review submitted event failed: ${error}`);
    }
  };

  const testAdminAction = () => {
    try {
      trackAdminAction('announcement_created', {
        has_button: true,
        message_length: 150
      });
      addResult('✅ Admin action event tracked successfully');
    } catch (error) {
      addResult(`❌ Admin action event failed: ${error}`);
    }
  };

  const testError = () => {
    try {
      trackError('Test error message', {
        page: 'test-ga',
        user_action: 'test_error_button'
      });
      addResult('✅ Error event tracked successfully');
    } catch (error) {
      addResult(`❌ Error event failed: ${error}`);
    }
  };

  const testAllEvents = () => {
    addResult('🚀 Starting comprehensive GA4 test...');
    testBasicEvent();
    testSignUp();
    testWidgetCreated();
    testReviewSubmitted();
    testAdminAction();
    testError();
    addResult('✅ All tests completed! Check browser console and GA4 dashboard.');
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Google Analytics 4 Test Page</h1>
          
          <div className="mb-8">
            <p className="text-gray-600 mb-4">
              This page allows you to test the Google Analytics 4 integration. 
              Each button will trigger a specific GA4 event that you can verify in your GA4 dashboard.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <h3 className="font-semibold text-blue-800 mb-2">How to verify:</h3>
              <ol className="text-blue-700 text-sm space-y-1">
                <li>1. Open your GA4 dashboard</li>
                <li>2. Go to Reports → Engagement → Events</li>
                <li>3. Click the buttons below to trigger events</li>
                <li>4. Refresh the GA4 dashboard to see the events</li>
                <li>5. Check the browser console for any errors</li>
              </ol>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <button
              onClick={testBasicEvent}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              Test Basic Event
            </button>
            
            <button
              onClick={testSignUp}
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
            >
              Test Sign Up
            </button>
            
            <button
              onClick={testWidgetCreated}
              className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 transition-colors"
            >
              Test Widget Created
            </button>
            
            <button
              onClick={testReviewSubmitted}
              className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors"
            >
              Test Review Submitted
            </button>
            
            <button
              onClick={testAdminAction}
              className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
            >
              Test Admin Action
            </button>
            
            <button
              onClick={testError}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
            >
              Test Error Event
            </button>
          </div>

          <div className="mb-6">
            <button
              onClick={testAllEvents}
              className="bg-slate-blue text-white px-6 py-3 rounded-md hover:bg-slate-blue/90 transition-colors font-semibold text-lg"
            >
              🚀 Test All Events
            </button>
            
            <button
              onClick={clearResults}
              className="ml-4 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
            >
              Clear Results
            </button>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Test Results:</h3>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {testResults.length === 0 ? (
                <p className="text-gray-500 italic">No tests run yet. Click the buttons above to start testing.</p>
              ) : (
                testResults.map((result, index) => (
                  <div key={index} className="text-sm font-mono">
                    {result}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h3 className="font-semibold text-yellow-800 mb-2">Debug Information:</h3>
            <div className="text-sm text-yellow-700 space-y-1">
              <p>• GA4 Tracking ID: {process.env.NEXT_PUBLIC_GA_TRACKING_ID || 'Not set'}</p>
              <p>• Window.gtag available: {typeof window !== 'undefined' && typeof window.gtag === 'function' ? 'Yes' : 'No'}</p>
              <p>• DataLayer available: {typeof window !== 'undefined' && window.dataLayer ? 'Yes' : 'No'}</p>
              <p>• Current URL: {typeof window !== 'undefined' ? window.location.href : 'Server-side'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 