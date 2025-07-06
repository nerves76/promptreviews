import React from "react";
import {
  FaStar,
  FaInfoCircle,
  FaGoogle,
  FaFacebook,
  FaYelp,
  FaTripadvisor,
  FaRegStar,
} from "react-icons/fa";
import { IconType } from "react-icons";

export interface ReviewPlatformLink {
  name: string;
  url: string;
  wordCount: number;
  customPlatform?: string;
  customInstructions?: string;
}

interface ReviewPlatformsSectionProps {
  value: ReviewPlatformLink[];
  onChange: (platforms: ReviewPlatformLink[]) => void;
  errors?: string[];
  hideReviewTemplateFields?: boolean;
  onResetToDefaults?: () => void;
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

// Helper to get platform icon based on name
function getPlatformIcon(platform: string): { icon: IconType; label: string } {
  const lowerPlatform = (platform || "").toLowerCase();
  if (lowerPlatform.includes("google"))
    return { icon: FaGoogle, label: "Google" };
  if (lowerPlatform.includes("facebook"))
    return { icon: FaFacebook, label: "Facebook" };
  if (lowerPlatform.includes("yelp")) return { icon: FaYelp, label: "Yelp" };
  if (lowerPlatform.includes("tripadvisor"))
    return { icon: FaTripadvisor, label: "TripAdvisor" };
  return { icon: FaStar, label: "Other" };
}

const ReviewPlatformsSection: React.FC<ReviewPlatformsSectionProps> = ({
  value,
  onChange,
  errors = [],
  hideReviewTemplateFields = false,
  onResetToDefaults,
}) => {
  const [showInfo, setShowInfo] = React.useState(false);

  const handlePlatformChange = (
    idx: number,
    field: keyof ReviewPlatformLink,
    val: string | number,
  ) => {
    const newPlatforms = value.map((p, i) =>
      i === idx ? { ...p, [field]: val } : p,
    );
    onChange(newPlatforms);
  };
  const addPlatform = () =>
    onChange([...value, { name: "", url: "", wordCount: 200 }]);
  const removePlatform = (idx: number) =>
    onChange(value.filter((_, i) => i !== idx));

  return (
    <div className="mb-16">
      <div className="flex items-center justify-between mb-12">
        <h2 className="text-2xl font-bold text-slate-blue flex items-center gap-3 m-0">
          <FaStar className="w-7 h-7 text-slate-blue" />
          Review platforms
        </h2>
      </div>
      <div className="space-y-10">
        {value.map((platform, idx) => (
          <div
            key={idx}
            className="flex flex-col gap-3 p-6 pt-10 border border-blue-200 rounded-lg bg-blue-50 shadow-sm relative"
          >
            {/* Platform Icon in top-left corner */}
            <div
              className="absolute -top-4 -left-4 bg-white rounded-full shadow p-2 flex items-center justify-center"
              title={getPlatformIcon(platform.name).label}
            >
              {React.createElement(getPlatformIcon(platform.name).icon, {
                className: "w-7 h-7",
                style: { color: "#4F46E5" },
              })}
            </div>
            {/* Labels row above inputs */}
            <div className="flex gap-2 items-end mb-1">
              <span className="w-1/3 text-xs font-semibold text-gray-500">
                Platform Name
              </span>
              <span className="w-1/2 text-xs font-semibold text-gray-500">
                Platform URL
              </span>
              <span className="w-1/6 text-xs font-semibold text-gray-500">
                Word Count
              </span>
            </div>
            <div className="flex gap-2 items-start">
              <div className="flex flex-col gap-2 w-1/3">
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
                  <input
                    type="text"
                    className="w-full border px-3 py-2 rounded-lg bg-white mt-1"
                    placeholder="Enter platform name"
                    value={platform.customPlatform || ""}
                    onChange={(e) =>
                      handlePlatformChange(idx, "customPlatform", e.target.value)
                    }
                    required
                  />
                )}
              </div>
              <input
                type="url"
                className="w-1/2 border px-3 py-2 rounded-lg bg-white"
                placeholder="https://example.com/review-page"
                value={platform.url || ""}
                onChange={(e) =>
                  handlePlatformChange(idx, "url", e.target.value)
                }
                required
              />
              <input
                type="number"
                className="w-1/6 border px-3 py-2 rounded-lg bg-white"
                placeholder="200"
                value={platform.wordCount || ""}
                min={20}
                max={1000}
                onChange={(e) =>
                  handlePlatformChange(idx, "wordCount", Number(e.target.value))
                }
                required
              />
              {/* Remove button in top-right corner */}
              <button
                type="button"
                onClick={() => removePlatform(idx)}
                className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 bg-white text-red-600 font-bold rounded-full shadow p-1 z-10 border border-gray-200 hover:bg-gray-50 transition"
                style={{
                  lineHeight: 1,
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                aria-label="Remove platform"
              >
                &times;
              </button>
            </div>
            {/* Platform Instructions */}
            <textarea
              className="w-full border px-3 py-2 rounded-lg bg-gray-50 mt-2 text-sm"
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
          </div>
        ))}
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

export default ReviewPlatformsSection;
