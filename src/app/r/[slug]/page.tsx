"use client";

import { useEffect, useState, useRef, useLayoutEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import SocialMediaIcons from '@/app/components/SocialMediaIcons';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Card } from '@/app/components/ui/card';
import { FaStar, FaGoogle, FaFacebook, FaYelp, FaTripadvisor, FaRegStar, FaQuestionCircle, FaPenFancy, FaHeart, FaBookmark, FaHome, FaEnvelope, FaStar as FaFavorites, FaCalendarAlt, FaBell, FaThumbsUp, FaLink, FaImage, FaCamera } from 'react-icons/fa';
import { IconType } from 'react-icons';
import ReviewSubmissionForm from '@/components/ReviewSubmissionForm';
import { useReviewer } from '@/contexts/ReviewerContext';
import { getUserOrMock } from '@/utils/supabase';

interface StyleSettings {
  name: string;
  logo_url: string | null;
  primary_font: string;
  secondary_font: string;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  facebook_url: string | null;
  instagram_url: string | null;
  bluesky_url: string | null;
  tiktok_url: string | null;
  youtube_url: string | null;
  linkedin_url: string | null;
  pinterest_url: string | null;
  background_type: string;
  gradient_start: string;
  gradient_middle: string;
  gradient_end: string;
}

interface ReviewPlatform {
  id: string;
  name: string;
  url: string;
  customInstructions?: string;
}

interface BusinessProfile {
  name: string;
  logo_url: string | null;
  primary_font: string;
  secondary_font: string;
  header_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  facebook_url: string | null;
  instagram_url: string | null;
  bluesky_url: string | null;
  tiktok_url: string | null;
  youtube_url: string | null;
  linkedin_url: string | null;
  pinterest_url: string | null;
  background_type: 'solid' | 'gradient';
  gradient_start: string;
  gradient_middle: string;
  gradient_end: string;
  business_name: string;
  review_platforms: ReviewPlatform[];
  default_offer_enabled?: boolean;
  default_offer_title?: string;
  default_offer_body?: string;
  business_website?: string;
  default_offer_url?: string;
}

// Helper to get platform icon based on URL or platform name
function getPlatformIcon(url: string, platform: string): { icon: IconType, label: string } {
  const lowerUrl = url?.toLowerCase() || '';
  const lowerPlatform = (platform || '').toLowerCase();
  if (lowerUrl.includes('google') || lowerPlatform.includes('google')) return { icon: FaGoogle, label: 'Google' };
  if (lowerUrl.includes('facebook') || lowerPlatform.includes('facebook')) return { icon: FaFacebook, label: 'Facebook' };
  if (lowerUrl.includes('yelp') || lowerPlatform.includes('yelp')) return { icon: FaYelp, label: 'Yelp' };
  if (lowerUrl.includes('tripadvisor') || lowerPlatform.includes('tripadvisor')) return { icon: FaTripadvisor, label: 'TripAdvisor' };
  return { icon: FaRegStar, label: 'Other' };
}

