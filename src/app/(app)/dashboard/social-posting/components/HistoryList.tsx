"use client";

import Icon from "@/components/Icon";
import { Badge } from "@/app/(app)/components/ui/badge";
import type { GoogleBusinessScheduledPost } from "@/features/social-posting";
import { formatDateOrFallback } from "@/utils/formatDate";

interface HistoryListProps {
  posts: GoogleBusinessScheduledPost[];
}

// formatDateTime using canonical formatDateOrFallback from @/utils/formatDate
function formatDateTime(dateStr: string | null): string {
  return formatDateOrFallback(dateStr, "\u2014");
}

export default function HistoryList({ posts }: HistoryListProps) {
  // Get content preview
  const getContentPreview = (post: GoogleBusinessScheduledPost) => {
    if (post.content?.summary) {
      const summary = post.content.summary;
      return summary.length > 100 ? summary.slice(0, 100) + "..." : summary;
    }
    if (post.caption) {
      return post.caption.length > 100
        ? post.caption.slice(0, 100) + "..."
        : post.caption;
    }
    return "No content";
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <Icon name="FaCheck" size={10} />
            Published
          </Badge>
        );
      case "partial_success":
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <Icon name="FaExclamationTriangle" size={10} />
            Partial
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="error" className="flex items-center gap-1">
            <Icon name="FaTimes" size={10} />
            Failed
          </Badge>
        );
      case "cancelled":
        return <Badge>Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Get target platforms
  const getTargetPlatforms = (post: GoogleBusinessScheduledPost) => {
    const platforms = [];

    if (post.selectedLocations && post.selectedLocations.length > 0) {
      platforms.push(
        <span
          key="gbp"
          className="inline-flex items-center px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded"
        >
          <Icon name="FaGoogle" size={10} className="mr-1" />
          GBP
        </span>
      );
    }

    if (post.additionalPlatforms?.bluesky?.enabled) {
      platforms.push(
        <span
          key="bluesky"
          className="inline-flex items-center px-2 py-0.5 text-xs bg-sky-100 text-sky-700 rounded"
        >
          <Icon name="FaGlobe" size={10} className="mr-1" />
          Bluesky
        </span>
      );
    }

    return platforms;
  };

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
        <Icon
          name="FaClock"
          className="w-12 h-12 text-gray-300 mx-auto mb-4"
          size={48}
        />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No post history yet
        </h3>
        <p className="text-gray-500">
          Published posts will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <div
          key={post.id}
          className="border border-gray-200 rounded-lg p-4 bg-white"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Date and status row */}
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm text-gray-500">
                  {formatDateTime(post.publishedAt || post.scheduledDate)}
                </span>
                {getStatusBadge(post.status)}
              </div>

              {/* Content preview */}
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {getContentPreview(post)}
              </p>

              {/* Target platforms */}
              <div className="flex items-center gap-2 flex-wrap">
                {getTargetPlatforms(post)}
              </div>

              {/* Error message if failed */}
              {(post.status === "failed" || post.status === "partial_success") &&
                post.errorLog && (
                  <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                    {typeof post.errorLog === "object"
                      ? JSON.stringify(post.errorLog)
                      : String(post.errorLog)}
                  </div>
                )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
