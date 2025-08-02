import React, { useState } from "react";
import Icon from "@/components/Icon";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";

export interface ReviewWritePlatform {
  name: string;
  url: string;
  wordCount: number;
  customPlatform?: string;
  customInstructions?: string;
  reviewText?: string;
  verified: boolean;
  verified_at: string;
}

interface ReviewWriteSectionProps {
  value: ReviewWritePlatform[];
  onChange: (platforms: ReviewWritePlatform[]) => void;
  onGenerateReview: (idx: number) => void;
  errors?: string[];
  hideReviewTemplateFields?: boolean;
  aiGeneratingIndex?: number | null;
}

const platformOptions = [
  "",
  "Google Business Profile",
  "Yelp",
  "Facebook",
  "TripAdvisor",
  "G2",
  "BBB",
  "Thumbtack",
  "Clutch",
  "Capterra",
  "Angi",
  "Houzz",
  "HomeAdvisor",
  "Trustpilot",
  "Other",
];

const REVIEW_CHAR_LIMIT = 600;

const getPlatformIcon = (name: string, url: string) => {
  const lowerName = (name || "").toLowerCase();
  const lowerUrl = (url || "").toLowerCase();
  if (lowerName.includes("google") || lowerUrl.includes("google"))
    return { icon: "FaGoogle", color: "text-slate-blue" };
  if (lowerName.includes("yelp") || lowerUrl.includes("yelp"))
    return { icon: "FaYelp", color: "text-red-500" };
  if (lowerName.includes("facebook") || lowerUrl.includes("facebook"))
    return { icon: "FaFacebook", color: "text-blue-700" };
  if (lowerName.includes("tripadvisor") || lowerUrl.includes("tripadvisor"))
    return { icon: "FaTripadvisor", color: "text-green-600" };
  return { icon: "FaRegStar", color: "text-slate-blue" };
};

/**
 * ReviewWriteSection component
 *
 * Usage: For review platform cards, AI button, and review template fields in prompt page forms.
 * - Use for all review platform input flows (Google, Yelp, etc.).
 * - Each card has a platform icon breaching the top-left, card title, and action buttons at the top.
 * - The AI button uses the standardized style: white, slate-blue border/text, FaMagic icon, left-aligned, text 'Generate with AI'.
 *
 * See DESIGN_GUIDELINES.md for visual rules and examples.
 */
