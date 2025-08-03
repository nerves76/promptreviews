"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabaseClient";
import { getAccountIdForUser } from "@/utils/accountUtils";
import Icon, { IconName } from "@/components/Icon";
import PageCard from "@/app/components/PageCard";
import AppLoader from "@/app/components/AppLoader";
import TopLoaderOverlay from "@/app/components/TopLoaderOverlay";
import {
  EMOJI_SENTIMENT_LABELS,
  EMOJI_SENTIMENT_ICONS,
} from "@/app/components/prompt-modules/emojiSentimentConfig";
import { platformOptions } from "@/app/components/prompt-features/ReviewPlatformsFeature";

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
  return { icon: "FaRegStar", label: platform || "Other" };
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
    const { icon: iconName, color } = EMOJI_SENTIMENT_ICONS[idx];
    return (
      <Icon
        name={iconName}
        className={`w-7 h-7 ${color}`}
        size={28}
      />
    );
  }
  return null;
}

export default function ReviewsPage() {
  const supabase = createClient();

  const [reviews, setReviews] = useState<Review[]>([]);
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

  // Add a ref map to store review refs
  const reviewRefs = useRef<{ [id: string]: HTMLDivElement | null }>({});
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // Using singleton Supabase client from supabaseClient.ts

  // Get current account ID first
  useEffect(() => {
    const getCurrentAccount = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          setError("Authentication required");
          return;
        }

        const currentAccountId = await getAccountIdForUser(user.id, supabase);
        if (!currentAccountId) {
          setError("No account found");
          return;
        }

        setAccountId(currentAccountId);
      } catch (err) {
        console.error("Error getting account:", err);
        setError("Failed to get account information");
      }
    };

    getCurrentAccount();
  }, [supabase]);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!accountId) return; // Wait for account ID to be available
      
      setLoading(true);
      setError(null);
      try {
        // Get all prompt page IDs for this account first
        const { data: promptPages, error: promptPagesError } = await supabase
          .from('prompt_pages')
          .select('id')
          .eq('account_id', accountId);

        if (promptPagesError) throw promptPagesError;

        const promptPageIds = promptPages?.map(p => p.id) || [];

        if (promptPageIds.length === 0) {
          // No prompt pages = no reviews
          setReviews([]);
          setTotalPages(1);
          setLoading(false);
          return;
        }

        // First, get total count with account filtering
        const { count, error: countError } = await supabase
          .from("review_submissions")
          .select("id", { count: "exact", head: true })
          .in('prompt_page_id', promptPageIds);

        if (countError) throw countError;

        // Calculate total pages
        const total = Math.ceil((count || 0) / ITEMS_PER_PAGE);
        setTotalPages(total);

        // Fetch paginated reviews with account filtering
        const { data: existingReviews, error: fetchError } = await supabase
          .from("review_submissions")
          .select(
            "id, prompt_page_id, first_name, last_name, reviewer_role, platform, review_content, created_at, status, emoji_sentiment_selection, verified, verified_at, platform_url"
          )
          .in('prompt_page_id', promptPageIds)
          .order("created_at", { ascending: false })
          .range(
            (currentPage - 1) * ITEMS_PER_PAGE,
            currentPage * ITEMS_PER_PAGE - 1,
          );

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
          setReviews(existingReviews);
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

  // Placeholder for export
  const handleExport = () => {
    // TODO: Implement CSV export
    alert("Export to CSV coming soon!");
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
    return platformMatch && verifiedMatch && emojiMatch;
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
      const { error } = await supabase
        .from("review_submissions")
        .update({
          verified: !currentVerified,
          verified_at: !currentVerified ? new Date().toISOString() : null,
        })
        .eq("id", reviewId);
      if (error) throw error;
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? { ...r, verified: !currentVerified, verified_at: !currentVerified ? new Date().toISOString() : null }
            : r,
        ),
      );
    } catch (err) {
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

  if (loading) {
    return (
      <div className="w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 mt-12 md:mt-16 lg:mt-20 mb-16 flex justify-center items-start">
        <div className="page relative w-full max-w-[1000px] rounded-2xl bg-white shadow-lg pt-4 px-8 md:px-12 pb-8">
          <div className="icon absolute -top-4 -left-4 sm:-top-6 sm:-left-6 z-10 bg-white rounded-full shadow-lg p-3 sm:p-4 flex items-center justify-center">
            <Icon name="FaStar" className="w-9 h-9 text-slate-blue" size={36} />
          </div>
          <div className="min-h-[400px] flex flex-col items-center justify-center">
            <AppLoader />
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageCard>
      {/* Title and Search Row */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-16 w-full gap-2 relative">
        <div className="absolute z-10" style={{ left: "-69px", top: "-37px" }}>
          <div className="rounded-full bg-white w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center shadow-lg">
            <Icon name="FaStar" className="w-6 h-6 sm:w-7 sm:h-7 text-slate-blue" size={28} />
          </div>
        </div>
        <div className="flex flex-col mt-0 md:mt-[3px]">
          <h1 className="text-4xl font-bold text-slate-blue mt-0 mb-2">
            Reviews
          </h1>
          <p className="text-gray-600 text-base max-w-md mt-0 mb-10">
            Manage and track all your customer reviews in one place.
          </p>
        </div>
        <div className="flex justify-end w-full sm:w-auto">
          <div className="relative w-full max-w-xs">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 pointer-events-none">
                                <Icon name="FaSearch" className="w-4 h-4" size={16} />
            </span>
            <input
              type="text"
              placeholder="Search by reviewer, platform, or text..."
              className="pl-9 pr-3 w-full rounded-lg border border-gray-200 px-2 py-2 shadow-sm focus:ring-2 focus:ring-[#1A237E] focus:outline-none h-[44px]"
            />
          </div>
        </div>
      </div>

      {/* Filters and Export */}
      <div className="flex flex-wrap gap-4 mb-4 items-end justify-between">
        <div className="flex flex-wrap gap-4 items-end">
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
          {/* Emoji Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
              Sentiment
              <Icon name="FaQuestionCircle"
                className="w-3.5 h-3.5 text-gray-400 cursor-pointer"
                title="You must be using the sentiment gating feature to collect reviews tagged with sentiment."
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
        <button
          className="flex items-center gap-2 px-3 py-2 bg-slate-blue text-white rounded hover:bg-indigo-900 text-sm font-semibold ml-auto"
          onClick={handleExport}
        >
          <Icon name="MdDownload" className="w-4 h-4" size={16} /> Download CSV
        </button>
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
            const { icon: PlatformIcon, label: platformLabel } =
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
                    <PlatformIcon
                      className="w-6 h-6 text-[#1A237E]"
                      title={platformLabel}
                    />
                    <span className="font-semibold text-base text-gray-800">
                      {review.first_name} {review.last_name}
                    </span>
                    {review.emoji_sentiment_selection &&
                      getSentimentIcon(review.emoji_sentiment_selection)}
                    <span className="text-xs text-gray-500 ml-2">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
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
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="FaComments" className="w-5 h-5 text-slate-500" size={20} />
                      <span
                        className="text-gray-800 text-sm"
                        style={{ whiteSpace: "pre-line" }}
                      >
                        {review.review_content}
                      </span>
                    </div>
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
  );
}
