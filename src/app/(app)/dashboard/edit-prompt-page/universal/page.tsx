// -----------------------------------------------------------------------------
// Universal Prompt Page Edit Screen
// This file implements the edit UI for the universal prompt page in the dashboard.
// It fetches the business and universal prompt page data, merges them, and passes
// them to the form. Handles nullability of review_platforms (may be null in DB).
// -----------------------------------------------------------------------------

"use client";
import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PromptPageForm from "@/app/(app)/components/PromptPageForm";
import Icon from "@/components/Icon";
import PageCard from "@/app/(app)/components/PageCard";
import offerConfig from "@/app/(app)/components/prompt-modules/offerConfig";
import { createClient } from "@/auth/providers/supabase";
import Link from "next/link";
import { markTaskAsCompleted } from "@/utils/onboardingTasks";
import { useAuth } from "@/auth";
import { revalidatePromptPage } from "@/app/(app)/actions/revalidate";

// Interface for Universal Prompt Form State
interface UniversalPromptFormState {
  offer_enabled: boolean;
  offer_title: string;
  offer_body: string;
  offer_url: string;
  offer_timelock: boolean;
  emoji_sentiment_enabled: boolean;
  emoji_sentiment_question: string;
  emoji_feedback_message: string;
  emoji_thank_you_message: string;
  emoji_feedback_popup_header: string;
  emoji_feedback_page_header: string;
  review_platforms: any[];
  falling_enabled: boolean;
  falling_icon: string;
  falling_icon_color: string;
  ai_button_enabled: boolean;
  fix_grammar_enabled: boolean;
  note_popup_enabled: boolean;
  show_friendly_note: boolean;
  friendly_note: string;
  kickstarters_enabled: boolean;
  selected_kickstarters: string[];
  recent_reviews_enabled: boolean;
  recent_reviews_scope: 'current_page' | 'all_pages';
  keywords?: string[];
  keyword_inspiration_enabled?: boolean;
  selected_keyword_inspirations?: string[];
  motivational_nudge_enabled?: boolean;
  motivational_nudge_text?: string;
  role_field_enabled?: boolean;
}

// Helper to normalize platform names to match dropdown options
const normalizePlatformName = (name: string): string => {
  if (!name) return "";
  if (name === "Google") return "Google Business Profile";
  if (name === "Facebook Page") return "Facebook";
  // Add more mappings as needed
  return name;
};

/**
 * Ensures platforms is always an array (never null/undefined) before mapping.
 * This prevents runtime errors if the DB field is null.
 * @param platforms Array of platform objects, or null/undefined
 * @returns Array of normalized platform objects
 */
const normalizePlatforms = (platforms: any[] | null | undefined = []) =>
  (platforms ?? []).map((p) => ({ ...p, name: normalizePlatformName(p.name) }));

