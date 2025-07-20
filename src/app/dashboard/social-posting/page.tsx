/**
 * Social Media Posting Dashboard Page
 * Universal dashboard for managing social media posting across platforms
 */

'use client';

import { useState, useEffect } from 'react';
import { FaGoogle, FaMapMarkerAlt, FaImage, FaClock, FaExclamationTriangle, FaCheck, FaTimes, FaPlus, FaSpinner, FaRedo } from 'react-icons/fa';
import PageCard from '@/app/components/PageCard';
import FiveStarSpinner from '@/app/components/FiveStarSpinner';
import { createClient } from '@/utils/supabaseClient';
// Using built-in alert for notifications instead of react-toastify

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
  const [hasHandledOAuth, setHasHandledOAuth] = useState(false);
  const [hasLoadedPlatforms, setHasLoadedPlatforms] = useState(false);
  const [hasRateLimitError, setHasRateLimitError] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [fetchingLocations, setFetchingLocations] = useState<string | null>(null);
  const [rateLimitedUntil, setRateLimitedUntil] = useState<number | null>(null);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'connect' | 'post'>('connect');

  // Handle post-OAuth redirects
  useEffect(() => {
    // Check if we're coming back from OAuth (has 'connected=true' in URL)
    const urlParams = new URLSearchParams(window.location.search);
    const isPostOAuth = urlParams.get('connected') === 'true';
    
    if (isPostOAuth) {
      console.log('🔄 Post-OAuth redirect detected - adding extended delay for session stability');
      setIsLoading(false);
      setHasHandledOAuth(true); // Mark that we've handled OAuth
      
      // Show success message from OAuth
      const message = urlParams.get('message');
      if (message) {
        setPostResult({ success: true, message: decodeURIComponent(message) });
      }
      
      // Clean up URL parameters
      window.history.replaceState({}, '', window.location.pathname);
      
      // Add a longer delay to allow session to fully stabilize after OAuth redirect
      setTimeout(() => {
        console.log('🔄 Session should be fully stable now, allowing platform loading');
        setHasLoadedPlatforms(false); // Allow platform loading
        setHasHandledOAuth(false); // Reset OAuth handling flag
      }, 4000); // Increased to 4 seconds for better stability
    } else {
      // Normal page load - start with loading false and let the other useEffect handle it
      setIsLoading(false);
    }
  }, []);

  // Auto-switch to post tab when connected and has locations
  useEffect(() => {
    if (isConnected && locations.length > 0 && activeTab === 'connect') {
      // Wait a moment for UI updates, then switch tabs
      setTimeout(() => {
        setActiveTab('post');
      }, 1000);
    }
  }, [isConnected, locations.length, activeTab]);


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
    // Don't load platforms if we have rate limit errors or are handling OAuth
    if (hasRateLimitError || rateLimitCountdown > 0 || hasHandledOAuth) {
      console.log('⏸️ Skipping platform load - rate limit or OAuth handling active');
      setIsLoading(false); // Ensure loading state is cleared
      return;
    }
    
    // Only load platforms if we haven't loaded them yet and we're not already loading
    if (!hasLoadedPlatforms && !isLoading) {
      console.log('🔄 Loading platforms...');
      setIsLoading(true);
      loadPlatforms();
    }
  }, [hasLoadedPlatforms, hasRateLimitError, rateLimitCountdown, hasHandledOAuth]);

  // Handle rate limit countdown
  useEffect(() => {
    if (rateLimitCountdown > 0) {
      const timer = setTimeout(() => {
        setRateLimitCountdown(rateLimitCountdown - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (rateLimitCountdown === 0 && hasRateLimitError) {
      // Countdown finished, allow retry
      setHasRateLimitError(false);
    }
  }, [rateLimitCountdown, hasRateLimitError]);

  // Handle rate limit for fetch locations button
  useEffect(() => {
    if (rateLimitedUntil && Date.now() < rateLimitedUntil) {
      const checkInterval = setInterval(() => {
        if (Date.now() >= rateLimitedUntil) {
          setRateLimitedUntil(null);
        }
      }, 1000); // Check every second
      
      return () => clearInterval(checkInterval);
    }
  }, [rateLimitedUntil]);

  const loadPlatforms = async () => {
    console.log('Loading platforms...');
    
    try {
      // Get the current session token for authentication
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.log('No session token available');
        setIsConnected(false);
        setLocations([]);
        setSelectedLocation('');
        setPostResult({ 
          success: false, 
          message: 'Please refresh the page to sign in again.' 
        });
        return;
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      };
      
      // Check for existing Google Business Profile connection
      console.log('🔍 Fetching platforms with auth header...');
      const response = await fetch('/api/social-posting/platforms', { headers });
      console.log('Platforms API response status:', response.status);
      
      if (response.status === 401) {
        console.log('Authentication error - session may have expired');
        setIsConnected(false);
        setLocations([]);
        setSelectedLocation('');
        setPostResult({ 
          success: false, 
          message: 'Please refresh the page or sign in again to access Google Business Profile features.' 
        });
        return;
      }
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('Platforms API response data:', responseData);
        
        const platforms = responseData.platforms || [];
        const googlePlatform = platforms.find((p: any) => p.id === 'google-business-profile');
        
        console.log('Google platform found:', googlePlatform);
        
        if (googlePlatform && googlePlatform.connected) {
          setIsConnected(true);
          console.log('Google Business Profile is connected');
          
          // Load business locations from the platforms response
          const locations = googlePlatform.locations || [];
          console.log('Locations from platforms API:', locations);
          
          // Transform locations to match expected format
          const transformedLocations = locations.map((loc: any) => ({
            id: loc.location_id || loc.id,
            name: loc.location_name || loc.name,
            address: loc.address || '',
            status: 'active' // Default status since we don't have this info
          }));
          
          setLocations(transformedLocations);
          setSelectedLocation(transformedLocations[0]?.id || '');
        } else {
          setIsConnected(false);
          setLocations([]);
          setSelectedLocation('');
          console.log('Google Business Profile is not connected');
        }
      } else {
        console.error('Failed to check platform connections, status:', response.status);
        const errorData = await response.text();
        console.error('Error response:', errorData);
        setIsConnected(false);
        setPostResult({ 
          success: false, 
          message: `Unable to load social posting platforms (status: ${response.status}). Please try refreshing the page.` 
        });
      }
    } catch (error) {
      console.error('Failed to load platform information:', error);
      setIsConnected(false);
      setPostResult({ 
        success: false, 
        message: 'Failed to load social posting features. Please check your internet connection and try again.' 
      });
    } finally {
      console.log('Setting isLoading to false');
      setIsLoading(false);
      setHasLoadedPlatforms(true); // Mark as loaded to prevent retry loops
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

  const handleFetchLocations = async (platformId: string) => {
    if (rateLimitedUntil && Date.now() < rateLimitedUntil) {
      const remainingTime = Math.ceil((rateLimitedUntil - Date.now()) / 1000);
      alert(`Rate limited. Please wait ${remainingTime} more seconds.`);
      return;
    }

    // Warn user about the wait time
    const confirmed = confirm(
      'Fetching business locations requires multiple API calls to Google Business Profile. ' +
      'Due to Google\'s strict rate limits (1 request per minute per Google Cloud project), this process will take at least 1-2 minutes. ' +
      'The system will automatically wait between API calls to avoid rate limit errors. ' +
      'Please keep this tab open and wait for completion. Continue?'
    );
    
    if (!confirmed) return;

    setFetchingLocations(platformId);
    
    try {
      // Increase timeout to 5 minutes to account for rate limiting delays
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000); // 5 minutes
      
      const response = await fetch(`/api/social-posting/platforms/${platformId}/fetch-locations`, {
        method: 'POST',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (response.status === 429) {
        const result = await response.json();
        const retryAfter = result.retryAfter || 60; // Default to 60 seconds
        const cooldownTime = Date.now() + (retryAfter * 1000);
        setRateLimitedUntil(cooldownTime);
        
        alert(`Google Business Profile API rate limit exceeded. ${result.message || 'Please wait before trying again.'}`);
        return;
      }

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to fetch locations: ${errorData}`);
      }

      const result = await response.json();
      console.log(`✅ Fetched ${result.locations?.length || 0} business locations`);
      
      // Show success message with demo mode indicator
      const demoNote = result.isDemoMode ? ' (Demo Mode - Using test data due to Google rate limits)' : '';
      alert(`Successfully fetched ${result.locations?.length || 0} business locations!${demoNote}`);
      
      // Refresh platforms to show new locations
      await loadPlatforms();
    } catch (error) {
      console.error('Error fetching locations:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        alert('Request timed out. The process may still be running in the background. Please wait a few minutes and refresh the page to check if locations were fetched.');
             } else if (error instanceof Error && error.message.includes('rate limit')) {
        // Rate limited - set a 2 minute cooldown
        const cooldownTime = Date.now() + (120 * 1000); // 2 minutes
        setRateLimitedUntil(cooldownTime);
        alert('Google Business Profile API quota exhausted. Please wait 2 minutes before trying again, or request higher quota limits in Google Cloud Console.');
      } else {
        alert('Failed to fetch business locations. Please try again.');
      }
    } finally {
      setFetchingLocations(null);
    }
  };

  const handlePost = async () => {
    if (!postContent.trim() || !selectedLocation) {
      setPostResult({ success: false, message: 'Please enter post content and select a location' });
      return;
    }

    try {
      setIsPosting(true);
      setPostResult(null);
      
      // Create the post data with proper structure
      const postData = {
        content: postContent,
        platforms: ['google-business-profile'],
        type: postType,
        metadata: {
          locationId: selectedLocation // This is crucial for posting to work!
        }
      };
      
      console.log('📝 Posting to Google Business Profile:', postData);
      
      // Make actual API call to post
      const response = await fetch('/api/social-posting/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      const result = await response.json();
      console.log('📊 Post response:', result);

      if (result.success) {
        const gbpResult = result.data?.publishResults?.['google-business-profile'];
        const demoNote = result.data?.isDemoMode ? ' (Demo Mode)' : '';
        setPostResult({ 
          success: true, 
          message: (gbpResult?.message || 'Post published successfully to Google Business Profile!') + demoNote
        });
        setPostContent(''); // Clear content on success
      } else {
        // Handle specific error types
        const gbpResult = result.data?.publishResults?.['google-business-profile'];
        if (gbpResult?.isRateLimit) {
          setPostResult({ 
            success: false, 
            message: 'Google Business Profile rate limit exceeded. Please try again in a few minutes.' 
          });
        } else {
          setPostResult({ 
            success: false, 
            message: gbpResult?.error || result.error || 'Failed to publish post. Please try again.' 
          });
        }
      }
    } catch (error) {
      console.error('Post failed:', error);
      setPostResult({ success: false, message: 'Failed to publish post. Please check your connection and try again.' });
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
              Connect and publish posts to your Google Business Profile
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('connect')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'connect'
                    ? 'border-slate-blue text-slate-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FaGoogle className="w-4 h-4" />
                  <span>Connect Platforms</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('post')}
                disabled={!isConnected}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'post' && isConnected
                    ? 'border-slate-blue text-slate-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center space-x-2">
                  <FaPlus className="w-4 h-4" />
                  <span>Create Posts</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'connect' && (
            <div className="space-y-6">
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

                {isConnected && locations.length === 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <div className="flex items-start space-x-3">
                      <FaExclamationTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-yellow-800 mb-1">
                          Fetch Your Business Locations
                        </h4>
                        <p className="text-sm text-yellow-700 mb-3">
                          Your Google Business Profile is connected! Now you need to fetch your business locations to start posting.
                        </p>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleFetchLocations('google-business-profile')}
                            disabled={fetchingLocations === 'google-business-profile' || Boolean(rateLimitedUntil && Date.now() < rateLimitedUntil)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              fetchingLocations === 'google-business-profile' || Boolean(rateLimitedUntil && Date.now() < rateLimitedUntil)
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-slate-600 text-white hover:bg-slate-700'
                            }`}
                          >
                            {fetchingLocations === 'google-business-profile' ? (
                              <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Fetching (1-2 min)...</span>
                              </div>
                            ) : Boolean(rateLimitedUntil && Date.now() < rateLimitedUntil) ? (
                              `Rate limited (${rateLimitedUntil ? Math.ceil((rateLimitedUntil - Date.now()) / 1000) : 0}s)`
                            ) : (
                              'Fetch Business Locations'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Connection Success & Locations */}
                {isConnected && locations.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <div className="flex items-start space-x-3">
                      <FaCheck className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-green-800 mb-1">
                          Successfully Connected!
                        </h4>
                        <p className="text-sm text-green-700 mb-3">
                          Found {locations.length} business location{locations.length !== 1 ? 's' : ''}. You can now create and publish posts.
                        </p>
                        <button
                          onClick={() => setActiveTab('post')}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          Start Creating Posts →
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Error Messages */}
              {postResult && !postResult.success && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex items-center space-x-2 text-red-800 mb-2">
                    <FaExclamationTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">Error</span>
                  </div>
                  <p className="text-sm text-red-700">{postResult.message}</p>
                  {rateLimitCountdown > 0 && (
                    <div className="mt-2 flex items-center space-x-2 text-sm text-red-600">
                      <FaClock className="w-3 h-3" />
                      <span>You can retry in {rateLimitCountdown} seconds</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'post' && (
            <div className="space-y-6">
              {!isConnected ? (
                <div className="text-center py-12">
                  <FaGoogle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Connect Google Business Profile First
                  </h3>
                  <p className="text-gray-600 mb-4">
                    You need to connect your Google Business Profile before you can create posts.
                  </p>
                  <button
                    onClick={() => setActiveTab('connect')}
                    className="px-4 py-2 bg-slate-blue text-white rounded-md hover:bg-slate-blue/90 transition-colors"
                  >
                    Go to Connect Tab
                  </button>
                </div>
              ) : (
                <>
                  {/* Location Selection */}
                  {locations.length > 0 && (
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
                  {selectedLocation && (
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
                  {locations.length === 0 && isConnected && (
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
                </>
              )}
            </div>
          )}
        </div>
      </PageCard>
    </div>
  );
} 