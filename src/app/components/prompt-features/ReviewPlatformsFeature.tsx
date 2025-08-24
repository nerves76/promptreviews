/**
 * ReviewPlatformsFeature Component
 * 
 * A reusable component for review platforms configuration that appears across all prompt page types.
 * This component handles the configuration of review platforms including platform selection, URLs, and word counts.
 * 
 * Features:
 * - Add/remove review platforms
 * - Platform selection with predefined options
 * - URL and word count configuration
 * - Custom platform support
 * - Proper state management and callbacks
 */

"use client";
import React, { useState, useEffect } from "react";
import Icon from "@/components/Icon";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";

export interface ReviewPlatform {
  name: string;
  url: string;
  wordCount: number;
  customPlatform?: string;
  customInstructions?: string;
  reviewText?: string;
  verified: boolean;
  verified_at: string;
}

export interface ReviewPlatformsFeatureProps {
  /** The list of review platforms */
  platforms: ReviewPlatform[];
  /** Callback when platforms change */
  onPlatformsChange: (platforms: ReviewPlatform[]) => void;
  /** Callback for AI review generation */
  onGenerateReview?: (idx: number) => void;
  /** Initial values for the component */
  initialData?: {
    review_platforms?: ReviewPlatform[];
  };
  /** Whether the component is disabled */
  disabled?: boolean;
}

export const platformOptions = [
  "",
  "Google Business Profile",
  "Yelp",
  "Facebook",
  "TripAdvisor",
  "Amazon",
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
    return { icon: "FaYelp", color: "text-slate-blue" };
  if (lowerName.includes("facebook") || lowerUrl.includes("facebook"))
    return { icon: "FaFacebook", color: "text-slate-blue" };
  if (lowerName.includes("tripadvisor") || lowerUrl.includes("tripadvisor"))
    return { icon: "FaTripadvisor", color: "text-slate-blue" };
  if (lowerName.includes("amazon") || lowerUrl.includes("amazon"))
    return { icon: "FaAmazon", color: "text-slate-blue" };
  if (lowerName.includes("bbb") || lowerName.includes("better business") || lowerUrl.includes("bbb"))
    return { icon: "FaBbb", color: "text-slate-blue" };
  if (lowerName.includes("g2") || lowerUrl.includes("g2"))
    return { icon: "SiG2", color: "text-slate-blue" };
  return { icon: "FaRegStar", color: "text-slate-blue" };
};

export default function ReviewPlatformsFeature({
  platforms,
  onPlatformsChange,
  onGenerateReview,
  initialData,
  disabled = false,
}: ReviewPlatformsFeatureProps) {
  // Initialize state from props and initialData
  const [platformList, setPlatformList] = useState<ReviewPlatform[]>(platforms);

  // Update state when props change
  useEffect(() => {
    setPlatformList(platforms);
  }, [platforms]);

  // Initialize from initialData if provided
  useEffect(() => {
    if (initialData?.review_platforms) {
      setPlatformList(initialData.review_platforms);
    }
  }, [initialData]);

  const handlePlatformChange = (
    idx: number,
    field: keyof ReviewPlatform,
    val: string | number,
  ) => {
    const newPlatforms = platformList.map((p, i) =>
      i === idx ? { ...p, [field]: val } : p,
    );
    setPlatformList(newPlatforms);
    onPlatformsChange(newPlatforms);
  };

  const addPlatform = () => {
    const newPlatforms = [
      ...platformList,
      {
        name: "",
        url: "",
        wordCount: 150,
        verified: false,
        verified_at: "",
      },
    ];
    setPlatformList(newPlatforms);
    onPlatformsChange(newPlatforms);
  };

  const removePlatform = (idx: number) => {
    const newPlatforms = platformList.filter((_, i) => i !== idx);
    setPlatformList(newPlatforms);
    onPlatformsChange(newPlatforms);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Icon name="FaStar" className="text-slate-blue text-lg" size={18} />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Review Platforms
            </h3>
            <p className="text-sm text-gray-600">
              Configure where customers can leave reviews
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={addPlatform}
          disabled={disabled}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-slate-blue hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon name="FaPlus" className="mr-2 h-4 w-4 text-slate-blue" size={16} />
          Add Platform
        </button>
      </div>

      <div className="space-y-4">
        {platformList.map((platform, idx) => {
          const { icon: PlatformIcon, color } = getPlatformIcon(platform.name, platform.url);
          
          return (
            <div key={idx} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Icon name={PlatformIcon as any} className={`w-5 h-5 ${color} flex-shrink-0`} size={20} />
                  <h4 className="font-medium text-gray-900">
                    Platform {idx + 1}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => removePlatform(idx)}
                  disabled={disabled}
                  className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon name="FaTrash" className="w-4 h-4" size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platform
                  </label>
                  <select
                    value={platform.name}
                    onChange={(e) => handlePlatformChange(idx, "name", e.target.value)}
                    disabled={disabled}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-slate-blue focus:ring-slate-blue sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {platformOptions.map((option) => (
                      <option key={option} value={option}>
                        {option || "Select a platform"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL
                  </label>
                  <Input
                    type="url"
                    value={platform.url}
                    onChange={(e) => handlePlatformChange(idx, "url", e.target.value)}
                    placeholder="https://your-review-url.com"
                    disabled={disabled}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Word Count
                  </label>
                  <Input
                    type="number"
                    value={platform.wordCount}
                    onChange={(e) => handlePlatformChange(idx, "wordCount", parseInt(e.target.value) || 0)}
                    min="50"
                    max="1000"
                    disabled={disabled}
                  />
                </div>

                {platform.name === "Other" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Platform Name
                    </label>
                    <Input
                      type="text"
                      value={platform.customPlatform || ""}
                      onChange={(e) => handlePlatformChange(idx, "customPlatform", e.target.value)}
                      placeholder="Enter platform name"
                      disabled={disabled}
                    />
                  </div>
                )}
              </div>

              {onGenerateReview && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => onGenerateReview(idx)}
                    disabled={disabled}
                    className="inline-flex items-center px-3 py-2 border border-slate-blue text-sm leading-4 font-medium rounded-md text-slate-blue bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Icon name="prompty" className="mr-2 h-4 w-4 text-slate-blue" size={16} />
                    Generate with AI
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {platformList.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Icon name="FaInfoCircle" className="mx-auto h-12 w-12 text-gray-400 mb-4" size={48} />
          <p>No review platforms configured yet.</p>
          <p className="text-sm">Add a platform to get started.</p>
        </div>
      )}
    </div>
  );
} 