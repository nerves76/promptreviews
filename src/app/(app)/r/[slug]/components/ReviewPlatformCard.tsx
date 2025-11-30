import React, { useState } from 'react';
import Icon, { IconName } from '@/components/Icon';
import { applyCardTransparency, getContrastTextColor } from '@/utils/colorUtils';
import ProcessIndicator from './ProcessIndicator';
import ButtonSpinner from '@/components/ButtonSpinner';
import {
  countWords,
  getWordLimitOrDefault,
  PROMPT_PAGE_WORD_LIMITS,
} from '@/constants/promptPageWordLimits';

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
  fixGrammarLoading: number | null;
  isSubmitting: number | null;
  isCopied: number | null;
  isRedirecting: number | null;
  hasSubmitted?: boolean;
  aiRewriteCounts: number[];
  fixGrammarCounts: number[];
  openInstructionsIdx: number | null;
  submitError: string | null;
  showAiToast: number | null;
  onToggleAccordion: (idx: number) => void;
  onFirstNameChange: (idx: number, value: string) => void;
  onLastNameChange: (idx: number, value: string) => void;
  onRoleChange: (idx: number, value: string) => void;
  onReviewTextChange: (idx: number, value: string) => void;
  onRewriteWithAI: (idx: number) => void;
  onFixGrammar: (idx: number) => void;
  onCopyAndSubmit: (idx: number, url: string) => void;
  onCopyReview?: (idx: number) => void; // Callback for secondary copy button
  onToggleInstructions: (idx: number | null) => void;
  onOpenKeywordInspiration?: () => void; // Callback to open keyword inspiration modal
  getPlatformIcon: (url: string, platform: string) => { icon: IconName; label: string };
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
  fixGrammarLoading,
  isSubmitting,
  isCopied,
  isRedirecting,
  hasSubmitted,
  aiRewriteCounts,
  fixGrammarCounts,
  openInstructionsIdx,
  submitError,
  showAiToast,
  onToggleAccordion,
  onFirstNameChange,
  onLastNameChange,
  onRoleChange,
  onReviewTextChange,
  onRewriteWithAI,
  onFixGrammar,
  onCopyAndSubmit,
  onCopyReview,
  onToggleInstructions,
  onOpenKeywordInspiration,
  getPlatformIcon,
  getFontClass,
}: ReviewPlatformCardProps) {
  const { icon: iconName, label: platformLabel } = getPlatformIcon(
    platform.url,
    platform.platform || platform.name,
  );
  // Use customPlatform name if platform is "Other", otherwise use the detected label
  const platformName = platform.platform || platform.name;
  const label = platformName === "Other" && platform.customPlatform
    ? platform.customPlatform
    : platformLabel;
  const isUniversal = !!promptPage.is_universal;
  const aiButtonEnabled = promptPage?.ai_button_enabled !== false;
  const fixGrammarEnabled = promptPage?.fix_grammar_enabled !== false;
  const keywordInspirationEnabled = promptPage?.keyword_inspiration_enabled &&
    promptPage?.selected_keyword_inspirations?.length > 0;
  const reviewText = platformReviewTexts[idx] || '';
  const configuredMin = typeof platform?.minWordCount === 'number'
    ? Math.max(platform.minWordCount, PROMPT_PAGE_WORD_LIMITS.MIN_REVIEW_WORDS)
    : PROMPT_PAGE_WORD_LIMITS.MIN_REVIEW_WORDS;
  const wordLimit = getWordLimitOrDefault(platform?.wordCount);
  const wordCount = countWords(reviewText);
  const isOverLimit = wordCount > wordLimit;
  const isUnderMin = wordCount > 0 && wordCount < configuredMin;
  const canSubmit = wordCount >= configuredMin && wordCount <= wordLimit;
  const progressValue = wordLimit > 0 ? Math.min(1, Math.max(0, wordCount / wordLimit)) : 0;

  // State for textarea focus (controls grammar button collapse)
  const [isTextareaFocused, setIsTextareaFocused] = useState(false);
  const [isGrammarHovered, setIsGrammarHovered] = useState(false);

  // Helper function to get card border style
  const getCardBorderStyle = () => {
    // Use database values with sensible defaults
    const borderWidth = businessProfile?.card_border_width ?? 2;
    const borderColor = businessProfile?.card_border_color || '#FFFFFF';
    const borderOpacity = businessProfile?.card_border_transparency ?? 0.8;
    
    if (borderWidth <= 0) return 'none';
    
    // Convert hex to RGB
    const hex = borderColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    return `${borderWidth}px solid rgba(${r}, ${g}, ${b}, ${borderOpacity})`;
  };

  // Helper function to get placeholder color (lighter version of card text)
  const getPlaceholderColor = () => {
    const textColor = businessProfile?.card_text || '#1A1A1A';
    // Convert hex to RGB and add 0.5 opacity for lighter appearance
    const hex = textColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, 0.5)`;
  };

  const transparency = businessProfile?.card_transparency ?? 0.95;
  const blurEnabled = transparency < 1;
  return (
    <div
      className={`rounded-xl shadow-lg p-6 relative mb-8 ${blurEnabled ? 'backdrop-blur-sm' : ''}`}
      style={{
        background: applyCardTransparency(businessProfile.card_bg || "#FFFFFF", transparency),
        color: businessProfile.card_text || "#1A1A1A",
        border: getCardBorderStyle(),
        backdropFilter: blurEnabled ? 'blur(8px)' : undefined
      }}
    >
      {businessProfile?.card_inner_shadow && (
        <div
          className="pointer-events-none absolute inset-0 rounded-xl"
          style={{
            boxShadow: `inset 0 0 32px 0 ${businessProfile.card_shadow_color || '#FFFFFF'}${Math.round((businessProfile.card_shadow_intensity || 0.30) * 255).toString(16).padStart(2, '0')}`,
            borderRadius: '0.75rem',
            zIndex: 0,
          }}
        />
      )}
      
      {/* Icon in top-left corner */}
      <div
        className={`absolute rounded-full shadow-lg p-2 flex items-center justify-center ${blurEnabled ? 'backdrop-blur-2xl' : ''}`}
        title={label}
        style={{
          top: '-20px',
          left: '-20px',
          zIndex: 20,
          // Use card background with same transparency setting
          backgroundColor: applyCardTransparency(businessProfile?.card_bg || '#FFFFFF', transparency),
          border: getCardBorderStyle(),
          backdropFilter: blurEnabled ? 'blur(12px)' : undefined,
          WebkitBackdropFilter: blurEnabled ? 'blur(12px)' : undefined
        }}
      >
        <Icon
          name={iconName}
          className="w-7 h-7"
          size={28}
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
          Create a review for {(platform.platform || platform.name) === "Google Business Profile" ? "Google" : (platform.platform || platform.name) === "Other" && platform.customPlatform ? platform.customPlatform : (platform.platform || platform.name)}
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
          {/* Process Indicator */}
          <div className="mt-6">
            <ProcessIndicator
              primaryColor={businessProfile?.primary_color}
              cardBackgroundColor={businessProfile?.card_bg}
              cardTransparency={businessProfile?.card_transparency ?? 0.30}
              cardTextColor={businessProfile?.card_text || "#1A1A1A"}
              platformName={label}
            />
          </div>
          
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
                className="block text-sm font-medium"
                style={{ color: businessProfile?.card_text || "#1A1A1A" }}
              >
                First name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id={`reviewerFirstName-${idx}`}
                value={reviewerFirstNames[idx]}
                onChange={(e) => onFirstNameChange(idx, e.target.value)}
                placeholder="Gerald"
                className="w-full mt-1 mb-2 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 sm:text-sm"
                style={{
                  background: applyCardTransparency(
                    businessProfile?.card_bg || "#F9FAFB",
                    Math.min(1, (businessProfile?.card_transparency ?? 0.30) + 0.4)
                  ),
                  color: businessProfile?.input_text_color || "#1A1A1A",
                  boxShadow: "inset 0 2px 4px 0 rgba(0,0,0,0.2), inset 0 1px 2px 0 rgba(0,0,0,0.15)",
                  border: "none",
                }}
                required
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor={`reviewerLastName-${idx}`}
                className="block text-sm font-medium"
                style={{ color: businessProfile?.card_text || "#1A1A1A" }}
              >
                Last name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id={`reviewerLastName-${idx}`}
                value={reviewerLastNames[idx]}
                onChange={(e) => onLastNameChange(idx, e.target.value)}
                placeholder="McGrew"
                className="w-full mt-1 mb-2 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 sm:text-sm"
                style={{
                  background: applyCardTransparency(
                    businessProfile?.card_bg || "#F9FAFB",
                    Math.min(1, (businessProfile?.card_transparency ?? 0.30) + 0.4)
                  ),
                  color: businessProfile?.input_text_color || "#1A1A1A",
                  boxShadow: "inset 0 2px 4px 0 rgba(0,0,0,0.2), inset 0 1px 2px 0 rgba(0,0,0,0.15)",
                  border: "none",
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
                className="block text-sm font-medium"
                style={{ color: businessProfile?.card_text || "#1A1A1A" }}
              >
                Role/Position/Occupation
              </label>
              <input
                type="text"
                id={`reviewerRole-${idx}`}
                value={reviewerRoles[idx]}
                onChange={(e) => onRoleChange(idx, e.target.value)}
                placeholder="Zoo Director"
                className="w-full mt-1 mb-2 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 sm:text-sm"
                style={{
                  background: applyCardTransparency(
                    businessProfile?.card_bg || "#F9FAFB",
                    Math.min(1, (businessProfile?.card_transparency ?? 0.30) + 0.4)
                  ),
                  color: businessProfile?.input_text_color || "#1A1A1A",
                  boxShadow: "inset 0 2px 4px 0 rgba(0,0,0,0.2), inset 0 1px 2px 0 rgba(0,0,0,0.15)",
                  border: "none",
                }}
              />
            </div>
          </div>

          {/* Review text area */}
          <div className="mb-4 relative">
            {/* AI Generation Toast */}
            {showAiToast === idx && (
              <div
                className="absolute -top-2 left-0 right-0 z-30 bg-green-50 border border-green-200 rounded-lg px-4 py-2 shadow-md animate-fadein"
                style={{
                  animation: 'fadein 0.3s ease-in-out',
                }}
              >
                <p className="text-sm font-medium text-green-800 text-center">
                  ✨ Edit to make the review reflect your unique experience
                </p>
              </div>
            )}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <label
                  htmlFor={`reviewText-${idx}`}
                  className="block text-sm font-medium"
                  style={{ color: businessProfile?.card_text || "#1A1A1A" }}
                >
                  Your review <span className="text-red-500">*</span>
                </label>
                {aiButtonEnabled && (
                  <button
                    type="button"
                    onClick={() => onRewriteWithAI(idx)}
                    disabled={aiLoading === idx || aiRewriteCounts[idx] >= 3}
                    className="px-2 py-0.5 rounded text-xs font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-all duration-200 border"
                    style={{
                      backgroundColor: "transparent",
                      borderColor: businessProfile?.primary_color || "#2563EB",
                      color: businessProfile?.primary_color || "#2563EB",
                    }}
                    onMouseEnter={(e) => {
                      if (aiLoading !== idx && aiRewriteCounts[idx] < 3) {
                        e.currentTarget.style.backgroundColor = businessProfile?.primary_color || "#2563EB";
                        e.currentTarget.style.color = getContrastTextColor(businessProfile?.primary_color || "#2563EB");
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (aiLoading !== idx && aiRewriteCounts[idx] < 3) {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = businessProfile?.primary_color || "#2563EB";
                      }
                    }}
                  >
                    {aiLoading === idx ? (
                      <>
                        <ButtonSpinner size={12} />
                        <span className="hidden sm:inline">Generating...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="w-3 h-3"
                        >
                          <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0L9.937 15.5Z"/>
                          <path d="M20 3v4"/>
                          <path d="M22 5h-4"/>
                          <path d="M4 17v2"/>
                          <path d="M5 18H3"/>
                        </svg>
                        <span className="hidden sm:inline">Generate with AI</span>
                        <span className="sm:hidden">AI</span>
                        {aiRewriteCounts[idx] > 0 && <span className="hidden sm:inline">({aiRewriteCounts[idx]}/3)</span>}
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {keywordInspirationEnabled && onOpenKeywordInspiration && (
                  <button
                    type="button"
                    onClick={onOpenKeywordInspiration}
                    className="px-3 py-1 border border-gray-300 rounded text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 flex items-center gap-1 transition-all duration-200 hover:text-white"
                    style={{
                      borderColor: businessProfile?.secondary_color || "#6B7280",
                      color: businessProfile?.secondary_color || "#6B7280",
                    }}
                    title="Boost online visibility of your review by adding any of these suggested phrases"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = businessProfile?.secondary_color || "#6B7280";
                      e.currentTarget.style.color = getContrastTextColor(businessProfile?.secondary_color || "#4F46E5");
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = businessProfile?.secondary_color || "#6B7280";
                    }}
                  >
                    <Icon name="mushroom" className="w-3.5 h-3.5" size={14} />
                    <span>Power-up phrases</span>
                  </button>
                )}
                {platform.customInstructions && platform.customInstructions.trim() && (
                  <button
                    type="button"
                    className="text-sm font-medium flex items-center gap-1 transition-colors duration-200"
                    onClick={() => onToggleInstructions(openInstructionsIdx === idx ? null : idx)}
                    style={{
                      color: businessProfile?.secondary_color || "#6B7280",
                    }}
                    onMouseEnter={(e) => {
                      const currentColor = businessProfile?.secondary_color || "#6B7280";
                      // Darken the color on hover
                      e.currentTarget.style.opacity = "0.7";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "1";
                    }}
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
            </div>
            <div className="relative">
              <textarea
                id={`reviewText-${idx}`}
                value={platformReviewTexts[idx]}
                onChange={(e) => onReviewTextChange(idx, e.target.value)}
                onFocus={() => setIsTextareaFocused(true)}
                onBlur={() => setIsTextareaFocused(false)}
                placeholder="Share your experience..."
                className="w-full p-3 pb-8 rounded-lg focus:ring-2 focus:ring-indigo-500 sm:text-sm"
                rows={4}
                style={{
                  background: applyCardTransparency(
                    businessProfile?.card_bg || "#F9FAFB",
                    Math.min(1, (businessProfile?.card_transparency ?? 0.30) + 0.4)
                  ),
                  color: businessProfile?.input_text_color || "#1A1A1A",
                  boxShadow: "inset 0 2px 4px 0 rgba(0,0,0,0.2), inset 0 1px 2px 0 rgba(0,0,0,0.15)",
                  border: "none",
                }}
                required
              />
              {/* Fix Grammar button - inside textarea, top-right corner */}
              {fixGrammarEnabled && (
                <button
                  type="button"
                  onClick={() => onFixGrammar(idx)}
                  disabled={fixGrammarLoading === idx || fixGrammarCounts[idx] >= 3}
                  onMouseEnter={() => setIsGrammarHovered(true)}
                  onMouseLeave={() => setIsGrammarHovered(false)}
                  className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-all duration-200"
                  style={{
                    // Calculate contrast against input background (which is card_bg with added opacity)
                    color: getContrastTextColor(businessProfile?.card_bg || "#FFFFFF"),
                    backgroundColor: applyCardTransparency(businessProfile?.card_bg || "#FFFFFF", 0.85),
                  }}
                  title="AI will check and correct spelling and grammar errors in your review"
                >
                  {fixGrammarLoading === idx ? (
                    <>
                      <ButtonSpinner size={14} />
                      {(!isTextareaFocused || isGrammarHovered) && <span>Fixing...</span>}
                    </>
                  ) : (
                    <>
                      <Icon name="FaSpellCheck" className="w-4 h-4" size={16} />
                      {(!isTextareaFocused || isGrammarHovered) && (
                        <span>Fix grammar{fixGrammarCounts[idx] > 0 && ` (${fixGrammarCounts[idx]}/3)`}</span>
                      )}
                    </>
                  )}
                </button>
              )}
              {/* Word count indicator - appears at 70%+ inside textarea */}
              {progressValue >= 0.7 && (
                <div
                  className="absolute bottom-2 left-3 text-xs font-medium transition-opacity duration-300 px-1.5 py-0.5 rounded"
                  style={{
                    color: progressValue >= 0.95
                      ? '#dc2626' // red at 95%+
                      : progressValue >= 0.8
                        ? '#f97316' // soft orange at 80%+
                        : '#22c55e', // light green at 70%+
                    backgroundColor: applyCardTransparency(businessProfile?.card_bg || "#FFFFFF", 0.85),
                    opacity: 1,
                    animation: 'fadeIn 0.3s ease-in-out',
                  }}
                >
                  {wordCount}/{wordLimit}
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            {hasSubmitted ? (
              <>
                {/* Copy review button */}
                <button
                  type="button"
                  onClick={() => onCopyReview?.(idx)}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center gap-2 transition-all duration-200 border-2"
                  style={{
                    backgroundColor: "transparent",
                    borderColor: businessProfile?.secondary_color || "#4F46E5",
                    color: businessProfile?.secondary_color || "#4F46E5",
                  }}
                >
                  Copy review
                </button>
                {/* Visit platform button */}
                <button
                  type="button"
                  onClick={() => {
                    if (platform.url) {
                      window.open(platform.url, "_blank", "noopener,noreferrer");
                    }
                  }}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center gap-2 transition-all duration-200 border-2"
                  style={{
                    backgroundColor: businessProfile?.secondary_color || "#4F46E5",
                    borderColor: businessProfile?.secondary_color || "#4F46E5",
                    color: getContrastTextColor(businessProfile?.secondary_color || "#4F46E5"),
                  }}
                >
                  <span className="text-center">Visit {label}</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => onCopyAndSubmit(idx, platform.url)}
                disabled={isSubmitting === idx || isCopied === idx || isRedirecting === idx}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200 border-2"
                style={{
                  backgroundColor: businessProfile?.secondary_color || "#4F46E5",
                  borderColor: businessProfile?.secondary_color || "#4F46E5",
                  color: getContrastTextColor(businessProfile?.secondary_color || "#4F46E5"),
                }}
                title={`We'll copy your review and open ${label}. Just paste and post.`}
                onMouseEnter={(e) => {
                  if (isSubmitting !== idx && isCopied !== idx && isRedirecting !== idx && !e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = businessProfile?.secondary_color || "#4F46E5";
                  }
                }}
                onMouseLeave={(e) => {
                  if (isSubmitting !== idx && isCopied !== idx && isRedirecting !== idx && !e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = businessProfile?.secondary_color || "#4F46E5";
                    e.currentTarget.style.color = getContrastTextColor(businessProfile?.secondary_color || "#4F46E5");
                  }
                }}
              >
                {isSubmitting === idx ? (
                  <>
                    <ButtonSpinner size={16} />
                    Copying review...
                  </>
                ) : isRedirecting === idx ? (
                  <>
                    <ButtonSpinner size={16} />
                    Redirecting...
                  </>
                ) : (
                  <span className="text-center">Copy & open {label}</span>
                )}
              </button>
            )}
          </div>

          {/* Compliance text */}
          <p className="mt-3 text-xs text-gray-500 text-center">
            By submitting, you agree to our{" "}
            <a href="https://promptreviews.app/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700">
              Terms
            </a>{" "}
            and{" "}
            <a href="https://promptreviews.app/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700">
              Privacy Policy
            </a>
            , and confirm the review reflects your experience.
          </p>

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
