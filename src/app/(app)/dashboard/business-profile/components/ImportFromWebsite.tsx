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
  differentiators?: string[];
  years_in_business?: string;
  facebook_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  youtube_url?: string;
  tiktok_url?: string;
  pinterest_url?: string;
  bluesky_url?: string;
  twitter_url?: string;
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
      const response = await apiClient.post<{
        success: boolean;
        error?: string;
        data?: ImportedBusinessInfo;
        url?: string;
      }>("/scrape-business-info", { url: processedUrl });

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
    <div className="mb-4 py-3 px-4">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
          <Icon name="prompty" size={14} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="font-medium text-white text-sm"><span className="text-white/70">Quick start:</span> Import from your website</span>
              <span className="text-white/60 text-xs hidden sm:inline">We&apos;ll scan your site and use AI to fill out everything we can. You can edit before saving.</span>
            </div>
            <div className="flex flex-1 gap-2 items-center">
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
                className={`flex-1 max-w-xs px-3 py-1.5 text-sm rounded-md border bg-white/90 ${
                  error ? "border-red-300 focus:ring-red-500 focus:border-red-500" : "border-white/30 focus:ring-white/50 focus:border-white/50"
                } focus:outline-none focus:ring-1 disabled:bg-white/50 disabled:cursor-not-allowed placeholder:text-gray-400`}
              />
              <button
                type="button"
                onClick={handleImport}
                disabled={isLoading || !url.trim()}
                className={`px-3 py-1.5 text-sm rounded-md font-medium transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  isLoading || !url.trim()
                    ? "bg-white/30 text-white/50 cursor-not-allowed"
                    : success
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-white/20 text-white hover:bg-white/30 border border-white/30"
                }`}
              >
                {isLoading ? (
                  <>
                    <Icon name="FaSpinner" size={12} className="animate-spin" />
                    <span>Scanning...</span>
                  </>
                ) : success ? (
                  <>
                    <Icon name="FaCheck" size={12} />
                    <span>Done!</span>
                  </>
                ) : (
                  <>
                    <Icon name="FaSearch" size={12} />
                    <span>Scan & fill</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-2 flex items-center gap-2 text-red-200 text-xs bg-red-500/20 border border-red-400/30 rounded-md px-2 py-1.5">
              <Icon name="FaExclamationTriangle" size={12} />
              <span>{error}</span>
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="mt-2 text-green-200 text-xs bg-green-500/20 border border-green-400/30 rounded-md px-2 py-1.5">
              Website info imported! Review the fields below and make any edits.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
