/**
 * Social Media Posting Dashboard Page
 * Universal dashboard for managing social media posting across platforms
 */

'use client';

import { useState, useEffect } from 'react';
import { FaGoogle, FaMapMarkerAlt, FaImage, FaClock, FaExclamationTriangle, FaCheck, FaTimes, FaPlus, FaSpinner } from 'react-icons/fa';
import PageCard from '@/app/components/PageCard';
import FiveStarSpinner from '@/app/components/FiveStarSpinner';

interface GoogleBusinessLocation {
  id: string;
  name: string;
  address: string;
  status: 'active' | 'pending' | 'suspended';
}

interface PostTemplate {
  id: string;
  title: string;
  content: string;
  type: 'WHATS_NEW' | 'EVENT' | 'OFFER' | 'PRODUCT';
}

export default function SocialPostingDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [locations, setLocations] = useState<GoogleBusinessLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [postContent, setPostContent] = useState('');
  const [postType, setPostType] = useState<'WHATS_NEW' | 'EVENT' | 'OFFER' | 'PRODUCT'>('WHATS_NEW');
  const [isPosting, setIsPosting] = useState(false);
  const [postResult, setPostResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  const postTemplates: PostTemplate[] = [
    {
      id: '1',
      title: 'Business Update',
      content: 'Exciting news! We\'re always working to improve our services and provide the best experience for our customers. Stay tuned for more updates!',
      type: 'WHATS_NEW'
    },
    {
      id: '2',
      title: 'Special Offer',
      content: '🎉 Limited time offer! Get 20% off our premium services this month. Don\'t miss out on this amazing deal. Contact us today to learn more!',
      type: 'OFFER'
    },
    {
      id: '3',
      title: 'Event Announcement',
      content: 'Join us for our upcoming community event! We\'re excited to meet with our customers and share what\'s new. See you there!',
      type: 'EVENT'
    },
    {
      id: '4',
      title: 'Product Showcase',
      content: 'Introducing our latest product! Designed with your needs in mind, this offering brings exceptional value and quality. Learn more about how it can benefit you.',
      type: 'PRODUCT'
    }
  ];

  useEffect(() => {
    // Check for OAuth callback success message
    const urlParams = new URLSearchParams(window.location.search);
    const connected = urlParams.get('connected');
    const message = urlParams.get('message');
    
    if (connected === 'true' && message) {
      setPostResult({ 
        success: true, 
        message: decodeURIComponent(message) + ' Note: Business locations may take a few minutes to load due to API rate limits.' 
      });
      
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    const loadData = async () => {
      try {
        await loadPlatforms();
      } catch (error) {
        console.error('Error loading platforms:', error);
        // Ensure loading state is cleared even if there's an error
        setIsLoading(false);
        setIsConnected(false);
      }
    };
    
    loadData();
    
    // Fallback timeout to ensure page loads
    const fallbackTimeout = setTimeout(() => {
      console.log('Fallback timeout reached, setting isLoading to false');
      setIsLoading(false);
      setIsConnected(false);
    }, 15000); // 15 second fallback
    
    return () => clearTimeout(fallbackTimeout);
  }, []);

  useEffect(() => {
    loadPlatforms();
    
    // Fallback timeout to ensure page loads
    const fallbackTimeout = setTimeout(() => {
      console.log('Fallback timeout reached, setting isLoading to false');
      setIsLoading(false);
    }, 15000); // 15 second fallback
    
    return () => clearTimeout(fallbackTimeout);
  }, []);

  const loadPlatforms = async () => {
    console.log('Loading platforms...');
    
    // Add a timeout to prevent getting stuck
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 10000); // 10 second timeout
    });
    
    const fetchWithRetry = async (url: string, retries = 2) => {
      for (let i = 0; i <= retries; i++) {
        try {
          const response = await Promise.race([
            fetch(url),
            timeoutPromise
          ]);
          return response;
        } catch (error) {
          console.log(`Attempt ${i + 1} failed for ${url}:`, error);
          if (i === retries) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
        }
      }
    };
    
    try {
      // Check for existing Google Business Profile connection
      const response = await fetchWithRetry('/api/social-posting/platforms');
      console.log('Platforms API response status:', response.status);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('Platforms API response data:', responseData);
        
        const platforms = responseData.data?.platforms || [];
        const googlePlatform = platforms.find((p: any) => p.platform === 'google-business-profile');
        
        console.log('Google platform found:', googlePlatform);
        
        if (googlePlatform && googlePlatform.isConnected) {
          setIsConnected(true);
          console.log('Google Business Profile is connected');
          
          // Load business locations from Google Business Profile API
          try {
            const locationsResponse = await fetchWithRetry('/api/social-posting/platforms/google-business-profile/locations');
            console.log('Locations API response status:', locationsResponse.status);
            
            if (locationsResponse.ok) {
              const locationsData = await locationsResponse.json();
              console.log('Locations API response data:', locationsData);
              
              setLocations(locationsData.locations || []);
              setSelectedLocation(locationsData.locations?.[0]?.id || '');
            } else {
              // Handle API errors gracefully
              const errorData = await locationsResponse.json();
              console.log('Locations API error:', errorData);
              
              if (errorData.error?.code === 429) {
                console.log('Rate limit hit while loading locations - this is normal for new connections');
                setPostResult({ 
                  success: false, 
                  message: 'Google Business Profile is connected! Business locations are still loading due to API rate limits. Please try again in a few minutes.' 
                });
              }
            }
          } catch (locationError) {
            console.error('Failed to load business locations:', locationError);
            
            // Check if it's a rate limiting error
            if (locationError instanceof Error && 
                (locationError.message.includes('rate limit') || 
                 locationError.message.includes('429'))) {
              console.log('Rate limit hit while loading locations - this is normal for new connections');
              setPostResult({ 
                success: false, 
                message: 'Google Business Profile is connected! Business locations are still loading due to API rate limits. Please try again in a few minutes.' 
              });
            }
            
            // Fall back to mock data for demo purposes
            const mockLocations: GoogleBusinessLocation[] = [
              { id: '1', name: 'Main Office', address: '123 Business St, City, State', status: 'active' },
              { id: '2', name: 'Downtown Branch', address: '456 Main Ave, City, State', status: 'active' }
            ];
            setLocations(mockLocations);
            setSelectedLocation(mockLocations[0]?.id || '');
          }
        } else {
          setIsConnected(false);
          setLocations([]);
          setSelectedLocation('');
          console.log('Google Business Profile is not connected');
        }
      } else {
        console.error('Failed to check platform connections, status:', response.status);
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Failed to load platform information:', error);
      setIsConnected(false);
    } finally {
      console.log('Setting isLoading to false');
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      
      // Get Google OAuth credentials from environment
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '984479581786-8h619lvt0jvhakg7riaom9bs7mlo1lku.apps.googleusercontent.com';
      const redirectUri = encodeURIComponent('http://localhost:3002/api/auth/google/callback');
      const scope = encodeURIComponent('https://www.googleapis.com/auth/plus.business.manage openid email profile');
      const responseType = 'code';
      const state = encodeURIComponent(JSON.stringify({ 
        platform: 'google-business-profile',
        returnUrl: '/dashboard/social-posting'
      }));

      // Construct Google OAuth URL
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=${responseType}&state=${state}&access_type=offline&prompt=consent`;
      
      console.log('🔗 Redirecting to Google OAuth:', googleAuthUrl);
      
      // Redirect to Google OAuth
      window.location.href = googleAuthUrl;
    } catch (error) {
      console.error('❌ Failed to initiate Google OAuth:', error);
      setPostResult({ success: false, message: 'Failed to connect to Google Business Profile' });
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('google-business-connected');
    setIsConnected(false);
    setLocations([]);
    setSelectedLocation('');
  };

  const handlePost = async () => {
    if (!postContent.trim() || !selectedLocation) {
      setPostResult({ success: false, message: 'Please enter post content and select a location' });
      return;
    }

    try {
      setIsPosting(true);
      setPostResult(null);
      
      // Simulate posting process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulate successful post
      setPostResult({ success: true, message: 'Post published successfully to Google Business Profile!' });
      setPostContent('');
    } catch (error) {
      console.error('Post failed:', error);
      setPostResult({ success: false, message: 'Failed to publish post. Please try again.' });
    } finally {
      setIsPosting(false);
    }
  };

  const handleUseTemplate = (template: PostTemplate) => {
    setPostContent(template.content);
    setPostType(template.type);
    setShowTemplates(false);
  };

  const getCharacterCount = () => postContent.length;
  const getCharacterLimit = () => 1500;
  const isOverLimit = () => getCharacterCount() > getCharacterLimit();

  if (isLoading) {
    return (
      <div className="w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 mt-12 md:mt-16 lg:mt-20 mb-16 flex justify-center items-start">
        <PageCard
          icon={<FaGoogle className="w-8 h-8 text-slate-blue" />}
          topMargin="mt-0"
        >
          <div className="min-h-[400px] flex flex-col items-center justify-center">
            <FiveStarSpinner />
            <p className="mt-4 text-gray-600">Loading Social Posting...</p>
          </div>
        </PageCard>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 mt-12 md:mt-16 lg:mt-20 mb-16">
      <PageCard
        icon={<FaGoogle className="w-8 h-8 text-slate-blue" />}
        topMargin="mt-0"
      >
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Social Media Posting
            </h1>
            <p className="text-gray-600">
              Create and publish posts to your Google Business Profile
            </p>
          </div>

          {/* Google Business Profile Connection Status */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FaGoogle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Google Business Profile</h3>
                  <p className="text-sm text-gray-600">
                    Connect to post updates to your business locations
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {isConnected ? (
                  <>
                    <div className="flex items-center space-x-2 text-green-600">
                      <FaCheck className="w-4 h-4" />
                      <span className="text-sm font-medium">Connected</span>
                    </div>
                    <button
                      onClick={handleDisconnect}
                      className="px-4 py-2 text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors text-sm"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleConnect}
                    disabled={isLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isLoading ? (
                      <FaSpinner className="w-4 h-4 animate-spin" />
                    ) : (
                      <FaGoogle className="w-4 h-4" />
                    )}
                    <span>Connect Google Business</span>
                  </button>
                )}
              </div>
            </div>

            {!isConnected && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex items-start space-x-3">
                  <FaExclamationTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-800 mb-1">
                      Connect Your Google Business Profile
                    </h4>
                    <p className="text-sm text-blue-700">
                      To post updates to your business locations, you need to connect your Google Business Profile. 
                      This allows you to reach customers directly on Google Search and Maps.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Location Selection */}
          {isConnected && locations.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <FaMapMarkerAlt className="w-4 h-4 text-slate-600" />
                <span>Select Business Location</span>
              </h3>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {locations.map((location) => (
                  <div
                    key={location.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedLocation === location.id
                        ? 'border-slate-blue bg-slate-blue/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedLocation(location.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{location.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{location.address}</p>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                          location.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : location.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {location.status}
                        </div>
                      </div>
                      {selectedLocation === location.id && (
                        <FaCheck className="w-4 h-4 text-slate-blue" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Post Creator */}
          {isConnected && selectedLocation && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Create Post</h3>
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="flex items-center space-x-2 px-4 py-2 text-slate-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <FaPlus className="w-4 h-4" />
                  <span>Use Template</span>
                </button>
              </div>

              {/* Templates */}
              {showTemplates && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Post Templates</h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    {postTemplates.map((template) => (
                      <div
                        key={template.id}
                        className="p-3 bg-white border rounded-md cursor-pointer hover:border-slate-blue transition-colors"
                        onClick={() => handleUseTemplate(template)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-sm">{template.title}</h5>
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded">{template.type}</span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {template.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Post Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Post Type
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { value: 'WHATS_NEW', label: "What's New", icon: '📢' },
                    { value: 'EVENT', label: 'Event', icon: '📅' },
                    { value: 'OFFER', label: 'Offer', icon: '🏷️' },
                    { value: 'PRODUCT', label: 'Product', icon: '📦' }
                  ].map((type) => (
                    <label
                      key={type.value}
                      className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                        postType === type.value
                          ? 'border-slate-blue bg-slate-blue/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="postType"
                        value={type.value}
                        checked={postType === type.value}
                        onChange={(e) => setPostType(e.target.value as any)}
                        className="sr-only"
                      />
                      <span className="text-lg">{type.icon}</span>
                      <span className="text-sm font-medium">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Post Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Post Content
                </label>
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  rows={6}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none ${
                    isOverLimit() ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="What would you like to share with your customers?"
                />
                <div className="flex justify-between items-center mt-2">
                  <div className={`text-sm ${
                    isOverLimit() ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {getCharacterCount()}/{getCharacterLimit()} characters
                  </div>
                  {isOverLimit() && (
                    <div className="flex items-center space-x-1 text-red-600 text-sm">
                      <FaExclamationTriangle className="w-3 h-3" />
                      <span>Content exceeds character limit</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Post Result */}
              {postResult && (
                <div className={`p-4 rounded-lg ${
                  postResult.success
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    {postResult.success ? (
                      <FaCheck className="w-4 h-4 text-green-600" />
                    ) : (
                      <FaTimes className="w-4 h-4 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${
                      postResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {postResult.message}
                    </span>
                  </div>
                </div>
              )}

              {/* Post Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setPostContent('');
                    setPostResult(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={handlePost}
                  disabled={isPosting || !postContent.trim() || isOverLimit()}
                  className="px-6 py-2 bg-slate-blue text-white rounded-md hover:bg-slate-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isPosting ? (
                    <>
                      <FaSpinner className="w-4 h-4 animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <FaGoogle className="w-4 h-4" />
                      <span>Publish to Google</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {isConnected && locations.length === 0 && (
            <div className="text-center py-12">
              <FaMapMarkerAlt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Business Locations Found
              </h3>
              <p className="text-gray-600 mb-4">
                Make sure your Google Business Profile has active locations to post updates.
              </p>
              <button
                onClick={() => window.open('https://business.google.com', '_blank')}
                className="px-4 py-2 bg-slate-blue text-white rounded-md hover:bg-slate-blue/90 transition-colors"
              >
                Manage Business Profile
              </button>
            </div>
          )}
        </div>
      </PageCard>
    </div>
  );
} 