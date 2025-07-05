// -----------------------------------------------------------------------------
// Location-Specific Prompt Page Edit Screen
// This file implements the edit UI for location-specific prompt pages.
// It fetches the location data and associated prompt page, then passes
// the location context to the UniversalPromptPageForm component.
// -----------------------------------------------------------------------------

"use client";
import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import UniversalPromptPageForm, {
  UniversalPromptFormState,
} from "../../universal/UniversalPromptPageForm";
import { FaMapMarkerAlt } from "react-icons/fa";
import PageCard from "@/app/components/PageCard";
import { supabase } from "@/utils/supabaseClient";
import AppLoader from "@/app/components/AppLoader";
import { getAccountIdForUser } from "@/utils/accountUtils";
import { BusinessLocation } from "@/types/business";
import { formatLocationAddress, getLocationDisplayName } from "@/utils/locationUtils";

// Helper to normalize platform names
const normalizePlatformName = (name: string): string => {
  if (!name) return "";
  if (name === "Google") return "Google Business Profile";
  if (name === "Facebook Page") return "Facebook";
  return name;
};

const normalizePlatforms = (platforms: any[] | null | undefined = []) =>
  (platforms ?? []).map((p) => ({ ...p, name: normalizePlatformName(p.name) }));

export default function EditLocationPromptPage() {
  const params = useParams();
  const router = useRouter();
  const locationId = params.id as string;
  const formRef = useRef<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<BusinessLocation | null>(null);
  const [promptPage, setPromptPage] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [initialData, setInitialData] = useState<UniversalPromptFormState | null>(null);
  const [businessReviewPlatforms, setBusinessReviewPlatforms] = useState<any[]>([]);
  const [locationBanner, setLocationBanner] = useState<React.ReactNode>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not signed in");
        
        const accountId = await getAccountIdForUser(user.id, supabase);
        if (!accountId) throw new Error("No account found");

        // Fetch business profile
        const { data: businessData } = await supabase
          .from("businesses")
          .select("*")
          .eq("account_id", accountId)
          .single();
        setBusiness(businessData);

        // Fetch location data
        const response = await fetch(`/api/business-locations/${locationId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch location");
        }
        const { location: locationData } = await response.json();
        setLocation(locationData);

        // Fetch associated prompt page
        const { data: pageData } = await supabase
          .from("prompt_pages")
          .select("*")
          .eq("business_location_id", locationId)
          .single();
        
        if (!pageData) {
          throw new Error("No prompt page found for this location");
        }
        
        setPromptPage(pageData);

        // Prepare initial form data
        const locationPlatforms = normalizePlatforms(locationData.review_platforms);
        const pagePlatforms = normalizePlatforms(pageData.review_platforms);
        const businessPlatforms = normalizePlatforms(businessData.review_platforms);
        
        // Priority: prompt page > location > business
        const effectivePlatforms = pagePlatforms.length ? pagePlatforms : 
                                  locationPlatforms.length ? locationPlatforms : 
                                  businessPlatforms;

        const merged: UniversalPromptFormState = {
          offerEnabled: pageData.offer_enabled ?? false,
          offerTitle: pageData.offer_title || "",
          offerBody: pageData.offer_body || "",
          offerUrl: pageData.offer_url || "",
          emojiSentimentEnabled: pageData.emoji_sentiment_enabled ?? false,
          emojiSentimentQuestion: pageData.emoji_sentiment_question || "How was your experience?",
          emojiFeedbackMessage: pageData.emoji_feedback_message || "How can we improve?",
          emojiThankYouMessage: pageData.emoji_thank_you_message || "Thank you for your feedback. It's important to us.",
          emojiLabels: pageData.emoji_labels || [
            "Excellent",
            "Satisfied",
            "Neutral",
            "Unsatisfied",
            "Frustrated",
          ],
          reviewPlatforms: effectivePlatforms,
          fallingEnabled: !!pageData.falling_icon,
          fallingIcon: pageData.falling_icon || "star",
          aiButtonEnabled: pageData.ai_button_enabled !== false,
        };

        setInitialData(merged);
        setBusinessReviewPlatforms(businessPlatforms);
        
        // Set location banner
        setLocationBanner(
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <h2 className="font-semibold text-gray-900 mb-1">
              {getLocationDisplayName(locationData)}
            </h2>
            <p className="text-sm text-gray-600">
              {formatLocationAddress(locationData)}
            </p>
          </div>
        );
      } catch (err) {
        console.error("Error loading location prompt page:", err);
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [locationId]);

  const handleSave = () => {
    // Check for review platforms before saving
    if (formRef.current && typeof formRef.current.getCurrentState === "function") {
      const currentFormState = formRef.current.getCurrentState();
      if (currentFormState && currentFormState.reviewPlatforms.length === 0) {
        if (!window.confirm("You didn't add a review platform. Are you sure you want to save?")) {
          return;
        }
      }
    }
    
    // Trigger form submission
    const form = document.querySelector('form');
    if (form) {
      form.dispatchEvent(new Event('submit', { bubbles: true }));
    }
  };

  const handleFormSave = async (formState: UniversalPromptFormState) => {
    setIsSaving(true);
    
    try {
      // Update the prompt page
      const { error } = await supabase
        .from("prompt_pages")
        .update({
          offer_enabled: formState.offerEnabled,
          offer_title: formState.offerTitle,
          offer_body: formState.offerBody,
          offer_url: formState.offerUrl,
          emoji_sentiment_enabled: formState.emojiSentimentEnabled,
          emoji_sentiment_question: formState.emojiSentimentQuestion,
          emoji_feedback_message: formState.emojiFeedbackMessage,
          emoji_thank_you_message: formState.emojiThankYouMessage,
          emoji_labels: formState.emojiLabels,
          review_platforms: formState.reviewPlatforms,
          falling_icon: formState.fallingEnabled ? formState.fallingIcon : null,
          ai_button_enabled: formState.aiButtonEnabled,
          business_location_id: locationId, // Ensure location ID is preserved
        })
        .eq("id", promptPage.id);

      if (error) {
        throw error;
      }

      // Set up the post-save modal data
      if (promptPage?.slug) {
        const modalData = { 
          url: `/r/${promptPage.slug}`,
          first_name: "", // Location pages don't have specific customer info
          phone: location?.phone || "",
          email: location?.email || ""
        };
        localStorage.setItem("showPostSaveModal", JSON.stringify(modalData));
      }
      
      // Redirect to prompt-pages
      window.location.href = "/prompt-pages";
    } catch (err) {
      alert("Failed to save: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setIsSaving(false);
    }
  };

  const actionButtons = (
    <div className="flex gap-3">
      <button
        type="button"
        className="bg-slate-blue text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-slate-blue/90 transition"
        onClick={handleSave}
        disabled={isSaving}
      >
        {isSaving ? "Saving..." : "Save & publish"}
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AppLoader />
      </div>
    );
  }

  if (error || !location || !promptPage || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Failed to load location prompt page"}</p>
          <button
            onClick={() => router.push("/prompt-pages")}
            className="text-slate-blue underline"
          >
            Back to Prompt Pages
          </button>
        </div>
      </div>
    );
  }

  return (
    <PageCard 
      icon={<FaMapMarkerAlt className="w-8 h-8 text-slate-blue" />}
      topRightAction={actionButtons}
    >
      <h1 className="text-3xl font-bold text-slate-blue mb-2">
        Edit Location Prompt Page
      </h1>
      {locationBanner}
      <p className="text-gray-600 mb-8">
        Customize the prompt page for this specific location. Changes here only affect this location's page.
      </p>

      <div className="pb-16">
        {initialData && (
          <UniversalPromptPageForm
            ref={formRef}
            onSave={handleFormSave}
            isLoading={isSaving}
            initialData={initialData}
            showResetButton={true}
            businessReviewPlatforms={businessReviewPlatforms}
          />
        )}
      </div>
      
      {/* Bottom Action Buttons */}
      <div className="border-t border-gray-200 pt-6 mt-8 flex justify-between items-center">
        {/* Reset Button - Bottom Left */}
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