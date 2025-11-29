"use client";

import React, { useEffect, useState, useRef } from "react";
import { createClient } from "@/auth/providers/supabase";
import { useAuthGuard } from "@/utils/authGuard";
import { getAccountIdForUser } from "@/auth/utils/accounts";
import { useAccountData } from "@/auth/hooks/granularAuthHooks";
import { Dialog } from "@headlessui/react";
import { useRouter } from "next/navigation";
import Icon, { IconName } from "@/components/Icon";
import PageCard from "@/app/(app)/components/PageCard";
import StandardLoader from "@/app/(app)/components/StandardLoader";
import TopLoaderOverlay from "@/app/(app)/components/TopLoaderOverlay";
import {
  EMOJI_SENTIMENT_LABELS,
  EMOJI_SENTIMENT_ICONS,
} from "@/app/(app)/components/prompt-modules/emojiSentimentConfig";
import { platformOptions } from "@/app/(app)/components/prompt-features/ReviewPlatformsFeature";
import ShareButton from "@/app/(app)/components/reviews/ShareButton";
import { ToastContainer, useToast } from "@/app/(app)/components/reviews/Toast";
import { SharePlatform } from "@/app/(app)/components/reviews/utils/shareHandlers";

interface Review {
  id: string;
  prompt_page_id: string;
  first_name: string;
  last_name: string;
  reviewer_role?: string;
  platform: string;
  review_content: string;
  created_at: string;
  status: string;
  emoji_sentiment_selection?: string;
  verified?: boolean;
  verified_at?: string | null;
  platform_url?: string;
  imported_from_google?: boolean;
  contact_id?: string;
  last_shared_at?: string | null;
  star_rating?: number | null;
  location_name?: string | null;
  business_location_id?: string | null;
}

interface ReviewerGroup {
  reviewerKey: string;
  first_name: string;
  last_name: string;
  reviews: Review[];
}

interface PlatformGroup {
  platform: string;
  reviews: Review[];
}

const ITEMS_PER_PAGE = 20;

const TABS = [
  { key: "platform", label: "By platform" },
  { key: "reviewer", label: "By reviewer" },
];

const SAMPLE_REVIEWS = [
  // Google (2)
  {
    prompt_page_id: "00000000-0000-0000-0000-000000000000",
    first_name: "John",
    last_name: "Smith",
    platform: "Google",
    review_content:
      "Absolutely amazing service! The team was professional, efficient, and completed the project ahead of schedule.",
    status: "submitted",
    emoji_sentiment_selection: "😊",
  },
  {
    prompt_page_id: "00000000-0000-0000-0000-000000000000",
    first_name: "Emily",
    last_name: "Davis",
    platform: "Google",
    review_content:
      "I've worked with many contractors, but this team stands out. Their expertise and attention to detail are unmatched.",
    status: "submitted",
    emoji_sentiment_selection: "😍",
  },
  // Yelp (2)
  {
    prompt_page_id: "00000000-0000-0000-0000-000000000000",
    first_name: "Sarah",
    last_name: "Johnson",
    platform: "Yelp",
    review_content:
      "Great experience from start to finish. The attention to detail was impressive, and the final result exceeded my expectations.",
    status: "submitted",
    emoji_sentiment_selection: "😊",
  },
  {
    prompt_page_id: "00000000-0000-0000-0000-000000000000",
    first_name: "Carlos",
    last_name: "Martinez",
    platform: "Yelp",
    review_content:
      "The food and service were both excellent. Will definitely return!",
    status: "submitted",
    emoji_sentiment_selection: "😐",
  },
  // Facebook (2)
  {
    prompt_page_id: "00000000-0000-0000-0000-000000000000",
    first_name: "Michael",
    last_name: "Brown",
    platform: "Facebook",
    review_content:
      "Professional service and excellent communication throughout the project. The quality of work is top-notch.",
    status: "submitted",
    emoji_sentiment_selection: "😊",
  },
  {
    prompt_page_id: "00000000-0000-0000-0000-000000000000",
    first_name: "Lisa",
    last_name: "Chen",
    platform: "Facebook",
    review_content:
      "Very responsive and creative team. Our campaign results improved dramatically.",
    status: "submitted",
    emoji_sentiment_selection: "😢",
  },
  // TripAdvisor (2)
  {
    prompt_page_id: "00000000-0000-0000-0000-000000000000",
    first_name: "Anna",
    last_name: "Lee",
    platform: "TripAdvisor",
    review_content:
      "The tour was well organized and the guide was knowledgeable. Highly recommend!",
    status: "submitted",
    emoji_sentiment_selection: "😊",
  },
  {
    prompt_page_id: "00000000-0000-0000-0000-000000000000",
    first_name: "David",
    last_name: "Kim",
    platform: "TripAdvisor",
    review_content:
      "A wonderful experience from start to finish. Will book again!",
    status: "submitted",
    emoji_sentiment_selection: "😡",
  },
  // Clutch (2)
  {
    prompt_page_id: "00000000-0000-0000-0000-000000000000",
    first_name: "Priya",
    last_name: "Patel",
    platform: "Clutch",
    review_content:
      "Their expertise helped us launch on time and on budget. Great partner!",
    status: "submitted",
    emoji_sentiment_selection: "😊",
  },
  {
    prompt_page_id: "00000000-0000-0000-0000-000000000000",
    first_name: "Tom",
    last_name: "Nguyen",
    platform: "Clutch",
    review_content:
      "Excellent communication and technical skills. Highly recommend for any SaaS project.",
    status: "submitted",
    emoji_sentiment_selection: "😍",
  },
  // G2 (2)
  {
    prompt_page_id: "00000000-0000-0000-0000-000000000000",
    first_name: "Samantha",
    last_name: "Green",
    platform: "G2",
    review_content:
      "The software is intuitive and support is always available. Five stars!",
    status: "submitted",
    emoji_sentiment_selection: "😊",
  },
  {
    prompt_page_id: "00000000-0000-0000-0000-000000000000",
    first_name: "Alex",
    last_name: "Rivera",
    platform: "G2",
    review_content:
      "Robust features and easy integration. Our team productivity increased noticeably.",
    status: "submitted",
    emoji_sentiment_selection: "😐",
  },
];

