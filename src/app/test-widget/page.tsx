/**
 * Test page for the Review Dashboard widget
 */

'use client';

import { useEffect } from 'react';

export default function TestWidget() {
  useEffect(() => {
    // Load the widget script
    const script = document.createElement('script');
    script.src = '/widgets/review-dashboard.js';
    script.async = true;
    document.body.appendChild(script);
    
    script.onload = () => {
      // Initialize the widget once script is loaded
      if ((window as any).ReviewDashboard) {
        (window as any).ReviewDashboard.init('widget-container', {
          showHeader: true,
          theme: 'light',
          components: ['overview', 'optimization', 'engagement']
        });
      }
    };
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Widget Test Page</h1>
        
        {/* Test 1: JavaScript Widget */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Test 1: JavaScript Widget</h2>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div id="widget-container" style={{ minHeight: '400px' }}></div>
          </div>
        </div>
        
        {/* Test 2: Direct Iframe */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Test 2: Direct Iframe Embed</h2>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <iframe 
              src="/embed/review-dashboard?theme=light&showHeader=true&components=overview,optimization,engagement,recommendations"
              width="100%"
              height="600"
              frameBorder="0"
              style={{ borderRadius: '8px' }}
              title="Review Dashboard"
            />
          </div>
        </div>
        
        {/* Test 3: Data Attribute Auto-init */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Test 3: Auto-initialization with Data Attributes</h2>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div 
              id="auto-widget"
              data-review-dashboard="true"
              data-theme="light"
              data-show-header="true"
              data-components="overview,recommendations"
              style={{ minHeight: '400px' }}
            ></div>
          </div>
        </div>
        
        {/* Embed Code Examples */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Embed Code Examples</h2>
          
          <div className="space-y-6">
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
              <p className="text-sm mb-2 text-gray-400">{`// Option 1: JavaScript Widget`}</p>
              <pre className="text-sm">{`<div id="my-review-widget"></div>
<script src="https://app.promptreviews.app/widgets/review-dashboard.js"></script>
<script>
  ReviewDashboard.init('my-review-widget', {
    showHeader: true,
    theme: 'light',
    components: ['overview', 'optimization', 'engagement']
  });
</script>`}</pre>
            </div>
            
            <div className="bg-gray-900 text-yellow-400 p-4 rounded-lg overflow-x-auto">
              <p className="text-sm mb-2 text-gray-400">{`// Option 2: Simple Iframe`}</p>
              <pre className="text-sm">{`<iframe 
  src="https://app.promptreviews.app/embed/review-dashboard"
  width="100%"
  height="600"
  frameborder="0"
  style="border-radius: 8px;"
  title="Review Dashboard">
</iframe>`}</pre>
            </div>
            
            <div className="bg-gray-900 text-blue-400 p-4 rounded-lg overflow-x-auto">
              <p className="text-sm mb-2 text-gray-400">{`// Option 3: Auto-init with Data Attributes`}</p>
              <pre className="text-sm">{`<div 
  id="widget"
  data-review-dashboard="true"
  data-theme="light"
  data-components="overview,performance">
</div>
<script src="https://app.promptreviews.app/widgets/review-dashboard.js"></script>`}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}