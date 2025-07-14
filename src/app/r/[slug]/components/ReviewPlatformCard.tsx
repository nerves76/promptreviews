import React from 'react';
import { IconType } from 'react-icons';
import { applyCardTransparency } from '@/utils/colorUtils';

interface ReviewPlatformCardProps {
  platform: any;
  idx: number;
  businessProfile: any;
  promptPage: any;
  isOpen: boolean;
  isAccordion: boolean;
  reviewerFirstNames: string[];
  reviewerLastNames: string[];
  reviewerRoles: string[];
  platformReviewTexts: string[];
  aiLoading: number | null;
  isSubmitting: number | null;
  aiRewriteCounts: number[];
  openInstructionsIdx: number | null;
  submitError: string | null;
  onToggleAccordion: (idx: number) => void;
  onFirstNameChange: (idx: number, value: string) => void;
  onLastNameChange: (idx: number, value: string) => void;
  onRoleChange: (idx: number, value: string) => void;
  onReviewTextChange: (idx: number, value: string) => void;
  onRewriteWithAI: (idx: number) => void;
  onCopyAndSubmit: (idx: number, url: string) => void;
  onToggleInstructions: (idx: number | null) => void;
  getPlatformIcon: (url: string, platform: string) => { icon: IconType; label: string };
  getFontClass: (fontName: string) => string;
}

