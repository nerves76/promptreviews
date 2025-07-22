/**
 * Social Media Posting Dashboard Page
 * Universal dashboard for managing social media posting across platforms
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { FaGoogle, FaMapMarkerAlt, FaImage, FaClock, FaExclamationTriangle, FaCheck, FaTimes, FaPlus, FaSpinner, FaRedo, FaChevronDown, FaChevronUp, FaTrash, FaUpload } from 'react-icons/fa';
import PageCard from '@/app/components/PageCard';
import FiveStarSpinner from '@/app/components/FiveStarSpinner';
import PhotoManagement from '@/app/components/PhotoManagement';
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
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postType, setPostType] = useState<'WHATS_NEW' | 'EVENT' | 'OFFER' | 'PRODUCT'>('WHATS_NEW');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [showCTA, setShowCTA] = useState(false);
  const [ctaType, setCTAType] = useState<'LEARN_MORE' | 'CALL' | 'ORDER_ONLINE' | 'BOOK' | 'SIGN_UP' | 'BUY'>('LEARN_MORE');
  const [ctaUrl, setCTAUrl] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [postResult, setPostResult] = useState<{ success: boolean; message: string } | null>(null);
  const [improvingWithAI, setImprovingWithAI] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [hasHandledOAuth, setHasHandledOAuth] = useState(false);
  const [hasLoadedPlatforms, setHasLoadedPlatforms] = useState(false);
  const [hasRateLimitError, setHasRateLimitError] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [fetchingLocations, setFetchingLocations] = useState<string | null>(null);
  const [rateLimitedUntil, setRateLimitedUntil] = useState<number | null>(null);
  
  // Ref to track image URLs for cleanup
  const imageUrlsRef = useRef<string[]>([]);

  // Update ref whenever imageUrls changes
  useEffect(() => {
    imageUrlsRef.current = imageUrls;
  }, [imageUrls]);

  // Tab state
  const [activeTab, setActiveTab] = useState<'connect' | 'post' | 'photos'>('connect');

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

  // Add effect to close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isLocationDropdownOpen && !target.closest('.location-dropdown')) {
        setIsLocationDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isLocationDropdownOpen]);

  // Cleanup image URLs on unmount
  useEffect(() => {
    return () => {
      imageUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []); // Empty dependency array means this runs only on unmount

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

  // Load platforms when component mounts
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
        setSelectedLocations([]);
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
        setSelectedLocations([]);
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
            name: loc.location_name || loc.name || (loc.location_id || loc.id)?.replace('locations/', '') || 'Unknown Location',
            address: loc.address || '',
            status: 'active' // Default status since we don't have this info
          }));
          
          setLocations(transformedLocations);
          setSelectedLocations([transformedLocations[0]?.id].filter(Boolean)); // Select first location by default
        } else {
          setIsConnected(false);
          setLocations([]);
          setSelectedLocations([]);
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
    setSelectedLocations([]);
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
    if (!postContent.trim() || selectedLocations.length === 0) {
      setPostResult({ success: false, message: 'Please enter post content and select at least one location' });
      return;
    }

    // Validate CTA if enabled
    if (showCTA && !ctaUrl.trim()) {
      setPostResult({ success: false, message: 'Please provide a URL for your Call-to-Action button' });
      return;
    }

    if (showCTA && ctaUrl && !isValidUrl(ctaUrl)) {
      setPostResult({ success: false, message: 'Please provide a valid URL for your Call-to-Action button' });
      return;
    }

    try {
      setIsPosting(true);
      setPostResult(null);
      
      console.log(`📝 Posting to ${selectedLocations.length} Google Business Profile location(s)...`);
      
      // Upload images to Supabase storage
      const uploadedImageUrls = await uploadImagesToStorage(selectedImages);

      // Post to each selected location individually
      const postPromises = selectedLocations.map(async (locationId) => {
        const postData = {
          content: postContent,
          platforms: ['google-business-profile'],
          type: postType,
          mediaUrls: uploadedImageUrls, // Include uploaded image URLs for the adapter
          callToAction: showCTA && ctaUrl ? {
            actionType: ctaType,
            url: ctaUrl
          } : undefined,
          metadata: {
            locationId: locationId
          }
        };
        
        console.log(`📝 Posting to location: ${locationId}`);
        
        const response = await fetch('/api/social-posting/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData),
        });

        const result = await response.json();
        const location = locations.find(loc => loc.id === locationId);
        
        return {
          locationId,
          locationName: location?.name || locationId,
          success: result.success,
          result: result
        };
      });

      const postResults = await Promise.all(postPromises);
      console.log('📊 All post responses:', postResults);

      const successfulPosts = postResults.filter(r => r.success);
      const failedPosts = postResults.filter(r => !r.success);

      if (successfulPosts.length === selectedLocations.length) {
        // All posts succeeded
        setPostResult({ 
          success: true, 
          message: `Successfully published to all ${selectedLocations.length} location${selectedLocations.length !== 1 ? 's' : ''}!`
        });
        setPostContent(''); // Clear content on success
        clearAllImages(); // Clear uploaded images on success
        setShowCTA(false); // Clear CTA on success
        setCTAType('LEARN_MORE');
        setCTAUrl('');
      } else if (successfulPosts.length > 0) {
        // Some posts succeeded, some failed
        setPostResult({ 
          success: true, 
          message: `Published to ${successfulPosts.length} of ${selectedLocations.length} locations. ${failedPosts.length} location${failedPosts.length !== 1 ? 's' : ''} failed: ${failedPosts.map(f => f.locationName).join(', ')}`
        });
      } else {
        // All posts failed
        const firstError = failedPosts[0]?.result?.data?.publishResults?.['google-business-profile']?.error || 
                          failedPosts[0]?.result?.error || 
                          'All posts failed';
        setPostResult({ 
          success: false, 
          message: `Failed to publish to any locations. Error: ${firstError}`
        });
      }
    } catch (error) {
      console.error('Post failed:', error);
      setPostResult({ success: false, message: 'Failed to publish posts. Please check your connection and try again.' });
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

  // URL validation helper
  const isValidUrl = (url: string): boolean => {
    try {
      // Allow tel: links for CALL CTA
      if (ctaType === 'CALL' && url.startsWith('tel:')) {
        return url.length > 4; // Must have something after 'tel:'
      }
      // Standard URL validation for other CTA types
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Clear all form data
  const clearAllFormData = () => {
    setPostContent('');
    setPostResult(null);
    clearAllImages();
    setShowCTA(false);
    setCTAType('LEARN_MORE');
    setCTAUrl('');
  };

  // Improve post with AI
  const handleImproveWithAI = async () => {
    if (!postContent.trim()) {
      setPostResult({ success: false, message: 'Please enter some post content to improve' });
      return;
    }

    if (selectedLocations.length === 0) {
      setPostResult({ success: false, message: 'Please select at least one location to get business context' });
      return;
    }

    setImprovingWithAI(true);
    setPostResult(null);

    try {
      // Get selected location names for context
      const selectedLocationNames = selectedLocations.map(locationId => {
        const location = locations.find(l => l.id === locationId);
        return location?.name || 'Unknown Location';
      });

      const requestData = {
        currentContent: postContent,
        businessLocations: selectedLocationNames,
        ctaType: showCTA ? ctaType : null,
        ctaUrl: showCTA ? ctaUrl : null,
        imageCount: selectedImages.length
      };

      const response = await fetch('/api/social-posting/improve-with-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`Failed to improve post: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setPostContent(result.improvedContent);
        setPostResult({ 
          success: true, 
          message: 'Post improved with AI! Check the enhanced content above.' 
        });
      } else {
        setPostResult({ success: false, message: result.message || 'Failed to improve post' });
      }
    } catch (error) {
      console.error('Error improving post with AI:', error);
      setPostResult({ 
        success: false, 
        message: 'Failed to improve post. Please try again.' 
      });
    } finally {
      setImprovingWithAI(false);
    }
  };

  // Image upload functions
  const handleImageUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;

    const imageFiles = Array.from(files).filter(file => {
      const isImage = file.type.startsWith('image/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      if (!isImage) {
        setPostResult({ success: false, message: 'Please select only image files.' });
        return false;
      }
      if (!isValidSize) {
        setPostResult({ success: false, message: 'Images must be smaller than 10MB.' });
        return false;
      }
      return true;
    });

    if (selectedImages.length + imageFiles.length > 10) {
      setPostResult({ success: false, message: 'Maximum 10 images allowed per post.' });
      return;
    }

    setUploadingImages(true);
    setPostResult(null);

    try {
      // Create a copy of existing images and add new ones
      const newImages = [...selectedImages, ...imageFiles];
      setSelectedImages(newImages);

      // Create preview URLs for new images
      const newImageUrls = imageFiles.map(file => URL.createObjectURL(file));
      setImageUrls(prev => [...prev, ...newImageUrls]);

      console.log(`📷 Added ${imageFiles.length} image(s). Total: ${newImages.length}`);
    } catch (error) {
      console.error('Image upload error:', error);
      setPostResult({ success: false, message: 'Failed to process images. Please try again.' });
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    // Revoke the object URL to free memory
    URL.revokeObjectURL(imageUrls[index]);
    
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllImages = () => {
    // Revoke all object URLs
    imageUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    setSelectedImages([]);
    setImageUrls([]);
  };

  // Upload images to Supabase storage
  const uploadImagesToStorage = async (images: File[]): Promise<string[]> => {
    if (images.length === 0) return [];

    try {
      const uploadPromises = images.map(async (image, index) => {
        const formData = new FormData();
        formData.append('file', image);
        formData.append('folder', 'social-posts');

        const response = await fetch('/api/social-posting/upload-image', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload image ${index + 1}`);
        }

        const result = await response.json();
        return result.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      console.log(`📷 Successfully uploaded ${uploadedUrls.length} images`);
      return uploadedUrls;
    } catch (error) {
      console.error('Failed to upload images:', error);
      throw error;
    }
  };

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
              <button
                onClick={() => setActiveTab('photos')}
                disabled={!isConnected}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'photos' && isConnected
                    ? 'border-slate-blue text-slate-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center space-x-2">
                  <FaImage className="w-4 h-4" />
                  <span>Photo Management</span>
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
                        <span>Select Business Locations</span>
                      </h3>
                      
                      {/* Multi-Select Dropdown */}
                      <div className="relative location-dropdown">
                        <button
                          onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                          className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                        >
                          <div className="flex items-center space-x-2">
                            <FaMapMarkerAlt className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700">
                              {selectedLocations.length === 0 
                                ? 'Select locations to post to...'
                                : selectedLocations.length === locations.length
                                ? `All locations selected (${locations.length})`
                                : `${selectedLocations.length} location${selectedLocations.length !== 1 ? 's' : ''} selected`
                              }
                            </span>
                          </div>
                          {isLocationDropdownOpen ? (
                            <FaChevronUp className="w-4 h-4 text-gray-500" />
                          ) : (
                            <FaChevronDown className="w-4 h-4 text-gray-500" />
                          )}
                        </button>

                        {isLocationDropdownOpen && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
                            {/* Select All / Deselect All */}
                            <div className="sticky top-0 bg-gray-50 border-b border-gray-200 p-3">
                              <button
                                onClick={() => {
                                  if (selectedLocations.length === locations.length) {
                                    setSelectedLocations([]);
                                  } else {
                                    setSelectedLocations(locations.map(loc => loc.id));
                                  }
                                }}
                                className="flex items-center space-x-2 text-sm font-medium text-slate-600 hover:text-slate-800"
                              >
                                <div className={`w-4 h-4 border border-gray-300 rounded ${
                                  selectedLocations.length === locations.length 
                                    ? 'bg-slate-blue border-slate-blue' 
                                    : selectedLocations.length > 0 
                                    ? 'bg-gray-300 border-gray-300' 
                                    : 'bg-white'
                                } flex items-center justify-center`}>
                                  {selectedLocations.length === locations.length && (
                                    <FaCheck className="w-2.5 h-2.5 text-white" />
                                  )}
                                  {selectedLocations.length > 0 && selectedLocations.length < locations.length && (
                                    <div className="w-2 h-0.5 bg-gray-600"></div>
                                  )}
                                </div>
                                <span>
                                  {selectedLocations.length === locations.length 
                                    ? 'Deselect All' 
                                    : 'Select All'}
                                </span>
                              </button>
                            </div>

                            {/* Location List */}
                            <div className="max-h-64 overflow-y-auto">
                              {locations.map((location) => (
                                <div
                                  key={location.id}
                                  className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                  onClick={() => {
                                    setSelectedLocations(prev => {
                                      if (prev.includes(location.id)) {
                                        return prev.filter(id => id !== location.id);
                                      } else {
                                        return [...prev, location.id];
                                      }
                                    });
                                  }}
                                >
                                  <div className={`w-4 h-4 border border-gray-300 rounded ${
                                    selectedLocations.includes(location.id) 
                                      ? 'bg-slate-blue border-slate-blue' 
                                      : 'bg-white'
                                  } flex items-center justify-center flex-shrink-0`}>
                                    {selectedLocations.includes(location.id) && (
                                      <FaCheck className="w-2.5 h-2.5 text-white" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-gray-900 truncate">{location.name}</h4>
                                    {location.address && (
                                      <p className="text-sm text-gray-600 truncate">{location.address}</p>
                                    )}
                                  </div>
                                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                                    location.status === 'active'
                                      ? 'bg-green-100 text-green-800'
                                      : location.status === 'pending'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {location.status}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Selected Locations Summary */}
                      {selectedLocations.length > 0 && (
                        <div className="bg-slate-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-slate-800">
                              Selected Locations ({selectedLocations.length})
                            </h4>
                            <button
                              onClick={() => setSelectedLocations([])}
                              className="text-xs text-slate-600 hover:text-slate-800"
                            >
                              Clear All
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {selectedLocations.slice(0, 5).map(locationId => {
                              const location = locations.find(loc => loc.id === locationId);
                              return location ? (
                                <span
                                  key={locationId}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-slate-200 text-slate-800"
                                >
                                  {location.name}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedLocations(prev => prev.filter(id => id !== locationId));
                                    }}
                                    className="ml-1 hover:text-slate-600"
                                  >
                                    <FaTimes className="w-2 h-2" />
                                  </button>
                                </span>
                              ) : null;
                            })}
                            {selectedLocations.length > 5 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-200 text-gray-600">
                                +{selectedLocations.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Post Creator */}
                  {selectedLocations.length > 0 && (
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

                        {/* Improve with AI Button */}
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={handleImproveWithAI}
                            disabled={improvingWithAI || !postContent.trim() || selectedLocations.length === 0}
                            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 text-sm"
                            title={
                              !postContent.trim() ? 'Enter post content first' :
                              selectedLocations.length === 0 ? 'Select business locations first' :
                              'Improve your post with AI using business profile and location data'
                            }
                          >
                            {improvingWithAI ? (
                              <>
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Improving...</span>
                              </>
                            ) : (
                              <>
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                <span>Improve with AI</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Character Count */}
                        <div className="flex justify-between items-center text-sm mt-2">
                          <span className={`${isOverLimit() ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                            {getCharacterCount()} / {getCharacterLimit()} characters
                          </span>
                          {isOverLimit() && (
                            <span className="text-red-600 text-xs">Over limit! Please shorten your post.</span>
                          )}
                        </div>

                        {/* AI Improvement Info */}
                        <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                          <div className="flex items-start space-x-2">
                            <svg className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            <div>
                              <h4 className="text-sm font-medium text-purple-900">AI Post Optimization</h4>
                              <p className="text-xs text-purple-700 mt-1">
                                Click "Improve with AI" to automatically enhance your post with local SEO keywords, 
                                better engagement tactics, and optimized formatting using your business profile information.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Image Upload */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Add Images (Max 10, 10MB each)
                          {process.env.NODE_ENV === 'development' && (
                            <span className="block text-xs text-orange-600 font-normal mt-1">
                              Note: Images are not included in Google Business Profile posts during local development.
                            </span>
                          )}
                        </label>
                        <div className="flex flex-wrap items-center gap-2 p-2 border border-gray-300 rounded-md bg-gray-50">
                          {selectedImages.map((image, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={imageUrls[index]}
                                alt={`Preview ${index + 1}`}
                                className="w-16 h-16 object-cover rounded-md"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-0 right-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove image"
                              >
                                <FaTrash className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-16 h-16 border border-dashed border-gray-300 rounded-md cursor-pointer hover:border-gray-400 focus-within:ring-2 focus-within:ring-slate-blue focus-within:border-transparent">
                            <input
                              type="file"
                              id="image-upload"
                              accept="image/*"
                              multiple
                              onChange={(e) => {
                                if (e.target.files) {
                                  handleImageUpload(e.target.files);
                                }
                              }}
                              className="hidden"
                            />
                            <FaUpload className="w-4 h-4 text-gray-500" />
                            <p className="text-xs text-gray-600 text-center">Add</p>
                          </label>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <div className="text-sm text-gray-600">
                            {selectedImages.length}/10 images
                          </div>
                          {selectedImages.length > 0 && (
                            <button
                              type="button"
                              onClick={clearAllImages}
                              className="text-sm text-red-600 hover:text-red-800"
                            >
                              Clear All
                            </button>
                          )}
                        </div>
                        {uploadingImages && (
                          <div className="flex items-center justify-center text-sm text-gray-600 mt-2">
                            <FaSpinner className="w-4 h-4 animate-spin mr-2" />
                            Uploading images...
                          </div>
                        )}
                      </div>

                        {/* CTA Section */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Add Call-to-Action (CTA)</h4>
                          <p className="text-xs text-gray-600 mb-3">
                            CTA buttons help drive engagement by giving customers a clear next step, like visiting your website or making a call.
                          </p>
                          <div className="flex items-center space-x-2 mb-3">
                            <input
                              type="checkbox"
                              id="showCTA"
                              checked={showCTA}
                              onChange={(e) => setShowCTA(e.target.checked)}
                              className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-gray-300 rounded"
                            />
                            <label htmlFor="showCTA" className="text-sm text-gray-700">
                              Add a call-to-action button to your post
                            </label>
                          </div>
                          {showCTA && (
                            <>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    CTA Type
                                  </label>
                                  <select
                                    value={ctaType}
                                    onChange={(e) => setCTAType(e.target.value as any)}
                                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                                  >
                                    <option value="LEARN_MORE">Learn More</option>
                                    <option value="CALL">Call</option>
                                    <option value="ORDER_ONLINE">Order Online</option>
                                    <option value="BOOK">Book Now</option>
                                    <option value="SIGN_UP">Sign Up</option>
                                    <option value="BUY">Buy</option>
                                  </select>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {ctaType === 'LEARN_MORE' && 'Link to your website or landing page'}
                                    {ctaType === 'CALL' && 'Use tel: link (e.g., tel:+15551234567)'}
                                    {ctaType === 'ORDER_ONLINE' && 'Link to your online ordering system'}
                                    {ctaType === 'BOOK' && 'Link to your booking/appointment page'}
                                    {ctaType === 'SIGN_UP' && 'Link to registration or signup form'}
                                    {ctaType === 'BUY' && 'Link to your online store or product page'}
                                  </p>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    CTA URL
                                  </label>
                                  <input
                                    type="url"
                                    value={ctaUrl}
                                    onChange={(e) => setCTAUrl(e.target.value)}
                                    placeholder={
                                      ctaType === 'CALL' ? 'tel:+15551234567' :
                                      ctaType === 'ORDER_ONLINE' ? 'https://order.example.com' :
                                      ctaType === 'BOOK' ? 'https://book.example.com' :
                                      ctaType === 'BUY' ? 'https://shop.example.com' :
                                      'https://example.com'
                                    }
                                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent ${
                                      ctaUrl && !isValidUrl(ctaUrl) ? 'border-red-300' : ''
                                    }`}
                                  />
                                  {ctaUrl && !isValidUrl(ctaUrl) && (
                                    <p className="text-xs text-red-600 mt-1">Please enter a valid URL</p>
                                  )}
                                </div>
                              </div>
                              
                              {/* CTA Preview */}
                              {ctaUrl && isValidUrl(ctaUrl) && (
                                <div className="bg-white rounded-md p-3 border border-gray-200">
                                  <p className="text-xs text-gray-600 mb-2">Preview:</p>
                                  <div className="flex items-center space-x-2">
                                    <button 
                                      type="button"
                                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors cursor-default"
                                    >
                                      {ctaType.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                                    </button>
                                    <span className="text-xs text-gray-500">→ {ctaUrl}</span>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
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

                      {/* Action Buttons */}
                      <div className="flex justify-between items-center space-x-3">
                        <button
                          onClick={clearAllFormData}
                          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Clear All
                        </button>
                        <button
                          onClick={handlePost}
                          disabled={isPosting || !postContent.trim() || selectedLocations.length === 0 || uploadingImages}
                          className="px-6 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                        >
                          {isPosting ? (
                            <>
                              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>Publishing...</span>
                            </>
                          ) : (
                            <span>Publish Post</span>
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

          {activeTab === 'photos' && (
            <div className="space-y-6">
              {!isConnected ? (
                <div className="text-center py-12">
                  <FaImage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Connect Google Business Profile First
                  </h3>
                  <p className="text-gray-600 mb-4">
                    You need to connect your Google Business Profile before you can manage photos.
                  </p>
                  <button
                    onClick={() => setActiveTab('connect')}
                    className="px-4 py-2 bg-slate-blue text-white rounded-md hover:bg-slate-blue/90 transition-colors"
                  >
                    Go to Connect Tab
                  </button>
                </div>
              ) : (
                <PhotoManagement 
                  locations={locations}
                  isConnected={isConnected}
                />
              )}
            </div>
          )}
        </div>
      </PageCard>
    </div>
  );
} 