/**
 * ReviewBuilderPromptPageForm
 *
 * Specialized prompt page form that configures the Review Builder experience.
 * Uses BasePromptPageForm for shared toggles/features and focuses on:
 * - Keyword clusters (power-ups) the reviewer will select from
 * - Builder questions (2-3 short answer prompts)
 * - Review platform destinations
 */

"use client";
import React, { useEffect, useMemo, useState } from "react";
import BasePromptPageForm from "./BasePromptPageForm";
import { Input } from "@/app/(app)/components/ui/input";
import { Textarea } from "@/app/(app)/components/ui/textarea";
import KeywordsInput from "./KeywordsInput";
import Icon from "@/components/Icon";
import ReviewWriteSection, { ReviewWritePlatform } from "../dashboard/edit-prompt-page/components/ReviewWriteSection";

interface ReviewBuilderPromptPageFormProps {
  mode: "create" | "edit";
  initialData: any;
  onSave: (data: any) => Promise<void> | void;
  onPublish?: (data: any) => Promise<void> | void;
  pageTitle: string;
  supabase: any;
  businessProfile: any;
  isUniversal?: boolean;
  onPublishSuccess?: (slug: string) => void;
  campaignType?: string;
  onGenerateReview?: (index: number) => void;
}

export interface BuilderQuestion {
  id: string;
  prompt: string;
  helperText?: string;
  placeholderText?: string;
  required?: boolean;
  questionType?: 'text' | 'checkbox' | 'radio';
  options?: string[];
}

const getDefaultQuestions = (businessName?: string): BuilderQuestion[] => {
  const name = businessName || "[Business Name]";
  return [
    {
      id: "builder-q1",
      prompt: `What surprised you, in a good way, during your time with ${name}?`,
      helperText: "Think about unexpected positives, exceptional service moments, or delightful details that stood out.",
      placeholderText: "Share a specific moment or detail that exceeded your expectations...",
      required: true,
      questionType: 'text',
    },
    {
      id: "builder-q2",
      prompt: `What was the highlight of your experience with ${name}?`,
      helperText: "Describe the best part of working with this business—what made the biggest positive impact?",
      placeholderText: "Tell us about the most memorable or valuable part of your experience...",
      required: true,
      questionType: 'text',
    },
  ];
};

const MIN_QUESTIONS = 2;
const MAX_QUESTIONS = 5;

const generateQuestionId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `builder-${Date.now()}`;

const normalizeQuestions = (rawQuestions?: any, businessName?: string): BuilderQuestion[] => {
  if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
    return getDefaultQuestions(businessName);
  }
  return rawQuestions
    .map((q) => ({
      id: q?.id || generateQuestionId(),
      prompt: q?.prompt || "",
      helperText: q?.helperText || q?.helper_text || "",
      placeholderText: q?.placeholderText || q?.placeholder_text || "Type your answer...",
      required: q?.required !== undefined ? Boolean(q.required) : true,
      questionType: q?.questionType || q?.question_type || 'text',
      options: Array.isArray(q?.options) ? q.options : undefined,
    }))
    .filter((q) => typeof q.prompt === "string");
};