export default function UniversalEditPromptPage() {
  const supabase = createClient();
  const router = useRouter();
  const { user, account } = useAuth();

  // Using standardized form architecture (consistent with other prompt page types)
  const useStandardizedForm = true;
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialData, setInitialData] =
    useState<UniversalPromptFormState | null>(null);
  const [showResetButton, setShowResetButton] = useState(false);
  const [businessReviewPlatforms, setBusinessReviewPlatforms] = useState<any[]>(
    [],
  );
  const [slug, setSlug] = useState<string | null>(null);
  const [businessProfile, setBusinessProfile] = useState<any>(null);

  // Fetch universal prompt page and business profile, then merge
  React.useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Use account from auth context if available
        if (!user || !account?.id) {
          setIsLoading(false);
          return;
        }
        
        
        // Use the account ID from the auth context (respects account switcher)
        const accountId = account.id;
        
        if (!accountId) {
          setError("No account found for user");
          setIsLoading(false);
          return;
        }
        
        
        // Fetch business profile
        // IMPORTANT: Don't use .single() as accounts can have multiple businesses
        // CRITICAL: Must filter by the EXACT account_id from the account switcher
        const { data: businessData, error: businessError } = await supabase
          .from("businesses")
          .select("*")
          .eq("account_id", accountId)
          .order("created_at", { ascending: true }); // Get oldest business first
          
        if (businessError) {
          console.error("Business fetch error:", businessError);
        }
        
        // Debug: Log all businesses returned
        if (businessData && businessData.length > 0) {
        }
        
        // Handle multiple businesses - use the first one (oldest)
        const businessProfile = businessData && businessData.length > 0 ? businessData[0] : null;
        if (businessData && businessData.length > 1) {
        }
        
        // CRITICAL: Verify the business belongs to the correct account
        // This prevents ALL business defaults from leaking across accounts
        if (businessProfile && businessProfile.account_id !== accountId) {
          // Don't use ANY business data - it's from the wrong account
          // Set businessProfile to null to prevent any defaults from being used
          setBusinessProfile(null);
          setBusinessReviewPlatforms([]);
          console.warn("⚠️ Business data rejected due to account mismatch - using empty defaults");
          // Continue loading but without business defaults
        }
        
        
        // Fetch universal prompt page (use maybeSingle to handle no rows gracefully)
        const { data: universalPage, error: universalError } = await supabase
          .from("prompt_pages")
          .select("*")
          .eq("account_id", accountId)
          .eq("is_universal", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (universalError) {
          console.error("Universal page fetch error:", universalError);
          setError("Failed to fetch universal prompt page: " + universalError.message);
          setIsLoading(false);
          return;
        }

        // CRITICAL: Verify the prompt page belongs to the correct account
        if (universalPage && universalPage.account_id !== accountId) {
          setError("Account data mismatch detected. Please refresh the page.");
          setIsLoading(false);
          return;
        }
        
        
        if (universalPage?.slug) setSlug(universalPage.slug);
        // Normalize platform names for business and universal platforms
        const universalPlatforms = normalizePlatforms(universalPage?.review_platforms);
        const businessPlatforms = normalizePlatforms(businessProfile?.review_platforms);
        
        // Debug: Log platform sources
        
        // CRITICAL FIX: Only use business platforms if universal page has NEVER been saved with platforms
        // If universal page has review_platforms field (even if empty array), use that instead of business platforms
        // This prevents cross-account data leakage when user explicitly clears platforms
        const platformsToUse = (universalPage?.review_platforms !== null && universalPage?.review_platforms !== undefined)
          ? universalPlatforms  // Use universal platforms (even if empty array)
          : businessPlatforms;   // Only fallback to business if universal page never saved platforms
        
        
        const merged: UniversalPromptFormState = {
          offer_enabled:
            universalPage?.offer_enabled ??
            businessProfile?.default_offer_enabled ??
            false,
          offer_title:
            universalPage?.offer_title ||
            businessProfile?.default_offer_title ||
            "",
          offer_body:
            universalPage?.offer_body ||
            businessProfile?.default_offer_body ||
            "",
          offer_url:
            universalPage?.offer_url || businessProfile?.default_offer_url || "",
          offer_timelock:
            universalPage?.offer_timelock ??
            businessProfile?.default_offer_timelock ??
            false,
          emoji_sentiment_enabled: universalPage?.emoji_sentiment_enabled ?? false,
          emoji_sentiment_question: universalPage?.emoji_sentiment_question || "How was Your Experience?",
          emoji_feedback_message: universalPage?.emoji_feedback_message || "We value your feedback! Let us know how we can do better.",
          emoji_thank_you_message: universalPage?.emoji_thank_you_message || "Thank you for your feedback. It's important to us.",
          emoji_feedback_popup_header: universalPage?.emoji_feedback_popup_header || "How can we improve?",
          emoji_feedback_page_header: universalPage?.emoji_feedback_page_header || "Your feedback helps us grow",

          review_platforms: platformsToUse,
          falling_enabled: true, // Always default to enabled for new pages
          falling_icon: universalPage?.falling_icon || "star",
          falling_icon_color: universalPage?.falling_icon_color || "#fbbf24",
          ai_button_enabled: universalPage?.ai_button_enabled !== false,
          fix_grammar_enabled: universalPage?.fix_grammar_enabled !== false,
          note_popup_enabled: universalPage?.note_popup_enabled ?? false,

          // Business default inheritance for friendly note features
          show_friendly_note: universalPage?.show_friendly_note ?? businessProfile?.default_show_friendly_note ?? false,
          friendly_note: universalPage?.friendly_note || businessProfile?.default_friendly_note || "",

          // Business default inheritance for kickstarter features
          kickstarters_enabled: universalPage?.kickstarters_enabled ?? businessProfile?.default_kickstarters_enabled ?? false,
          selected_kickstarters: universalPage?.selected_kickstarters ??
            (Array.isArray(businessProfile?.default_selected_kickstarters) ? businessProfile.default_selected_kickstarters : []),

          // Business default inheritance for recent reviews features
          recent_reviews_enabled: universalPage?.recent_reviews_enabled ?? businessProfile?.default_recent_reviews_enabled ?? false,
          recent_reviews_scope: universalPage?.recent_reviews_scope || businessProfile?.default_recent_reviews_scope || 'current_page',

          // Keywords with business default inheritance
          keywords: universalPage?.keywords ?? businessProfile?.keywords ?? [],

          // Business default inheritance for keyword inspiration
          keyword_inspiration_enabled: universalPage?.keyword_inspiration_enabled ?? businessProfile?.default_keyword_inspiration_enabled ?? false,
          selected_keyword_inspirations: universalPage?.selected_keyword_inspirations ??
            (Array.isArray(businessProfile?.default_selected_keyword_inspirations) ? businessProfile.default_selected_keyword_inspirations : []),

          // Motivational Nudge
          motivational_nudge_enabled: universalPage?.motivational_nudge_enabled ?? true,
          motivational_nudge_text: universalPage?.motivational_nudge_text ?? "{business_name} needs your STAR POWER so more people can find them online!",

          // Role Field - default to false for universal/catch-all pages
          role_field_enabled: universalPage?.role_field_enabled ?? false,
        };

        // Show reset button only if universal page has saved platforms (not null/undefined)
        // This allows resetting back to business defaults
        const hasUniversalPlatformsSaved = universalPage?.review_platforms !== null && universalPage?.review_platforms !== undefined;
        setShowResetButton(hasUniversalPlatformsSaved);
        
        setInitialData(merged);
        setBusinessReviewPlatforms(businessPlatforms);
        setBusinessProfile(businessProfile);
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("An error occurred while loading the page");
        setIsLoading(false);
      }
    }
    fetchData();
  }, [user, account?.id]); // Re-fetch when account changes

  const handleFormSave = async (formState: UniversalPromptFormState) => {
    setIsSaving(true);
    
    // DEVELOPMENT MODE BYPASS - Check for dev bypass flag
    let user = null;
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      const devBypass = localStorage.getItem('dev_auth_bypass');
      if (devBypass === 'true') {
        user = {
          id: '12345678-1234-5678-9abc-123456789012',
          email: 'test@example.com',
          user_metadata: {
            first_name: 'Dev',
            last_name: 'User'
          }
        };
      }
    }
    
    // Get current user (if not using dev bypass)
    if (!user) {
      const {
        data: { user: realUser },
      } = await supabase.auth.getUser();
      user = realUser;
    }
    
    if (!user) {
      alert("You must be signed in to save.");
      setIsSaving(false);
      return;
    }
    // Get correct account ID from auth context
    const accountId = account?.id;
    if (!accountId) {
      alert("No account found for user");
      setIsSaving(false);
      return;
    }
    // Fetch the universal prompt page to get its id
    let universalPage = null;
    let fetchError = null;
    
    // DEVELOPMENT MODE BYPASS - Use mock universal prompt page ID
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && localStorage.getItem('dev_auth_bypass') === 'true' && accountId === '12345678-1234-5678-9abc-123456789012') {
      universalPage = {
        id: '0f1ba885-07d6-4698-9e94-a63d990c65e0'
      };
    } else {
      const { data: dbUniversalPage, error: dbFetchError } = await supabase
        .from("prompt_pages")
        .select("id")
        .eq("account_id", accountId)
        .eq("is_universal", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      universalPage = dbUniversalPage;
      fetchError = dbFetchError;
    }
    
    if (fetchError || !universalPage) {
      alert("Failed to find universal prompt page: " + (fetchError?.message || "Not found"));
      setIsSaving(false);
      return;
    }
    // Debug: Log form state being saved
    
    // Update universal prompt page
    let error = null;
    
    // DEVELOPMENT MODE BYPASS - Skip database update in dev mode
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && localStorage.getItem('dev_auth_bypass') === 'true' && accountId === '12345678-1234-5678-9abc-123456789012') {
      
      // Store the current form state in localStorage so the public page can use it
      // When emoji sentiment is enabled, disable falling on page load (they should only fall on emoji selection)
      const devUniversalPageData = {
        offer_enabled: formState.offer_enabled,
        offer_title: formState.offer_title,
        offer_body: formState.offer_body,
        offer_url: formState.offer_url,
        offer_timelock: formState.offer_timelock,
        emoji_sentiment_enabled: formState.emoji_sentiment_enabled,
        emoji_sentiment_question: formState.emoji_sentiment_question,
        emoji_feedback_message: formState.emoji_feedback_message,
        emoji_thank_you_message: formState.emoji_thank_you_message,
        emoji_feedback_popup_header: formState.emoji_feedback_popup_header,
        emoji_feedback_page_header: formState.emoji_feedback_page_header,
        review_platforms: formState.review_platforms,
        falling_enabled: formState.emoji_sentiment_enabled ? false : formState.falling_enabled, // Disable auto-falling when emoji sentiment is enabled
        falling_icon: formState.falling_icon,
        falling_icon_color: formState.falling_icon_color,
        ai_button_enabled: formState.ai_button_enabled,
        fix_grammar_enabled: formState.fix_grammar_enabled,
        note_popup_enabled: formState.note_popup_enabled,
        show_friendly_note: formState.show_friendly_note,
        friendly_note: formState.friendly_note,
        kickstarters_enabled: formState.kickstarters_enabled,
        selected_kickstarters: formState.selected_kickstarters,
        recent_reviews_enabled: formState.recent_reviews_enabled,
        recent_reviews_scope: formState.recent_reviews_scope,
        keywords: formState.keywords,
        keyword_inspiration_enabled: formState.keyword_inspiration_enabled,
        selected_keyword_inspirations: formState.selected_keyword_inspirations,
        motivational_nudge_enabled: formState.motivational_nudge_enabled,
        motivational_nudge_text: formState.motivational_nudge_text,
        role_field_enabled: formState.role_field_enabled,
        updated_at: new Date().toISOString()
      };

      localStorage.setItem('dev_universal_page_data', JSON.stringify(devUniversalPageData));
      
      // Verify it was saved
      const saved = localStorage.getItem('dev_universal_page_data');
      
      // Simulate successful save
      error = null;
    } else {
      const { error: dbError } = await supabase.from("prompt_pages").update({
        offer_enabled: formState.offer_enabled,
        offer_title: formState.offer_title,
        offer_body: formState.offer_body,
        offer_url: formState.offer_url,
        offer_timelock: formState.offer_timelock,
        emoji_sentiment_enabled: formState.emoji_sentiment_enabled,
        emoji_sentiment_question: formState.emoji_sentiment_question,
        emoji_feedback_message: formState.emoji_feedback_message,
        emoji_thank_you_message: formState.emoji_thank_you_message,
        emoji_feedback_popup_header: formState.emoji_feedback_popup_header,
        emoji_feedback_page_header: formState.emoji_feedback_page_header,
        review_platforms: formState.review_platforms,
        falling_icon: formState.falling_enabled ? formState.falling_icon : null,
        falling_icon_color: formState.falling_enabled ? formState.falling_icon_color : null,
        ai_button_enabled: formState.ai_button_enabled,
        fix_grammar_enabled: formState.fix_grammar_enabled,
        note_popup_enabled: formState.note_popup_enabled,
        show_friendly_note: formState.show_friendly_note,
        friendly_note: formState.friendly_note,
        kickstarters_enabled: formState.kickstarters_enabled,
        selected_kickstarters: formState.selected_kickstarters,
        recent_reviews_enabled: formState.recent_reviews_enabled,
        recent_reviews_scope: formState.recent_reviews_scope,
        keywords: formState.keywords,
        keyword_inspiration_enabled: formState.keyword_inspiration_enabled,
        selected_keyword_inspirations: formState.selected_keyword_inspirations,
        motivational_nudge_enabled: formState.motivational_nudge_enabled,
        motivational_nudge_text: formState.motivational_nudge_text,
        role_field_enabled: formState.role_field_enabled,
        falling_enabled: formState.falling_enabled,
      }).eq("id", universalPage.id);
      
      error = dbError;
    }
    
    if (error) {
      alert("Failed to save: " + error.message);
      setIsSaving(false);
      return;
    }
    
    // Mark customize-universal task as completed when user successfully saves
    try {
      if (accountId) {
        await markTaskAsCompleted(accountId, "customize-universal");
      }
    } catch (taskError) {
      console.error("Error marking customize-universal task as complete:", taskError);
    }
    
    // Fetch the updated universal prompt page to get the slug
    let updatedPage = null;
    
    // DEVELOPMENT MODE BYPASS - Use mock slug
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && localStorage.getItem('dev_auth_bypass') === 'true' && accountId === '12345678-1234-5678-9abc-123456789012') {
      updatedPage = {
        slug: 'universal-mdwd0peh'
      };
    } else {
      const { data: dbUpdatedPage } = await supabase
        .from("prompt_pages")
        .select("slug")
        .eq("account_id", accountId)
        .eq("is_universal", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      updatedPage = dbUpdatedPage;
    }
    
    if (updatedPage?.slug) setSlug(updatedPage.slug);
    if (updatedPage?.slug) {
      const modalData = {
        url: `${window.location.origin}/r/${updatedPage.slug}`,
        first_name: "", // Universal pages don't have specific customer info
        phone: "",
        email: "",
        isUniversal: true // Flag to identify this as a universal page
      };
      localStorage.setItem(
        "showPostSaveModal",
        JSON.stringify(modalData),
      );

      // Revalidate the prompt page cache to ensure fresh data
      await revalidatePromptPage(updatedPage.slug);
    }
    // Redirect to prompt-pages to show the modal
    router.push("/prompt-pages");
    setIsSaving(false);
  };

  const saveButton = (
    <button
      onClick={() => {
        const form = document.querySelector('form');
        if (form) {
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        }
      }}
      disabled={isSaving}
      className="bg-slate-blue text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-slate-blue/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isSaving ? "Saving..." : "Save & publish"}
    </button>
  );

  return (
    <PageCard
      icon={<Icon name="FaHome" className="w-9 h-9 text-slate-blue" size={36} />}
      topRightAction={saveButton}
    >
      <div className="flex flex-col mt-0 md:mt-[3px] mb-4">
        <h1 className="text-4xl font-bold text-slate-blue mt-0 mb-2">
          Universal Prompt Page
        </h1>
        <p className="text-gray-600 text-base max-w-md mt-0 mb-6">
          The Universal Prompt Page is designed to be shared with many.
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-lg text-white">Loading...</div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="text-red-800 font-medium">Error</div>
          <div className="text-red-600">{error}</div>
        </div>
      )}

      {/* Form */}
      {!isLoading && !error && initialData && (
        <PromptPageForm
          mode="edit"
          initialData={{
            ...initialData,
            review_type: "universal",
            is_universal: true,
            campaign_type: "public",
            slug: slug
          }}
          onSave={handleFormSave}
          pageTitle="Universal Prompt Page"
          supabase={supabase}
          businessProfile={businessProfile}
          isUniversal={true}
          onPublishSuccess={(newSlug) => {
            setSlug(newSlug);
            window.location.href = "/prompt-pages";
          }}
        />
      )}
    </PageCard>
  );
}
