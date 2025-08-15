/**
 * Multi-Business Posting Demo
 * Interactive animation showing how to post to multiple business locations
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/Icon';
import SpriteLoader from '@/components/SpriteLoader';

// Fake business locations
const fakeLocations = [
  {
    id: '1',
    name: "Snuzzlepup's Veterinary Clinic - Burnside",
    address: '2341 E Burnside St, Portland, OR 97214',
    status: 'active' as const
  },
  {
    id: '2',
    name: "Snuzzlepup's Veterinary Clinic - Division",
    address: '5678 SE Division St, Portland, OR 97206',
    status: 'active' as const
  },
  {
    id: '3',
    name: "Snuzzlepup's Veterinary Clinic - Hawthorne",
    address: '3456 SE Hawthorne Blvd, Portland, OR 97214',
    status: 'active' as const
  },
  {
    id: '4',
    name: "Snuzzlepup's Homes 4 Pets Non-Profit",
    address: '1234 NE Sandy Blvd, Portland, OR 97213',
    status: 'active' as const
  }
];

const postMessage = "🐾 Free Dental Health Check Week! Bring your furry friend to any Snuzzlepup's location Feb 5-9 for a complimentary dental exam. Early detection prevents painful problems later. Book online or call to schedule. Your pet's smile matters! 🦷✨";

export default function MultiBusinessPostingDemo() {
  const [phase, setPhase] = useState<'waiting' | 'dropdown' | 'selecting' | 'typing' | 'posting' | 'success'>('waiting');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [displayedText, setDisplayedText] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const animationTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Animation sequence
  useEffect(() => {
    const runAnimation = async () => {
      // Wait a bit before starting
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Open dropdown
      setPhase('dropdown');
      setIsDropdownOpen(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Start selecting locations
      setPhase('selecting');
      
      // Select first location
      await new Promise(resolve => setTimeout(resolve, 800));
      setSelectedLocations(['1']);
      
      // Select second location
      await new Promise(resolve => setTimeout(resolve, 600));
      setSelectedLocations(['1', '2']);
      
      // Select third location
      await new Promise(resolve => setTimeout(resolve, 600));
      setSelectedLocations(['1', '2', '3']);
      
      // Close dropdown
      await new Promise(resolve => setTimeout(resolve, 800));
      setIsDropdownOpen(false);
      
      // Start typing
      setPhase('typing');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Type the message with realistic speed
      for (let i = 0; i <= postMessage.length; i++) {
        setDisplayedText(postMessage.slice(0, i));
        await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 20));
      }
      
      // Wait a moment before posting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Click post button
      setPhase('posting');
      setIsPosting(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show success
      setIsPosting(false);
      setPhase('success');
      setShowSuccess(true);
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Reset and loop
      setPhase('waiting');
      setIsDropdownOpen(false);
      setSelectedLocations([]);
      setDisplayedText('');
      setShowSuccess(false);
      
      // Start again after a pause
      await new Promise(resolve => setTimeout(resolve, 2000));
      runAnimation();
    };

    runAnimation();

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <SpriteLoader />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Post to Multiple Locations at Once
            </h1>
            <p className="text-xl text-gray-600">
              Save time by publishing the same update to all your business locations simultaneously
            </p>
          </div>

          {/* Demo Container */}
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
            {/* Mock Browser Bar */}
            <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="ml-4 px-4 py-1 bg-white rounded-md text-sm text-gray-600">
                  app.promptreviews.app/dashboard/google-business
                </div>
              </div>
              <Icon name="FaLock" className="w-4 h-4 text-green-600" />
            </div>

            {/* Demo Content */}
            <div className="p-8">
              {/* Page Title */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Icon name="FaGoogle" className="w-6 h-6 mr-3 text-blue-500" />
                  Google Business Profile
                </h2>
                <div className="text-sm text-gray-500">
                  Create Post
                </div>
              </div>

              {/* Create Post Form */}
              <div className="space-y-6">
                {/* Location Selector */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select locations to post
                    {phase === 'dropdown' && (
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 animate-pulse">
                        Click to select
                      </span>
                    )}
                  </label>
                  
                  <button
                    className={`w-full flex items-center justify-between px-4 py-3 border rounded-md bg-white transition-all ${
                      isDropdownOpen ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon name="FaMapMarker" className="w-4 h-4 text-gray-500" />
                      <span className={`transition-all ${selectedLocations.length > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                        {selectedLocations.length === 0 
                          ? 'Select business locations' 
                          : selectedLocations.length === 1 
                            ? fakeLocations.find(l => l.id === selectedLocations[0])?.name
                            : `${selectedLocations.length} locations selected`
                        }
                      </span>
                    </div>
                    {isDropdownOpen ? (
                      <Icon name="FaChevronUp" className="w-4 h-4 text-gray-500" />
                    ) : (
                      <Icon name="FaChevronDown" className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  
                  {/* Dropdown */}
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 animate-slideDown">
                      {fakeLocations.map((location) => (
                        <label
                          key={location.id}
                          className={`flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-all ${
                            selectedLocations.includes(location.id) ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={selectedLocations.includes(location.id)}
                              readOnly
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            {phase === 'selecting' && selectedLocations.includes(location.id) && (
                              <div className="absolute inset-0 w-4 h-4 bg-blue-600 rounded animate-ping"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">{location.name}</div>
                            <div className="text-sm text-gray-500 truncate">{location.address}</div>
                          </div>
                          <div className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {location.status}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Post Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Post content
                    {phase === 'typing' && (
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 animate-pulse">
                        Composing message
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <textarea
                      value={displayedText}
                      readOnly
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      placeholder="What's happening at your business?"
                    />
                    {phase === 'typing' && displayedText.length < postMessage.length && (
                      <span className="absolute animate-blink">|</span>
                    )}
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    {displayedText.length}/1500 characters
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center">
                  <div className="flex space-x-3">
                    <button
                      className={`px-6 py-2 rounded-md font-medium transition-all flex items-center space-x-2 ${
                        displayedText.trim() 
                          ? 'bg-purple-600 text-white hover:bg-purple-700' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <Icon name="FaRobot" className="w-4 h-4" />
                      <span>Improve with AI</span>
                    </button>
                    
                    <button
                      className={`px-6 py-2 rounded-md font-medium transition-all flex items-center space-x-2 ${
                        isPosting 
                          ? 'bg-blue-600 text-white cursor-wait' 
                          : displayedText && selectedLocations.length > 0
                            ? 'bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-105'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isPosting ? (
                        <>
                          <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
                          <span>Publishing to {selectedLocations.length} locations...</span>
                        </>
                      ) : (
                        <>
                          <Icon name="FaPlus" className="w-4 h-4" />
                          <span>Publish Post</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Success Message */}
                {showSuccess && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg animate-slideDown">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Icon name="FaCheckCircle" className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-800">
                          Successfully published to {selectedLocations.length} locations!
                        </p>
                        <p className="text-sm text-green-600 mt-1">
                          Your post is now live on all selected business profiles.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Feature Benefits */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Icon name="FaClock" className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Save Time</h3>
              <p className="text-gray-600">
                Post to all your locations at once instead of updating each one individually
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Icon name="FaUsers" className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Consistent Messaging</h3>
              <p className="text-gray-600">
                Ensure all your locations share the same promotions and updates
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Icon name="FaChartLine" className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Better Reach</h3>
              <p className="text-gray-600">
                Maximize your visibility by keeping all locations actively updated
              </p>
            </div>
          </div>

          {/* Embed Code Section */}
          <div className="mt-16 bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Embed This Demo</h2>
            
            <div className="space-y-6">
              {/* Iframe Embed */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Simple Iframe Embed (Browser Window Only)</h3>
                <pre className="bg-gray-900 text-yellow-400 p-4 rounded-lg overflow-x-auto text-sm">
{`<iframe 
  src="https://app.promptreviews.app/demo/multi-business-posting-embed"
  width="100%"
  height="700"
  frameborder="0"
  style="border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);"
  title="Multi-Location Posting Demo">
</iframe>`}
                </pre>
              </div>

              {/* Full Page Embed */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Responsive Container Embed</h3>
                <pre className="bg-gray-900 text-blue-400 p-4 rounded-lg overflow-x-auto text-sm">
{`<div style="position: relative; width: 100%; padding-bottom: 56.25%; overflow: hidden;">
  <iframe 
    src="https://app.promptreviews.app/demo/multi-business-posting-embed"
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; border-radius: 12px;"
    title="Multi-Location Posting Demo">
  </iframe>
</div>`}
                </pre>
              </div>

              {/* With Custom Styling */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">With Custom Container</h3>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
{`<div style="max-width: 1024px; margin: 0 auto; padding: 20px;">
  <h2 style="text-align: center; margin-bottom: 20px;">
    See How Multi-Location Posting Works
  </h2>
  <iframe 
    src="https://app.promptreviews.app/demo/multi-business-posting-embed"
    width="100%"
    height="700"
    frameborder="0"
    style="border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.15);"
    title="Multi-Location Posting Demo">
  </iframe>
</div>`}
                </pre>
              </div>
            </div>

            {/* Copy Button */}
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => {
                  const code = document.querySelector('pre')?.textContent || '';
                  navigator.clipboard.writeText(code);
                  alert('Embed code copied to clipboard!');
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Copy First Embed Code
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes blink {
          0%, 50% {
            opacity: 1;
          }
          51%, 100% {
            opacity: 0;
          }
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }

        .animate-blink {
          animation: blink 1s infinite;
        }
      `}</style>
    </>
  );
}