export default function ReviewPlatformCard({
  platform,
  idx,
  businessProfile,
  promptPage,
  isOpen,
  isAccordion,
  reviewerFirstNames,
  reviewerLastNames,
  reviewerRoles,
  platformReviewTexts,
  aiLoading,
  isSubmitting,
  aiRewriteCounts,
  openInstructionsIdx,
  submitError,
  onToggleAccordion,
  onFirstNameChange,
  onLastNameChange,
  onRoleChange,
  onReviewTextChange,
  onRewriteWithAI,
  onCopyAndSubmit,
  onToggleInstructions,
  getPlatformIcon,
  getFontClass,
}: ReviewPlatformCardProps) {
  const { icon: Icon, label } = getPlatformIcon(
    platform.url,
    platform.platform || platform.name,
  );
  const isUniversal = !!promptPage.is_universal;

  return (
    <div
      className="bg-white rounded-xl shadow-md p-6 border border-gray-200 relative mb-8"
      style={{
        background: applyCardTransparency(businessProfile.card_bg || "#F9FAFB", businessProfile.card_transparency ?? 1.0),
        color: businessProfile.card_text || "#1A1A1A",
      }}
    >
      {businessProfile?.card_inner_shadow && (
        <div
          className="pointer-events-none absolute inset-0 rounded-xl"
          style={{
            boxShadow: `inset 0 0 32px 0 ${businessProfile.card_shadow_color || '#222222'}${Math.round((businessProfile.card_shadow_intensity || 0.2) * 255).toString(16).padStart(2, '0')}`,
            borderRadius: '0.75rem',
            zIndex: 0,
          }}
        />
      )}
      
      {/* Icon in top-left corner */}
      <div
        className="absolute -top-4 -left-4 rounded-full shadow p-2 flex items-center justify-center"
        title={label}
        style={{ 
          zIndex: 20, 
          backgroundColor: businessProfile?.card_bg || '#ffffff'
        }}
      >
        <Icon
          className="w-7 h-7"
          style={{ color: businessProfile?.primary_color || "#4F46E5" }}
        />
      </div>

      {/* Accordion header */}
      <div
        className="flex items-center mb-4 mt-0 cursor-pointer w-full"
        onClick={() => {
          if (!isAccordion) return;
          onToggleAccordion(idx);
        }}
        style={{ userSelect: "none" }}
      >
        <div
          className={`text-2xl font-bold ${getFontClass(businessProfile?.primary_font)}`}
          style={{ color: businessProfile?.primary_color || "#4F46E5", marginTop: "-5px", marginLeft: "4px" }}
        >
          Leave a review on {(platform.platform || platform.name) === "Google Business Profile" ? "Google" : (platform.platform || platform.name) === "Other" && platform.customPlatform ? platform.customPlatform : (platform.platform || platform.name)}
        </div>
        <div className="flex-1" />
        {isAccordion && (
          <span className="text-lg flex items-center justify-end" style={{ color: businessProfile?.primary_color || "#4F46E5" }}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ display: 'inline', verticalAlign: 'middle', transition: 'transform 0.2s', transform: isOpen ? 'rotate(-90deg)' : 'rotate(0deg)' }}
            >
              <path d="M16 5l-8 7 8 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        )}
      </div>

      {/* Only render the rest if open */}
      {isOpen && (
        <>
          {/* Custom instructions popup */}
          {openInstructionsIdx === idx &&
            platform.customInstructions &&
            platform.customInstructions.trim() && (
              <div
                className="absolute z-50 left-1/2 -translate-x-1/2 top-10 bg-white border border-yellow-300 rounded shadow-lg p-4 text-yellow-900 text-sm max-w-xs w-max animate-fadein"
                style={{ minWidth: 220 }}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">Instructions</span>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-700 ml-2"
                    onClick={() => onToggleInstructions(null)}
                    aria-label="Close instructions"
                  >
                    ×
                  </button>
                </div>
                <div>{platform.customInstructions}</div>
              </div>
            )}

          {/* Name and role inputs */}
          {/* First and Last Name Row - Full width on mobile */}
          <div className="flex flex-col md:flex-row gap-4 w-full mb-4">
            <div className="flex-1">
              <label
                htmlFor={`reviewerFirstName-${idx}`}
                className="block text-sm font-medium text-gray-700"
              >
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id={`reviewerFirstName-${idx}`}
                value={reviewerFirstNames[idx]}
                onChange={(e) => onFirstNameChange(idx, e.target.value)}
                placeholder="Ezra"
                className="w-full mt-1 mb-2 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                style={{
                  background: businessProfile?.card_bg || "#F9FAFB",
                  color: businessProfile?.card_text || "#1A1A1A",
                  boxShadow: "inset 0 1px 3px 0 rgba(60,64,67,0.18), inset 0 1.5px 6px 0 rgba(60,64,67,0.10)",
                }}
                required
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor={`reviewerLastName-${idx}`}
                className="block text-sm font-medium text-gray-700"
              >
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id={`reviewerLastName-${idx}`}
                value={reviewerLastNames[idx]}
                onChange={(e) => onLastNameChange(idx, e.target.value)}
                placeholder="Scout"
                className="w-full mt-1 mb-2 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                style={{
                  background: businessProfile?.card_bg || "#F9FAFB",
                  color: businessProfile?.card_text || "#1A1A1A",
                  boxShadow: "inset 0 1px 3px 0 rgba(60,64,67,0.18), inset 0 1.5px 6px 0 rgba(60,64,67,0.10)",
                }}
                required
              />
            </div>
          </div>

          {/* Role Field Row - Full width on mobile */}
          <div className="w-full mb-4">
            <div className="flex-1">
              <label
                htmlFor={`reviewerRole-${idx}`}
                className="block text-sm font-medium text-gray-700"
              >
                Role/Position/Occupation
              </label>
              <input
                type="text"
                id={`reviewerRole-${idx}`}
                value={reviewerRoles[idx]}
                onChange={(e) => onRoleChange(idx, e.target.value)}
                placeholder="Customer"
                className="w-full mt-1 mb-2 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                style={{
                  background: businessProfile?.card_bg || "#F9FAFB",
                  color: businessProfile?.card_text || "#1A1A1A",
                  boxShadow: "inset 0 1px 3px 0 rgba(60,64,67,0.18), inset 0 1.5px 6px 0 rgba(60,64,67,0.10)",
                }}
              />
            </div>
          </div>

          {/* Review text area */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor={`reviewText-${idx}`}
                className="block text-sm font-medium text-gray-700"
              >
                Your Review <span className="text-red-500">*</span>
              </label>
              {platform.customInstructions && platform.customInstructions.trim() && (
                <button
                  type="button"
                  className="text-yellow-600 hover:text-yellow-800 text-sm font-medium flex items-center gap-1"
                  onClick={() => onToggleInstructions(openInstructionsIdx === idx ? null : idx)}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-4 h-4"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                  </svg>
                  Instructions
                </button>
              )}
            </div>
            <textarea
              id={`reviewText-${idx}`}
              value={platformReviewTexts[idx]}
              onChange={(e) => onReviewTextChange(idx, e.target.value)}
              placeholder="Share your experience..."
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              rows={4}
              style={{
                background: businessProfile?.card_bg || "#F9FAFB",
                color: businessProfile?.card_text || "#1A1A1A",
                boxShadow: "inset 0 1px 3px 0 rgba(60,64,67,0.18), inset 0 1.5px 6px 0 rgba(60,64,67,0.10)",
              }}
              required
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <button
              type="button"
              onClick={() => onRewriteWithAI(idx)}
              disabled={aiLoading === idx}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200 hover:text-white"
              style={{
                borderColor: businessProfile?.secondary_color || "#6B7280",
                color: businessProfile?.secondary_color || "#6B7280",
              }}
              onMouseEnter={(e) => {
                if (aiLoading !== idx) {
                  e.currentTarget.style.backgroundColor = businessProfile?.secondary_color || "#6B7280";
                  e.currentTarget.style.color = "white";
                }
              }}
              onMouseLeave={(e) => {
                if (aiLoading !== idx) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = businessProfile?.secondary_color || "#6B7280";
                }
              }}
            >
              {aiLoading === idx ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  Generating...
                </>
              ) : (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="w-4 h-4"
                  >
                    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0L9.937 15.5Z"/>
                    <path d="M20 3v4"/>
                    <path d="M22 5h-4"/>
                    <path d="M4 17v2"/>
                    <path d="M5 18H3"/>
                  </svg>
                  Generate with AI {aiRewriteCounts[idx] > 0 && `(${aiRewriteCounts[idx]}/3)`}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => onCopyAndSubmit(idx, platform.url)}
              disabled={isSubmitting === idx}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200 border-2"
              style={{
                backgroundColor: businessProfile?.secondary_color || "#4F46E5",
                borderColor: businessProfile?.secondary_color || "#4F46E5",
              }}
              onMouseEnter={(e) => {
                if (isSubmitting !== idx && !e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = businessProfile?.secondary_color || "#4F46E5";
                }
              }}
              onMouseLeave={(e) => {
                if (isSubmitting !== idx && !e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = businessProfile?.secondary_color || "#4F46E5";
                  e.currentTarget.style.color = "white";
                }
              }}
            >
              {isSubmitting === idx ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-4 h-4"
                  >
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                  </svg>
                  Copy & Submit
                </>
              )}
            </button>
          </div>
          
          {/* Error message display */}
          {submitError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {submitError}
            </div>
          )}
        </>
      )}
    </div>
  );
} 