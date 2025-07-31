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
import { FaGlobe } from "react-icons/fa";
import PageCard from "@/app/components/PageCard";
import offerConfig from "@/app/components/prompt-modules/offerConfig";
import { createClient } from "@/utils/supabaseClient";
import Link from "next/link";
import { markTaskAsCompleted } from "@/utils/onboardingTasks";
import { getAccountIdForUser } from "@/utils/accountUtils";

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

  // Fetch universal prompt page and business profile, then merge
  React.useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setError("You must be signed in to access this page.");
          setIsLoading(false);
          return;
        }
        
        console.log("Current user:", user.id, user.email);
        
        // Get correct account ID
        const accountId = await getAccountIdForUser(user.id, supabase);
        console.log("Account ID result:", accountId);
        
        if (!accountId) {
          console.error("No account found for user:", user.id);
          setError("No account found for user");
          setIsLoading(false);
          return;
        }
        
        console.log("Fetching data for account:", accountId);
        
        // Fetch business profile
        const { data: businessProfile, error: businessError } = await supabase
          .from("businesses")
          .select("*")
          .eq("account_id", accountId)
          .single();
          
        if (businessError) {
          console.error("Business fetch error:", businessError);
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
        
        console.log("Universal prompt page:", universalPage);
        
        if (universalPage?.slug) setSlug(universalPage.slug);
        // Normalize platform names for business and universal platforms
        const universalPlatforms = normalizePlatforms(universalPage?.review_platforms);
        const businessPlatforms = normalizePlatforms(businessProfile?.review_platforms);
        const merged: UniversalPromptFormState = {
          offerEnabled:
            universalPage?.offer_enabled ??
            businessProfile?.default_offer_enabled ??
            false,
          offerTitle:
            universalPage?.offer_title ||
            businessProfile?.default_offer_title ||
            "",
          offerBody:
            universalPage?.offer_body ||
            businessProfile?.default_offer_body ||
            "",
          offerUrl:
            universalPage?.offer_url || businessProfile?.default_offer_url || "",
          emojiSentimentEnabled: universalPage?.emoji_sentiment_enabled ?? false,
          emojiSentimentQuestion: universalPage?.emoji_sentiment_question || "How was Your Experience?",
          emojiFeedbackMessage: universalPage?.emoji_feedback_message || "We value your feedback! Let us know how we can do better.",
          emojiThankYouMessage: universalPage?.emoji_thank_you_message || "Thank you for your feedback. It's important to us.",
          emojiFeedbackPopupHeader: universalPage?.emoji_feedback_popup_header || "How can we improve?",
          emojiFeedbackPageHeader: universalPage?.emoji_feedback_page_header || "Your feedback helps us grow",

          reviewPlatforms: universalPlatforms.length
            ? universalPlatforms
            : businessPlatforms,
          fallingEnabled: !!universalPage?.falling_icon,
          fallingIcon: universalPage?.falling_icon || "star",
          fallingIconColor: universalPage?.falling_icon_color || "#fbbf24",
          aiButtonEnabled: universalPage?.ai_button_enabled !== false,
          fixGrammarEnabled: universalPage?.fix_grammar_enabled !== false,
          notePopupEnabled: universalPage?.note_popup_enabled ?? false,
          friendlyNote: universalPage?.friendly_note || "",
          kickstartersEnabled: universalPage?.kickstarters_enabled ?? false,
          selectedKickstarters: universalPage?.selected_kickstarters ?? [],
        };
        
        console.log("Merged form data:", merged);
        
        // Show the button if there is a universal override, or if the merged list is empty
        setShowResetButton(
          universalPlatforms.length > 0 || merged.reviewPlatforms.length === 0,
        );
        setInitialData(merged);
        setBusinessReviewPlatforms(businessPlatforms);
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("An error occurred while loading the page");
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSave = () => {
    console.log('🔍 handleSave called');
    
    // Check for review platforms before saving
    if (formRef.current && typeof formRef.current.getCurrentState === "function") {
      const currentFormState = formRef.current.getCurrentState();
      console.log('🔍 Current form state:', currentFormState);
      if (currentFormState && currentFormState.reviewPlatforms.length === 0) {
        if (!window.confirm("You didn't add a review platform. Are you sure you want to save?")) {
          return;
        }
      }
    }
    
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
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      alert("You must be signed in to save.");
      setIsSaving(false);
      return;
    }
    // Get correct account ID
    const accountId = await getAccountIdForUser(user.id, supabase);
    if (!accountId) {
      alert("No account found for user");
      setIsSaving(false);
      return;
    }
    // Fetch the universal prompt page to get its id
    const { data: universalPage, error: fetchError } = await supabase
      .from("prompt_pages")
      .select("id")
      .eq("account_id", accountId)
      .eq("is_universal", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (fetchError || !universalPage) {
      alert("Failed to find universal prompt page: " + (fetchError?.message || "Not found"));
      setIsSaving(false);
      return;
    }
    // Update universal prompt page
    const { error } = await supabase.from("prompt_pages").update({
      offer_enabled: formState.offerEnabled,
      offer_title: formState.offerTitle,
      offer_body: formState.offerBody,
      offer_url: formState.offerUrl,
      emoji_sentiment_enabled: formState.emojiSentimentEnabled,
      emoji_sentiment_question: formState.emojiSentimentQuestion,
      emoji_feedback_message: formState.emojiFeedbackMessage,
      emoji_thank_you_message: formState.emojiThankYouMessage,
      emoji_feedback_popup_header: formState.emojiFeedbackPopupHeader,
      emoji_feedback_page_header: formState.emojiFeedbackPageHeader,
      review_platforms: formState.reviewPlatforms,
      falling_icon: formState.fallingEnabled ? formState.fallingIcon : null,
      falling_icon_color: formState.fallingEnabled ? formState.fallingIconColor : null,
      ai_button_enabled: formState.aiButtonEnabled,
      fix_grammar_enabled: formState.fixGrammarEnabled,
      note_popup_enabled: formState.notePopupEnabled,
      friendly_note: formState.friendlyNote,
      kickstarters_enabled: formState.kickstartersEnabled,
      selected_kickstarters: formState.selectedKickstarters,
    }).eq("id", universalPage.id);
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
    const { data: updatedPage } = await supabase
      .from("prompt_pages")
      .select("slug")
      .eq("account_id", accountId)
      .eq("is_universal", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
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

  const actionButtons = (
    <div className="flex gap-3">
      {saveButton}
    </div>
  );

  return (
    <PageCard
      icon={<FaGlobe className="w-9 h-9 text-slate-blue" />}
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
      
      {/* Bottom Action Buttons */}
      <div className={`border-t border-gray-200 pt-6 mt-8 flex items-center ${showResetButton ? 'justify-between' : 'justify-end'}`}>
        {/* Reset Button - Bottom Left */}
        {showResetButton && (
          <button
            type="button"
            className="px-4 py-2 text-sm rounded border-2 border-red-500 text-red-600 bg-white hover:bg-red-50 transition-colors"
            onClick={() => {
              if (window.confirm("Are you sure you want to reset to business defaults? Any customizations will be lost.")) {
                if (formRef.current && typeof formRef.current.getCurrentState === "function") {
                  const currentState = formRef.current.getCurrentState();
                  if (currentState) {
                    // Reset review platforms to business defaults
                    const updatedState = {
                      ...currentState,
                      reviewPlatforms: businessReviewPlatforms
                    };
                    // Update the form with reset data
                    setInitialData(updatedState);
                  }
                }
              }
            }}
            title="Reset to Business Defaults"
          >
            Reset to Defaults
          </button>
        )}
        
        {/* Save Button - Bottom Right */}
        <div className="flex gap-3">
          <button
            type="button"
            className="px-4 py-2 text-sm rounded bg-slate-blue text-white hover:bg-slate-blue/90 transition-colors"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save & publish"}
          </button>
        </div>
      </div>
    </PageCard>
  );
}
