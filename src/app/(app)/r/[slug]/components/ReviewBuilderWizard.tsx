"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/app/(app)/components/ui/input";
import { Textarea } from "@/app/(app)/components/ui/textarea";
import { Button } from "@/app/(app)/components/ui/button";
import Icon from "@/components/Icon";
import { generateContextualReview } from "@/utils/aiReviewGeneration";
import {
  countWords,
  getWordLimitOrDefault,
  PROMPT_PAGE_WORD_LIMITS,
} from "@/constants/promptPageWordLimits";
import dynamic from "next/dynamic";
import PromptReviewsLogo from "@/app/(app)/dashboard/components/PromptReviewsLogo";

// Dynamically import FallingAnimation
const FallingAnimation = dynamic(() => import("./FallingAnimation"), {
  ssr: false,
  loading: () => null
});

interface ReviewBuilderWizardProps {
  promptPage: any;
  businessProfile: any;
  currentUser?: any;
}

const DEFAULT_BUILDER_QUESTIONS = (businessName?: string) => [
  {
    id: "builder-q1",
    prompt: `What stood out about your experience with ${businessName || 'our business'}?`,
    helperText: "Share the moment that made the biggest impression.",
    required: true,
  },
  {
    id: "builder-q2",
    prompt: `What benefits of working with ${businessName || 'our business'} do you think others should know?`,
    helperText: "Mention results, unique touches, or unexpected perks.",
    required: true,
  },
];

const normalizeQuestion = (question: any, index: number, businessName?: string) => ({
  id: question?.id || `review-builder-${index}`,
  prompt:
    question?.prompt ||
    DEFAULT_BUILDER_QUESTIONS(businessName)[
      index % DEFAULT_BUILDER_QUESTIONS(businessName).length
    ].prompt,
  helperText: question?.helperText || question?.helper_text || "",
  placeholderText: question?.placeholderText || question?.placeholder_text || "Type your answer...",
  required: question?.required !== undefined ? Boolean(question.required) : true,
  questionType: question?.questionType || question?.question_type || 'text',
  options: Array.isArray(question?.options) ? question.options : undefined,
});

const copyToClipboard = async (text: string) => {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  // Fallback for older browsers
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
    return true;
  } finally {
    document.body.removeChild(textarea);
  }
};

export default function ReviewBuilderWizard({
  promptPage,
  businessProfile,
  currentUser,
}: ReviewBuilderWizardProps) {
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("");
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [reviewText, setReviewText] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiAttemptCount, setAiAttemptCount] = useState(0);
  const [submitIndex, setSubmitIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showFallingAnimation, setShowFallingAnimation] = useState(false);
  const [reviewCopied, setReviewCopied] = useState(false);
  const attemptStorageKey = useMemo(
    () => (promptPage?.slug ? `reviewBuilderAiAttempts_${promptPage.slug}` : null),
    [promptPage?.slug],
  );

  useEffect(() => {
    if (!attemptStorageKey) return;
    if (typeof window === "undefined") return;
    const saved = sessionStorage.getItem(attemptStorageKey);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!Number.isNaN(parsed)) {
        setAiAttemptCount(parsed);
      }
    }
  }, [attemptStorageKey]);

  const persistAttemptCount = (count: number) => {
    setAiAttemptCount(count);
    if (attemptStorageKey && typeof window !== "undefined") {
      sessionStorage.setItem(attemptStorageKey, count.toString());
    }
  };

  const keywordOptions = useMemo(() => {
    if (
      Array.isArray(promptPage?.selected_keyword_inspirations) &&
      promptPage.selected_keyword_inspirations.length > 0
    ) {
      return promptPage.selected_keyword_inspirations;
    }
    if (Array.isArray(promptPage?.keywords) && promptPage.keywords.length > 0) {
      return promptPage.keywords;
    }
    if (typeof businessProfile?.keywords === "string") {
      return businessProfile.keywords
        .split(",")
        .map((keyword: string) => keyword.trim())
        .filter(Boolean);
    }
    return [];
  }, [promptPage?.selected_keyword_inspirations, promptPage?.keywords, businessProfile?.keywords]);

