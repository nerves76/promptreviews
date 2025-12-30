"use client";

import { useState } from "react";
import { Dialog } from "@headlessui/react";
import Icon from "@/components/Icon";
import { apiClient } from "@/utils/apiClient";
import { TestFeedResponse, ParsedFeedItem } from "@/features/rss-feeds/types";

interface TestFeedModalProps {
  onClose: () => void;
  onUseUrl: (url: string, name: string) => void;
}

export default function TestFeedModal({ onClose, onUseUrl }: TestFeedModalProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TestFeedResponse | null>(null);

  const handleTest = async () => {
    if (!url) {
      setError("Please enter a feed URL");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await apiClient.post<TestFeedResponse>("/rss-feeds/test", {
        feedUrl: url,
      });
      setResult(response);
      if (!response.success) {
        setError(response.error || "Failed to parse feed");
      }
    } catch (err: unknown) {
      console.error("Failed to test feed:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to test feed";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Unknown date";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString();
  };

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <Dialog.Title className="text-xl font-bold text-gray-900 mb-4">
              Test RSS feed
            </Dialog.Title>

            <p className="text-gray-600 mb-4">
              Enter a feed URL to validate it and preview its content.
            </p>

            {/* URL Input */}
            <div className="flex gap-2 mb-4">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/feed.xml"
                className="flex-1 border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                onKeyDown={(e) => e.key === "Enter" && handleTest()}
              />
              <button
                onClick={handleTest}
                disabled={loading || !url}
                className="px-4 py-2 text-sm font-medium text-white bg-slate-blue rounded-lg hover:bg-slate-blue/90 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Icon name="FaSpinner" className="animate-spin" size={16} />
                ) : (
                  "Test"
                )}
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Results */}
            {result?.success && (
              <div className="space-y-4">
                {/* Feed Info */}
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="FaCheckCircle" className="text-green-600" size={16} />
                    <span className="font-medium text-green-800">
                      Valid RSS feed
                    </span>
                  </div>
                  <p className="text-green-800 font-medium">
                    {result.feed.title || "Untitled Feed"}
                  </p>
                  {result.feed.description && (
                    <p className="text-green-700 text-sm mt-1">
                      {result.feed.description}
                    </p>
                  )}
                  <p className="text-green-700 text-sm mt-2">
                    {result.feed.itemCount} items found
                  </p>
                </div>

                {/* Preview Items */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Recent items (preview):
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {result.items.map((item, index) => (
                      <div
                        key={item.guid || index}
                        className="p-3 bg-gray-50 rounded-lg"
                      >
                        <p className="font-medium text-gray-900 text-sm">
                          {item.title || "Untitled"}
                        </p>
                        {item.description && (
                          <p className="text-gray-600 text-xs mt-1 line-clamp-2">
                            {item.description.substring(0, 200)}
                            {item.description.length > 200 && "..."}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          {item.pubDate && (
                            <span>{formatDate(item.pubDate)}</span>
                          )}
                          {item.imageUrl && (
                            <span className="flex items-center gap-1">
                              <Icon name="FaImage" size={10} />
                              Has image
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Use this feed button */}
                <button
                  onClick={() => onUseUrl(url, result.feed.title || "")}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-slate-blue rounded-lg hover:bg-slate-blue/90 transition-colors"
                >
                  Use this feed
                </button>
              </div>
            )}

            {/* Close button */}
            <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