// Helper to split full name into first and last
function splitName(fullName: string) {
  if (!fullName) return { first: '', last: '' };
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

async function sendAnalyticsEvent(event: Record<string, any>) {
  try {
    await fetch('/api/track-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
  } catch (e) {
    // Optionally log error
  }
}

export default function PromptPage() {
  const router = useRouter();
  const params = useParams();
  const [promptPage, setPromptPage] = useState<any>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [platformReviewTexts, setPlatformReviewTexts] = useState<string[]>([]);
  const [aiRewriteCounts, setAiRewriteCounts] = useState<number[]>([]);
  const [aiLoading, setAiLoading] = useState<number | null>(null);
  const [showRewardsBanner, setShowRewardsBanner] = useState(true);
  const [showPersonalNote, setShowPersonalNote] = useState(true);
  const [openInstructionsIdx, setOpenInstructionsIdx] = useState<number | null>(null);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [availableFeatures, setAvailableFeatures] = useState({
    share: false,
    notifications: false,
    clipboard: false,
    bookmarks: false
  });
  const saveMenuRef = useRef<HTMLDivElement>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<number | null>(null);
  const [reviewerNames, setReviewerNames] = useState<string[]>(() => promptPage?.review_platforms?.map(() => '') || []);
  const [reviewerRoles, setReviewerRoles] = useState<string[]>(() => promptPage?.review_platforms?.map(() => '') || []);
  const [canShowPersonalNote, setCanShowPersonalNote] = useState(false);
  const [showStarRain, setShowStarRain] = useState(true);
  const [fallingIcon, setFallingIcon] = useState('star');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [testimonial, setTestimonial] = useState('');
  const [photoSubmitting, setPhotoSubmitting] = useState(false);
  const [photoSuccess, setPhotoSuccess] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [aiLoadingPhoto, setAiLoadingPhoto] = useState(false);
  const [photoReviewerName, setPhotoReviewerName] = useState('');
  const [photoReviewerRole, setPhotoReviewerRole] = useState('');
  const [showSentimentModal, setShowSentimentModal] = useState(false);
  const [sentiment, setSentiment] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [sentimentComplete, setSentimentComplete] = useState(false);
  const [feedbackFirstName, setFeedbackFirstName] = useState('');
  const [feedbackLastName, setFeedbackLastName] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackPhone, setFeedbackPhone] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const slug = params.slug as string;
      
      try {
        const { data: promptData, error: promptError } = await supabase
          .from('prompt_pages')
          .select('*')
          .eq('slug', slug)
          .single();

        if (promptError) {
          console.error('PromptPage Supabase error:', promptError);
          throw promptError;
        }
        setPromptPage(promptData);

        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('*')
          .eq('account_id', promptData.account_id)
          .single();

        if (businessError) {
          console.error('BusinessProfile Supabase error:', businessError);
          throw businessError;
        }
        console.log('Business data from Supabase:', businessData);
        setBusinessProfile({
          ...businessData,
          business_name: businessData.name,
          review_platforms: [],
          business_website: businessData.business_website,
          default_offer_url: businessData.default_offer_url
        });
        console.log('Set business profile with website:', businessData.business_website);
      } catch (err) {
        console.error('PromptPage fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load page');
      } finally {
        setLoading(false);
      }
    };

    if (params.slug) fetchData();
  }, [params.slug, supabase]);

  useEffect(() => {
    if (promptPage && Array.isArray(promptPage.review_platforms)) {
      setPlatformReviewTexts(promptPage.review_platforms.map((p: any) => p.reviewText || ''));
      setAiRewriteCounts(promptPage.review_platforms.map(() => 0));
      setReviewerNames(promptPage.review_platforms.map(() => promptPage.first_name || ''));
      setReviewerRoles(promptPage.review_platforms.map(() => promptPage.role || ''));
    }
  }, [promptPage]);

  // Track page view (exclude logged-in users)
  useEffect(() => {
    async function trackView() {
      const { data: { user } } = await getUserOrMock(supabase);
      if (!user && promptPage?.id) {
        sendAnalyticsEvent({
          promptPageId: promptPage.id,
          eventType: 'view',
          platform: 'web',
        });
      }
    }
    trackView();
  }, [promptPage, supabase]);

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await getUserOrMock(supabase);
      setCurrentUser(user);
    }
    fetchUser();
  }, [supabase]);

  const handleReviewTextChange = (idx: number, value: string) => {
    setPlatformReviewTexts(prev => prev.map((text, i) => i === idx ? value : text));
  };

  const handleCopyAndSubmit = async (idx: number, url: string) => {
    setSubmitError(null);
    if (!reviewerNames[idx].trim()) {
      setSubmitError('Please enter your name.');
      setIsSubmitting(null);
      return;
    }
    const { first: first_name, last: last_name } = splitName(reviewerNames[idx]);
    setIsSubmitting(idx);
    try {
      const reviewGroupId = (localStorage.getItem('reviewGroupId') || (() => { const id = crypto.randomUUID(); localStorage.setItem('reviewGroupId', id); return id; })());
      const { data: { user } } = await getUserOrMock(supabase);
      if (!user) {
        // Check for existing review from this group for this prompt page
        const { data: existingReviews, error: checkError } = await supabase
          .from('review_submissions')
          .select('id')
          .eq('prompt_page_id', promptPage.id)
          .eq('review_group_id', reviewGroupId);
        if (checkError) {
          setSubmitError('Error checking for existing review. Please try again.');
          setIsSubmitting(null);
          return;
        }
        if (existingReviews && existingReviews.length > 0) {
          // Overwrite (update) the existing review
          const reviewId = existingReviews[0].id;
          const { error: updateError } = await supabase
            .from('review_submissions')
            .update({
              first_name,
              last_name,
              reviewer_name: reviewerNames[idx].trim(),
              reviewer_role: reviewerRoles[idx] ? reviewerRoles[idx].trim() : null,
              review_content: platformReviewTexts[idx] || '',
              emoji_sentiment_selection: sentiment,
              user_agent: navigator.userAgent,
              // ...any other fields you want to update
            })
            .eq('id', reviewId);
          if (updateError) throw updateError;
        } else {
          // Insert new review
          const { error: submissionError } = await supabase
            .from('review_submissions')
            .insert({
              prompt_page_id: promptPage.id,
              platform: promptPage.review_platforms[idx].platform || promptPage.review_platforms[idx].name,
              status: 'submitted',
              first_name,
              last_name,
              reviewer_name: reviewerNames[idx].trim(),
              reviewer_role: reviewerRoles[idx] ? reviewerRoles[idx].trim() : null,
              review_content: platformReviewTexts[idx] || '',
              emoji_sentiment_selection: sentiment,
              review_group_id: reviewGroupId,
              user_agent: navigator.userAgent,
              ip_address: null
            });
          if (submissionError) throw submissionError;
        }
      }
      // Always proceed to copy and open the review platform, regardless of insert/update
      if (platformReviewTexts[idx]) {
        navigator.clipboard.writeText(platformReviewTexts[idx]);
      }
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
      // Track copy_submit event (exclude logged-in users)
      if (!currentUser && promptPage?.id && promptPage.review_platforms?.[idx]) {
        sendAnalyticsEvent({
          promptPageId: promptPage.id,
          eventType: 'copy_submit',
          platform: promptPage.review_platforms[idx].platform || promptPage.review_platforms[idx].name || '',
        });
      }
    } catch (err) {
      setSubmitError('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleRewriteWithAI = async (idx: number) => {
    if (!promptPage || !businessProfile) return;
    setAiLoading(idx);
    try {
      const platform = promptPage.review_platforms[idx];
      const prompt = `Generate a positive review for ${businessProfile.business_name} on ${platform.platform || platform.name}. The review should be authentic, specific, and highlight the business's strengths.`;
      const response = await fetch('/api/generate-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      if (!response.ok) throw new Error('Failed to generate review');
      const { text } = await response.json();
      setPlatformReviewTexts(prev => prev.map((t, i) => i === idx ? text : t));
      setAiRewriteCounts(prev => prev.map((c, i) => i === idx ? c + 1 : c));
      if (!currentUser && promptPage?.id && promptPage.review_platforms?.[idx]) {
        sendAnalyticsEvent({
          promptPageId: promptPage.id,
          eventType: 'generate_with_ai',
          platform: promptPage.review_platforms[idx].platform || promptPage.review_platforms[idx].name || '',
        });
      }
    } catch (err) {
      // Optionally show error
    } finally {
      setAiLoading(null);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (saveMenuRef.current && !saveMenuRef.current.contains(event.target as Node)) {
        setShowSaveMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveOption = (option: string) => {
    switch (option) {
      case 'reading-list':
        // Add to browser's reading list
        if ('share' in navigator) {
          navigator.share({
            title: `Review ${businessProfile?.business_name}`,
            url: window.location.href
          });
        }
        break;
      case 'home-screen':
        // Show instructions for adding to home screen
        alert('To add to home screen:\n1. Open in Safari\n2. Tap the share icon\n3. Select "Add to Home Screen"');
        break;
      case 'email':
        // Open email client
        window.location.href = `mailto:?subject=Review ${businessProfile?.business_name}&body=Here's the review page: ${window.location.href}`;
        break;
      case 'pocket':
        // Open Pocket save dialog
        window.open(`https://getpocket.com/save?url=${encodeURIComponent(window.location.href)}`);
        break;
      case 'instapaper':
        // Open Instapaper save dialog
        window.open(`https://www.instapaper.com/add?url=${encodeURIComponent(window.location.href)}`);
        break;
      case 'calendar':
        // Create calendar event
        const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Review ${encodeURIComponent(businessProfile?.business_name || '')}&details=Review page: ${encodeURIComponent(window.location.href)}`;
        window.open(calendarUrl);
        break;
      case 'reminder':
        // Request notification permission and set reminder
        if ('Notification' in window) {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              // Set reminder for 1 hour from now
              const reminderTime = new Date(Date.now() + 60 * 60 * 1000);
              const reminder = new Notification('Review Reminder', {
                body: `Time to leave a review for ${businessProfile?.business_name}`,
                icon: '/favicon.ico'
              });
              // Store reminder in localStorage
              const reminders = JSON.parse(localStorage.getItem('reviewReminders') || '[]');
              reminders.push({
                businessName: businessProfile?.business_name,
                url: window.location.href,
                time: reminderTime.toISOString()
              });
              localStorage.setItem('reviewReminders', JSON.stringify(reminders));
              alert('Reminder set for 1 hour from now!');
            }
          });
        } else {
          alert('Your browser does not support notifications');
        }
        break;
      case 'copy-link':
        // Copy link to clipboard
        navigator.clipboard.writeText(window.location.href).then(() => {
          alert('Link copied to clipboard!');
        });
        break;
      case 'favorites':
        // Add to browser favorites
        if ('bookmarks' in window) {
          (window as any).bookmarks.create({
            title: `Review ${businessProfile?.business_name}`,
            url: window.location.href
          });
        } else {
          alert('Please use your browser\'s bookmark feature to save this page');
        }
        break;
    }
    setShowSaveMenu(false);
  };

  // Check for available features
  useEffect(() => {
    const features = {
      share: 'share' in navigator,
      notifications: 'Notification' in window,
      clipboard: 'clipboard' in navigator,
      bookmarks: 'bookmarks' in window
    };
    setAvailableFeatures(features);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setCanShowPersonalNote(true), 700);
    return () => clearTimeout(timer);
  }, []);

  const handlePhotoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  }, []);

  const handlePhotoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhotoSubmitting(true);
    setPhotoError(null);
    try {
      if (!photoFile) {
        setPhotoError('Please select or take a photo.');
        setPhotoSubmitting(false);
        return;
      }
      if (!testimonial.trim()) {
        setPhotoError('Please enter a testimonial.');
        setPhotoSubmitting(false);
        return;
      }
      // Upload photo to API route
      const formData = new FormData();
      formData.append('file', photoFile);
      formData.append('promptPageId', promptPage.id);
      const uploadRes = await fetch('/api/upload-photo', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Failed to upload photo');
      const photoUrl = uploadData.url;
      // Save testimonial + photo URL to review_submissions
      const reviewGroupId = (localStorage.getItem('reviewGroupId') || (() => { const id = crypto.randomUUID(); localStorage.setItem('reviewGroupId', id); return id; })());
      const { first: first_name, last: last_name } = splitName(photoReviewerName);
      const { error: submissionError } = await supabase
        .from('review_submissions')
        .insert({
          prompt_page_id: promptPage.id,
          platform: 'photo',
          status: 'submitted',
          first_name,
          last_name,
          reviewer_name: photoReviewerName,
          reviewer_role: photoReviewerRole ? photoReviewerRole.trim() : null,
          review_content: testimonial,
          emoji_sentiment_selection: sentiment,
          review_group_id: reviewGroupId,
          user_agent: navigator.userAgent,
          ip_address: null,
          photo_url: photoUrl,
        });
      if (submissionError) throw submissionError;
      // Update the prompt page status to 'complete'
      await supabase
        .from('prompt_pages')
        .update({ status: 'complete' })
        .eq('id', promptPage.id);
      setPhotoSuccess(true);
      setPhotoFile(null);
      setPhotoPreview(null);
      setTestimonial('');
      setPhotoReviewerName('');
      setPhotoReviewerRole('');
    } catch (err: any) {
      setPhotoError(err.message || 'Failed to submit.');
    } finally {
      setPhotoSubmitting(false);
    }
  };

  const handleGeneratePhotoTestimonial = async () => {
    if (!promptPage || !businessProfile) return;
    setAiLoadingPhoto(true);
    try {
      const prompt = `Generate a positive testimonial for ${businessProfile.business_name}. The testimonial should be authentic, specific, and highlight the business's strengths.`;
      const response = await fetch('/api/generate-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      if (!response.ok) throw new Error('Failed to generate testimonial');
      const { text } = await response.json();
      setTestimonial(text);
    } catch (err) {
      // Optionally show error
    } finally {
      setAiLoadingPhoto(false);
    }
  };

  // Show modal on load if enabled
  useEffect(() => {
    console.log('PromptPage.emoji_sentiment_enabled:', promptPage?.emoji_sentiment_enabled, 'PromptPage.emoji_sentiment_question:', promptPage?.emoji_sentiment_question);
    debugger;
    if (promptPage?.emoji_sentiment_enabled) setShowSentimentModal(true);
  }, [promptPage]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: businessProfile?.background_color || '#FFFFFF' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: businessProfile?.header_color || '#4F46E5' }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" style={{ backgroundColor: businessProfile?.background_color || '#FFFFFF' }}>
        <div className="text-red-600" style={{ color: businessProfile?.text_color || '#1F2937' }}>{error}</div>
      </div>
    );
  }

  if (!promptPage || !businessProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" style={{ backgroundColor: businessProfile?.background_color || '#FFFFFF' }}>
        <div style={{ color: businessProfile?.text_color || '#1F2937' }}>Page not found.</div>
      </div>
    );
  }

  // Only compute these after promptPage and businessProfile are loaded
  const showOffer = promptPage?.offer_enabled ?? businessProfile?.default_offer_enabled;
  const offerTitle = promptPage?.offer_title || businessProfile?.default_offer_title || 'Review Rewards';
  const offerBody = promptPage?.offer_body || businessProfile?.default_offer_body || '';
  const offerLearnMoreUrl = promptPage?.default_offer_url || businessProfile?.default_offer_url || '';

  // Review Rewards Banner logic
  const showBanner = showRewardsBanner && promptPage.offer_enabled && promptPage.offer_title && promptPage.offer_body;

  // Compute background style
  const backgroundStyle = businessProfile?.background_type === 'gradient'
    ? {
        background: `linear-gradient(to bottom right, ${businessProfile.gradient_start}, ${businessProfile.gradient_middle}, ${businessProfile.gradient_end})`,
        color: businessProfile?.text_color || '#1F2937',
      }
    : {
        backgroundColor: businessProfile?.background_color || '#FFFFFF',
        color: businessProfile?.text_color || '#1F2937',
      };
  return (
    <>
      <div className="min-h-screen" style={backgroundStyle}>
        {/* Falling Animation */}
        {promptPage?.falling_icon && showStarRain && (
          (!promptPage?.emoji_sentiment_enabled && sentiment === null) ||
          (sentimentComplete && ['delighted','satisfied'].includes(sentiment||''))
        ) && (
          <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
            {[...Array(36)].map((_, i) => {
              const left = Math.random() * 100;
              const duration = 2 + Math.random() * 1.5;
              const delay = Math.random() * 0.5;
              const size = 18 + Math.random() * 18;
              let IconComp;
              if (promptPage.falling_icon === 'star') IconComp = <FaStar className="absolute" style={{ color: '#facc15' }} />;
              else if (promptPage.falling_icon === 'heart') IconComp = <FaHeart className="absolute" style={{ color: '#ef4444' }} />;
              else if (promptPage.falling_icon === 'rainbow') IconComp = <span className="absolute text-2xl" role="img" aria-label="rainbow">🌈</span>;
              else if (promptPage.falling_icon === 'thumb') IconComp = <FaThumbsUp className="absolute" style={{ color: '#3b82f6' }} />;
              else IconComp = <FaStar className="absolute" style={{ color: '#facc15' }} />;
              return (
                <span
                  key={i}
                  className="absolute drop-shadow-lg animate-star-fall"
                  style={{
                    left: `${left}%`,
                    top: '-40px',
                    fontSize: `${size}px`,
                    animationDuration: `${duration}s`,
                    animationDelay: `${delay}s`,
                  }}
                >
                  {IconComp}
                </span>
              );
            })}
          </div>
        )}
        {/* Save for Later Button */}
        <div 
          className={`fixed right-4 z-50 transition-all duration-300 ${showBanner ? 'top-16' : 'top-4'}`} 
          ref={saveMenuRef}
        >
          <button
            onClick={() => setShowSaveMenu(!showSaveMenu)}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
            style={{ color: businessProfile?.header_color || '#4F46E5' }}
          >
            <FaHeart className="w-5 h-5" />
            <span>Save for Later</span>
          </button>
          
          {showSaveMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 animate-fadein">
              <button
                onClick={() => handleSaveOption('calendar')}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                style={{ color: businessProfile?.header_color || '#4F46E5' }}
              >
                <FaCalendarAlt className="w-4 h-4" />
                Add to Calendar
              </button>
              {availableFeatures.notifications && (
                <button
                  onClick={() => handleSaveOption('reminder')}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                  style={{ color: businessProfile?.header_color || '#4F46E5' }}
                >
                  <FaBell className="w-4 h-4" />
                  Set Reminder
                </button>
              )}
              <button
                onClick={() => handleSaveOption('email')}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                style={{ color: businessProfile?.header_color || '#4F46E5' }}
              >
                <FaEnvelope className="w-4 h-4" />
                Email to Self
              </button>
              <button
                onClick={() => handleSaveOption('home-screen')}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                style={{ color: businessProfile?.header_color || '#4F46E5' }}
              >
                <FaHome className="w-4 h-4" />
                Add to Home Screen
              </button>
              {availableFeatures.clipboard && (
                <button
                  onClick={() => handleSaveOption('copy-link')}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                  style={{ color: businessProfile?.header_color || '#4F46E5' }}
                >
                  <FaLink className="w-4 h-4" />
                  Copy Link
                </button>
              )}
              {availableFeatures.share && (
                <button
                  onClick={() => handleSaveOption('reading-list')}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                  style={{ color: businessProfile?.header_color || '#4F46E5' }}
                >
                  <FaBookmark className="w-4 h-4" />
                  Add to Reading List
                </button>
              )}
              <button
                onClick={() => handleSaveOption('pocket')}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                style={{ color: businessProfile?.header_color || '#4F46E5' }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.5 3.5H3.5C2.67 3.5 2 4.17 2 5v14c0 .83.67 1.5 1.5 1.5h17c.83 0 1.5-.67 1.5-1.5V5c0-.83-.67-1.5-1.5-1.5zM12 19.5H4v-15h8v15zm8 0h-7v-15h7v15z"/>
                </svg>
                Save to Pocket
              </button>
              <button
                onClick={() => handleSaveOption('instapaper')}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                style={{ color: businessProfile?.header_color || '#4F46E5' }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.5 3.5H3.5C2.67 3.5 2 4.17 2 5v14c0 .83.67 1.5 1.5 1.5h17c.83 0 1.5-.67 1.5-1.5V5c0-.83-.67-1.5-1.5-1.5zM12 19.5H4v-15h8v15zm8 0h-7v-15h7v15z"/>
                </svg>
                Save to Instapaper
              </button>
              {availableFeatures.bookmarks && (
                <button
                  onClick={() => handleSaveOption('favorites')}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                  style={{ color: businessProfile?.header_color || '#4F46E5' }}
                >
                  <FaFavorites className="w-4 h-4" />
                  Bookmark in Browser
                </button>
              )}
            </div>
          )}
        </div>

        {/* Review Rewards Banner */}
        {showBanner && (
          <div className="w-full flex items-center justify-center relative px-4 py-2 bg-yellow-50 border-b border-yellow-300 text-black text-sm font-medium shadow-sm" style={{ minHeight: 0, fontSize: '0.97rem' }}>
            <span className="flex items-center gap-2 mx-auto">
              {/* Yellow SVG Gift Icon with lighter lid, darker ribbon and bow */}
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="flex-shrink-0"
                style={{ display: 'inline', verticalAlign: 'middle' }}
              >
                {/* Box */}
                <rect x="3" y="8" width="18" height="13" rx="2" fill="#fde68a" />
                {/* Lid (lighter yellow) */}
                <rect x="2" y="6" width="20" height="4" rx="1.5" fill="#facc15" />
                {/* Bow left */}
                <path d="M12 6C10.5 2.5 6 3.5 7.5 6C9 8.5 12 6 12 6Z" fill="#ca8a04" />
                {/* Bow right */}
                <path d="M12 6C13.5 2.5 18 3.5 16.5 6C15 8.5 12 6 12 6Z" fill="#ca8a04" />
                {/* Ribbon */}
                <rect x="11" y="8" width="2" height="13" fill="#ca8a04" />
              </svg>
              <span className="font-semibold">{promptPage.offer_title}:</span>
              <span className="ml-1">{promptPage.offer_body}</span>
              {offerLearnMoreUrl && (
                <a
                  href={offerLearnMoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 underline"
                  style={{ marginLeft: 8, color: businessProfile?.header_color || '#4F46E5' }}
                >
                  Learn More
                </a>
              )}
            </span>
            <button
              className="absolute right-4 text-black text-lg font-bold hover:text-yellow-600 focus:outline-none"
              aria-label="Dismiss"
              onClick={() => setShowRewardsBanner(false)}
              style={{ lineHeight: 1 }}
            >
              ×
            </button>
          </div>
        )}
        <div className="min-h-screen flex justify-center items-start">
          <div className="relative w-full">
            <div className="max-w-[1000px] w-full mx-auto px-4">
              {/* Business Info Card (always visible) */}
              <div className="bg-gray-50 rounded-2xl shadow p-6 mb-8 flex flex-col items-center max-w-md mx-auto animate-slideup relative mt-32">
                {/* Business Logo - No drop-down animation */}
                <div className="absolute left-1/2 -translate-x-1/2 w-44 h-44 aspect-square flex items-center justify-center mb-10" style={{ pointerEvents: 'none', top: '-100px' }}>
                  <div className="bg-white rounded-full p-1 shadow-lg flex items-center justify-center w-full h-full aspect-square">
                    {businessProfile?.logo_url ? (
                      <img
                        src={businessProfile.logo_url}
                        alt={`${businessProfile?.business_name || 'Business'} logo`}
                        className="h-36 w-36 aspect-square object-contain rounded-full"
                      />
                    ) : (
                      <div className="h-36 w-36 aspect-square bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-5xl text-gray-500">
                          {businessProfile?.business_name?.[0] || 'B'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {/* Business Name - Added more space above */}
                <h1 
                  className={`text-3xl font-bold text-center mb-1 mt-20 ${businessProfile?.primary_font || 'font-inter'}`}
                  style={{ color: businessProfile?.header_color || '#4F46E5' }}
                >
                  {businessProfile?.business_name ? `Give ${businessProfile.business_name} a Review` : 'Give Us a Review'}
                </h1>
                {/* Estimated time note */}
                <div className="text-center text-sm text-gray-500">Estimated time to complete: 2-5 minutes</div>
              </div>
              {/* Feedback Form Section (if negative sentiment) */}
              {sentimentComplete && ['neutral','unsatisfied','angry'].includes(sentiment||'') && (
                <div className="w-full flex justify-center my-8">
                  <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-[1000px] w-full flex flex-col items-center animate-fadein relative">
                    <h2 className="text-2xl font-bold text-slate-blue mb-4">{promptPage.emoji_feedback_message || 'We value your feedback! Let us know how we can do better.'}</h2>
                    <form className="w-full flex flex-col items-center" onSubmit={async e => {
                      e.preventDefault();
                      setFeedbackSubmitting(true);
                      setFeedbackError(null);
                      setFeedbackSuccess(false);
                      try {
                        const { error } = await supabase.from('review_submissions').insert({
                          prompt_page_id: promptPage.id,
                          first_name: feedbackFirstName,
                          last_name: feedbackLastName,
                          email: feedbackEmail,
                          phone: feedbackPhone || null,
                          review_content: feedback,
                          emoji_sentiment_selection: sentiment,
                          status: 'feedback',
                          user_agent: navigator.userAgent,
                          ip_address: null
                        });
                        if (error) throw error;
                        setFeedbackSuccess(true);
                        setFeedbackFirstName('');
                        setFeedbackLastName('');
                        setFeedbackEmail('');
                        setFeedbackPhone('');
                        setFeedback('');
                        if (!currentUser && promptPage?.id && sentiment && feedback) {
                          sendAnalyticsEvent({
                            promptPageId: promptPage.id,
                            eventType: 'constructive_feedback',
                            platform: 'web',
                            sentiment,
                            feedback,
                          });
                        }
                      } catch (err: any) {
                        setFeedbackError(err.message || 'Failed to submit feedback.');
                      } finally {
                        setFeedbackSubmitting(false);
                      }
                    }}>
                      <div className="flex flex-col md:flex-row gap-4 w-full mb-4">
                        <div className="flex-1">
                          <label htmlFor="feedbackFirstName" className="block text-sm font-medium text-gray-700">First Name <span className="text-red-500">*</span></label>
                          <input type="text" id="feedbackFirstName" value={feedbackFirstName} onChange={e => setFeedbackFirstName(e.target.value)} required className="mt-1 block w-full rounded-lg border border-gray-300 p-3" />
                        </div>
                        <div className="flex-1">
                          <label htmlFor="feedbackLastName" className="block text-sm font-medium text-gray-700">Last Name <span className="text-red-500">*</span></label>
                          <input type="text" id="feedbackLastName" value={feedbackLastName} onChange={e => setFeedbackLastName(e.target.value)} required className="mt-1 block w-full rounded-lg border border-gray-300 p-3" />
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row gap-4 w-full mb-4">
                        <div className="flex-1">
                          <label htmlFor="feedbackEmail" className="block text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
                          <input type="email" id="feedbackEmail" value={feedbackEmail} onChange={e => setFeedbackEmail(e.target.value)} required className="mt-1 block w-full rounded-lg border border-gray-300 p-3" />
                        </div>
                        <div className="flex-1">
                          <label htmlFor="feedbackPhone" className="block text-sm font-medium text-gray-700">Phone (optional)</label>
                          <input type="tel" id="feedbackPhone" value={feedbackPhone} onChange={e => setFeedbackPhone(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 p-3" />
                        </div>
                      </div>
                      <textarea
                        className="w-full rounded-lg border border-gray-300 p-4 min-h-[120px] focus:ring-2 focus:ring-indigo-400 mb-4"
                        placeholder="Your feedback..."
                        value={feedback}
                        onChange={e => setFeedback(e.target.value)}
                        required
                      />
                      <button type="submit" className="px-6 py-2 bg-slate-blue text-white rounded-lg font-semibold shadow hover:bg-indigo-900 transition" disabled={feedbackSubmitting}>
                        Submit Feedback
                      </button>
                      {feedbackSuccess && <div className="text-green-600 mt-4">Thank you for your feedback!</div>}
                      {feedbackError && <div className="text-red-600 mt-4">{feedbackError}</div>}
                    </form>
                  </div>
                </div>
              )}
              {/* Main Content (hidden if feedback form is shown) */}
              {!(sentimentComplete && ['neutral','unsatisfied','angry'].includes(sentiment||'')) && <>
                  {/* Photo + Testimonial Module */}
                  {(promptPage?.review_type === 'photo' || promptPage?.review_type === 'photo_testimonial') && (
                    <div className="mb-8 bg-gray-50 rounded-2xl shadow p-8 animate-slideup">
                      <div className="flex items-center mb-8">
                        <FaCamera className="w-8 h-8 mr-3" style={{ color: '#1A237E' }} />
                        <h1 className="text-3xl font-bold text-left" style={{ color: '#1A237E' }}>
                          Photo + Testimonial
                        </h1>
                      </div>
                      {photoSuccess ? (
                        <div className="text-green-600 text-center text-lg font-semibold py-8">Thank you for your photo and testimonial!</div>
                      ) : (
                        <form onSubmit={handlePhotoSubmit} className="flex flex-col gap-6 items-center">
                          <div className="flex gap-4">
                            <button
                              type="button"
                              className="px-4 py-2 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700 focus:outline-none"
                              onClick={() => cameraInputRef.current?.click()}
                            >
                              Take Photo
                            </button>
                            <button
                              type="button"
                              className="px-4 py-2 bg-gray-200 text-gray-800 rounded shadow hover:bg-gray-300 focus:outline-none"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              Upload Photo
                            </button>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            ref={cameraInputRef}
                            style={{ display: 'none' }}
                            onChange={handlePhotoChange}
                          />
                          <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handlePhotoChange}
                          />
                          {photoPreview && (
                            <img src={photoPreview} alt="Preview" className="rounded-lg shadow max-h-64 object-contain" />
                          )}
                          <div className="w-full flex flex-col md:flex-row gap-4">
                            <div className="flex-1 min-w-[200px] max-w-[400px]">
                              <label htmlFor="photoReviewerName" className="block text-sm font-medium text-gray-700">
                                Your Name <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                id="photoReviewerName"
                                value={photoReviewerName}
                                onChange={e => setPhotoReviewerName(e.target.value)}
                                placeholder="Ezra C"
                                className="mt-1 block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
                                required
                              />
                            </div>
                            <div className="flex-1 min-w-[200px] max-w-[400px]">
                              <label htmlFor="photoReviewerRole" className="block text-sm font-medium text-gray-700">
                                Role/Position/Occupation
                              </label>
                              <input
                                type="text"
                                id="photoReviewerRole"
                                value={photoReviewerRole}
                                onChange={e => setPhotoReviewerRole(e.target.value)}
                                placeholder="Store Manager, GreenSprout Co-Op"
                                className="mt-1 block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
                              />
                            </div>
                          </div>
                          <textarea
                            className="w-full rounded-lg border border-gray-300 p-4 min-h-[120px] focus:ring-2 focus:ring-indigo-400"
                            placeholder="Write your testimonial here..."
                            value={testimonial}
                            onChange={e => setTestimonial(e.target.value)}
                            required
                          />
                          <div className="flex justify-between w-full gap-2">
                            <button
                              type="button"
                              onClick={handleGeneratePhotoTestimonial}
                              disabled={aiLoadingPhoto}
                              className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <FaPenFancy style={{ color: businessProfile?.header_color || '#4F46E5' }} />
                              <span style={{ color: businessProfile?.header_color || '#4F46E5' }}>{aiLoadingPhoto ? 'Generating...' : 'Generate with AI'}</span>
                            </button>
                            <button
                              type="submit"
                              className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 rounded-lg hover:bg-gray-50 transition-colors"
                              style={{ color: businessProfile?.header_color || '#4F46E5' }}
                              disabled={photoSubmitting}
                            >
                              {photoSubmitting ? 'Submitting...' : 'Submit'}
                            </button>
                          </div>
                          {photoError && <div className="text-red-500 text-sm">{photoError}</div>}
                        </form>
                      )}
                    </div>
                  )}
                  {/* Personalized Note */}
                  {promptPage?.friendly_note && !promptPage?.is_universal && showPersonalNote && canShowPersonalNote && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadein">
                      <div className="bg-white rounded-lg p-6 max-w-lg mx-4 relative animate-slideup">
                        <button
                          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 focus:outline-none"
                          onClick={() => setShowPersonalNote(false)}
                          aria-label="Close note"
                        >
                          ×
                        </button>
                        <div className="text-gray-900 text-base">
                          {promptPage.friendly_note}
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Review Platforms Section */}
                  {Array.isArray(promptPage?.review_platforms) && promptPage.review_platforms.length > 0 && (
                    <div className="mb-8">
                      <div className="bg-gray-50 rounded-2xl shadow pt-6 pb-8 px-8 mb-8">
                        <h2
                          className={`text-xl font-bold mb-2 mt-0 ${businessProfile?.primary_font || 'font-inter'}`}
                          style={{ color: businessProfile?.header_color || '#4F46E5' }}
                        >
                          Support Small Business
                        </h2>
                        <p className="text-gray-700 text-base">
                          Reviews help us grow. Write something custom, or use AI for a headstart. When you're ready, click "Copy & Submit." You will be taken to the review site where you can login and paste your review.
                        </p>
                      </div>
                      <div className="flex flex-col gap-8">
                        {promptPage.review_platforms.map((platform: any, idx: number) => {
                          const { icon: Icon, label } = getPlatformIcon(platform.url, platform.platform || platform.name);
                          const isUniversal = !!promptPage.is_universal;
                          return (
                            <div
                              key={idx}
                              className="relative bg-gray-50 rounded-xl shadow p-4 pt-8 flex flex-col items-start border border-gray-100 animate-slideup"
                              style={{ animationDelay: `${300 + idx * 100}ms` }}
                            >
                              {/* Icon in top-left corner */}
                              <div className="absolute -top-4 -left-4 bg-white rounded-full shadow p-2 flex items-center justify-center" title={label}>
                                <Icon className="w-7 h-7" style={{ color: businessProfile?.header_color || '#4F46E5' }} />
                              </div>
                              <div className="flex items-center gap-3 mb-2 mt-0">
                                <div
                                  className={`text-2xl font-bold ${businessProfile?.primary_font || 'font-inter'}`}
                                  style={{ color: businessProfile?.header_color || '#1A237E' }}
                                >
                                  {platform.platform || platform.name}
                                </div>
                                {platform.customInstructions && platform.customInstructions.trim() && (
                                  <button
                                    type="button"
                                    className="ml-2 focus:outline-none"
                                    onClick={() => setOpenInstructionsIdx(openInstructionsIdx === idx ? null : idx)}
                                    aria-label="Show custom instructions"
                                    style={{ verticalAlign: 'middle' }}
                                  >
                                    <FaQuestionCircle className="inline-block w-5 h-5 align-middle relative" style={{ color: businessProfile?.header_color || '#1A237E', top: '-2px' }} />
                                  </button>
                                )}
                              </div>
                              {/* Popup for custom instructions */}
                              {openInstructionsIdx === idx && platform.customInstructions && platform.customInstructions.trim() && (
                                <div className="absolute z-50 left-1/2 -translate-x-1/2 top-10 bg-white border border-yellow-300 rounded shadow-lg p-4 text-yellow-900 text-sm max-w-xs w-max animate-fadein" style={{ minWidth: 220 }}>
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="font-semibold">Instructions</span>
                                    <button
                                      type="button"
                                      className="text-gray-400 hover:text-gray-700 ml-2"
                                      onClick={() => setOpenInstructionsIdx(null)}
                                      aria-label="Close instructions"
                                    >
                                      ×
                                    </button>
                                  </div>
                                  <div>{platform.customInstructions}</div>
                                </div>
                              )}
                              <div className="flex flex-col md:flex-row gap-4 mb-2">
                                <div className="flex-1 min-w-[300px] max-w-[400px]">
                                  <label htmlFor={`reviewerName-${idx}`} className="block text-sm font-medium text-gray-700">
                                    Your Name <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    id={`reviewerName-${idx}`}
                                    value={reviewerNames[idx]}
                                    onChange={e => setReviewerNames(names => names.map((n, i) => i === idx ? e.target.value : n))}
                                    placeholder="Ezra C"
                                    className="mt-1 block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
                                    required
                                  />
                                </div>
                                <div className="flex-1 min-w-[300px] max-w-[400px]">
                                  <label htmlFor={`reviewerRole-${idx}`} className="block text-sm font-medium text-gray-700">
                                    Role/Position/Occupation
                                  </label>
                                  <input
                                    type="text"
                                    id={`reviewerRole-${idx}`}
                                    value={reviewerRoles[idx]}
                                    onChange={e => setReviewerRoles(roles => roles.map((r, i) => i === idx ? e.target.value : r))}
                                    placeholder="Store Manager, GreenSprout Co-Op"
                                    className="mt-1 block w-full rounded-lg shadow-md bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:text-sm border border-gray-200 py-3 px-4"
                                  />
                                </div>
                              </div>
                              <textarea
                                className="w-full mt-2 mb-4 p-4 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Write your review here..."
                                value={isUniversal ? (platformReviewTexts[idx] || '') : (platformReviewTexts[idx] || '')}
                                onChange={e => handleReviewTextChange(idx, e.target.value)}
                                rows={5}
                              />
                              {submitError && <div className="text-red-500 text-sm mb-2">{submitError}</div>}
                              <div className="flex justify-between w-full">
                                <button
                                  onClick={() => handleRewriteWithAI(idx)}
                                  disabled={aiLoading === idx}
                                  className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                  <FaPenFancy style={{ color: businessProfile?.header_color || '#4F46E5' }} />
                                  <span style={{ color: businessProfile?.header_color || '#4F46E5' }}>{aiLoading === idx ? 'Generating...' : 'Generate with AI'}</span>
                                </button>
                                <button
                                  onClick={() => handleCopyAndSubmit(idx, platform.url)}
                                  className="px-4 py-2 text-white rounded hover:opacity-90 transition-colors"
                                  style={{ backgroundColor: businessProfile?.secondary_color || '#4F46E5' }}
                                  disabled={isSubmitting === idx}
                                >
                                  {isSubmitting === idx ? 'Submitting...' : 'Copy & Submit'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {/* Website and Social Media Card */}
                  {(businessProfile?.facebook_url || businessProfile?.instagram_url || businessProfile?.bluesky_url || businessProfile?.tiktok_url || businessProfile?.youtube_url || businessProfile?.linkedin_url || businessProfile?.pinterest_url) && (
                    <div className="mb-8 bg-gray-50 rounded-2xl shadow p-8 animate-slideup">
                      <div className="flex flex-col md:flex-row gap-8 w-full">
                        {/* Website Section (left column) */}
                        {businessProfile?.business_website && (
                          <div className="flex-1 flex flex-col justify-start text-center md:text-left md:max-w-[320px] md:pr-4 border-b md:border-b-0 md:border-r border-gray-200 mb-8 md:mb-0">
                            <h2 
                              className={`text-2xl font-bold mt-0 mb-6 ${businessProfile?.primary_font || 'font-inter'}`}
                              style={{ color: businessProfile?.header_color || '#000000' }}
                            >
                              Visit Our Website
                            </h2>
                            <a
                              href={businessProfile.business_website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block text-xl font-medium hover:opacity-80 transition-opacity"
                              style={{ color: businessProfile?.header_color || '#4F46E5' }}
                              onClick={async () => {
                                if (!promptPage?.id) return;
                                await sendAnalyticsEvent({
                                  promptPageId: promptPage.id,
                                  eventType: 'website_click',
                                  platform: 'website',
                                });
                              }}
                            >
                              {businessProfile.business_website.replace(/^https?:\/\//, '')}
                            </a>
                          </div>
                        )}
                        {/* Social Media Section (right column, wider) */}
                        <div className="flex-[1.5] flex flex-col justify-start text-center md:text-left w-full md:pl-8">
                          <h2 
                            className={`text-2xl font-bold mt-0 mb-6 text-center md:text-left ${businessProfile?.primary_font || 'font-inter'}`}
                            style={{ color: businessProfile?.header_color || '#000000' }}
                          >
                            {`Follow ${businessProfile?.business_name || 'us'} on Social`}
                          </h2>
                          <div className="flex flex-wrap justify-center md:justify-start gap-6 p-2 w-full">
                            <SocialMediaIcons
                              facebook_url={businessProfile.facebook_url || undefined}
                              instagram_url={businessProfile.instagram_url || undefined}
                              bluesky_url={businessProfile.bluesky_url || undefined}
                              tiktok_url={businessProfile.tiktok_url || undefined}
                              youtube_url={businessProfile.youtube_url || undefined}
                              linkedin_url={businessProfile.linkedin_url || undefined}
                              pinterest_url={businessProfile.pinterest_url || undefined}
                              color={businessProfile.header_color || '#3b82f6'}
                              onIconClick={async (platform) => {
                                if (!promptPage?.id) return;
                                await sendAnalyticsEvent({
                                  promptPageId: promptPage.id,
                                  eventType: 'social_click',
                                  platform,
                                });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
              </>}

              {/* PromptReviews Advertisement (always visible) */}
              <div className="mt-12 mb-12 bg-white rounded-2xl shadow p-8 animate-slideup" style={{ background: businessProfile?.header_color || '#4F46E5' }}>
                <div className="flex flex-col md:flex-row items-center text-center md:text-left gap-8 md:items-center">
                  <div className="flex-shrink-0 flex items-center justify-center w-full md:w-48 mb-4 md:mb-0">
                    <img
                      src="https://ltneloufqjktdplodvao.supabase.co/storage/v1/object/public/logos/prompt-assets/prompt-reviews-get-more-reviews-logo.png"
                      alt="Prompt Reviews Logo"
                      className="h-10 w-auto"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-4 justify-center md:justify-start">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ color: '#fff' }}
                      >
                        <path
                          d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                          fill="currentColor"
                        />
                      </svg>
                      <span className="text-lg font-semibold text-white">Powered by Prompt Reviews</span>
                    </div>
                    <p className="max-w-2xl text-white">
                      Get more reviews for your business with our easy-to-use review management platform. 
                      Create custom review pages, track your progress, and grow your online presence.
                    </p>
                    <a
                      href="https://promptreviews.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 font-medium hover:opacity-80 transition-opacity inline-block text-white underline"
                    >
                      Learn more about Prompt Reviews →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> {/* <-- This closes the main wrapper */}
      {showSentimentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
          <div className="bg-white rounded-2xl shadow-2xl p-8 px-10 max-w-xl w-full flex flex-col items-center animate-fadein relative mx-4 sm:mx-6 md:mx-0">
            <h2 className="text-2xl font-bold text-slate-blue mb-4">{promptPage.emoji_sentiment_question || 'How was your experience?'}</h2>
            <div className="flex flex-col items-center gap-2 my-4">
              <div className="grid grid-cols-3 md:grid-cols-5 gap-x-8 gap-y-6 select-none">
                <div className="flex flex-col items-center">
                  <button onClick={() => setSentiment('delighted')} aria-label="Delighted" className={`transition-transform hover:scale-125 cursor-pointer ${sentiment==='delighted'?'ring-2 ring-slate-blue rounded-full':''}`}><img src="/emojis/delighted.svg" width="60" height="60" alt="Delighted" /></button>
                  <span className="w-16 text-center mt-1 text-xs text-gray-600 font-medium">Delighted</span>
                </div>
                <div className="flex flex-col items-center">
                  <button onClick={() => setSentiment('satisfied')} aria-label="Satisfied" className={`transition-transform hover:scale-125 cursor-pointer ${sentiment==='satisfied'?'ring-2 ring-slate-blue rounded-full':''}`}><img src="/emojis/satisfied.svg" width="60" height="60" alt="Satisfied" /></button>
                  <span className="w-16 text-center mt-1 text-xs text-gray-600 font-medium">Satisfied</span>
                </div>
                <div className="flex flex-col items-center">
                  <button onClick={() => setSentiment('neutral')} aria-label="Neutral" className={`transition-transform hover:scale-125 cursor-pointer ${sentiment==='neutral'?'ring-2 ring-slate-blue rounded-full':''}`}><img src="/emojis/neutral.svg" width="60" height="60" alt="Neutral" /></button>
                  <span className="w-16 text-center mt-1 text-xs text-gray-600 font-medium">Neutral</span>
                </div>
                <div className="flex flex-col items-center">
                  <button onClick={() => setSentiment('unsatisfied')} aria-label="Unsatisfied" className={`transition-transform hover:scale-125 cursor-pointer ${sentiment==='unsatisfied'?'ring-2 ring-slate-blue rounded-full':''}`}><img src="/emojis/unsatisfied.svg" width="60" height="60" alt="Unsatisfied" /></button>
                  <span className="w-16 text-center mt-1 text-xs text-gray-600 font-medium">Unsatisfied</span>
                </div>
                <div className="flex flex-col items-center">
                  <button onClick={() => setSentiment('angry')} aria-label="Angry" className={`transition-transform hover:scale-125 cursor-pointer ${sentiment==='angry'?'ring-2 ring-slate-blue rounded-full':''}`}><img src="/emojis/angry.svg" width="60" height="60" alt="Angry" /></button>
                  <span className="w-16 text-center mt-1 text-xs text-gray-600 font-medium">Angry</span>
                </div>
              </div>
            </div>
            {!sentiment && (
              <div className="text-sm text-gray-500 mt-4 mb-2">Please select an emoji to continue</div>
            )}
            {sentiment && (
              <button
                className="mt-6 px-6 py-2 bg-slate-blue text-white rounded-lg font-semibold shadow hover:bg-indigo-900 transition"
                onClick={() => { setShowSentimentModal(false); setSentimentComplete(true); if (!currentUser && promptPage?.id && sentiment) {
                  sendAnalyticsEvent({
                    promptPageId: promptPage.id,
                    eventType: 'emoji_sentiment',
                    platform: 'web',
                    sentiment,
                  });
                }}}
              >
                Continue
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