const businessName = businessProfile?.business_name || businessProfile?.name || "our business";

const builderQuestions = useMemo(() => {
  if (Array.isArray(promptPage?.builder_questions) && promptPage.builder_questions.length > 0) {
    return promptPage.builder_questions.map((question: any, index: number) =>
      normalizeQuestion(question, index, businessName),
    );
  }
  return DEFAULT_BUILDER_QUESTIONS(businessName);
}, [promptPage?.builder_questions, businessName]);

  const activePlatforms = useMemo(() => {
    if (Array.isArray(promptPage?.review_platforms) && promptPage.review_platforms.length > 0) {
      return promptPage.review_platforms;
    }
    if (Array.isArray(businessProfile?.review_platforms)) {
      return businessProfile.review_platforms;
    }
    return [];
  }, [promptPage?.review_platforms, businessProfile?.review_platforms]);

  const localStorageKey = useMemo(() => {
    const slug = promptPage?.slug || promptPage?.id || "review-builder";
    return `reviewBuilderDraft_${slug}`;
  }, [promptPage?.slug, promptPage?.id]);

  // Initialize answers map
  useEffect(() => {
    setAnswers((prev) => {
      const next: Record<string, string> = {};
      builderQuestions.forEach((question, index) => {
        const id = question.id || `review-builder-${index}`;
        next[id] = prev[id] || "";
      });
      return next;
    });
  }, [builderQuestions]);

  // Load draft from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(localStorageKey);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      setFirstName(parsed.firstName || "");
      setLastName(parsed.lastName || "");
      setRole(parsed.role || "");
      setSelectedKeywords(Array.isArray(parsed.selectedKeywords) ? parsed.selectedKeywords : []);
      if (parsed.answers && typeof parsed.answers === "object") {
        setAnswers((prev) => ({ ...prev, ...parsed.answers }));
      }
      if (parsed.reviewText) {
        setReviewText(parsed.reviewText);
      }
    } catch (storageError) {
      console.error("Failed to parse review builder draft:", storageError);
    }
  }, [localStorageKey]);

  // Persist draft whenever inputs change
  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload = {
      firstName,
      lastName,
      role,
      selectedKeywords,
      answers,
      reviewText,
    };
    localStorage.setItem(localStorageKey, JSON.stringify(payload));
  }, [firstName, lastName, role, selectedKeywords, answers, reviewText, localStorageKey]);

  const handleKeywordToggle = (keyword: string) => {
    setSelectedKeywords((prev) => {
      if (prev.includes(keyword)) {
        return prev.filter((k) => k !== keyword);
      }
      if (prev.length >= 3) {
        return prev; // limit to 3 selections
      }
      return [...prev, keyword];
    });
  };

  const updateAnswer = (questionId: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const resetMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  const validateCurrentStep = () => {
    if (step === 1) {
      if (!firstName.trim() || !lastName.trim() || !role.trim()) {
        setError("Please add your first name, last name, and role.");
        return false;
      }
    }
    if (step === 2) {
      // Step 2 is now questions - validate all required questions are answered
      const missing = builderQuestions.filter((question) => {
        if (!question.required) return false;
        const answer = answers[question.id];

        // For checkbox/radio, check if at least one option is selected
        if (question.questionType === 'checkbox') {
          return !Array.isArray(answer) || answer.length === 0;
        }

        // For text/radio, check if answer exists and is not empty
        return !answer || (typeof answer === 'string' && !answer.trim());
      });
      if (missing.length > 0) {
        setError("Please answer all required questions.");
        return false;
      }
    }
    if (step === 3) {
      // Step 3 is now highlights (keywords) - optional, no validation needed
      // Users can skip this or select 0-3 keywords
    }
    setError(null);
    return true;
  };

  const goToNext = () => {
    if (step === 4) return;
    if (!validateCurrentStep()) return;
    resetMessages();
    setStep((prev) => prev + 1);
  };

  const goToPrevious = () => {
    if (step === 1) return;
    resetMessages();
    setStep((prev) => prev - 1);
  };

  const handleGenerateReview = async () => {
    if (!validateCurrentStep()) return;
    if (aiAttemptCount >= 3) {
      setError("You've reached the 3 AI generations limit for this session.");
      return;
    }
    setAiGenerating(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const primaryPlatform = activePlatforms[0];
      const platformName =
        primaryPlatform?.platform || primaryPlatform?.name || "review site";
      const wordLimit = getWordLimitOrDefault(primaryPlatform?.wordCount);

      const answerSummary = builderQuestions
        .map((question) => {
          const answer = answers[question.id];
          let response = "Not provided";

          if (Array.isArray(answer)) {
            // Checkbox answers
            response = answer.length > 0 ? answer.join(", ") : "Not provided";
          } else if (typeof answer === 'string') {
            response = answer.trim() || "Not provided";
          }

          return `${question.prompt}: ${response}`;
        })
        .join("\n");

      const keywordInstruction =
        selectedKeywords.length > 0
          ? `Please incorporate these keywords: ${selectedKeywords.join(", ")}.`
          : "";

      const reviewerRole = role || "customer";

      const generated = await generateContextualReview(
        businessProfile,
        promptPage,
        {
          firstName,
          lastName,
          role: reviewerRole,
        },
        platformName,
        wordLimit,
        `${keywordInstruction}\n\nReview builder responses:\n${answerSummary}`,
      );

      setReviewText(generated);
      persistAttemptCount(aiAttemptCount + 1);
      setSuccessMessage("Draft ready! Review the AI copy below.");
      setStep(4);

      // Trigger falling animation on successful generation
      setShowFallingAnimation(true);
      setTimeout(() => setShowFallingAnimation(false), 5000); // Show for 5 seconds
    } catch (generationError: any) {
      console.error("Failed to generate review:", generationError);
      setError("Unable to generate the review. Please try again.");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleCopyAndSubmit = async (index: number, url: string) => {
    if (currentUser) {
      setError("You must sign out of the dashboard before submitting a review.");
      return;
    }
    if (!reviewText.trim()) {
      setError("Generate the review before copying.");
      return;
    }
    const wordCount = countWords(reviewText);
    const platform = activePlatforms[index];
    const maxWords = getWordLimitOrDefault(platform?.wordCount);
    const minWords = Math.max(
      platform?.minWordCount || PROMPT_PAGE_WORD_LIMITS.MIN_REVIEW_WORDS,
      PROMPT_PAGE_WORD_LIMITS.MIN_REVIEW_WORDS,
    );

    if (wordCount < minWords) {
      setError(`Please add at least ${minWords} words before copying.`);
      return;
    }
    if (wordCount > maxWords) {
      setError(`Please trim the review to ${maxWords} words or fewer.`);
      return;
    }
    if (!url) {
      setError("Missing review link for this platform.");
      return;
    }

    setSubmitIndex(index);
    setError(null);
    setSuccessMessage(null);
    try {
      await copyToClipboard(reviewText);
      const builderAnswersPayload = builderQuestions.map((question) => ({
        id: question.id,
        prompt: question.prompt,
        answer: answers[question.id] || "",
      }));

      const response = await fetch("/api/track-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptPageId: promptPage.id,
          platform: platform?.platform || platform?.name || "review site",
          status: "submitted",
          first_name: firstName,
          last_name: lastName,
          reviewContent: reviewText,
          promptPageType: promptPage.is_universal ? "universal" : "custom",
          review_type: "review_builder",
          role,
          builderAnswers: builderAnswersPayload,
          builderKeywords: selectedKeywords,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.error || "Failed to track review.");
      }

      setSuccessMessage("Copied! Paste the review on the destination site.");
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (submitError: any) {
      console.error("Review submission failed:", submitError);
      setError(submitError?.message || "Failed to copy review.");
    } finally {
      setSubmitIndex(null);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <p className="text-2xl font-semibold text-white mb-2">
                First, tell us about yourself
              </p>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  aria-label="First name"
                  className="text-lg py-3 bg-white/90 backdrop-blur"
                />
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  aria-label="Last name"
                  className="text-lg py-3 bg-white/90 backdrop-blur"
                />
              </div>
              <Input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Your role (e.g., client, homeowner, director)"
                aria-label="Role"
                className="text-lg py-3 bg-white/90 backdrop-blur"
              />
            </div>
          </div>
        );
      case 2:
        // Show one question at a time in step 2 (moved from step 3)
        const currentQuestionIndex = Object.keys(answers).filter(id => {
          const answer = answers[id];
          return builderQuestions.some(q => q.id === id && (
            (typeof answer === 'string' && answer.trim()) ||
            (Array.isArray(answer) && answer.length > 0)
          ));
        }).length;
        const currentQuestion = builderQuestions[Math.min(currentQuestionIndex, builderQuestions.length - 1)];
        const isLastQuestion = currentQuestionIndex >= builderQuestions.length - 1;

        return (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <p className="text-sm text-white/70">
                Question {Math.min(currentQuestionIndex + 1, builderQuestions.length)} of {builderQuestions.length}
              </p>
            </div>
            <div className="space-y-4">
              <p className="text-2xl font-semibold text-white text-center">
                {currentQuestion.prompt}
                {currentQuestion.required && <span className="text-white/80 ml-1">*</span>}
              </p>
              {currentQuestion.helperText && (
                <p className="text-base text-white/80 text-center">{currentQuestion.helperText}</p>
              )}

              {currentQuestion.questionType === 'checkbox' && currentQuestion.options ? (
                <div className="space-y-3 bg-white/90 backdrop-blur rounded-lg p-4">
                  {currentQuestion.options.map((option) => (
                    <label key={option} className="flex items-center gap-3 cursor-pointer hover:bg-white/50 p-2 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={(answers[currentQuestion.id] as string[] || []).includes(option)}
                        onChange={(e) => {
                          const current = (answers[currentQuestion.id] as string[]) || [];
                          const updated = e.target.checked
                            ? [...current, option]
                            : current.filter(o => o !== option);
                          updateAnswer(currentQuestion.id, updated);
                        }}
                        className="w-5 h-5 rounded border-gray-300 text-slate-blue focus:ring-slate-blue"
                      />
                      <span className="text-lg text-gray-900">{option}</span>
                    </label>
                  ))}
                </div>
              ) : currentQuestion.questionType === 'radio' && currentQuestion.options ? (
                <div className="space-y-3 bg-white/90 backdrop-blur rounded-lg p-4">
                  {currentQuestion.options.map((option) => (
                    <label key={option} className="flex items-center gap-3 cursor-pointer hover:bg-white/50 p-2 rounded transition-colors">
                      <input
                        type="radio"
                        name={currentQuestion.id}
                        checked={answers[currentQuestion.id] === option}
                        onChange={() => updateAnswer(currentQuestion.id, option)}
                        className="w-5 h-5 border-gray-300 text-slate-blue focus:ring-slate-blue"
                      />
                      <span className="text-lg text-gray-900">{option}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <Textarea
                  rows={6}
                  value={(answers[currentQuestion.id] as string) || ""}
                  onChange={(e) => updateAnswer(currentQuestion.id, e.target.value)}
                  placeholder={currentQuestion.placeholderText || "Type your answer..."}
                  className="text-lg bg-white/90 backdrop-blur"
                  autoFocus
                />
              )}
            </div>
          </div>
        );
      case 3:
        // Highlights (keywords) moved to step 3
        return keywordOptions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-white/80">
              No highlights configured yet.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <p className="text-2xl font-semibold text-white mb-2">
                What stood out most?
              </p>
              <p className="text-base text-white/80">
                Pick up to 3 highlights to emphasize in your review
              </p>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              {keywordOptions.map((keyword) => {
                const active = selectedKeywords.includes(keyword);
                return (
                  <button
                    type="button"
                    key={keyword}
                    onClick={() => handleKeywordToggle(keyword)}
                    className={`rounded-full px-6 py-3 text-base font-medium transition-all ${
                      active
                        ? "bg-white text-slate-900 ring-2 ring-white ring-offset-2 ring-offset-transparent scale-105 shadow-lg"
                        : "bg-white/20 text-white hover:bg-white/30 border-2 border-white/40 hover:border-white/60 backdrop-blur"
                    }`}
                  >
                    {keyword}
                  </button>
                );
              })}
            </div>
            <p className="text-sm text-white/70 text-center">
              {selectedKeywords.length} of 3 selected
            </p>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <p className="text-2xl font-semibold text-white mb-2">
                Your AI-generated review
              </p>
              <p className="text-base text-white/80">
                Feel free to edit, then copy and submit to your chosen platform
              </p>
            </div>
            <Textarea
              rows={10}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Click the button below to generate your personalized review..."
              className="text-base bg-white/90 backdrop-blur"
            />

            {/* AI Generate/Regenerate Button */}
            <button
              type="button"
              onClick={handleGenerateReview}
              disabled={aiGenerating || aiAttemptCount >= 3}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-base font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              <Icon name="FaSparkles" className="w-4 h-4" size={16} />
              <span>
                {aiGenerating
                  ? "Generating..."
                  : reviewText
                    ? `Re-generate Review${aiAttemptCount > 0 ? ` (${aiAttemptCount}/3)` : ""}`
                    : `AI Generate${aiAttemptCount > 0 ? ` (${aiAttemptCount}/3)` : ""}`}
              </span>
            </button>

            {activePlatforms.length > 0 && reviewText && (
              <div className="mt-8 space-y-6">
                <h3 className="text-xl font-semibold text-white text-center">
                  Post your review:
                </h3>

                {/* Step 1: Copy your review */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-white/90">
                    1. Copy your review
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await copyToClipboard(reviewText);
                        setReviewCopied(true);
                        setSuccessMessage("Review copied to clipboard!");
                        setTimeout(() => setSuccessMessage(null), 3000);
                      } catch (err) {
                        setError("Failed to copy review");
                        setTimeout(() => setError(null), 3000);
                      }
                    }}
                    className="w-full rounded-lg bg-white text-slate-900 px-6 py-4 text-base font-medium hover:bg-white/90 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <Icon name="FaCopy" className="w-4 h-4" size={16} />
                    {reviewCopied ? "Copied!" : "Copy Review"}
                  </button>
                </div>

                {/* Step 2: Post on platforms */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-white/90">
                    2. Post on one or more of these platforms:
                  </p>
                  <div className="space-y-3">
                    {activePlatforms.map((platform, index) => (
                      <button
                        key={`${platform.url}-${index}`}
                        type="button"
                        disabled={!platform.url}
                        onClick={() => {
                          if (platform.url) {
                            window.open(platform.url, '_blank', 'noopener,noreferrer');
                          }
                        }}
                        className="w-full rounded-lg bg-white text-slate-900 px-6 py-4 text-base font-medium hover:bg-white/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-lg"
                      >
                        Post on {platform.platform || platform.name || "Review Platform"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Special Offer - Only shown after review is generated */}
            {reviewText && promptPage?.offer_enabled && promptPage?.offer_title && (
              <div className="mt-8 rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-400 p-6 shadow-xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {promptPage.offer_title}
                </h3>
                {promptPage.offer_body && (
                  <p className="text-gray-800 mb-4 whitespace-pre-line">
                    {promptPage.offer_body}
                  </p>
                )}
                {promptPage.offer_url && (
                  <a
                    href={promptPage.offer_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Learn More
                  </a>
                )}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const stepLabels = [
    "Your details",
    "Quick questions",
    "Highlights",
    "AI review & submit",
  ];

  return (
    <div
      className="min-h-screen p-6 md:p-12 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      {/* Falling animation when review is generated */}
      {showFallingAnimation && promptPage?.falling_enabled !== false && (
        <FallingAnimation
          icon={promptPage?.falling_icon || 'star'}
          iconColor={promptPage?.falling_icon_color || '#FFD700'}
        />
      )}

      {/* Back Button - Only visible to authenticated users */}
      {currentUser && (
        <div className="fixed left-4 top-4 z-40">
          <div className="bg-black bg-opacity-20 backdrop-blur-sm rounded-xl p-3">
            <button
              onClick={() => window.location.href = '/prompt-pages'}
              className="flex items-center gap-2 px-4 py-2 rounded-lg shadow-md bg-white hover:bg-gray-50 transition-colors group text-slate-blue font-medium"
              style={{
                border: "1px solid #E5E7EB"
              }}
              title="Back to prompt pages"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="hidden sm:inline">Back</span>
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-2xl relative z-10">
        {/* Business Logo */}
        {businessProfile?.logo_url && (
          <div className="flex justify-center mb-8">
            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-white shadow-lg ring-4 ring-white/20">
              <img
                src={businessProfile.logo_url}
                alt={businessProfile.business_name || businessProfile.name || "Business logo"}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        <div className="mb-12 text-center">
          <h1 className="text-3xl font-semibold text-white mb-3">
            Let's create a review for {businessProfile?.business_name || businessProfile?.name || "us"}
          </h1>
          <p className="text-xl text-white/90">
            Answer a few questions and we'll help you craft the perfect review.
          </p>
        </div>

        {/* Subway-style progress indicator */}
        <div className="mb-12 flex justify-center">
          <div className="flex items-center gap-1">
            {stepLabels.map((label, index) => {
              const stepNumber = index + 1;
              const isActive = stepNumber === step;
              const isCompleted = stepNumber < step;
              const isClickable = isCompleted;

              return (
                <div key={index} className="flex items-center">
                  {/* Station dot */}
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => isClickable && setStep(stepNumber)}
                      disabled={!isClickable}
                      className={`relative flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                        isActive
                          ? "border-white bg-white text-slate-900 scale-110"
                          : isCompleted
                          ? "border-white bg-white text-slate-900 hover:scale-105 cursor-pointer"
                          : "border-white/40 bg-transparent text-white/60 cursor-default"
                      }`}
                    >
                      {isCompleted ? (
                        <span className="text-sm">✓</span>
                      ) : (
                        <span className="text-xs font-bold">{stepNumber}</span>
                      )}
                    </button>
                    <span className={`mt-1.5 text-xs font-medium ${
                      isActive ? "text-white" : "text-white/60"
                    }`}>
                      {label}
                    </span>
                  </div>

                  {/* Connector line */}
                  {index < stepLabels.length - 1 && (
                    <div
                      className={`h-0.5 w-10 mx-1 mb-5 transition-all ${
                        isCompleted ? "bg-white" : "bg-white/30"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-8">
          {renderStepContent()}
        </div>

        <div className="mt-8 flex justify-center gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={goToPrevious}
              className="px-6 py-3 text-base font-medium text-white/90 hover:text-white transition-colors"
            >
              ← Back
            </button>
          )}
          {step < 4 && (
            <button
              type="button"
              onClick={goToNext}
              className="px-8 py-3 bg-white text-slate-900 text-base font-medium rounded-lg hover:bg-white/90 transition-all shadow-lg"
            >
              Continue →
            </button>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-500/90 backdrop-blur px-4 py-3 text-sm text-white text-center">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mt-4 rounded-lg bg-green-500/90 backdrop-blur px-4 py-3 text-sm text-white text-center">
            {successMessage}
          </div>
        )}

        {/* PromptReviews Footer */}
        <div className="mt-12 mb-12 rounded-2xl shadow-lg p-4 md:p-8 bg-black/20 backdrop-blur-sm border border-white/20">
          <div className="flex flex-col md:flex-row items-center text-center md:text-left gap-4 md:gap-8 md:items-center">
            <div className="flex-shrink-0 flex items-center justify-center w-full md:w-40 mb-0">
              <a
                href="https://promptreviews.app"
                target="_blank"
                rel="noopener"
                aria-label="Prompt Reviews Home"
              >
                <PromptReviewsLogo
                  color="#ffffff"
                  size={240}
                  className="h-20 w-auto"
                />
              </a>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-4 justify-center md:justify-start">
                <span className="text-lg font-semibold text-white">
                  Powered by Prompt Reviews
                </span>
              </div>
              <p className="max-w-2xl text-sm md:text-base text-white/90">
                Make it easy and fun for your customers or clients to post reviews online. Grow your online presence on traditional and AI search platforms.
              </p>
              <a
                href="https://promptreviews.app"
                target="_blank"
                rel="noopener"
                className="mt-4 font-medium hover:opacity-80 transition-opacity inline-block underline text-white"
              >
                Learn more about Prompt Reviews →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
