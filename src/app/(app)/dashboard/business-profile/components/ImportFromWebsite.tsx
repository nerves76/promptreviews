/**
 * ImportFromWebsite Component
 *
 * A highlighted section that allows users to import business information
 * from their website URL to auto-fill the business profile form.
 */

"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import { apiClient } from "@/utils/apiClient";

interface ImportedBusinessInfo {
  name?: string;
  about_us?: string;
  services_offered?: string[];
  keywords?: string;
  taglines?: string;
  phone?: string;
  business_email?: string;
  industry?: string;
  differentiators?: string;
  facebook_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  youtube_url?: string;
  tiktok_url?: string;
  pinterest_url?: string;
  bluesky_url?: string;
}

interface ImportFromWebsiteProps {
  onImport: (data: ImportedBusinessInfo, websiteUrl: string) => void;
  isVisible?: boolean;
}

export default function ImportFromWebsite({ onImport, isVisible = true }: ImportFromWebsiteProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isVisible) return null;

  const handleImport = async () => {
    if (!url.trim()) {
      setError("Please enter a website URL");
      return;
    }

    // Add protocol if missing
    let processedUrl = url.trim();
    if (!processedUrl.startsWith("http://") && !processedUrl.startsWith("https://")) {
      processedUrl = "https://" + processedUrl;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.post("/scrape-business-info", { url: processedUrl });

      if (!response.success) {
        setError(response.error || "Failed to import website information");
        return;
      }

      const data = response.data as ImportedBusinessInfo;

      // Count how many fields were extracted
      const fieldCount = Object.values(data).filter((v) => {
        if (Array.isArray(v)) return v.length > 0;
        return v !== undefined && v !== null && v !== "";
      }).length;

      if (fieldCount === 0) {
        setError("No business information could be extracted from this website");
        return;
      }

      setSuccess(true);
      onImport(data, processedUrl);

      // Reset after a delay
      setTimeout(() => {
        setSuccess(false);
      }, 3000);

    } catch (err) {
      console.error("Import error:", err);
      setError(err instanceof Error ? err.message : "Failed to import website information");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      handleImport();
    }
  };

  return (
    <div className="mb-6 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-[2px]">
      <div className="rounded-[10px] bg-white p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Icon and text */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
              <Icon name="FaGlobe" size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Quick start: Import from your website</h3>
              <p className="text-sm text-gray-600">Get a head start - we'll scan your site and use AI to fill out everything we can. You can edit everything before saving.</p>
            </div>
          </div>

          {/* Input and button */}
          <div className="flex-1 flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setError(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder="yourwebsite.com"
                disabled={isLoading}
                className={`w-full px-4 py-2.5 rounded-lg border ${
                  error ? "border-red-300 focus:ring-red-500 focus:border-red-500" : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                } focus:outline-none focus:ring-2 disabled:bg-gray-50 disabled:cursor-not-allowed`}
              />
            </div>
            <button
              type="button"
              onClick={handleImport}
              disabled={isLoading || !url.trim()}
              className={`px-5 py-2.5 rounded-lg font-medium text-white transition-all flex items-center justify-center gap-2 ${
                isLoading || !url.trim()
                  ? "bg-gray-400 cursor-not-allowed"
                  : success
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
              }`}
            >
              {isLoading ? (
                <>
                  <Icon name="FaSpinner" size={16} className="animate-spin" />
                  <span>Importing...</span>
                </>
              ) : success ? (
                <>
                  <Icon name="FaCheck" size={16} />
                  <span>Imported!</span>
                </>
              ) : (
                <>
                  <Icon name="FaUpload" size={16} />
                  <span>Import</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
            <Icon name="FaExclamationTriangle" size={14} />
            <span>{error}</span>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="mt-3 flex items-center gap-2 text-green-600 text-sm">
            <Icon name="FaCheckCircle" size={14} />
            <span>Website information imported! Review the fields below and make any edits.</span>
          </div>
        )}
      </div>
    </div>
  );
}
