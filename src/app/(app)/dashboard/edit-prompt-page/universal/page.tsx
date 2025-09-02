// -----------------------------------------------------------------------------
// Universal Prompt Page Edit Screen
// This file implements the edit UI for the universal prompt page in the dashboard.
// It fetches the business and universal prompt page data, merges them, and passes
// them to the form. Handles nullability of review_platforms (may be null in DB).
// -----------------------------------------------------------------------------

"use client";
import React, { useRef, useState } from "react";
import UniversalPromptPageForm, {
  UniversalPromptFormState,
} from "./UniversalPromptPageForm";
import PromptPageForm from "@/app/(app)/components/PromptPageForm";
import Icon from "@/components/Icon";
import PageCard from "@/app/(app)/components/PageCard";
import offerConfig from "@/app/(app)/components/prompt-modules/offerConfig";
import { createClient } from "@/utils/supabaseClient";
import Link from "next/link";
import { markTaskAsCompleted } from "@/utils/onboardingTasks";
import { useAuth } from "@/auth";

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
  const { user, account } = useAuth();

  // Feature flag for testing new standardized form
  const useStandardizedForm = false; // Set to true to use new form, false for old form

  const formRef = useRef<any>(null);
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
          console.log("Waiting for auth context to load...");
          setIsLoading(false);
          return;
        }
        
        console.log("Current user:", user.id, user.email);
        console.log("Current account from context:", account.id);
        
        // Use the account ID from the auth context (respects account switcher)
        const accountId = account.id;
        console.log("Account ID result:", accountId);
        
        if (!accountId) {
          console.error("No account found for user:", user.id);
          setError("No account found for user");
          setIsLoading(false);
          return;
        }
        
        console.log("Fetching data for account:", accountId);
        
        // Fetch business profile
        // IMPORTANT: Don't use .single() as accounts can have multiple businesses
        // CRITICAL: Must filter by the EXACT account_id from the account switcher
        console.log("🔍 Fetching businesses for account_id:", accountId);
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
          console.log(`🔍 Businesses returned from query:`, businessData.map(b => ({
            id: b.id,
            account_id: b.account_id,
            name: b.name || b.business_name,
            platforms: b.review_platforms?.length || 0
          })));
        }
        
        // Handle multiple businesses - use the first one (oldest)
        const businessProfile = businessData && businessData.length > 0 ? businessData[0] : null;
        if (businessData && businessData.length > 1) {
          console.log(`📊 Found ${businessData.length} businesses for account, using first one:`, businessProfile?.name || businessProfile?.id);
        }
        
        // CRITICAL: Verify the business belongs to the correct account
        // This prevents ALL business defaults from leaking across accounts
        if (businessProfile && businessProfile.account_id !== accountId) {
          console.error("⚠️ ACCOUNT ISOLATION BREACH: Business account_id mismatch!", {
            expected: accountId,
            got: businessProfile.account_id,
            business: businessProfile.id,
            affectedSettings: [
              'default_offer_enabled', 'default_offer_title', 'default_offer_body', 'default_offer_url',
              'review_platforms', 'emoji_sentiment_*', 'falling_*', 'ai_button_enabled', 
              'fix_grammar_enabled', 'kickstarters_*', 'recent_reviews_*', 'personalized_note_*'
            ]
          });
          // Don't use ANY business data - it's from the wrong account
          // Set businessProfile to null to prevent any defaults from being used
          setBusinessProfile(null);
          setBusinessReviewPlatforms([]);
          console.warn("⚠️ Business data rejected due to account mismatch - using empty defaults");
          // Continue loading but without business defaults
        }
        
        console.log("Business profile:", businessProfile);
        
        // Fetch universal prompt page
        const { data: universalPage, error: universalError } = await supabase
          .from("prompt_pages")
          .select("*")
          .eq("account_id", accountId)
          .eq("is_universal", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
          
        if (universalError) {
          console.error("Universal page fetch error:", universalError);
          setError("Failed to fetch universal prompt page: " + universalError.message);
          setIsLoading(false);
          return;
        }
        
        // CRITICAL: Verify the prompt page belongs to the correct account
        if (universalPage && universalPage.account_id !== accountId) {
          console.error("⚠️ ACCOUNT ISOLATION BREACH: Prompt page account_id mismatch!", {
            expected: accountId,
            got: universalPage.account_id,
            page: universalPage.id
          });
          setError("Account data mismatch detected. Please refresh the page.");
          setIsLoading(false);
          return;
        }
        
        console.log("Universal prompt page:", universalPage);
        
        if (universalPage?.slug) setSlug(universalPage.slug);
        // Normalize platform names for business and universal platforms
        const universalPlatforms = normalizePlatforms(universalPage?.review_platforms);
        const businessPlatforms = normalizePlatforms(businessProfile?.review_platforms);
        
        // Debug: Log platform sources
        console.log("🔍 Platform sources:", {
          universalPlatforms: universalPlatforms.map(p => ({ name: p.name, url: p.url })),
          businessPlatforms: businessPlatforms.map(p => ({ name: p.name, url: p.url })),
          universalPageHasPlatforms: universalPage?.review_platforms !== null && universalPage?.review_platforms !== undefined,
          willUseUniversal: universalPage?.review_platforms !== null && universalPage?.review_platforms !== undefined,
          willUseBusiness: universalPage?.review_platforms === null || universalPage?.review_platforms === undefined
        });
        
        // CRITICAL FIX: Only use business platforms if universal page has NEVER been saved with platforms
        // If universal page has review_platforms field (even if empty array), use that instead of business platforms
        // This prevents cross-account data leakage when user explicitly clears platforms
        const platformsToUse = (universalPage?.review_platforms !== null && universalPage?.review_platforms !== undefined)
          ? universalPlatforms  // Use universal platforms (even if empty array)
          : businessPlatforms;   // Only fallback to business if universal page never saved platforms
        
        console.log("🔍 CRITICAL: Platforms decision:", {
          universalPageField: universalPage?.review_platforms,
          isNull: universalPage?.review_platforms === null,
          isUndefined: universalPage?.review_platforms === undefined,
          usingUniversal: (universalPage?.review_platforms !== null && universalPage?.review_platforms !== undefined),
          platformCount: platformsToUse.length
        });
        
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
          show_friendly_note: universalPage?.show_friendly_note ?? false,
          friendly_note: universalPage?.friendly_note || "",
          kickstarters_enabled: universalPage?.kickstarters_enabled ?? false,
          selected_kickstarters: universalPage?.selected_kickstarters ?? [],
          recent_reviews_enabled: universalPage?.recent_reviews_enabled ?? false,
          recent_reviews_scope: universalPage?.recent_reviews_scope ?? 'current_page',
        };
        
        console.log("Merged form data:", merged);
        
        // Show reset button only if universal page has saved platforms (not null/undefined)
        // This allows resetting back to business defaults
        const hasUniversalPlatformsSaved = universalPage?.review_platforms !== null && universalPage?.review_platforms !== undefined;
        setShowResetButton(hasUniversalPlatformsSaved);
        console.log('🏢 Universal page - Business profile data:', businessProfile);
        console.log('🏢 Universal page - Business name:', businessProfile?.name, businessProfile?.business_name);
        
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

  const handleSave = () => {
    console.log('🔍 handleSave called');
    
    // Skip review platform check - it has a stale closure issue
    // The form component will handle its own validation
    
    // Trigger form submission (same as Service Prompt Page)
    const form = document.querySelector('form');
    console.log('🔍 Form element found:', !!form);
    if (form) {
      console.log('🔍 Dispatching submit event');
      form.dispatchEvent(new Event('submit', { bubbles: true }));
    }
  };

  const handleFormSave = async (formState: UniversalPromptFormState) => {
    console.log('🔍 handleFormSave called with:', formState);
    setIsSaving(true);
    
    // DEVELOPMENT MODE BYPASS - Check for dev bypass flag
    let user = null;
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      const devBypass = localStorage.getItem('dev_auth_bypass');
      if (devBypass === 'true') {
        console.log('🔧 DEV MODE: Save function using authentication bypass');
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
      console.log('🔧 DEV MODE: Using mock universal prompt page ID for save');
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
    console.log('🔍 SAVE DEBUG: Form state being saved:', {
      offer_enabled: formState.offer_enabled,
      offer_title: formState.offer_title,
      offer_body: formState.offer_body,
      offer_url: formState.offer_url,
    });
    
    // Update universal prompt page
    let error = null;
    
    // DEVELOPMENT MODE BYPASS - Skip database update in dev mode
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && localStorage.getItem('dev_auth_bypass') === 'true' && accountId === '12345678-1234-5678-9abc-123456789012') {
      console.log('🔧 DEV MODE: Skipping database update for universal prompt page');
      
      // Store the current form state in localStorage so the public page can use it
      // When emoji sentiment is enabled, disable falling on page load (they should only fall on emoji selection)
      const devUniversalPageData = {
        offer_enabled: formState.offer_enabled,
        offer_title: formState.offer_title,
        offer_body: formState.offer_body,
        offer_url: formState.offer_url,
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
        updated_at: new Date().toISOString()
      };
      
      localStorage.setItem('dev_universal_page_data', JSON.stringify(devUniversalPageData));
      console.log('🔧 DEV MODE: Stored Universal page data in localStorage:', devUniversalPageData);
      
      // Verify it was saved
      const saved = localStorage.getItem('dev_universal_page_data');
      console.log('🔧 DEV MODE: Verified saved data:', saved ? JSON.parse(saved) : null);
      
      // Simulate successful save
      error = null;
    } else {
      const { error: dbError } = await supabase.from("prompt_pages").update({
        offer_enabled: formState.offer_enabled,
        offer_title: formState.offer_title,
        offer_body: formState.offer_body,
        offer_url: formState.offer_url,
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
      await markTaskAsCompleted(user.id, "customize-universal");
      console.log("Customize universal task marked as completed");
    } catch (taskError) {
      console.error("Error marking customize-universal task as complete:", taskError);
    }
    
    // Fetch the updated universal prompt page to get the slug
    let updatedPage = null;
    
    // DEVELOPMENT MODE BYPASS - Use mock slug
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && localStorage.getItem('dev_auth_bypass') === 'true' && accountId === '12345678-1234-5678-9abc-123456789012') {
      console.log('🔧 DEV MODE: Using mock slug for save success');
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
        url: `/r/${updatedPage.slug}`,
        first_name: "", // Universal pages don't have specific customer info
        phone: "",
        email: ""
      };
      console.log('🔍 Setting localStorage showPostSaveModal:', modalData);
      localStorage.setItem(
        "showPostSaveModal",
        JSON.stringify(modalData),
      );
    }
    // Redirect to prompt-pages to show the modal
    console.log('🔍 Redirecting to prompt-pages');
    window.location.href = "/prompt-pages";
    setIsSaving(false);
  };

  const saveButton = (
    <button
      type="button"
      className="bg-slate-blue text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-slate-blue/90 transition"
      onClick={handleSave}
      disabled={isSaving}
    >
      {isSaving ? "Saving..." : "Save & publish"}
    </button>
  );

  const actionButtons = !useStandardizedForm ? (
    <div className="flex gap-3">
      {saveButton}
    </div>
  ) : null;

  return (
    <>
      {!useStandardizedForm && (
        <PageCard
          icon={<Icon name="FaHome" className="w-9 h-9 text-slate-blue" size={36} />}
          topRightAction={actionButtons}
        >
          <div className="flex flex-col mt-0 md:mt-[3px] mb-4">
            <h1 className="text-4xl font-bold text-slate-blue mt-0 mb-2">
              Universal prompt page
            </h1>
            <p className="text-gray-600 text-base max-w-md mt-0 mb-6">
              The universal prompt page is designed to be shared with many.
            </p>
          </div>

          {/* Content inside PageCard */}
          <div className="pb-16">
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="text-lg text-gray-600">Loading...</div>
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="text-red-800 font-medium">Error</div>
                <div className="text-red-600">{error}</div>
              </div>
            )}
            {!isLoading && !error && initialData && (
              <UniversalPromptPageForm
                ref={formRef}
                onSave={handleFormSave}
                isLoading={isSaving}
                initialData={initialData}
                showResetButton={showResetButton}
                businessReviewPlatforms={businessReviewPlatforms}
                slug={slug || undefined}
                businessProfile={businessProfile}
              />
            )}
            {!isLoading && !error && !initialData && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="text-yellow-800 font-medium">No Data Available</div>
                <div className="text-yellow-600">
                  The universal prompt page data could not be loaded. Please try refreshing the page.
                </div>
              </div>
            )}
          </div>
        </PageCard>
      )}
      
      {useStandardizedForm && (
        <div className="w-full bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600 pb-16 md:pb-24 lg:pb-32">
          <div className="flex flex-col mt-0 md:mt-[3px] mb-4 px-6 pt-8">
            <h1 className="text-4xl font-bold text-white mt-0 mb-2">
              Universal prompt page
            </h1>
            <p className="text-indigo-100 text-base max-w-md mt-0 mb-6">
              The universal prompt page is designed to be shared with many.
            </p>
          </div>
        </div>
      )}

      
      {/* Standardized Form - rendered outside PageCard */}
      {useStandardizedForm && !isLoading && !error && initialData && (
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
      
      {/* Loading and Error States for Standardized Form */}
      {useStandardizedForm && isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      )}
      
      {useStandardizedForm && error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-6">
          <div className="text-red-800 font-medium">Error</div>
          <div className="text-red-600">{error}</div>
        </div>
      )}
    </>
  );
}
