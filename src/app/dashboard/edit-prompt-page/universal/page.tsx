'use client';
import React, { useRef, useState } from 'react';
import UniversalPromptPageForm, { UniversalPromptFormState } from './UniversalPromptPageForm';
import { FaGlobe } from 'react-icons/fa';
import PageCard from '@/app/components/PageCard';
import offerConfig from '@/app/components/prompt-modules/offerConfig';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

// Helper to normalize platform names to match dropdown options
const normalizePlatformName = (name: string): string => {
  if (!name) return '';
  if (name === 'Google') return 'Google Business Profile';
  if (name === 'Facebook Page') return 'Facebook';
  // Add more mappings as needed
  return name;
};

export default function UniversalEditPromptPage() {
  const formRef = useRef<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [initialData, setInitialData] = useState<UniversalPromptFormState | null>(null);
  const [showResetButton, setShowResetButton] = useState(false);
  const [businessReviewPlatforms, setBusinessReviewPlatforms] = useState<any[]>([]);
  const [slug, setSlug] = useState<string | null>(null);

  // Fetch universal prompt page and business profile, then merge
  React.useEffect(() => {
    async function fetchData() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // handle not signed in
        return;
      }
      // Fetch business profile
      const { data: businessProfile } = await supabase
        .from('businesses')
        .select('*')
        .eq('account_id', user.id)
        .single();
      // Fetch universal prompt page
      const { data: universalPage } = await supabase
        .from('prompt_pages')
        .select('*')
        .eq('account_id', user.id)
        .eq('is_universal', true)
        .single();
      if (universalPage?.slug) setSlug(universalPage.slug);
      // Normalize platform names for business and universal platforms
      const normalizePlatforms = (platforms: any[] = []): any[] =>
        platforms.map((p) => ({ ...p, name: normalizePlatformName(p.name) }));
      // Merge logic: universal overrides business
      const universalPlatforms = normalizePlatforms(universalPage?.review_platforms) as any[];
      const businessPlatforms = normalizePlatforms(businessProfile?.review_platforms) as any[];
      const merged: UniversalPromptFormState = {
        offerEnabled: universalPage?.offer_enabled ?? businessProfile?.default_offer_enabled ?? false,
        offerTitle: universalPage?.offer_title || businessProfile?.default_offer_title || '',
        offerBody: universalPage?.offer_body || businessProfile?.default_offer_body || '',
        offerUrl: universalPage?.offer_url || businessProfile?.default_offer_url || '',
        emojiSentimentEnabled: universalPage?.emoji_sentiment_enabled ?? false,
        emojiSentimentQuestion: universalPage?.emoji_sentiment_question || '',
        emojiFeedbackMessage: universalPage?.emoji_feedback_message || '',
        emojiThankYouMessage: universalPage?.emoji_thank_you_message || '',
        emojiLabels: universalPage?.emoji_labels || ['Excellent', 'Satisfied', 'Neutral', 'Unsatisfied', 'Frustrated'],
        reviewPlatforms: universalPlatforms.length ? universalPlatforms : businessPlatforms,
        fallingEnabled: !!universalPage?.falling_icon,
        fallingIcon: universalPage?.falling_icon || 'star',
        aiButtonEnabled: universalPage?.ai_button_enabled !== false,
      };
      // Show the button if there is a universal override, or if the merged list is empty
      setShowResetButton(universalPlatforms.length > 0 || merged.reviewPlatforms.length === 0);
      setInitialData(merged);
      setBusinessReviewPlatforms(businessPlatforms);
    }
    fetchData();
  }, []);

  const handleSave = () => {
    if (formRef.current && typeof formRef.current.submit === 'function') {
      setIsSaving(true);
      formRef.current.submit();
      setTimeout(() => setIsSaving(false), 1000); // Simulate save, replace with real logic
    }
  };

  const handleFormSave = async (formState: UniversalPromptFormState) => {
    setIsSaving(true);
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('You must be signed in to save.');
      setIsSaving(false);
      return;
    }
    // Upsert universal prompt page (only columns in schema)
    const { error } = await supabase
      .from('prompt_pages')
      .upsert([
        {
          account_id: user.id,
          is_universal: true,
          offer_enabled: formState.offerEnabled,
          offer_title: formState.offerTitle,
          offer_body: formState.offerBody,
          offer_url: formState.offerUrl,
          emoji_sentiment_enabled: formState.emojiSentimentEnabled,
          emoji_sentiment_question: formState.emojiSentimentQuestion,
          emoji_feedback_message: formState.emojiFeedbackMessage,
          emoji_thank_you_message: formState.emojiThankYouMessage,
          review_platforms: formState.reviewPlatforms,
          falling_icon: formState.fallingEnabled ? formState.fallingIcon : null,
          ai_button_enabled: formState.aiButtonEnabled,
        },
      ], { onConflict: 'account_id,is_universal' });
    if (error) {
      alert('Failed to save: ' + error.message);
    } else {
      // Fetch the updated universal prompt page to get the slug
      const { data: updatedPage } = await supabase
        .from('prompt_pages')
        .select('slug')
        .eq('account_id', user.id)
        .eq('is_universal', true)
        .single();
      if (updatedPage?.slug) setSlug(updatedPage.slug);
      if (updatedPage?.slug) {
        localStorage.setItem('showPostSaveModal', JSON.stringify({ url: `/r/${updatedPage.slug}` }));
      }
      // Redirect to dashboard to show the modal
      window.location.href = '/dashboard';
    }
    setIsSaving(false);
  };

  const saveButton = (
    <button
      type="button"
      className="bg-slate-blue text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-slate-blue/90 transition"
      onClick={handleSave}
      disabled={isSaving}
    >
      {isSaving ? 'Saving...' : 'Save'}
    </button>
  );

  const viewButton = (
    <Link
      href={slug ? `/r/${slug}` : '#'}
      target="_blank"
      rel="noopener noreferrer"
      className={`px-6 py-2 rounded-lg font-semibold shadow border border-slate-blue text-slate-blue bg-white hover:bg-slate-50 transition ml-2 ${!slug ? 'opacity-50 pointer-events-none' : ''}`}
      tabIndex={slug ? 0 : -1}
    >
      View
    </Link>
  );

  const actionButtons = (
    <div className="flex gap-3">
      {viewButton}
      {saveButton}
    </div>
  );

  return (
    <PageCard
      icon={<FaGlobe />}
      topRightAction={actionButtons}
      bottomRightAction={actionButtons}
    >
      <h1 className="text-3xl font-bold text-slate-blue mb-2 mt-2">Universal Prompt Page</h1>
      <p className="text-gray-600 mb-8">
        The Universal Prompt page is designed to be shared with many.<br />
        It is a perfect choice for displaying a QR code in your place of business.
      </p>
      <div className="pb-16">
        {initialData && (
          <UniversalPromptPageForm
            ref={formRef}
            onSave={handleFormSave}
            isLoading={isSaving}
            initialData={initialData}
            showResetButton={showResetButton}
            businessReviewPlatforms={businessReviewPlatforms}
          />
        )}
      </div>
    </PageCard>
  );
} 