const ReviewWriteSection: React.FC<ReviewWriteSectionProps> = ({
  value,
  onChange,
  onGenerateReview,
  errors = [],
  hideReviewTemplateFields = false,
  aiGeneratingIndex = null,
}) => {
  const handlePlatformChange = (
    idx: number,
    field: keyof ReviewWritePlatform,
    val: string | number,
  ) => {
    const newPlatforms = value.map((p, i) =>
      i === idx ? { ...p, [field]: val } : p,
    );
    onChange(newPlatforms);
  };
  const addPlatform = () =>
    onChange([
      ...value,
      {
        name: "",
        url: "",
        wordCount: 200,
        reviewText: "",
        verified: false,
        verified_at: "",
      },
    ]);
  const removePlatform = (idx: number) =>
    onChange(value.filter((_, i) => i !== idx));

  return (
    <div className="mb-16">
      <h2 className="mt-4 mb-8 text-2xl font-bold text-slate-blue flex items-center gap-3">
        <Icon name="FaStar" className="w-7 h-7 text-slate-blue" size={28} />
        Review Platforms
      </h2>
      <div>
        <div className="space-y-12">
          {value.map((platform, idx) => (
            <div
              key={idx}
              className="relative flex flex-col gap-1 mb-12 px-6 py-3 pt-4 border border-blue-100 rounded-2xl bg-blue-50 shadow-sm"
            >
              {/* Card title: platform name and action buttons row */}
              <div className="flex items-center justify-between pt-1 pb-2 pr-2">
                <span className="text-lg font-bold text-slate-blue">
                  {platform.name || "Platform"}
                  {platform.customPlatform && platform.name === "Other"
                    ? `: ${platform.customPlatform}`
                    : ""}
                </span>
                <div className="flex items-center gap-2">
                  {platform.url && (
                    <a
                      href={platform.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-700 underline"
                    >
                      Check if Published
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      // Simulate verification (replace with API call as needed)
                      const newPlatforms = value.map((p, i) =>
                        i === idx
                          ? {
                              ...p,
                              verified: true,
                              verified_at: new Date().toISOString(),
                            }
                          : p,
                      );
                      onChange(newPlatforms);
                    }}
                    disabled={platform.verified}
                    className={`px-2 py-1 rounded text-xs ${platform.verified ? "bg-green-200 text-green-700" : "bg-slate-blue text-white hover:bg-slate-blue/90"}`}
                  >
                    {platform.verified ? "Verified" : "Mark as Verified"}
                  </button>
                  {platform.verified && platform.verified_at && (
                    <span className="text-xs text-green-700">
                      ({new Date(platform.verified_at).toLocaleDateString()})
                    </span>
                  )}
                  <HoverTooltip text="Check if the review was published and mark as 'verified' if it is.">
                    <Icon name="FaInfoCircle" className="w-4 h-4 text-gray-400 cursor-pointer" size={16} />
                  </HoverTooltip>
                </div>
              </div>
              {/* Platform icon in top left, breaching */}
              <div
                className="absolute -top-4 -left-4 bg-white rounded-full shadow p-2 flex items-center justify-center"
                title={platform.name}
              >
                {(() => {
                  const { icon: Icon, color } = getPlatformIcon(
                    platform.name,
                    platform.url,
                  );
                  return <Icon className={`w-6 h-6 ${color}`} />;
                })()}
              </div>
              {value.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePlatform(idx)}
                  className="absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white shadow text-red-600 text-xl font-bold z-10 border border-gray-200 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400"
                  title="Remove platform"
                >
                  &times;
                </button>
              )}
              {/* Move labels inside each card above the inputs */}
              <div className="flex gap-4 items-center mb-2">
                <div className="flex flex-col w-1/3">
                  <label className="text-xs font-semibold text-gray-500 mb-1">
                    Platform Name
                  </label>
                  <select
                    className="w-full border px-3 py-2 rounded-lg bg-white"
                    value={platform.name || ""}
                    onChange={(e) =>
                      handlePlatformChange(idx, "name", e.target.value)
                    }
                    required
                  >
                    {platformOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt || "Select a platform"}
                      </option>
                    ))}
                  </select>
                  {platform.name === "Other" && (
                    <Input
                      type="text"
                      className="mt-2"
                      placeholder="Enter platform name"
                      value={platform.customPlatform || ""}
                      onChange={(e) =>
                        handlePlatformChange(
                          idx,
                          "customPlatform",
                          e.target.value,
                        )
                      }
                      required
                    />
                  )}
                </div>
                <div className="flex flex-col flex-1">
                  <label className="text-xs font-semibold text-gray-500 mb-1">
                    Platform URL
                  </label>
                  <Input
                    type="url"
                    className="w-full border px-3 py-2 rounded-lg bg-white"
                    placeholder="Review URL"
                    value={platform.url || ""}
                    onChange={(e) =>
                      handlePlatformChange(idx, "url", e.target.value)
                    }
                    required
                  />
                </div>
                <div className="flex flex-col w-32">
                  <label className="text-xs font-semibold text-gray-500 mb-1">
                    Word Count
                  </label>
                  <Input
                    type="number"
                    className="w-full border px-3 py-2 rounded-lg bg-white"
                    placeholder="200"
                    value={platform.wordCount || ""}
                    min={20}
                    max={1000}
                    onChange={(e) =>
                      handlePlatformChange(
                        idx,
                        "wordCount",
                        Number(e.target.value),
                      )
                    }
                    required
                  />
                </div>
              </div>
              {/* Platform Instructions */}
              <Textarea
                className="w-full mt-2 text-sm"
                placeholder="Platform instructions (e.g., Log in with Google before leaving a review)"
                value={platform.customInstructions || ""}
                onChange={(e) =>
                  handlePlatformChange(
                    idx,
                    "customInstructions",
                    e.target.value.slice(0, 160),
                  )
                }
                rows={2}
                maxLength={160}
              />
              <div className="text-xs text-gray-400 text-right">
                {platform.customInstructions?.length || 0}/160
              </div>
              {/* Review Text + AI Button (conditionally rendered) */}
              {!hideReviewTemplateFields && (
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex items-center gap-1 mb-1 self-start">
                    <label className="block text-xs font-medium text-gray-700">
                      Review Template
                    </label>
                    <HoverTooltip text="By filling this out, you give your client or customer a template that will make posting a review much easier and quicker. They will still be able to use the AI button to generate a new review if they are not sure about the one you provide, or they can choose to write a custom review on their own.">
                      <Icon name="FaInfoCircle" className="w-3 h-3 text-gray-400 cursor-pointer" size={12} />
                    </HoverTooltip>
                  </div>
                  <Textarea
                    className="w-full text-sm"
                    placeholder="Write or generate a review for this platform"
                    value={platform.reviewText || ""}
                    onChange={(e) =>
                      handlePlatformChange(
                        idx,
                        "reviewText",
                        e.target.value.slice(0, REVIEW_CHAR_LIMIT),
                      )
                    }
                    rows={3}
                    maxLength={REVIEW_CHAR_LIMIT}
                  />
                  <div className="text-xs text-gray-400 text-right w-full">
                    {platform.reviewText?.length || 0}/{REVIEW_CHAR_LIMIT}
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border rounded font-semibold shadow text-slate-blue border-slate-blue bg-white hover:bg-slate-blue/10 transition text-sm whitespace-nowrap mt-1 w-auto min-w-[180px] self-start disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => onGenerateReview(idx)}
                    title="Generate with AI"
                    disabled={aiGeneratingIndex === idx}
                  >
                    {aiGeneratingIndex === idx ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-blue mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Icon name="FaRobot" className="w-4 h-4 mr-2 text-slate-blue" size={16} />
                        Generate with AI
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addPlatform}
          className="text-blue-600 underline mt-2"
        >
          + Add Platform
        </button>
      </div>
    </div>
  );
};

function HoverTooltip({
  text,
  children,
}: {
  text: string;
  children: React.ReactNode;
}) {
  const [show, setShow] = useState(false);
  return (
    <span
      className="relative inline-block align-middle ml-1"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
      tabIndex={0}
    >
      {children}
      {show && (
        <div className="absolute z-20 left-1/2 -translate-x-1/2 mt-2 w-56 p-2 bg-white border border-gray-200 rounded shadow text-xs text-gray-700">
          {text}
        </div>
      )}
    </span>
  );
}

export default ReviewWriteSection;
