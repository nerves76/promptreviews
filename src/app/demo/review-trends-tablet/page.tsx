/**
 * Review Trends Overview in Tablet Wrapper
 * Marketing-ready component with tablet frame
 */

'use client';

import ProfileOptimizationEmbed from '@/components/GoogleBusinessProfile/embeds/ProfileOptimizationEmbed';
import CustomerEngagementEmbed from '@/components/GoogleBusinessProfile/embeds/CustomerEngagementEmbed';
import OptimizationOpportunitiesEmbed from '@/components/GoogleBusinessProfile/embeds/OptimizationOpportunitiesEmbed';
import OverviewStatsEmbed from '@/components/GoogleBusinessProfile/embeds/OverviewStatsEmbed';

export default function ReviewTrendsTablet() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12">
      <div className="max-w-4xl mx-auto px-4">

        {/* Tablet Wrapper - Responsive */}
        <div className="relative mx-auto max-w-full md:max-w-2xl lg:max-w-3xl">
          {/* Mobile View (no tablet frame) */}
          <div className="block md:hidden bg-white rounded-lg shadow-xl overflow-hidden">
            {/* Mobile Status Bar */}
            <div className="bg-gray-100 px-4 py-2 flex items-center justify-between border-b">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-gray-600">Dashboard</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-600">100%</span>
                <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2 17h20v2H2zm1.15-4.05L4 11.47l.85 1.48 1.3-.75-.85-1.48H7v-1.5H2v1.5h2.15zm6.7-1.48l1.48.85 1.48-.85-.85-1.48H14v-1.5h-5v1.5h2.15l-.85 1.48zM23 13.5h-2v-2h-1.5v2h-2V15h2v2H21v-2h2v-1.5z"/>
                </svg>
              </div>
            </div>
            
            {/* Mobile Content */}
            <div className="h-[500px] overflow-y-auto">
              <div className="p-4 space-y-6">
                {/* Review Trends Overview */}
                <OverviewStatsEmbed />
                
                {/* Profile Optimization */}
                <ProfileOptimizationEmbed />
                
                {/* Customer Engagement */}
                <CustomerEngagementEmbed />
                
                {/* AI-Powered Recommendations */}
                <OptimizationOpportunitiesEmbed />
              </div>
            </div>
          </div>

          {/* Tablet/Desktop View (with frame) */}
          <div className="hidden md:block">
            {/* Tablet Frame */}
            <div className="relative bg-gray-900 rounded-[2rem] lg:rounded-[2.5rem] p-4 lg:p-6 shadow-2xl">
              {/* Camera Notch */}
              <div className="absolute top-2 lg:top-3 left-1/2 transform -translate-x-1/2 w-16 lg:w-20 h-1 lg:h-1.5 bg-gray-800 rounded-full"></div>
              
              {/* Screen Container */}
              <div className="relative bg-white rounded-[1.25rem] lg:rounded-[1.5rem] overflow-hidden" style={{ height: '600px' }}>
                {/* Status Bar */}
                <div className="bg-gray-100 px-4 lg:px-6 py-2 flex items-center justify-between border-b">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">Dashboard</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-gray-600">100%</span>
                    <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M2 17h20v2H2zm1.15-4.05L4 11.47l.85 1.48 1.3-.75-.85-1.48H7v-1.5H2v1.5h2.15zm6.7-1.48l1.48.85 1.48-.85-.85-1.48H14v-1.5h-5v1.5h2.15l-.85 1.48zM23 13.5h-2v-2h-1.5v2h-2V15h2v2H21v-2h2v-1.5z"/>
                    </svg>
                  </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="overflow-y-auto" style={{ height: 'calc(100% - 40px)' }}>
                  <div className="p-4 lg:p-6 space-y-6 lg:space-y-8">
                  {/* Review Trends Overview */}
                  <OverviewStatsEmbed />
                  
                  {/* Profile Optimization */}
                  <ProfileOptimizationEmbed />
                  
                  {/* Customer Engagement */}
                  <CustomerEngagementEmbed />
                  
                  {/* AI-Powered Recommendations */}
                  <OptimizationOpportunitiesEmbed />
                </div>
              </div>
            </div>

              {/* Home Button */}
              <div className="absolute bottom-1 lg:bottom-2 left-1/2 transform -translate-x-1/2 w-10 lg:w-12 h-10 lg:h-12 bg-gray-800 rounded-full"></div>
            </div>

            {/* Shadow Effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-900/10 rounded-[2rem] lg:rounded-[2.5rem] pointer-events-none" style={{ transform: 'translateY(10px)', filter: 'blur(20px)', zIndex: -1 }}></div>
          </div>
        </div>

        {/* Embed Code Section */}
        <div className="mt-16 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Embed This Component</h2>
          
          <div className="space-y-6">
            {/* React/Next.js Code */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">React/Next.js Implementation</h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
{`import OverviewStatsEmbed from '@/components/GoogleBusinessProfile/embeds/OverviewStatsEmbed';

export default function ReviewDashboard() {
  return (
    <div className="tablet-wrapper">
      <div className="tablet-frame">
        <div className="tablet-screen">
          <OverviewStatsEmbed />
        </div>
      </div>
    </div>
  );
}`}
              </pre>
            </div>

            {/* HTML/CSS/JS Code */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">HTML/CSS/JavaScript (Responsive)</h3>
              <pre className="bg-gray-900 text-blue-400 p-4 rounded-lg overflow-x-auto text-sm">
{`<!-- HTML Structure -->
<div class="review-dashboard-container">
  <!-- Mobile View -->
  <div class="mobile-view">
    <div class="status-bar">
      <div class="status-left">
        <span class="status-dot"></span>
        <span>Dashboard</span>
      </div>
      <div class="status-right">100%</div>
    </div>
    <div class="content-area">
      <div id="review-trends-widget"></div>
    </div>
  </div>
  
  <!-- Tablet/Desktop View -->
  <div class="tablet-view">
    <div class="tablet-frame">
      <div class="camera-notch"></div>
      <div class="tablet-screen">
        <div class="status-bar">
          <div class="status-left">
            <span class="status-dot"></span>
            <span>Dashboard</span>
          </div>
          <div class="status-right">100%</div>
        </div>
        <div class="content-area">
          <div id="review-trends-widget-tablet"></div>
        </div>
      </div>
      <div class="home-button"></div>
    </div>
  </div>
</div>

<!-- Responsive CSS -->
<style>
  .review-dashboard-container {
    max-width: 1024px;
    margin: 0 auto;
    padding: 1rem;
  }
  
  /* Mobile View (shown < 768px) */
  .mobile-view {
    display: block;
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }
  
  /* Tablet View (hidden on mobile) */
  .tablet-view {
    display: none;
  }
  
  /* Status Bar */
  .status-bar {
    background: #f3f4f6;
    padding: 0.5rem 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #e5e7eb;
    font-size: 0.75rem;
    color: #4b5563;
  }
  
  .status-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .status-dot {
    width: 8px;
    height: 8px;
    background: #10b981;
    border-radius: 50%;
  }
  
  .content-area {
    padding: 1rem;
    max-height: 70vh;
    overflow-y: auto;
  }
  
  /* Tablet/Desktop Styles (768px+) */
  @media (min-width: 768px) {
    .mobile-view {
      display: none;
    }
    
    .tablet-view {
      display: block;
    }
    
    .tablet-frame {
      background: #111;
      border-radius: 2rem;
      padding: 1.5rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      position: relative;
    }
    
    .camera-notch {
      position: absolute;
      top: 0.75rem;
      left: 50%;
      transform: translateX(-50%);
      width: 80px;
      height: 6px;
      background: #222;
      border-radius: 9999px;
    }
    
    .tablet-screen {
      background: white;
      border-radius: 1.25rem;
      overflow: hidden;
      min-height: 500px;
      max-height: 800px;
    }
    
    .tablet-screen .content-area {
      height: calc(100% - 40px);
      max-height: 760px;
      padding: 1.5rem;
    }
    
    .home-button {
      position: absolute;
      bottom: 0.5rem;
      left: 50%;
      transform: translateX(-50%);
      width: 48px;
      height: 48px;
      background: #1f2937;
      border-radius: 50%;
    }
  }
  
  /* Large Desktop (1024px+) */
  @media (min-width: 1024px) {
    .tablet-frame {
      border-radius: 2.5rem;
      padding: 2rem;
    }
    
    .tablet-screen {
      border-radius: 1.5rem;
    }
    
    .content-area {
      padding: 2rem;
    }
  }
</style>

<!-- JavaScript -->
<script src="https://app.promptreviews.app/widgets/review-dashboard.js"></script>
<script>
  // Initialize for both mobile and tablet views
  ReviewDashboard.init('review-trends-widget', {
    showHeader: true,
    theme: 'light',
    components: ['overview', 'optimization', 'engagement', 'recommendations']
  });
  
  // Only initialize tablet widget on larger screens
  if (window.innerWidth >= 768) {
    ReviewDashboard.init('review-trends-widget-tablet', {
      showHeader: true,
      theme: 'light',
      components: ['overview', 'optimization', 'engagement', 'recommendations']
    });
  }
</script>`}
              </pre>
            </div>

            {/* Iframe Embed */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Simple Iframe Embed</h3>
              <pre className="bg-gray-900 text-yellow-400 p-4 rounded-lg overflow-x-auto text-sm">
{`<iframe 
  src="https://app.promptreviews.app/embed/review-dashboard?theme=light&showHeader=true"
  width="100%"
  height="600"
  frameborder="0"
  style="border-radius: 1.5rem; box-shadow: 0 10px 40px rgba(0,0,0,0.1); max-width: 1024px;"
  title="Review Trends Dashboard">
</iframe>`}
              </pre>
            </div>
          </div>

          {/* Copy Button */}
          <div className="mt-6 flex justify-end">
            <button 
              onClick={() => {
                const code = document.querySelector('pre')?.textContent || '';
                navigator.clipboard.writeText(code);
                alert('Code copied to clipboard!');
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Copy Embed Code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}