// Custom BBB and Angi icons as React components
const BBBIcon = () => (
  <span
    style={{ fontWeight: "bold", fontSize: "1.2em", letterSpacing: "0.05em" }}
  >
    BBB
  </span>
);
const AngiIcon = () => (
  <span
    style={{ fontWeight: "bold", fontSize: "1.2em", letterSpacing: "0.05em" }}
  >
    Angi
  </span>
);

// Helper to get platform icon based on platform name
function getPlatformIcon(platform: string): { icon: any; label: string } {
  const lower = (platform || "").toLowerCase();
  if (lower.includes("google"))
    return { icon: "FaGoogle", label: "Google Business Profile" };
  if (lower.includes("yelp")) return { icon: "FaYelp", label: "Yelp" };
  if (lower.includes("facebook"))
    return { icon: "FaFacebook", label: "Facebook" };
  if (lower.includes("tripadvisor"))
    return { icon: "FaTripadvisor", label: "TripAdvisor" };
  if (lower.includes("clutch"))
    return { icon: "FaRegCopyright", label: "Clutch" };
  if (lower.includes("g2")) return { icon: "SiG2", label: "G2" };
  if (lower.includes("angi")) return { icon: AngiIcon, label: "Angi" };
  if (lower.includes("houzz")) return { icon: "SiHouzz", label: "Houzz" };
  if (lower.includes("bbb")) return { icon: "FaBbb", label: "BBB" };
  if (lower.includes("thumbtack"))
    return { icon: "FaThumbtack", label: "Thumbtack" };
  if (lower.includes("homeadvisor"))
    return { icon: "SiHomeadvisor", label: "HomeAdvisor" };
  if (lower.includes("trustpilot"))
    return { icon: "SiTrustpilot", label: "Trustpilot" };
  if (lower.includes("other") || !platform)
    return { icon: "FaStar", label: "Other" };
  return { icon: "FaStar", label: platform || "Other" };
}

// Helper to render star rating from Google
function StarRating({ rating }: { rating: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span
        key={i}
        className={i <= rating ? "text-yellow-400" : "text-gray-300"}
      >
        ★
      </span>
    );
  }
  return <span className="text-sm">{stars}</span>;
}

// Helper to check if a review is new (within 7 days)
function isNewReview(created_at: string) {
  const created = new Date(created_at);
  const now = new Date();
  const diff = now.getTime() - created.getTime();
  return diff < 7 * 24 * 60 * 60 * 1000;
}

// Add this helper to map sentiment label to icon
/**
 * Combines predefined platform options with custom platforms actually used in reviews
 */
function getCombinedPlatformOptions(reviews: Review[]): string[] {
  // Get predefined platforms (exclude empty string and "Other")
  const predefinedPlatforms = platformOptions.filter(p => p && p !== "Other");
  
  // Get custom platforms from reviews (platforms not in predefined list)
  const customPlatforms = Array.from(
    new Set(
      reviews
        .map(r => r.platform)
        .filter(Boolean) // Remove empty/null values
        .filter(platform => !platformOptions.includes(platform)) // Only custom platforms
    )
  );
  
  // Combine and sort alphabetically
  const allPlatforms = [...predefinedPlatforms, ...customPlatforms].sort();
  
  return allPlatforms;
}

function getSentimentIcon(sentiment: string) {
  const idx = EMOJI_SENTIMENT_LABELS.findIndex(
    (l) => l.toLowerCase() === (sentiment || "").toLowerCase(),
  );
  if (idx !== -1) {
    const { icon: IconComponent, color } = EMOJI_SENTIMENT_ICONS[idx];
    return (
      <IconComponent className={`w-7 h-7 ${color}`} />
    );
  }
  return null;
}