export default function ReviewBuilderPromptPageForm({
  mode,
  initialData,
  onSave,
  onPublish,
  pageTitle,
  supabase,
  businessProfile,
  isUniversal = false,
  onPublishSuccess,
  campaignType = "public",
  onGenerateReview,
}: ReviewBuilderPromptPageFormProps) {
  const [keywords, setKeywords] = useState<string[]>(() => {
    if (Array.isArray(initialData?.keywords)) {
      return initialData.keywords;
    }
    if (Array.isArray(businessProfile?.keywords)) {
      return businessProfile.keywords;
    }
    if (typeof businessProfile?.keywords === "string") {
      return businessProfile.keywords
        .split(",")
        .map((k: string) => k.trim())
        .filter(Boolean);
    }
    return [];
  });
  const [selectedKeywordInspirations, setSelectedKeywordInspirations] =
    useState<string[]>(
      Array.isArray(initialData?.selected_keyword_inspirations)
        ? initialData.selected_keyword_inspirations
        : [],
    );
  const [keywordsRequired, setKeywordsRequired] = useState<boolean>(
    initialData?.keywords_required ?? true
  );
  const [questions, setQuestions] = useState<BuilderQuestion[]>(
    normalizeQuestions(initialData?.builder_questions, businessProfile?.name || businessProfile?.business_name),
  );
  const [configError, setConfigError] = useState<string | null>(null);
  const [campaignName, setCampaignName] = useState(initialData?.name || "");
  const [recipientDetails, setRecipientDetails] = useState(() => ({
    first_name: initialData?.first_name || "",
    last_name: initialData?.last_name || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    role: initialData?.role || "",
  }));
  const normalizePlatforms = (platforms: any): ReviewWritePlatform[] => {
    if (!platforms) return [];
    let list = platforms;
    if (typeof list === "string") {
      try {
        list = JSON.parse(list);
      } catch {
        list = [];
      }
    }
    if (!Array.isArray(list)) return [];
    return list.map((platform: any) => ({
      name: platform.name || platform.platform || "",
      url: platform.url || "",
      wordCount: platform.wordCount || platform.word_count || 0,
      customPlatform: platform.customPlatform || platform.custom_platform || "",
      customInstructions:
        platform.customInstructions || platform.custom_instructions || "",
      reviewText: platform.reviewText || platform.review_text || "",
      verified: Boolean(platform.verified),
      verified_at: platform.verified_at || "",
    }));
  };

  const [reviewPlatforms, setReviewPlatforms] = useState<ReviewWritePlatform[]>(
    normalizePlatforms(initialData?.review_platforms || businessProfile?.review_platforms),
  );

  // Ensure at least the minimum number of questions exist
  useEffect(() => {
    if (questions.length < MIN_QUESTIONS) {
      setQuestions((prev) => {
        const next = [...prev];
        const defaultQuestions = getDefaultQuestions(businessProfile?.name || businessProfile?.business_name);
        while (next.length < MIN_QUESTIONS) {
          next.push({
            ...defaultQuestions[next.length] ?? {
              id: generateQuestionId(),
              prompt: "",
              helperText: "",
              required: true,
            },
            id: generateQuestionId(),
          });
        }
        return next;
      });
    }
  }, [questions.length, businessProfile?.name, businessProfile?.business_name]);

  // Keep selected inspirations in sync with keyword list
  useEffect(() => {
    setSelectedKeywordInspirations((prev) =>
      prev.filter((keyword) => keywords.includes(keyword)),
    );
  }, [keywords]);

  useEffect(() => {
    if (initialData?.name) {
      setCampaignName(initialData.name);
    }
  }, [initialData?.name]);

  useEffect(() => {
    if (
      campaignType === "public" &&
      !campaignName &&
      (businessProfile?.name || businessProfile?.business_name)
    ) {
      setCampaignName(
        `${businessProfile?.name || businessProfile?.business_name} Review Builder`,
      );
    }
  }, [initialData?.name]);

  useEffect(() => {
    if (initialData?.review_platforms) {
      setReviewPlatforms(normalizePlatforms(initialData.review_platforms));
    } else if (
      (!reviewPlatforms || reviewPlatforms.length === 0) &&
      businessProfile?.review_platforms
    ) {
      setReviewPlatforms(normalizePlatforms(businessProfile.review_platforms));
    }
  }, [initialData?.review_platforms, businessProfile?.review_platforms]);

  useEffect(() => {
    setRecipientDetails({
      first_name: initialData?.first_name || "",
      last_name: initialData?.last_name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      role: initialData?.role || "",
    });
  }, [
    initialData?.first_name,
    initialData?.last_name,
    initialData?.email,
    initialData?.phone,
    initialData?.role,
  ]);

  const businessInfo = useMemo(
    () => ({
      name: businessProfile?.name || businessProfile?.business_name,
      industry: businessProfile?.industry,
      industries_other: businessProfile?.industries_other,
      industry_other: businessProfile?.industry_other,
      accountId: businessProfile?.account_id,
      about_us: businessProfile?.about_us,
      differentiators: businessProfile?.differentiators,
      years_in_business: businessProfile?.years_in_business,
      services_offered: businessProfile?.services_offered,
      industries_served: businessProfile?.industries_served,
      address_city: businessProfile?.address_city,
      address_state: businessProfile?.address_state,
    }),
    [businessProfile],
  );

  const globalKeywords = useMemo(() => {
    const source = businessProfile?.keywords;
    if (!source) return [];
    if (Array.isArray(source)) {
      return source
        .map((kw: string) => (typeof kw === "string" ? kw.trim() : ""))
        .filter(Boolean);
    }
    if (typeof source === "string") {
      return source
        .split(",")
        .map((kw) => kw.trim())
        .filter(Boolean);
    }
    return [];
  }, [businessProfile?.keywords]);

  const handleAddGlobalKeywords = () => {
    if (!globalKeywords.length) return;
    setKeywords((prev) => {
      const unique = new Set(prev.map((kw) => kw.trim()).filter(Boolean));
      globalKeywords.forEach((kw) => {
        if (!unique.has(kw)) unique.add(kw);
      });
      return Array.from(unique);
    });
  };

  // If business profile keywords load after mount, auto-populate the builder keywords
  useEffect(() => {
    if (keywords.length === 0 && globalKeywords.length > 0) {
      setKeywords(globalKeywords);
    }
  }, [globalKeywords, keywords.length]);

  const fallbackKeywords = useMemo(() => {
    const fallback: string[] = [];
    const servicesSource = businessProfile?.services_offered;
    if (Array.isArray(servicesSource)) {
      servicesSource.forEach((service: string) => {
        if (typeof service === "string" && service.trim()) {
          fallback.push(service.trim());
        }
      });
    } else if (typeof servicesSource === "string" && servicesSource.trim()) {
      try {
        const parsed = JSON.parse(servicesSource);
        if (Array.isArray(parsed)) {
          parsed.forEach((service: string) => {
            if (typeof service === "string" && service.trim()) {
              fallback.push(service.trim());
            }
          });
        }
      } catch {
        servicesSource
          .split(/,|\n/)
          .map((service) => service.trim())
          .filter(Boolean)
          .forEach((service) => fallback.push(service));
      }
    }
    if (
      typeof businessProfile?.industries_served === "string" &&
      businessProfile.industries_served.trim()
    ) {
      fallback.push(businessProfile.industries_served.trim());
    }
    if (
      typeof businessProfile?.name === "string" &&
      businessProfile.name.trim()
    ) {
      fallback.push(businessProfile.name.trim());
    }
    return Array.from(new Set(fallback)).slice(0, 10);
  }, [businessProfile?.services_offered, businessProfile?.industries_served, businessProfile?.name]);

  useEffect(() => {
    if (keywords.length === 0 && fallbackKeywords.length > 0) {
      setKeywords(fallbackKeywords);
    }
  }, [fallbackKeywords, keywords.length]);

  // Ensure at least one power-up is selected when keywords exist
  useEffect(() => {
    if (keywords.length > 0 && selectedKeywordInspirations.length === 0) {
      setSelectedKeywordInspirations(keywords.slice(0, Math.min(3, keywords.length)));
    }
  }, [keywords, selectedKeywordInspirations.length]);

  const seedKeywords = () => {
    const seeds = Array.from(
      new Set([...keywords, ...globalKeywords, ...fallbackKeywords].filter(Boolean)),
    ).slice(0, 10);
    if (seeds.length === 0) {
      const fallbackName =
        businessProfile?.name ||
        businessProfile?.business_name ||
        campaignName ||
        "review builder";
      seeds.push(fallbackName);
    }
    setKeywords(seeds);
    setSelectedKeywordInspirations(
      seeds.slice(0, Math.min(3, seeds.length)),
    );
    return seeds;
  };

  const handleQuestionChange = (
    id: string,
    field: keyof BuilderQuestion,
    value: string | boolean | string[] | 'text' | 'checkbox' | 'radio',
  ) => {
    setQuestions((prev) =>
      prev.map((question) =>
        question.id === id ? { ...question, [field]: value } : question,
      ),
    );
    setConfigError(null);
  };

  const addQuestion = () => {
    if (questions.length >= MAX_QUESTIONS) return;
    setQuestions((prev) => [
      ...prev,
      {
        id: generateQuestionId(),
        prompt: "",
        helperText: "",
        required: false,
      },
    ]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length <= MIN_QUESTIONS) return;
    setQuestions((prev) => prev.filter((question) => question.id !== id));
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    setQuestions((prev) => {
      const next = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) {
        return prev;
      }
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  const questionPayload = useMemo(
    () =>
      questions.map((question, index) => ({
        id: question.id || `builder-${index}`,
        prompt: question.prompt.trim(),
        helperText: question.helperText?.trim() || "",
        placeholderText: question.placeholderText?.trim() || "Type your answer...",
        required: question.required ?? true,
        questionType: question.questionType || 'text',
        options: question.options || undefined,
      })),
    [questions],
  );

  const validateBuilderConfig = () => {
    if (campaignType === "public" && !campaignName.trim()) {
      setConfigError("Campaign name is required for public Review Builders.");
      return false;
    }

    if (campaignType === "individual") {
      if (!recipientDetails.first_name.trim()) {
        setConfigError("Recipient first name is required.");
        return false;
      }
      if (!recipientDetails.email.trim()) {
        setConfigError("Recipient email is required.");
        return false;
      }
    }

    if (questionPayload.some((question) => !question.prompt)) {
      setConfigError("Please add question text for every builder step.");
      return false;
    }
    if (keywords.length === 0) {
      const seeded = seedKeywords();
      if (seeded.length === 0) {
        setConfigError(
          "Add at least one keyword so reviewers can power-up their answers.",
        );
        return false;
      }
    }
    setConfigError(null);
    return true;
  };

  const buildPayload = (baseFormData: any) => ({
    ...baseFormData,
    review_type: "review_builder",
    campaign_type: campaignType,
    ai_button_enabled: true,
    visibility: campaignType === "public" ? "public" : "individual",
    status: "in_queue",  // Fixed: Use valid enum value instead of "published"
    ...(campaignType === "public"
      ? { name: campaignName }
      : {
          first_name: recipientDetails.first_name,
          last_name: recipientDetails.last_name,
          email: recipientDetails.email,
          phone: recipientDetails.phone,
          role: recipientDetails.role,
        }),
    review_platforms: reviewPlatforms,
    keywords,
    selected_keyword_inspirations: selectedKeywordInspirations,
    keyword_inspiration_enabled: true,
    keywords_required: keywordsRequired,
    builder_questions: questionPayload,
    // Ensure emoji_sentiment features are disabled for review builder
    emoji_sentiment_enabled: false,
    emoji_labels: [],
    // Ensure other optional features have defaults (use form data if provided)
    show_friendly_note: baseFormData.show_friendly_note ?? false,
    friendly_note: baseFormData.friendly_note ?? '',
    falling_enabled: baseFormData.falling_enabled ?? true,
    falling_icon: baseFormData.falling_icon ?? 'star',
    falling_icon_color: baseFormData.falling_icon_color ?? '',
    fix_grammar_enabled: baseFormData.fix_grammar_enabled ?? false,
    kickstarters_enabled: baseFormData.kickstarters_enabled ?? false,
    selected_kickstarters: baseFormData.selected_kickstarters ?? [],
  });

  const handleSave = async (baseFormData: any) => {
    if (!validateBuilderConfig()) {
      throw new Error("Review Builder configuration is incomplete.");
    }
    await onSave(buildPayload(baseFormData));
  };

  const handlePublish = async (baseFormData: any) => {
    if (!validateBuilderConfig()) {
      throw new Error("Review Builder configuration is incomplete.");
    }
    if (onPublish) {
      await onPublish(buildPayload(baseFormData));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <BasePromptPageForm
        mode={mode}
        initialData={{
          ...initialData,
          ...(campaignType === "public" ? { name: campaignName } : {}),
          keywords,
          selected_keyword_inspirations: selectedKeywordInspirations,
          builder_questions: questionPayload,
          keyword_inspiration_enabled: true,
          review_type: "review_builder",
        }}
        onSave={handleSave}
        onPublish={onPublish ? handlePublish : undefined}
        pageTitle={pageTitle}
        supabase={supabase}
        businessProfile={businessProfile}
        isUniversal={isUniversal}
        onPublishSuccess={onPublishSuccess}
        campaignType={campaignType}
        onGenerateReview={onGenerateReview}
        offerHelpText="The special offer will appear after the customer's review is generated, creating a perfect moment to incentivize them."
        enabledFeatures={{
          personalizedNote: false,
          emojiSentiment: false,
          fallingStars: true,
          aiSettings: false,
          offer: true,
          reviewPlatforms: false,
          kickstarters: false,
        }}
      >
        {/* Page Title Section - inside form so submit button works */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
          <div className="flex-1">
            <div className="mb-3">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-slate-blue">
                  {pageTitle}
                </h1>
                <div className="relative group">
                  <Icon name="prompty" className="w-6 h-6 text-slate-blue" size={24} />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-64 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg z-10">
                    This particular Prompt Page needs AI to function so there is no option to turn it off.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 mt-3">
                Reviewers will complete a guided flow: (1) enter their name & role, (2) answer custom questions, (3) choose highlights, and (4) let AI assemble the review before copying it to your preferred sites.
              </p>
            </div>
          </div>
          <button
            type="submit"
            className="inline-flex justify-center rounded-md border border-transparent bg-slate-blue py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto shrink-0"
          >
            Save & publish
          </button>
        </div>

        <div className="space-y-10">
        {campaignType === "public" ? (
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <Icon name="FaFileAlt" className="text-slate-blue w-6 h-6" size={24} />
              <h2 className="text-2xl font-bold text-slate-blue">Campaign details</h2>
            </div>
            <p className="text-gray-600 mb-4 text-sm">
              Give this Review Builder a descriptive name so your team can recognize it later.
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campaign name <span className="text-red-600">*</span>
            </label>
            <Input
              value={campaignName}
              onChange={(e) => {
                setCampaignName(e.target.value);
                setConfigError(null);
              }}
              placeholder="e.g., VIP review builder, Holiday follow-up"
            />
          </section>
        ) : (
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <Icon name="FaUser" className="text-slate-blue w-6 h-6" size={24} />
              <h2 className="text-2xl font-bold text-slate-blue">Recipient details</h2>
            </div>
            <p className="text-gray-600 mb-4 text-sm">
              We'll personalize the builder with this contact information and send it to the right person.
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First name <span className="text-red-600">*</span>
                </label>
                <Input
                  value={recipientDetails.first_name}
                  onChange={(e) =>
                    setRecipientDetails((prev) => ({ ...prev, first_name: e.target.value }))
                  }
                  placeholder="First name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last name
                </label>
                <Input
                  value={recipientDetails.last_name}
                  onChange={(e) =>
                    setRecipientDetails((prev) => ({ ...prev, last_name: e.target.value }))
                  }
                  placeholder="Last name"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-600">*</span>
                </label>
                <Input
                  type="email"
                  value={recipientDetails.email}
                  onChange={(e) =>
                    setRecipientDetails((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="name@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone number
                </label>
                <Input
                  value={recipientDetails.phone}
                  onChange={(e) =>
                    setRecipientDetails((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="555-123-4567"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role / title
              </label>
              <Input
                value={recipientDetails.role}
                onChange={(e) =>
                  setRecipientDetails((prev) => ({ ...prev, role: e.target.value }))
                }
                placeholder="e.g., homeowner, marketing director"
              />
            </div>
          </section>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Icon name="FaQuestionCircle" className="text-slate-blue w-6 h-6" size={24} />
            <div>
              <h3 className="text-xl font-semibold text-slate-blue">Builder Questions</h3>
              <p className="text-sm text-gray-600">
                Ask 2–5 short answer questions that capture vivid proof points. Answers are sent to AI with the keywords to craft the review.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {questions.map((question, index) => (
              <div
                key={question.id}
                className="rounded-lg border border-slate-200 p-4 bg-slate-50 relative"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-slate-blue">
                    Question {index + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="text-slate-500 hover:text-slate-700 disabled:opacity-40"
                      onClick={() => moveQuestion(index, "up")}
                      disabled={index === 0}
                      aria-label="Move question up"
                    >
                      <Icon name="FaChevronUp" className="w-4 h-4" size={16} />
                    </button>
                    <button
                      type="button"
                      className="text-slate-500 hover:text-slate-700 disabled:opacity-40"
                      onClick={() => moveQuestion(index, "down")}
                      disabled={index === questions.length - 1}
                      aria-label="Move question down"
                    >
                      <Icon name="FaChevronDown" className="w-4 h-4" size={16} />
                    </button>
                    <button
                      type="button"
                      className="text-red-500 hover:text-red-600 disabled:opacity-30"
                      onClick={() => removeQuestion(question.id)}
                      disabled={questions.length <= MIN_QUESTIONS}
                      aria-label="Remove question"
                    >
                      <Icon name="FaTrash" className="w-4 h-4" size={16} />
                    </button>
                  </div>
                </div>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question prompt <span className="text-red-600">*</span>
                </label>
                <Input
                  value={question.prompt}
                  onChange={(e) =>
                    handleQuestionChange(question.id, "prompt", e.target.value)
                  }
                  placeholder="What stood out most from your experience?"
                  className="mb-3"
                />

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Helper text (optional)
                </label>
                <Textarea
                  value={question.helperText}
                  onChange={(e) =>
                    handleQuestionChange(question.id, "helperText", e.target.value)
                  }
                  rows={2}
                  placeholder="Give reviewers extra guidance (e.g., mention any numbers or proof points)."
                  className="mb-3"
                />

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Placeholder text (optional)
                </label>
                <Input
                  value={question.placeholderText || ""}
                  onChange={(e) =>
                    handleQuestionChange(question.id, "placeholderText", e.target.value)
                  }
                  placeholder="Type your answer..."
                />

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question type
                  </label>
                  <select
                    value={question.questionType || 'text'}
                    onChange={(e) =>
                      handleQuestionChange(question.id, "questionType", e.target.value as 'text' | 'checkbox' | 'radio')
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-slate-blue focus:ring-slate-blue"
                  >
                    <option value="text">Text answer</option>
                    <option value="checkbox">Multiple choice (checkboxes)</option>
                    <option value="radio">Single choice (radio buttons)</option>
                  </select>
                </div>

                {(question.questionType === 'checkbox' || question.questionType === 'radio') && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Options (one per line)
                    </label>
                    <Textarea
                      value={(question.options || []).join('\n')}
                      onChange={(e) => {
                        const options = e.target.value.split('\n').filter(opt => opt.trim());
                        handleQuestionChange(question.id, "options", options);
                      }}
                      rows={4}
                      placeholder="Option 1&#10;Option 2&#10;Option 3"
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {question.options?.length || 0} option{question.options?.length !== 1 ? 's' : ''} configured
                    </p>
                  </div>
                )}

                <div className="mt-4 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`required-${question.id}`}
                    className="rounded border-gray-300 text-slate-blue focus:ring-slate-blue"
                    checked={question.required ?? true}
                    onChange={(e) =>
                      handleQuestionChange(question.id, "required", e.target.checked)
                    }
                  />
                  <label
                    htmlFor={`required-${question.id}`}
                    className="text-sm text-gray-700"
                  >
                    Required
                  </label>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-gray-500">
              {questions.length}/{MAX_QUESTIONS} questions configured
            </p>
            <button
              type="button"
              className="inline-flex items-center rounded-md bg-slate-blue/10 px-3 py-2 text-sm font-semibold text-slate-blue hover:bg-slate-blue/20 disabled:opacity-40"
              onClick={addQuestion}
              disabled={questions.length >= MAX_QUESTIONS}
            >
              <Icon name="FaPlus" className="w-4 h-4 mr-2" size={16} />
              Add question
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Icon name="FaKey" className="text-slate-blue w-6 h-6" size={24} />
            <h3 className="text-xl font-semibold text-slate-blue">
              Keyword select
            </h3>
            <div className="relative group">
              <Icon name="prompty" className="w-5 h-5 text-slate-blue" size={20} />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-72 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg z-10">
                Keywords are used by Prompty AI and inserted into reviews for better rankings in Google and LLMs like ChatGPT.
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Encourage your customers to select 1-3 of these phrases to include in their review.
          </p>
          <KeywordsInput
            keywords={keywords}
            onChange={setKeywords}
            placeholder="e.g., same-day installation, custom web design, Austin SEO expert"
            businessInfo={businessInfo}
          />
          {globalKeywords.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <span>
                Start from your Prompt Page defaults ({globalKeywords.length} saved keyword
                {globalKeywords.length === 1 ? "" : "s"}).
              </span>
              <button
                type="button"
                onClick={handleAddGlobalKeywords}
                className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-blue hover:border-slate-blue hover:bg-slate-blue/5"
              >
                Use global keywords
              </button>
            </div>
          )}

          <div className="rounded-lg border border-green-100 bg-green-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icon name="FaQuestionCircle" className="w-5 h-5 text-slate-blue" size={20} />
                <span className="font-semibold text-slate-blue">
                  Select up to 10 power-ups
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {selectedKeywordInspirations.length}/10 selected
              </span>
            </div>
            {keywords.length === 0 ? (
              <div className="rounded border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
                Add keywords above to make them available here.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {keywords.map((keyword) => {
                  const checked = selectedKeywordInspirations.includes(keyword);
                  return (
                    <label
                      key={keyword}
                      className="flex items-center gap-3 rounded-md border border-green-200 bg-white px-3 py-2 text-sm text-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setSelectedKeywordInspirations((prev) => {
                            if (checked) {
                              return prev.filter((k) => k !== keyword);
                            }
                            if (prev.length >= 10) return prev;
                            return [...prev, keyword];
                          });
                        }}
                        disabled={!checked && selectedKeywordInspirations.length >= 10}
                        className="h-4 w-4 rounded border-gray-300 text-slate-blue focus:ring-slate-blue"
                      />
                      <span className="truncate">{keyword}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <input
              type="checkbox"
              id="keywords-required"
              className="rounded border-gray-300 text-slate-blue focus:ring-slate-blue"
              checked={keywordsRequired}
              onChange={(e) => setKeywordsRequired(e.target.checked)}
            />
            <label
              htmlFor="keywords-required"
              className="text-sm text-gray-700"
            >
              Required (customers must select at least one keyword)
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <ReviewWriteSection
            value={reviewPlatforms}
            onChange={setReviewPlatforms}
            onGenerateReview={onGenerateReview || (() => {})}
            hideReviewTemplateFields
            hideAdvancedFields
            aiGeneratingIndex={null}
          />
        </section>

        {configError && (
          <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {configError}
          </div>
        )}
      </div>
    </BasePromptPageForm>
    </div>
  );
}
