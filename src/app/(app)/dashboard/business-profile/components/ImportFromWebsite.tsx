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
    <div className="mt-6 mb-4 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-5 mx-auto max-w-[1000px]">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
          <Icon name="prompty" size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white mb-1"><span className="text-green-300">Quick start:</span> Import from your website</h3>
          <p className="text-sm text-white/90 mb-3">
            Get a head start – we&apos;ll scan your site and use AI to fill out everything we can. You can edit everything before saving.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 max-w-xl">
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
              className={`flex-1 px-3 py-2 rounded-lg border bg-white ${
                error ? "border-red-300 focus:ring-red-500 focus:border-red-500" : "border-transparent focus:ring-white focus:border-white"
              } focus:outline-none focus:ring-2 disabled:bg-gray-50 disabled:cursor-not-allowed`}
            />
            <button
              type="button"
              onClick={handleImport}
              disabled={isLoading || !url.trim()}
              className={`px-5 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                isLoading || !url.trim()
                  ? "bg-white/30 text-white/60 cursor-not-allowed"
                  : success
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : "bg-slate-blue text-white hover:bg-slate-blue/90"
              }`}
            >
              {isLoading ? (
                <>
                  <Icon name="FaSpinner" size={14} className="animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : success ? (
                <>
                  <Icon name="FaCheck" size={14} />
                  <span>Done!</span>
                </>
              ) : (
                <>
                  <Icon name="FaSearch" size={14} />
                  <span>Scan & fill</span>
                </>
              )}
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-2 flex items-center gap-2 text-white text-sm bg-red-500/80 rounded-lg px-3 py-2">
              <Icon name="FaExclamationTriangle" size={14} />
              <span>{error}</span>
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="mt-2 text-white text-sm bg-green-500/80 rounded-lg px-3 py-2">
              Website info imported! Review the fields below and make any edits.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
