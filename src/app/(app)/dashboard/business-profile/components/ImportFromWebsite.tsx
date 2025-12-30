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
    <div className="mt-4 mb-8 flex justify-center px-4">
      <div className="bg-white/15 backdrop-blur-md border border-white/30 rounded-xl px-6 py-5 max-w-md w-full text-center">
        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
            <Icon name="prompty" size={14} className="text-white" />
          </div>
          <span className="font-bold text-lg">
            <span className="text-green-300">Quick start:</span> <span className="text-white">Import from your website</span>
          </span>
        </div>

        {/* Description */}
        <p className="text-white text-sm mb-4">
          We&apos;ll scan your site and use AI to fill out everything we can. You can edit before saving.
        </p>

        {/* Input and button */}
        <div className="flex gap-2">
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
            className={`flex-1 px-3 py-2 text-sm rounded-lg border bg-white/90 ${
              error ? "border-red-300 focus:ring-red-500 focus:border-red-500" : "border-white/30 focus:ring-white/50 focus:border-white/50"
            } focus:outline-none focus:ring-1 disabled:bg-white/50 disabled:cursor-not-allowed placeholder:text-gray-400`}
          />
          <button
            type="button"
            onClick={handleImport}
            disabled={isLoading || !url.trim()}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              isLoading || !url.trim()
                ? "bg-green-300/30 text-green-300/50 cursor-not-allowed"
                : success
                ? "bg-green-500 text-white hover:bg-green-600"
                : "bg-green-300 text-slate-blue hover:bg-green-200"
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

        {/* Error message */}
        {error && (
          <div className="mt-3 flex items-center justify-center gap-2 text-red-200 text-xs bg-red-500/20 border border-red-400/30 rounded-lg px-3 py-2">
            <Icon name="FaExclamationTriangle" size={12} />
            <span>{error}</span>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="mt-3 text-green-200 text-xs bg-green-500/20 border border-green-400/30 rounded-lg px-3 py-2">
            Website info imported! Review the fields below and make any edits.
          </div>
        )}
      </div>
    </div>
  );
}
