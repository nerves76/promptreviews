/**
 * Social Media Posting Dashboard Page
 * Universal dashboard for managing social media posting across platforms
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/Icon';
import PageCard from '@/app/components/PageCard';
import FiveStarSpinner from '@/app/components/FiveStarSpinner';
import PhotoManagement from '@/app/components/PhotoManagement';
import ReviewManagement from '@/app/components/ReviewManagement';
import BusinessInfoEditor from '@/app/components/BusinessInfoEditor';
import ReviewResponseGenerator from '@/app/components/ReviewResponseGenerator';
import ServiceDescriptionGenerator from '@/app/components/ServiceDescriptionGenerator';
import BusinessDescriptionAnalyzer from '@/app/components/BusinessDescriptionAnalyzer';
import { createClient } from '@/utils/supabaseClient';
// Using built-in alert for notifications instead of react-toastify

interface GoogleBusinessLocation {
  id: string;
  name: string;
  address: string;
  status: 'active' | 'pending' | 'suspended';
}

export default function SocialPostingDashboard() {
  // Loading and connection state
  const [isLoading, setIsLoading] = useState(true);
  
  // Connection state with localStorage persistence
  const [isConnected, setIsConnected] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('google-business-connected');
      return stored === 'true';
    }
    return false;
  });
  
  const [locations, setLocations] = useState<GoogleBusinessLocation[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('google-business-locations');
      try {
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
    return [];
  });
  
  const [selectedLocations, setSelectedLocations] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('google-business-selected-locations');
      try {
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
    return [];
  });
  
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
  const [hasRateLimitError, setHasRateLimitError] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const [fetchingLocations, setFetchingLocations] = useState<string | null>(null);
  const [isPostOAuthConnecting, setIsPostOAuthConnecting] = useState(false);
  const [rateLimitedUntil, setRateLimitedUntil] = useState<number | null>(null);

  // Ref to track image URLs for cleanup
  const imageUrlsRef = useRef<string[]>([]);

  // Update ref whenever imageUrls changes
  useEffect(() => {
    imageUrlsRef.current = imageUrls;
  }, [imageUrls]);

  // Tab state with URL parameter support
  const [activeTab, setActiveTab] = useState<'connect' | 'post' | 'photos' | 'business-info' | 'reviews'>(() => {
    // Initialize from URL parameter if available
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab') as 'connect' | 'post' | 'photos' | 'business-info' | 'reviews';
      if (tabParam && ['connect', 'post', 'photos', 'business-info', 'reviews'].includes(tabParam)) {
        return tabParam;
      }
    }
    return 'connect';
  });

  // Update URL when tab changes
  const changeTab = (newTab: 'connect' | 'post' | 'photos' | 'business-info' | 'reviews') => {
    setActiveTab(newTab);
    
    // Update URL parameter
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', newTab);
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Handle post-OAuth redirects  
  useEffect(() => {
    // Check if we're coming back from OAuth (has 'connected=true' in URL)
    const urlParams = new URLSearchParams(window.location.search);
    const isPostOAuth = urlParams.get('connected') === 'true';
    
    if (isPostOAuth) {
      console.log('🔄 Post-OAuth redirect detected');
      
      // Show success message from OAuth
      const message = urlParams.get('message');
      if (message) {
        setPostResult({ success: true, message: decodeURIComponent(message) });
      }
      
      // Clean up URL parameters
      window.history.replaceState({}, '', window.location.pathname);
    }
    
    // Load platforms on page load with simplified logic
    loadPlatforms();
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

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem('google-business-connected', isConnected.toString());
  }, [isConnected]);

  useEffect(() => {
    localStorage.setItem('google-business-locations', JSON.stringify(locations));
  }, [locations]);

  useEffect(() => {
    localStorage.setItem('google-business-selected-locations', JSON.stringify(selectedLocations));
  }, [selectedLocations]);

  // Clean up image URLs on unmount
  useEffect(() => {
    return () => {
      // imageUrlsRef.current.forEach(url => URL.revokeObjectURL(url)); // This ref was removed
    };
  }, []); // Empty dependency array means this runs only on unmount

  // Load platforms when component mounts
  useEffect(() => {
    // Don't load platforms if we have rate limit errors or are handling OAuth
    if (hasRateLimitError || rateLimitCountdown > 0) { // Removed hasHandledOAuth
      console.log('⏸️ Skipping platform load - rate limit or OAuth handling active');
      setIsLoading(false); // Ensure loading state is cleared
      return;
    }
    
    // Only load platforms if we haven't loaded them yet and we're not already loading
    // if (!hasLoadedPlatforms && !isLoading) { // This state was removed
      console.log('🔄 Loading platforms...');
      setIsLoading(true);
      // loadPlatforms(); // This function was removed
    // }
  }, [hasRateLimitError, rateLimitCountdown]); // Removed hasLoadedPlatforms

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

  // Simplified platform loading - no API validation calls
  const loadPlatforms = async () => {
    console.log('Loading platforms (database check only)...');
    
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
        setIsLoading(false);
        return;
      }

      // Check platforms API for database state only (no token validation calls)
      console.log('🔍 Fetching platforms (database only)...');
      const response = await fetch('/api/social-posting/platforms');
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
        setIsLoading(false);
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
          if (transformedLocations.length > 0 && selectedLocations.length === 0) {
            setSelectedLocations([transformedLocations[0].id]); // Select first location by default
          }
        } else {
          setIsConnected(false);
          setLocations([]);
          setSelectedLocations([]);
          console.log('Google Business Profile is not connected');
          
          // Show error message if available
          if (googlePlatform?.error) {
            setPostResult({ 
              success: false, 
              message: googlePlatform.error 
            });
          }
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
      console.error('Failed to load platforms:', error);
      setIsConnected(false);
      setLocations([]);
      setSelectedLocations([]);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      setPostResult({ 
        success: false, 
        message: 'Failed to load Google Business Profile connection. Please refresh the page or try reconnecting.' 
      });
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
      const redirectUriRaw = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;
      
      // Validate required environment variables
      if (!redirectUriRaw) {
        console.error('❌ Missing environment variable: NEXT_PUBLIC_GOOGLE_REDIRECT_URI');
        setPostResult({ success: false, message: 'Missing Google OAuth configuration. Please check environment variables.' });
        setIsLoading(false);
        return;
      }
      
      const redirectUri = encodeURIComponent(redirectUriRaw);
      const scope = encodeURIComponent('https://www.googleapis.com/auth/plus.business.manage openid email profile');
      const responseType = 'code';
      const state = encodeURIComponent(JSON.stringify({ 
        platform: 'google-business-profile',
        returnUrl: '/dashboard/google-business'
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
    localStorage.removeItem('google-business-locations');
    localStorage.removeItem('google-business-selected-locations');
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

    // setFetchingLocations(platformId); // This state was removed
    
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
      // await loadPlatforms(); // This function was removed
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
      // setFetchingLocations(null); // This state was removed
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

      console.log(`�� Added ${imageFiles.length} image(s). Total: ${newImages.length}`);
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

    const uploadPromises = images.map(async (image, index) => {
      try {
        const fileName = `post-image-${Date.now()}-${index}-${image.name}`;
        const { data, error } = await createClient()
          .storage
          .from('post-images')
          .upload(fileName, image);

        if (error) {
          console.error('Error uploading image:', error);
          throw error;
        }

        // Get public URL
        const { data: urlData } = createClient()
          .storage
          .from('post-images')
          .getPublicUrl(fileName);

        return urlData.publicUrl;
      } catch (error) {
        console.error('Failed to upload image:', error);
        throw error;
      }
    });

    try {
      const uploadedUrls = await Promise.all(uploadPromises);
      return uploadedUrls;
    } catch (error) {
      console.error('Some images failed to upload:', error);
      throw new Error('Failed to upload one or more images');
    }
  };

  if (isLoading || isPostOAuthConnecting) {
    return (
      <div className="w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 mt-12 md:mt-16 lg:mt-20 mb-16 flex justify-center items-start">
        <PageCard
          icon={<Icon name="FaGoogle" className="w-8 h-8 text-slate-blue" size={32} />}
          topMargin="mt-0"
        >
          <div className="min-h-[400px] flex flex-col items-center justify-center">
            <FiveStarSpinner />
            <p className="mt-4 text-gray-600">
              {isPostOAuthConnecting ? 'Connecting to Google Business Profile...' : 'Loading Social Posting...'}
            </p>
          </div>
        </PageCard>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 mt-12 md:mt-16 lg:mt-20 mb-16">
      <PageCard
        icon={<Icon name="FaGoogle" className="w-8 h-8 text-slate-blue" size={32} />}
        topMargin="mt-0"
      >
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="text-left">
              <h1 className="text-3xl font-bold text-slate-blue mb-2">
                Google Business Profiles
              </h1>
              <p className="text-gray-600">
                Optimize your Google Business Profiles with Prompty power! Update regularly for best results.
              </p>
            </div>
            {/* Full Editor Button */}
            <a
              href="https://business.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-blue border border-slate-blue rounded-md hover:bg-slate-blue hover:text-white transition-colors"
            >
              <Icon name="FaGoogle" className="w-4 h-4" size={16} />
              <span>Full Editor</span>
            </a>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => changeTab('connect')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'connect'
                    ? 'border-slate-blue text-slate-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Icon name="FaGoogle" className="w-4 h-4" />
                  <span>Connect Platforms</span>
                </div>
              </button>
              <button
                onClick={() => changeTab('post')}
                disabled={!isConnected}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'post' && isConnected
                    ? 'border-slate-blue text-slate-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center space-x-2">
                  <Icon name="FaPlus" className="w-4 h-4" size={16} />
                  <span>Create Posts</span>
                </div>
              </button>
              <button
                onClick={() => changeTab('photos')}
                disabled={!isConnected}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'photos' && isConnected
                    ? 'border-slate-blue text-slate-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center space-x-2">
                  <Icon name="FaImage" className="w-4 h-4" size={16} />
                  <span>Photos</span>
                </div>
              </button>
              <button
                onClick={() => changeTab('business-info')}
                disabled={!isConnected}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'business-info' && isConnected
                    ? 'border-slate-blue text-slate-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center space-x-2">
                  <Icon name="FaStore" className="w-4 h-4" size={16} />
                  <span>Business Info</span>
                </div>
              </button>
              <button
                onClick={() => changeTab('reviews')}
                disabled={!isConnected}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reviews' && isConnected
                    ? 'border-slate-blue text-slate-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center space-x-2">
                  <Icon name="FaStar" className="w-4 h-4" size={16} />
                  <span>Reviews Management</span>
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
                      <Icon name="FaGoogle" className="w-6 h-6 text-blue-600" />
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
                          <Icon name="FaCheck" className="w-4 h-4" />
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
                        className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 text-sm"
                      >
                        {isLoading ? (
                          <>
                            <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
                            <span>Connecting...</span>
                          </>
                        ) : (
                          <>
                            <Icon name="FaGoogle" className="w-4 h-4" />
                            <span>Connect Google Business</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>



                {/* {isConnected && locations.length === 0 && ( // This state was removed
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <div className="flex items-start space-x-3">
                      <Icon name="FaExclamationTriangle" className="w-5 h-5 text-yellow-600 mt-0.5" />
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
                )} */}

                {/* Connection Success & Locations */}
                {/* {isConnected && locations.length > 0 && ( // This state was removed
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <div className="flex items-start space-x-3">
                      <Icon name="FaCheck" className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-green-800 mb-1">
                          Successfully Connected!
                        </h4>
                        <p className="text-sm text-green-700 mb-3">
                          Found {locations.length} business location{locations.length !== 1 ? 's' : ''}. You can now create and publish posts.
                        </p>
                        <button
                          onClick={() => changeTab('post')}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          Start Creating Posts →
                        </button>
                      </div>
                    </div>
                  </div>
                )} */}
              </div>

              {/* Error Messages */}
              {postResult && !postResult.success && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex items-center space-x-2 text-red-800 mb-2">
                    <Icon name="FaExclamationTriangle" className="w-4 h-4" />
                    <span className="text-sm font-medium">Error</span>
                  </div>
                  <p className="text-sm text-red-700">{postResult.message}</p>
                  {rateLimitCountdown > 0 && (
                    <div className="mt-2 flex items-center space-x-2 text-sm text-red-600">
                      <Icon name="FaClock" className="w-3 h-3" />
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
                  <Icon name="FaGoogle" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Google Business Profile</h3>
                  <p className="text-gray-600 mb-4">
                    Connect your Google Business Profile to start posting updates to your business locations.
                  </p>
                  <button
                    onClick={handleConnect}
                    disabled={isLoading}
                    className="px-6 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 mx-auto"
                  >
                    {isLoading ? (
                      <>
                        <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
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
              ) : (
                <div className="space-y-6">
                  {/* Location Selection */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4">Select Locations</h3>
                    
                    {locations.length === 0 ? (
                      <div className="text-center py-8">
                        <Icon name="FaMapMarkerAlt" className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 mb-4">No business locations found</p>
                        <button
                          onClick={() => handleFetchLocations('google-business-profile')}
                          disabled={!!fetchingLocations || (rateLimitedUntil ? Date.now() < rateLimitedUntil : false)}
                          className="px-4 py-2 bg-slate-blue text-white rounded-md hover:bg-slate-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
                        >
                          {fetchingLocations ? (
                            <>
                              <Icon name="FaSpinner" className="w-4 h-4 animate-spin mr-2" />
                              Fetching Locations...
                            </>
                          ) : rateLimitedUntil && Date.now() < rateLimitedUntil ? (
                            `Rate Limited (${Math.ceil((rateLimitedUntil - Date.now()) / 1000)}s)`
                          ) : (
                            'Fetch Business Locations'
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="location-dropdown relative">
                        <button
                          onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                          className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:ring-2 focus:ring-slate-blue focus:border-slate-blue"
                        >
                          <div className="flex items-center space-x-2">
                            <Icon name="FaMapMarkerAlt" className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700">
                              {selectedLocations.length === 0 
                                ? 'Select business locations' 
                                : selectedLocations.length === 1 
                                  ? locations.find(l => l.id === selectedLocations[0])?.name || 'Selected location'
                                  : `${selectedLocations.length} locations selected`
                              }
                            </span>
                          </div>
                          {isLocationDropdownOpen ? (
                            <Icon name="FaChevronUp" className="w-4 h-4 text-gray-500" />
                          ) : (
                            <Icon name="FaChevronDown" className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                        
                        {isLocationDropdownOpen && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                            {locations.map((location) => (
                              <label
                                key={location.id}
                                className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedLocations.includes(location.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedLocations([...selectedLocations, location.id]);
                                    } else {
                                      setSelectedLocations(selectedLocations.filter(id => id !== location.id));
                                    }
                                  }}
                                  className="w-4 h-4 text-slate-blue border-gray-300 rounded focus:ring-slate-blue"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 truncate">{location.name}</div>
                                  {location.address && (
                                    <div className="text-sm text-gray-500 truncate">{location.address}</div>
                                  )}
                                </div>
                                <div className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                                  location.status === 'active' ? 'bg-green-100 text-green-800' :
                                  location.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {location.status}
                                </div>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Post Creation Form */}
                  {locations.length > 0 && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Create Post</h3>
                      </div>

                      {/* Post Type Selection */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Post Type</label>
                        <select
                          value={postType}
                          onChange={(e) => setPostType(e.target.value as any)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-slate-blue focus:border-slate-blue"
                        >
                          <option value="WHATS_NEW">What's New</option>
                          <option value="EVENT">Event</option>
                          <option value="OFFER">Offer</option>
                          <option value="PRODUCT">Product</option>
                        </select>
                      </div>

                      {/* Post Content */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Post Content</label>
                        <textarea
                          value={postContent}
                          onChange={(e) => setPostContent(e.target.value)}
                          placeholder="What would you like to share with your customers?"
                          rows={4}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-slate-blue focus:border-slate-blue resize-none"
                        />
                        <div className="flex justify-between items-center mt-2">
                          <div className="text-xs text-gray-500">
                            {postContent.length}/1500 characters
                          </div>
                          <button
                            onClick={handleImproveWithAI}
                            disabled={improvingWithAI || !postContent.trim()}
                            className="px-3 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
                          >
                            {improvingWithAI ? (
                              <>
                                <Icon name="FaSpinner" className="w-3 h-3 animate-spin" />
                                <span>Improving...</span>
                              </>
                            ) : (
                              <>
                                <Icon name="FaBolt" className="w-3 h-3" />
                                <span>AI Improve</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Image Upload */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Photos (Optional)</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-slate-blue transition-colors">
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                            className="hidden"
                            id="image-upload"
                            disabled={uploadingImages}
                          />
                          <label htmlFor="image-upload" className="cursor-pointer">
                            <Icon name="FaImage" className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">
                              {uploadingImages ? 'Processing images...' : 'Click to upload photos or drag and drop'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              PNG, JPG up to 10MB each (max 10 photos)
                            </p>
                          </label>
                        </div>

                        {/* Image Previews */}
                        {imageUrls.length > 0 && (
                          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                            {imageUrls.map((url, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={url}
                                  alt={`Preview ${index + 1}`}
                                  className="w-full h-24 object-cover rounded-md border border-gray-200"
                                />
                                <button
                                  onClick={() => removeImage(index)}
                                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Icon name="FaTimes" className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Call-to-Action */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <label className="block text-sm font-medium text-gray-700">Call-to-Action Button</label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={showCTA}
                              onChange={(e) => setShowCTA(e.target.checked)}
                              className="w-4 h-4 text-slate-blue border-gray-300 rounded focus:ring-slate-blue"
                            />
                            <span className="text-sm text-gray-600">Add CTA button</span>
                          </label>
                        </div>

                        {showCTA && (
                          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Button Type</label>
                              <select
                                value={ctaType}
                                onChange={(e) => setCTAType(e.target.value as any)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-slate-blue focus:border-slate-blue"
                              >
                                <option value="LEARN_MORE">Learn More</option>
                                <option value="CALL">Call</option>
                                <option value="ORDER_ONLINE">Order Online</option>
                                <option value="BOOK">Book</option>
                                <option value="SIGN_UP">Sign Up</option>
                                <option value="BUY">Buy</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {ctaType === 'CALL' ? 'Phone Number' : 'URL'}
                              </label>
                              <input
                                type={ctaType === 'CALL' ? 'tel' : 'url'}
                                value={ctaUrl}
                                onChange={(e) => setCTAUrl(e.target.value)}
                                placeholder={ctaType === 'CALL' ? 'tel:+1234567890' : 'https://example.com'}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-slate-blue focus:border-slate-blue"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <button
                          onClick={clearAllFormData}
                          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          Clear All
                        </button>
                        <button
                          onClick={handlePost}
                          disabled={isPosting || !postContent.trim() || selectedLocations.length === 0}
                          className="px-6 py-2 bg-slate-blue text-white rounded-md hover:bg-slate-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                        >
                          {isPosting ? (
                            <>
                              <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
                              <span>Publishing...</span>
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
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="space-y-6">
              {!isConnected ? (
                <div className="text-center py-12">
                  <Icon name="FaImage" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Google Business Profile</h3>
                  <p className="text-gray-600 mb-4">
                    Connect your Google Business Profile to manage photos for your business locations.
                  </p>
                  <button
                    onClick={handleConnect}
                    disabled={isLoading}
                    className="px-6 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 mx-auto"
                  >
                    {isLoading ? (
                      <>
                        <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
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
              ) : (
                <PhotoManagement 
                  locations={locations}
                  isConnected={isConnected}
                />
              )}
            </div>
          )}

          {/* Business Information Tab */}
          {activeTab === 'business-info' && (
            <div className="space-y-6">
              <BusinessInfoEditor 
                locations={locations}
                isConnected={isConnected}
              />
            </div>
          )}

          {/* Reviews Management Tab */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              {!isConnected ? (
                <div className="text-center py-12">
                  <Icon name="FaStar" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Google Business Profile</h3>
                  <p className="text-gray-600 mb-4">
                    Connect your Google Business Profile to manage reviews for your business locations.
                  </p>
                  <button
                    onClick={handleConnect}
                    disabled={isLoading}
                    className="px-6 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 mx-auto"
                  >
                    {isLoading ? (
                      <>
                        <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
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
              ) : (
                <ReviewManagement 
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