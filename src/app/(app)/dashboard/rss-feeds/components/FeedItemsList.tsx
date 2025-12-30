"use client";

import { useState, useEffect } from "react";
import Icon from "@/components/Icon";
import { apiClient } from "@/utils/apiClient";
import { RssFeedItem, FeedDetailResponse } from "@/features/rss-feeds/types";

interface FeedItemsListProps {
  feedId: string;
}

export default function FeedItemsList({ feedId }: FeedItemsListProps) {
  const [items, setItems] = useState<RssFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchItems() {
      try {
        setLoading(true);
        const response = await apiClient.get<FeedDetailResponse>(
          `/rss-feeds/${feedId}`
        );
        if (response.success) {
          setItems(response.recentItems || []);
        }
      } catch (err) {
        console.error("Failed to fetch items:", err);
        setError("Failed to load feed items");
      } finally {
        setLoading(false);
      }
    }

    fetchItems();
  }, [feedId]);

  const getStatusBadge = (status: RssFeedItem["status"]) => {
    switch (status) {
      case "scheduled":
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
            Scheduled
          </span>
        );
      case "skipped":
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
            Skipped
          </span>
        );
      case "failed":
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">
            Failed
          </span>
        );
      case "pending":
      default:
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
            Pending
          </span>
        );
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Icon
          name="FaSpinner"
          className="animate-spin text-slate-blue"
          size={24}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        <Icon name="FaExclamationTriangle" size={16} className="inline mr-2" />
        {error}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <Icon name="FaFileAlt" size={24} className="mx-auto mb-2 text-gray-300" />
        <p>No items discovered yet</p>
        <p className="text-sm mt-1">
          Items will appear here after the feed is polled
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h4 className="font-medium text-gray-900 mb-3">Recent items</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2 font-medium">Title</th>
              <th className="pb-2 font-medium">Published</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium">Processed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="py-3 pr-4">
                  <div className="flex items-start gap-2">
                    {item.imageUrl && (
                      <Icon
                        name="FaImage"
                        size={12}
                        className="text-gray-400 mt-1 flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate max-w-xs">
                        {item.title || "Untitled"}
                      </p>
                      {item.itemUrl && (
                        <a
                          href={item.itemUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-slate-blue hover:underline"
                        >
                          View original
                        </a>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-4 text-gray-600">
                  {formatDate(item.publishedAt)}
                </td>
                <td className="py-3 pr-4">
                  <div className="flex flex-col gap-1">
                    {getStatusBadge(item.status)}
                    {item.skipReason && (
                      <span className="text-xs text-gray-500">
                        {item.skipReason.replace(/_/g, " ")}
                      </span>
                    )}
                    {item.errorMessage && (
                      <span className="text-xs text-red-500">
                        {item.errorMessage}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 text-gray-600">
                  {formatDate(item.processedAt)}
                  {item.scheduledPostId && (
                    <a
                      href={`/dashboard/social-posting/scheduled`}
                      className="block text-xs text-slate-blue hover:underline"
                    >
                      View post
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