export default function ReviewsPage() {
  const { loading: authLoading, shouldRedirect } = useAuthGuard();
  const supabase = createClient();
  const router = useRouter();
  const { selectedAccountId } = useAccountData();
  const { toasts, closeToast, success, error: showError } = useToast();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [business, setBusiness] = useState<{ id: string; name: string; website?: string } | null>(null);
  const [grouped, setGrouped] = useState<ReviewerGroup[]>([]);
  const [platformGrouped, setPlatformGrouped] = useState<PlatformGroup[]>([]);
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"reviewer" | "platform">(
    "platform",
  );
  const [platformFilter, setPlatformFilter] = useState("");
  const [reviewerFilter, setReviewerFilter] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("");
  const [expandedRows, setExpandedRows] = useState<{ [id: string]: boolean }>(
    {},
  );
  const [openReviewPopoverId, setOpenReviewPopoverId] = useState<string | null>(
    null,
  );
  const [emojiFilter, setEmojiFilter] = useState<string>("");
  const [showEmojiDropdown, setShowEmojiDropdown] = useState(false);
  const [sampleNotice, setSampleNotice] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [businessLocations, setBusinessLocations] = useState<{ id: string; name: string }[]>([]);

  // Add a ref map to store review refs
  const reviewRefs = useRef<{ [id: string]: HTMLDivElement | null }>({});
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<string[][]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importingLocationId, setImportingLocationId] = useState<string | null>(null);
  const [hasGbpConnected, setHasGbpConnected] = useState(false);
  const [gbpLocations, setGbpLocations] = useState<{ id: string; location_id: string; location_name: string }[]>([]);

  // Using singleton Supabase client from supabaseClient.ts

  // Get current account ID from auth context
  useEffect(() => {
    if (selectedAccountId) {
      setAccountId(selectedAccountId);
      setError(null);
    } else {
      setError("No account selected");
      setAccountId(null);
    }
  }, [selectedAccountId]);

  // Check if GBP is connected for import modal
  useEffect(() => {
    const checkGbpConnection = async () => {
      if (!accountId) return;

      try {
        // Use API endpoint to ensure proper account isolation
        const { apiClient } = await import('@/utils/apiClient');
        const response = await apiClient.get('/social-posting/platforms/google-business-profile/locations');

        const locations = response.data?.locations || response.locations || [];
        console.log('[Reviews] GBP locations for account', accountId, ':', locations.length, 'locations', locations.map((l: any) => l.location_name));

        if (locations.length > 0) {
          setHasGbpConnected(true);
          setGbpLocations(locations.map((loc: any) => ({
            id: loc.id,
            location_id: loc.location_id || loc.name,
            location_name: loc.location_name || loc.title || loc.name
          })));
        } else {
          setHasGbpConnected(false);
          setGbpLocations([]);
        }
      } catch (err) {
        console.error('Error checking GBP connection:', err);
        setHasGbpConnected(false);
        setGbpLocations([]);
      }
    };

    checkGbpConnection();
  }, [accountId]);

  // Fetch business locations for location filter
  useEffect(() => {
    const fetchBusinessLocations = async () => {
      if (!accountId) return;

      try {
        const { data: locations } = await supabase
          .from('business_locations')
          .select('id, name')
          .eq('account_id', accountId)
          .order('name');

        if (locations) {
          setBusinessLocations(locations.filter(l => l.name));
        }
      } catch (err) {
        console.error('Error fetching business locations:', err);
      }
    };

    fetchBusinessLocations();
  }, [accountId, supabase]);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!accountId) return; // Wait for account ID to be available

      setLoading(true);
      setError(null);
      try {
        // Fetch business data for this account
        const { data: businessData } = await supabase
          .from('businesses')
          .select('id, name, business_website')
          .eq('account_id', accountId)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (businessData) {
          setBusiness({
            id: businessData.id,
            name: businessData.name,
            website: businessData.business_website,
          });
        }

        // Get all prompt page IDs for this account first
        const { data: promptPages, error: promptPagesError } = await supabase
          .from('prompt_pages')
          .select('id')
          .eq('account_id', accountId);

        if (promptPagesError) throw promptPagesError;

        const promptPageIds = promptPages?.map(p => p.id) || [];

        // Build query to include both:
        // 1. Reviews submitted through prompt pages (prompt_page_id matches)
        // 2. Imported Google reviews (prompt_page_id is null AND imported_from_google is true AND business_id matches)
        let countQuery = supabase
          .from("review_submissions")
          .select("id", { count: "exact", head: true });

        let reviewsQuery = supabase
          .from("review_submissions")
          .select(
            "id, prompt_page_id, first_name, last_name, reviewer_role, platform, review_content, created_at, status, emoji_sentiment_selection, verified, verified_at, platform_url, imported_from_google, contact_id, star_rating, location_name, business_location_id"
          );

        // Apply filtering based on account_id
        // Include ALL reviews for this account:
        // 1. Reviews submitted through prompt pages (prompt_page_id matches)
        // 2. Imported Google reviews (imported_from_google = true)
        // 3. Manually uploaded reviews (account_id matches)
        countQuery = countQuery.eq('account_id', accountId);
        reviewsQuery = reviewsQuery.eq('account_id', accountId);

        // First, get total count with account filtering
        const { count, error: countError } = await countQuery;

        if (countError) throw countError;

        // Calculate total pages
        const total = Math.ceil((count || 0) / ITEMS_PER_PAGE);
        setTotalPages(total);

        // Fetch paginated reviews with account filtering
        const { data: existingReviews, error: fetchError } = await reviewsQuery
          .order("created_at", { ascending: false })
          .range(
            (currentPage - 1) * ITEMS_PER_PAGE,
            currentPage * ITEMS_PER_PAGE - 1,
          );

        console.log('[Reviews] Fetch result:', {
          count,
          existingReviewsLength: existingReviews?.length,
          fetchError: fetchError?.message,
          accountId
        });

        if (fetchError) throw fetchError;

        // If no reviews exist, show sample reviews in-memory only
        if (!existingReviews || existingReviews.length === 0) {
          setReviews(
            SAMPLE_REVIEWS.map((r, i) => ({
              ...r,
              id: "sample-" + i,
              created_at: new Date().toISOString(),
            })),
          );
        } else {
          // Fetch last shared date for each review
          const reviewIds = existingReviews.map(r => r.id);
          const { data: shareEvents } = await supabase
            .from('review_share_events')
            .select('review_id, timestamp')
            .in('review_id', reviewIds)
            .order('timestamp', { ascending: false });

          // Create a map of review_id to most recent timestamp
          const lastSharedMap = new Map<string, string>();
          shareEvents?.forEach(event => {
            if (!lastSharedMap.has(event.review_id)) {
              lastSharedMap.set(event.review_id, event.timestamp);
            }
          });

          // Add last_shared_at to each review
          const reviewsWithShares = existingReviews.map(review => ({
            ...review,
            last_shared_at: lastSharedMap.get(review.id) || null,
          }));

          setReviews(reviewsWithShares);
        }
      } catch (err) {
        console.error("Error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load reviews.",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [supabase, currentPage, accountId]);

  useEffect(() => {
    // Group reviews by reviewer (name+role)
    const groups: { [key: string]: ReviewerGroup } = {};
    for (const review of reviews) {
      const reviewerKey = `${review.first_name}||${review.last_name}`;
      if (!groups[reviewerKey]) {
        groups[reviewerKey] = {
          reviewerKey,
          first_name: review.first_name,
          last_name: review.last_name,
          reviews: [],
        };
      }
      groups[reviewerKey].reviews.push(review);
    }
    setGrouped(Object.values(groups));

    // Group reviews by platform
    const platformMap: { [platform: string]: PlatformGroup } = {};
    for (const review of reviews) {
      if (!platformMap[review.platform]) {
        platformMap[review.platform] = {
          platform: review.platform,
          reviews: [],
        };
      }
      platformMap[review.platform].reviews.push(review);
    }
    setPlatformGrouped(Object.values(platformMap));
  }, [reviews]);

  const toggleExpand = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review? This will also remove it from your stats.")) return;

    setIsDeleting(reviewId);
    try {
      const { error } = await supabase
        .from("review_submissions")
        .delete()
        .eq("id", reviewId);

      if (error) throw error;

      // Remove the deleted review from the state
      setReviews((prev) => prev.filter((review) => review.id !== reviewId));
    } catch (err) {
      console.error("Error deleting review:", err);
      setError("Failed to delete review. Please try again.");
    } finally {
      setIsDeleting(null);
    }
  };

  // Export reviews as CSV
  const handleExport = async () => {
    try {
      // For blob responses, we need to use raw fetch with authentication
      const { tokenManager } = await import('@/auth/services/TokenManager');
      const token = await tokenManager.getAccessToken();

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;

        // Get selected account
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.sub) {
            const accountKey = `promptreviews_selected_account_${payload.sub}`;
            const selectedAccount = localStorage.getItem(accountKey);
            if (selectedAccount) {
              headers['X-Selected-Account'] = selectedAccount;
            }
          }
        } catch (e) {
          // Token parsing failed, ignore
        }
      }

      const response = await fetch('/api/reviews/export', { headers });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Create download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const currentDate = new Date().toISOString().split('T')[0];
      a.download = `reviews-${currentDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export reviews. Please try again.');
    }
  };

  // Import handlers
  const handleImportFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportError(null);
    setImportSuccess(null);

    // Parse preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      const preview = lines.slice(0, 6).map(line => {
        // Simple CSV parsing for preview (handles basic cases)
        const cells: string[] = [];
        let current = '';
        let inQuotes = false;
        for (const char of line) {
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            cells.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        cells.push(current.trim());
        return cells;
      });
      setImportPreview(preview);
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = async () => {
    try {
      // Include auth headers so template includes user's location names
      const { tokenManager } = await import('@/auth/services/TokenManager');
      const token = await tokenManager.getAccessToken();

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.sub) {
            const accountKey = `promptreviews_selected_account_${payload.sub}`;
            const selectedAccount = localStorage.getItem(accountKey);
            if (selectedAccount) {
              headers['X-Selected-Account'] = selectedAccount;
            }
          }
        } catch (e) {
          // Token parsing failed
        }
      }

      const response = await fetch('/api/reviews/upload', { headers });
      if (!response.ok) throw new Error('Failed to download template');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'review-upload-template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Template download error:', err);
      setImportError('Failed to download template');
    }
  };

  const handleImportUpload = async () => {
    if (!importFile) return;

    setIsImporting(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      const { tokenManager } = await import('@/auth/services/TokenManager');
      const token = await tokenManager.getAccessToken();

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.sub) {
            const accountKey = `promptreviews_selected_account_${payload.sub}`;
            const selectedAccount = localStorage.getItem(accountKey);
            if (selectedAccount) {
              headers['X-Selected-Account'] = selectedAccount;
            }
          }
        } catch (e) {
          // Token parsing failed
        }
      }

      const formData = new FormData();
      formData.append('file', importFile);

      const response = await fetch('/api/reviews/upload', {
        method: 'POST',
        headers,
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      // Success
      let successMsg = `Successfully imported ${result.reviewsCreated} review${result.reviewsCreated !== 1 ? 's' : ''}`;
      if (result.duplicatesSkipped > 0) {
        successMsg += ` (${result.duplicatesSkipped} duplicate${result.duplicatesSkipped !== 1 ? 's' : ''} skipped)`;
      }
      if (result.contactsCreated > 0) {
        successMsg += `, created ${result.contactsCreated} new contact${result.contactsCreated !== 1 ? 's' : ''}`;
      }
      if (result.contactsLinked > 0) {
        successMsg += `, linked to ${result.contactsLinked} existing contact${result.contactsLinked !== 1 ? 's' : ''}`;
      }
      setImportSuccess(successMsg);

      // Reset file selection
      setImportFile(null);
      setImportPreview([]);

      // Refresh reviews list
      window.location.reload();

    } catch (err: any) {
      console.error('Import error:', err);
      setImportError(err.message || 'Failed to import reviews');
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportFromGoogle = async (locationId: string) => {
    setIsImporting(true);
    setImportingLocationId(locationId);
    setImportError(null);
    setImportSuccess(null);

    try {
      const { apiClient } = await import('@/utils/apiClient');

      const result = await apiClient.post('/google-business-profile/import-reviews', {
        locationId,
        importType: 'new',
      });

      // API returns count (imported) and skipped
      const imported = result.count || 0;
      const skipped = result.skipped || 0;

      if (imported > 0) {
        setImportSuccess(`Successfully imported ${imported} new reviews from Google`);
        // Only reload if we actually imported something
        setTimeout(() => window.location.reload(), 1500);
      } else if (skipped > 0) {
        setImportSuccess(`All ${skipped} reviews already exist in your database`);
        // Don't reload - nothing new to show
      } else {
        setImportSuccess(result.message || 'No reviews found to import');
      }

    } catch (err: any) {
      console.error('Google import error:', err);
      setImportError(err.message || 'Failed to import from Google');
    } finally {
      setIsImporting(false);
      setImportingLocationId(null);
    }
  };

  // Auto-scroll and highlight review if hash matches
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace("#", "");
    if (hash && reviewRefs.current[hash]) {
      reviewRefs.current[hash]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      setHighlightedId(hash);
      // Remove highlight after 2 seconds
      setTimeout(() => setHighlightedId(null), 2000);
    }
  }, [reviews]);

  // Compute filtered reviews
  const filteredReviews = reviews.filter((r) => {
    const platformMatch = !platformFilter || r.platform === platformFilter;
    const verifiedMatch =
      !verifiedFilter ||
      (verifiedFilter === "verified" && r.verified) ||
      (verifiedFilter === "not_verified" && !r.verified);
    const emojiMatch =
      !emojiFilter || r.emoji_sentiment_selection === emojiFilter;
    // Location filter: match by business_location_id or by location_name text
    const locationMatch =
      !locationFilter ||
      r.business_location_id === locationFilter ||
      (locationFilter === "__other__" && r.location_name && !r.business_location_id);
    return platformMatch && verifiedMatch && emojiMatch && locationMatch;
  });

  // Debug: Log reviews state
  console.log('[Reviews] State:', {
    reviewsCount: reviews.length,
    filteredReviewsCount: filteredReviews.length,
    platformFilter,
    verifiedFilter,
    emojiFilter,
    locationFilter,
    firstReview: reviews[0]
  });

  // Close popover on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        !(e.target as HTMLElement).closest(".review-popover") &&
        !(e.target as HTMLElement).closest(".review-popover-btn")
      ) {
        setOpenReviewPopoverId(null);
      }
    }
    if (openReviewPopoverId) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [openReviewPopoverId]);

  // Toggle review verified status
  const handleToggleVerified = async (reviewId: string, currentVerified: boolean) => {
    try {
      // First, get the review details to check if it has a contact_id and platform
      const { data: reviewData, error: reviewFetchError } = await supabase
        .from("review_submissions")
        .select("contact_id, platform")
        .eq("id", reviewId)
        .single();

      if (reviewFetchError) {
        console.error("Error fetching review data:", reviewFetchError);
        throw reviewFetchError;
      }

      // Update the review verification status
      const { error: reviewUpdateError } = await supabase
        .from("review_submissions")
        .update({
          verified: !currentVerified,
          verified_at: !currentVerified ? new Date().toISOString() : null,
        })
        .eq("id", reviewId);
      
      if (reviewUpdateError) throw reviewUpdateError;

      // If review has a contact_id and is being verified, update the contact's platform verification
      if (reviewData?.contact_id && !currentVerified) {
        const platform = reviewData.platform?.toLowerCase();
        const platformFieldMap: { [key: string]: string } = {
          'google': 'google_review_verified_at',
          'google business profile': 'google_review_verified_at',
          'yelp': 'yelp_review_verified_at',
          'facebook': 'facebook_review_verified_at'
        };

        const verificationField = platformFieldMap[platform];
        
        if (verificationField) {
          // Update the contact's platform-specific verification field
          const { error: contactUpdateError } = await supabase
            .from("contacts")
            .update({
              [verificationField]: new Date().toISOString(),
              review_verification_status: 'verified'
            })
            .eq("id", reviewData.contact_id);
            
          if (contactUpdateError) {
            console.error("Error updating contact verification:", contactUpdateError);
            // Don't fail the whole operation if contact update fails
          }
        }
      } else if (reviewData?.contact_id && currentVerified) {
        // If un-verifying, remove the platform verification
        const platform = reviewData.platform?.toLowerCase();
        const platformFieldMap: { [key: string]: string } = {
          'google': 'google_review_verified_at',
          'google business profile': 'google_review_verified_at',
          'yelp': 'yelp_review_verified_at',
          'facebook': 'facebook_review_verified_at'
        };

        const verificationField = platformFieldMap[platform];
        
        if (verificationField) {
          const { error: contactUpdateError } = await supabase
            .from("contacts")
            .update({
              [verificationField]: null
            })
            .eq("id", reviewData.contact_id);
            
          if (contactUpdateError) {
            console.error("Error removing contact verification:", contactUpdateError);
          }
        }
      }

      // Update the UI
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? { ...r, verified: !currentVerified, verified_at: !currentVerified ? new Date().toISOString() : null }
            : r,
        ),
      );
    } catch (err) {
      console.error("Error in handleToggleVerified:", err);
      setError("Failed to update verified status. Please try again.");
    }
  };

  // Add click outside handler for dropdown
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest(".relative")) {
        setShowEmojiDropdown(false);
      }
    }
    if (showEmojiDropdown) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [showEmojiDropdown]);

  // Show sample notice for sample reviews
  const handleSampleNotice = () => {
    setSampleNotice(
      "This is a sample review and is just for display. As soon as you get your first real review, these samples will go away.",
    );
    setTimeout(() => setSampleNotice(null), 7000);
  };

  // Handle share success
  const handleShareSuccess = (platform: SharePlatform) => {
    const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
    success(`Review shared on ${platformName}!`);
  };

  // Handle share error
  const handleShareError = (errorMessage: string) => {
    showError(errorMessage);
  };

  // Generate share URL for a review
  const getReviewShareUrl = (review: Review): string => {
    // Use business website as the share URL
    // This will drive traffic to the customer's website
    if (business?.website) {
      return business.website;
    }

    // No fallback URL - return empty string if no website configured
    return '';
  };

  if (authLoading || loading) {
    return (
      <PageCard>
        <StandardLoader isLoading={true} mode="inline" />
      </PageCard>
    );
  }

  if (shouldRedirect) {
    return null; // Will redirect to /auth/sign-in
  }

  return (
    <>
      <ToastContainer toasts={toasts} onClose={closeToast} />
      <PageCard>
        {/* Title Row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 w-full gap-2 relative">
        <div className="absolute z-10" style={{ left: "-69px", top: "-37px" }}>
          <div className="rounded-full bg-white w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center shadow-lg">
            <Icon name="FaStar" className="w-6 h-6 sm:w-7 sm:h-7 text-slate-blue" size={28} />
          </div>
        </div>
        <div className="flex flex-col mt-0 md:mt-[3px]">
          <h1 className="text-4xl font-bold text-slate-blue mt-0 mb-2">
            Reviews
          </h1>
          <p className="text-gray-600 text-base max-w-md mt-0 mb-4">
            Manage and track all your customer reviews in one place. Share your reviews on Bluesky, Pinterest, Facebook, and more.
          </p>
        </div>
        {/* Action Buttons - Top Right */}
        <div className="flex items-center gap-2 sm:mt-0 mt-4">
          <button
            className="flex items-center gap-2 px-3 py-2 border-2 border-slate-blue text-slate-blue rounded hover:bg-indigo-50 text-sm font-semibold"
            onClick={() => setShowImportModal(true)}
          >
            <Icon name="FaUpload" className="w-4 h-4" size={16} /> Import
          </button>
          <button
            className="flex items-center gap-2 px-3 py-2 bg-slate-blue text-white rounded hover:bg-indigo-900 text-sm font-semibold"
            onClick={handleExport}
          >
            <Icon name="MdDownload" className="w-4 h-4" size={16} /> Export
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap gap-4 mb-4 items-end justify-between">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Search Bar */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Search
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-gray-400 pointer-events-none">
                <Icon name="FaSearch" className="w-3.5 h-3.5" size={14} />
              </span>
              <input
                type="text"
                placeholder="Search by reviewer, platform, or text..."
                className="pl-8 pr-3 w-52 rounded border border-gray-200 px-2 py-1 shadow-sm focus:ring-2 focus:ring-[#1A237E] focus:outline-none text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Platform
            </label>
            <select
              className="border rounded px-2 py-1"
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
            >
              <option value="">All</option>
              {getCombinedPlatformOptions(reviews).map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Verified
            </label>
            <select
              className="border rounded px-2 py-1"
              value={verifiedFilter}
              onChange={(e) => setVerifiedFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="verified">Verified</option>
              <option value="not_verified">Not Verified</option>
            </select>
          </div>
          {/* Location Filter - only show if there are locations or reviews have location data */}
          {(businessLocations.length > 0 || reviews.some(r => r.location_name || r.business_location_id)) && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Location
              </label>
              <select
                className="border rounded px-2 py-1 max-w-[150px] truncate"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              >
                <option value="">All</option>
                {businessLocations.map((loc) => (
                  <option key={loc.id} value={loc.id} title={loc.name}>
                    {loc.name.length > 20 ? loc.name.substring(0, 20) + '...' : loc.name}
                  </option>
                ))}
                {reviews.some(r => r.location_name && !r.business_location_id) && (
                  <option value="__other__">Other (unmatched)</option>
                )}
              </select>
            </div>
          )}
          {/* Emoji Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
              Sentiment
              <Icon name="FaQuestionCircle"
                className="w-3.5 h-3.5 text-gray-400 cursor-pointer"
              />
            </label>
            <div className="flex items-end gap-2">
              <div className="relative">
                <button
                  type="button"
                  className="flex items-center gap-2 border rounded px-2 py-1 bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onClick={() => setShowEmojiDropdown((v: boolean) => !v)}
                  aria-haspopup="listbox"
                  aria-expanded={showEmojiDropdown ? "true" : "false"}
                >
                  {emojiFilter ? (
                    <>
                      {(() => {
                        const idx = EMOJI_SENTIMENT_LABELS.findIndex(
                          (l) => l === emojiFilter,
                        );
                        if (idx !== -1) {
                          const { icon: IconComponent, color } =
                            EMOJI_SENTIMENT_ICONS[idx];
                          return <IconComponent className={`w-6 h-6 ${color}`} />;
                        }
                        return null;
                      })()}
                      <span>{emojiFilter}</span>
                    </>
                  ) : (
                    <>
                      <Icon name="FaSmile" className="w-6 h-6 text-slate-blue" size={24} />
                      <span>All</span>
                    </>
                  )}
                  <Icon name="FaChevronDown" className="w-4 h-4 text-gray-400 ml-1" size={16} />
                </button>
                {showEmojiDropdown && (
                  <div
                    className="absolute z-20 mt-1 w-48 bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-auto"
                    role="listbox"
                  >
                    {/* ALL option */}
                    <button
                      className={`flex items-center gap-2 w-full px-3 py-2 text-left text-sm hover:bg-indigo-50 ${!emojiFilter ? "bg-indigo-100" : ""}`}
                      onClick={() => {
                        setEmojiFilter("");
                        setShowEmojiDropdown(false);
                      }}
                      role="option"
                      aria-selected={!emojiFilter}
                      type="button"
                    >
                      <Icon name="FaSmile" className="w-6 h-6 text-slate-blue" size={24} />
                      <span>ALL</span>
                    </button>
                    {/* Individual sentiment options */}
                    {EMOJI_SENTIMENT_LABELS.map((label, i) => {
                      const { icon: IconComponent, color } = EMOJI_SENTIMENT_ICONS[i];
                      return (
                        <button
                          key={label}
                          className={`flex items-center gap-2 w-full px-3 py-2 text-left text-sm hover:bg-indigo-50 ${emojiFilter === label ? "bg-indigo-100" : ""}`}
                          onClick={() => {
                            setEmojiFilter(label);
                            setShowEmojiDropdown(false);
                          }}
                          role="option"
                          aria-selected={emojiFilter === label}
                          type="button"
                        >
                          <IconComponent className={`w-6 h-6 ${color}`} />
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card List */}
      <div className="space-y-4 mt-6">
        {sampleNotice && (
          <div className="mb-4 px-4 py-2 bg-yellow-100 text-yellow-800 rounded text-center text-sm font-medium">
            {sampleNotice}
          </div>
        )}
        {filteredReviews.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No reviews found.
          </div>
        ) : (
          filteredReviews.map((review) => {
            const { icon: platformIcon, label: platformLabel } =
              getPlatformIcon(review.platform);
            const isExpanded = expandedRows[review.id];
            return (
              <div
                key={review.id}
                className="bg-white rounded-lg border border-gray-200 shadow-sm"
              >
                <button
                  className="w-full flex items-center justify-between px-4 py-3 focus:outline-none"
                  onClick={() =>
                    setExpandedRows((r) => ({
                      ...r,
                      [review.id]: !r[review.id],
                    }))
                  }
                  aria-expanded={isExpanded}
                  aria-controls={`review-details-${review.id}`}
                >
                  <div className="flex items-center gap-3">
                    {typeof platformIcon === 'string' ? (
                      <Icon 
                        name={platformIcon as IconName}
                        className="w-6 h-6 text-[#1A237E]"
                        size={24}
                      />
                    ) : (
                      React.createElement(platformIcon, {
                        className: "w-6 h-6 text-[#1A237E]",
                        title: platformLabel
                      })
                    )}
                    <span className="font-semibold text-base text-gray-800">
                      {review.first_name} {review.last_name}
                    </span>
                    {review.emoji_sentiment_selection &&
                      getSentimentIcon(review.emoji_sentiment_selection)}
                    <span className="text-xs text-gray-500 ml-2">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                    {review.last_shared_at && (
                      <span className="text-xs text-gray-500 ml-2 flex items-center gap-1">
                        <Icon name="FaShare" className="w-3 h-3" size={12} />
                        Last shared: {new Date(review.last_shared_at).toLocaleDateString()}
                      </span>
                    )}
                    {isNewReview(review.created_at) && (
                      <span className="ml-2 inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                        New
                      </span>
                    )}
                    {review.verified ? (
                      <span className="ml-2 inline-block px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                        Verified
                      </span>
                    ) : (
                      <span className="ml-2 inline-block px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded">
                        Not verified
                      </span>
                    )}
                    {review.imported_from_google && (
                      <span className="ml-2 inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                        <Icon name="FaGoogle" className="w-3 h-3" size={12} />
                        Imported
                      </span>
                    )}
                    {(review.location_name || review.business_location_id) && (() => {
                      const locationName = review.business_location_id
                        ? businessLocations.find(l => l.id === review.business_location_id)?.name || review.location_name
                        : review.location_name;
                      const truncated = locationName && locationName.length > 15
                        ? locationName.substring(0, 15) + '...'
                        : locationName;
                      return (
                        <span
                          className="ml-2 inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                          title={locationName || undefined}
                        >
                          <Icon name="FaMapMarker" className="w-3 h-3" size={12} />
                          {truncated}
                        </span>
                      );
                    })()}
                  </div>
                  <span className="ml-4 text-gray-400">
                    {isExpanded ? (
                      <Icon name="FaChevronDown" className="w-4 h-4" size={16} />
                    ) : (
                      <Icon name="FaChevronLeft" className="w-4 h-4" size={16} />
                    )}
                  </span>
                </button>
                {isExpanded && (
                  <div
                    id={`review-details-${review.id}`}
                    className="px-4 pb-4 pt-2 border-t border-gray-100 animate-fade-in bg-gray-50 rounded-b-lg shadow-inner"
                  >
                    <div className="mb-2">
                      <span
                        className="text-gray-800 text-sm"
                        style={{ whiteSpace: "pre-line" }}
                      >
                        {review.review_content}
                      </span>
                    </div>
                    {review.star_rating && (
                      <div className="flex items-center gap-2 mb-2">
                        <StarRating rating={review.star_rating} />
                        <span className="text-xs text-gray-500">(From Google)</span>
                      </div>
                    )}
                    {review.reviewer_role && (
                      <div className="text-xs text-gray-500 mb-1">
                        Role: {review.reviewer_role}
                      </div>
                    )}
                    <div className="flex flex-row flex-wrap items-center justify-between gap-3 mt-2 mb-2 w-full">
                      <div className="flex flex-row flex-wrap items-center gap-3">
                        {review.platform_url && (
                          <a
                            href={review.platform_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-700 underline"
                          >
                            Check if Published
                          </a>
                        )}
                        {review.prompt_page_id && (
                          <a
                            href={
                              review.id.startsWith("sample-")
                                ? undefined
                                : `/dashboard/prompt-pages/${review.prompt_page_id}`
                            }
                            className={`text-xs text-indigo-700 underline ${review.id.startsWith("sample-") ? "cursor-not-allowed opacity-60" : ""}`}
                            onClick={(e) => {
                              if (review.id.startsWith("sample-")) {
                                e.preventDefault();
                                handleSampleNotice();
                              }
                            }}
                          >
                            View prompt page
                          </a>
                        )}
                        {review.contact_id && (
                          <a
                            href={`/dashboard/contacts?id=${review.contact_id}`}
                            className="text-xs text-purple-700 underline flex items-center gap-1"
                          >
                            <Icon name="FaUser" className="w-3 h-3" size={12} />
                            View contact
                          </a>
                        )}
                        <button
                          className={`text-xs rounded px-3 py-1 ${review.verified ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                          onClick={(e) => {
                            if (review.id.startsWith("sample-")) {
                              e.preventDefault();
                              handleSampleNotice();
                            } else {
                              handleToggleVerified(review.id, !!review.verified);
                            }
                          }}
                        >
                          {review.verified ? "Un-verify" : "Mark as Verified"}
                        </button>
                        {!review.id.startsWith("sample-") && (
                          <ShareButton
                            review={{
                              id: review.id,
                              first_name: review.first_name,
                              last_name: review.last_name,
                              review_content: review.review_content,
                              platform: review.platform,
                              emoji_sentiment_selection: review.emoji_sentiment_selection,
                            }}
                            shareUrl={getReviewShareUrl(review)}
                            productName={business?.name ? `${business.name} just got praise!` : "Just got praise!"}
                            imageUrl={`${window.location.origin}/api/review-shares/og-image?reviewId=${review.id}`}
                            onShareSuccess={handleShareSuccess}
                            onShareError={handleShareError}
                          />
                        )}
                      </div>
                      <button
                        className="text-xs text-red-600 hover:underline"
                        onClick={(e) => {
                          if (review.id.startsWith("sample-")) {
                            e.preventDefault();
                            handleSampleNotice();
                          } else {
                            handleDelete(review.id);
                          }
                        }}
                        disabled={isDeleting === review.id}
                      >
                        {isDeleting === review.id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}

        {/* Add responsive bottom padding to the card */}
        <div className="pb-8 md:pb-12 lg:pb-16" />
      </PageCard>

      {/* Import Reviews Modal */}
      <Dialog
        open={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setImportFile(null);
          setImportPreview([]);
          setImportError(null);
          setImportSuccess(null);
        }}
        className="fixed z-50 inset-0 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen px-4 py-8">
          <div
            className="fixed inset-0 bg-black opacity-30"
            aria-hidden="true"
          />
          {/* Wrapper div to allow close button to overflow */}
          <div className="relative z-10">
            {/* Close button - outside the scrollable area */}
            <button
              className="absolute -top-3 -right-3 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 focus:outline-none z-20"
              style={{ width: 40, height: 40 }}
              onClick={() => {
                setShowImportModal(false);
                setImportFile(null);
                setImportPreview([]);
                setImportError(null);
                setImportSuccess(null);
              }}
              aria-label="Close"
            >
              <Icon name="FaTimes" className="w-5 h-5 text-red-600" />
            </button>

            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-auto p-8 max-h-[85vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-slate-blue flex items-center gap-3 mb-6">
              <Icon name="FaUpload" className="w-7 h-7 text-slate-blue" />
              Import Reviews
            </h2>

            {/* Error/Success Messages */}
            {importError && (
              <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
                {importError}
              </div>
            )}
            {importSuccess && (
              <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg">
                {importSuccess}
              </div>
            )}

            {/* Section 1: Import from Google */}
            <div className="mb-8 bg-blue-50 rounded-lg p-6 border border-blue-100">
              <h3 className="text-lg font-semibold text-slate-blue flex items-center gap-2 mb-4">
                <Icon name="FaGoogle" className="w-5 h-5" />
                Import from Google Business Profile
              </h3>

              {hasGbpConnected ? (
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    Pull reviews directly from your connected Google Business Profile locations.
                  </p>
                  <div className="space-y-2">
                    {gbpLocations.map((location) => {
                      const isThisLocationImporting = importingLocationId === location.location_id;
                      return (
                        <button
                          key={location.id}
                          onClick={() => handleImportFromGoogle(location.location_id)}
                          disabled={isImporting}
                          className="w-full flex items-center justify-between px-4 py-3 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
                        >
                          <span className="text-gray-700">{location.location_name || 'Unnamed Location'}</span>
                          <span className="text-sm text-blue-600 font-medium">
                            {isThisLocationImporting ? 'Importing...' : 'Import Reviews'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    Connect your Google Business Profile to import reviews directly from Google.
                  </p>
                  <button
                    onClick={() => router.push('/dashboard/google-business')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Icon name="FaGoogle" className="w-4 h-4" />
                    Connect Google Business Profile
                  </button>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-sm text-gray-500">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Section 2: Upload from CSV */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-slate-blue flex items-center gap-2 mb-4">
                <Icon name="FaUpload" className="w-5 h-5" />
                Upload from CSV
              </h3>

              <p className="text-sm text-gray-600 mb-4">
                Upload reviews from a spreadsheet. This will:
              </p>
              <ul className="text-sm text-gray-600 mb-6 space-y-1">
                <li className="flex items-center gap-2">
                  <Icon name="FaCheck" className="w-4 h-4 text-green-500" />
                  Create review records in your database
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="FaCheck" className="w-4 h-4 text-green-500" />
                  Automatically create contacts for reviewers with email or phone
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="FaCheck" className="w-4 h-4 text-green-500" />
                  Link reviews to existing contacts when email/phone matches
                </li>
              </ul>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <Icon name="FaUpload" className="text-slate-blue" />
                    <span className="text-gray-700">Choose CSV file</span>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleImportFileSelect}
                      className="hidden"
                    />
                  </label>
                  {importFile && (
                    <div className="text-sm text-gray-600 max-w-[200px] truncate">
                      Selected: {importFile.name}
                    </div>
                  )}
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Icon name="MdDownload" className="text-slate-blue" />
                  Download Template
                </button>
              </div>

              {/* Preview Section */}
              {importPreview.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Preview</h4>
                  <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {importPreview[0]?.map((header: string, index: number) => (
                            <th
                              key={index}
                              className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {importPreview.slice(1).map((row: string[], rowIndex: number) => (
                          <tr key={rowIndex}>
                            {row.map((cell: string, cellIndex: number) => (
                              <td
                                key={cellIndex}
                                className="px-3 py-2 text-sm text-gray-500 max-w-[200px] truncate"
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {importPreview.length > 1 && (
                    <p className="text-xs text-gray-500 mt-2">
                      Showing first {importPreview.length - 1} row(s)
                    </p>
                  )}
                </div>
              )}

              {/* Upload Button */}
              {importFile && (
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleImportUpload}
                    disabled={isImporting}
                    className="px-6 py-2 bg-slate-blue text-white rounded-lg hover:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo transition-colors disabled:opacity-50"
                  >
                    {isImporting ? 'Importing...' : 'Upload Reviews'}
                  </button>
                </div>
              )}
            </div>

            {/* Close button at bottom */}
            <button
              className="w-full mt-6 py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-semibold"
              onClick={() => {
                setShowImportModal(false);
                setImportFile(null);
                setImportPreview([]);
                setImportError(null);
                setImportSuccess(null);
              }}
            >
              Close
            </button>
          </div>
          </div>{/* End wrapper div */}
        </div>
      </Dialog>
    </>
  );
}
