"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabaseClient";
import Icon, { IconName } from "@/components/Icon";
import PageCard from "@/app/components/PageCard";
import AppLoader from "@/app/components/AppLoader";
import TopLoaderOverlay from "@/app/components/TopLoaderOverlay";

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

const ITEMS_PER_PAGE = 30;

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
  },
  {
    prompt_page_id: "00000000-0000-0000-0000-000000000000",
    first_name: "Emily",
    last_name: "Davis",
    platform: "Google",
    review_content:
      "I've worked with many contractors, but this team stands out. Their expertise and attention to detail are unmatched.",
    status: "submitted",
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
  },
  {
    prompt_page_id: "00000000-0000-0000-0000-000000000000",
    first_name: "Carlos",
    last_name: "Martinez",
    platform: "Yelp",
    review_content:
      "The food and service were both excellent. Will definitely return!",
    status: "submitted",
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
  },
  {
    prompt_page_id: "00000000-0000-0000-0000-000000000000",
    first_name: "Lisa",
    last_name: "Chen",
    platform: "Facebook",
    review_content:
      "Very responsive and creative team. Our campaign results improved dramatically.",
    status: "submitted",
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
  },
  {
    prompt_page_id: "00000000-0000-0000-0000-000000000000",
    first_name: "David",
    last_name: "Kim",
    platform: "TripAdvisor",
    review_content:
      "A wonderful experience from start to finish. Will book again!",
    status: "submitted",
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
  },
  {
    prompt_page_id: "00000000-0000-0000-0000-000000000000",
    first_name: "Tom",
    last_name: "Nguyen",
    platform: "Clutch",
    review_content:
      "Excellent communication and technical skills. Highly recommend for any SaaS project.",
    status: "submitted",
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
  },
  {
    prompt_page_id: "00000000-0000-0000-0000-000000000000",
    first_name: "Alex",
    last_name: "Rivera",
    platform: "G2",
    review_content:
      "Robust features and easy integration. Our team productivity increased noticeably.",
    status: "submitted",
  },
];

// Custom BBB and Angi icons as React components
const BBBIcon: IconType = () => (
  <span
    style={{ fontWeight: "bold", fontSize: "1.2em", letterSpacing: "0.05em" }}
  >
    BBB
  </span>
);
const AngiIcon: IconType = () => (
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
  if (lower.includes("bbb")) return { icon: BBBIcon, label: "BBB" };
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

  // Add a ref map to store review refs
  const reviewRefs = useRef<{ [id: string]: HTMLDivElement | null }>({});
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // Using singleton Supabase client from supabaseClient.ts

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      setError(null);
      try {
        // First, get total count
        const { count, error: countError } = await supabase
          .from("review_submissions")
          .select("*", { count: "exact", head: true });

        if (countError) throw countError;

        // Calculate total pages
        const total = Math.ceil((count || 0) / ITEMS_PER_PAGE);
        setTotalPages(total);

        // Fetch paginated reviews
        const { data: existingReviews, error: fetchError } = await supabase
          .from("review_submissions")
          .select(
            "id, prompt_page_id, first_name, last_name, reviewer_role, platform, review_content, created_at, status",
          )
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
  }, [supabase, currentPage]);

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
    if (!confirm("Are you sure you want to delete this review?")) return;

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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <AppLoader />
      </div>
    );
  }

  return (
    <PageCard>
              <h1 className="text-4xl font-bold mt-0 mb-2 flex items-center gap-3 text-slate-blue">
        <Icon name="FaStar" className="w-7 h-7 text-slate-blue" />
        Reviews
      </h1>

      {/* Tabs */}
      <div className="mb-8 flex gap-4 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as "reviewer" | "platform")}
            className={`px-4 py-2 -mb-px border-b-2 font-medium transition-colors ${
              activeTab === tab.key
                ? "border-[#1A237E] text-[#1A237E]"
                : "border-transparent text-gray-500 hover:text-[#1A237E]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Section */}
      <div className="mb-8">
        <input
          type="text"
          placeholder="Search by reviewer, platform, or text..."
          className="w-full max-w-md rounded-lg border border-gray-200 px-4 py-2 shadow-sm focus:ring-2 focus:ring-[#1A237E] focus:outline-none"
        />
      </div>

      {/* Reviews Section */}
      {error ? (
        <div className="text-red-500 p-4 bg-red-50 rounded-lg">{error}</div>
      ) : activeTab === "reviewer" ? (
        grouped.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            No testimonials found.
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {grouped.map((group) => (
                <div
                  key={group.reviewerKey}
                  className="bg-gray-50 rounded-lg p-6 border border-gray-200"
                >
                  <button
                    className="flex items-center w-full text-left gap-3"
                    onClick={() => toggleExpand(group.reviewerKey)}
                  >
                    {expanded[group.reviewerKey] ? (
                      <Icon name="FaChevronDown" className="text-[#1A237E]" />
                    ) : (
                                              <Icon name="FaChevronRight" className="text-[#1A237E]" />
                    )}
                    <span className="font-semibold text-lg text-gray-800">
                      {group.first_name || "[No Name]"}{" "}
                      {group.last_name ? group.last_name : ""}
                      {group.reviews[0]?.reviewer_role ? (
                        <span className="text-gray-500 font-normal text-base ml-2">
                          ({group.reviews[0].reviewer_role})
                        </span>
                      ) : null}
                    </span>
                    <span className="ml-auto text-sm text-gray-400">
                      {group.reviews.length} review
                      {group.reviews.length !== 1 ? "s" : ""}
                    </span>
                  </button>
                  {expanded[group.reviewerKey] && (
                    <div className="mt-4 space-y-4">
                      {group.reviews.map((review) => {
                        const { icon: PlatformIcon, label } = getPlatformIcon(
                          review.platform,
                        );
                        return (
                          <div
                            key={review.id}
                            ref={(el) => {
                              reviewRefs.current[review.id] = el;
                            }}
                            className={`bg-white rounded-lg p-4 border border-gray-200 relative transition-colors duration-700 ${highlightedId === review.id ? "bg-yellow-100 border-yellow-400" : ""}`}
                          >
                            {/* Platform icon in top-left corner */}
                            <div
                              className="absolute -top-4 -left-4 bg-white rounded-full shadow p-2 flex items-center justify-center"
                              title={label}
                            >
                              <PlatformIcon className="w-6 h-6 text-[#1A237E]" />
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-[#1A237E]">
                                {review.platform}
                              </span>
                              <span className="text-xs text-gray-400 ml-2">
                                {new Date(
                                  review.created_at,
                                ).toLocaleDateString()}
                              </span>
                              <span
                                className={`ml-2 text-xs px-2 py-1 rounded ${
                                  review.status === "submitted"
                                    ? "bg-green-100 text-green-600"
                                    : "bg-yellow-100 text-yellow-600"
                                }`}
                              >
                                {review.status}
                              </span>
                              {review.reviewer_role && (
                                <span className="ml-2 text-xs text-gray-500">
                                  ({review.reviewer_role})
                                </span>
                              )}
                              {isNewReview(review.created_at) && (
                                <span className="ml-2 text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold">
                                  New
                                </span>
                              )}
                              <button
                                onClick={() => handleDelete(review.id)}
                                disabled={isDeleting === review.id}
                                className="ml-auto text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                                title="Delete review"
                              >
                                {isDeleting === review.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                                ) : (
                                  <Icon name="FaTrash" className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                            <div className="text-gray-800">
                              {review.review_content}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
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
          </>
        )
      ) : platformGrouped.length === 0 ? (
        <div className="text-center py-8 text-gray-600">
          No testimonials found.
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {platformGrouped.map((group) => (
              <div
                key={group.platform}
                className="bg-gray-50 rounded-lg p-6 border border-gray-200"
              >
                <button
                  className="flex items-center w-full text-left gap-3"
                  onClick={() => toggleExpand(group.platform)}
                >
                  {expanded[group.platform] ? (
                    <Icon name="FaChevronDown" className="text-[#1A237E]" />
                  ) : (
                    <Icon name="FaChevronRight" className="text-[#1A237E]" />
                  )}
                  <span className="font-semibold text-lg text-gray-800">
                    {group.platform}
                  </span>
                  <span className="ml-auto text-sm text-gray-400">
                    {group.reviews.length} review
                    {group.reviews.length !== 1 ? "s" : ""}
                  </span>
                </button>
                {expanded[group.platform] && (
                  <div className="mt-4 space-y-4">
                    {group.reviews.map((review) => {
                      const { icon: PlatformIcon, label } = getPlatformIcon(
                        review.platform,
                      );
                      return (
                        <div
                          key={review.id}
                          ref={(el) => {
                            reviewRefs.current[review.id] = el;
                          }}
                          className={`bg-white rounded-lg p-4 border border-gray-200 relative transition-colors duration-700 ${highlightedId === review.id ? "bg-yellow-100 border-yellow-400" : ""}`}
                        >
                          {/* Platform icon in top-left corner */}
                          <div
                            className="absolute -top-4 -left-4 bg-white rounded-full shadow p-2 flex items-center justify-center"
                            title={label}
                          >
                            <PlatformIcon className="w-6 h-6 text-[#1A237E]" />
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-[#1A237E]">
                              {review.first_name || "[No Name]"}{" "}
                              {review.last_name ? review.last_name : ""}
                            </span>
                            {review.reviewer_role && (
                              <span className="ml-2 text-xs text-gray-500">
                                ({review.reviewer_role})
                              </span>
                            )}
                            <span className="text-xs text-gray-400 ml-2">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                            <span
                              className={`ml-2 text-xs px-2 py-1 rounded ${
                                review.status === "submitted"
                                  ? "bg-green-100 text-green-600"
                                  : "bg-yellow-100 text-yellow-600"
                              }`}
                            >
                              {review.status}
                            </span>
                            {isNewReview(review.created_at) && (
                              <span className="ml-2 text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold">
                                New
                              </span>
                            )}
                            <button
                              onClick={() => handleDelete(review.id)}
                              disabled={isDeleting === review.id}
                              className="ml-auto text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                              title="Delete review"
                            >
                              {isDeleting === review.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                              ) : (
                                <Icon name="FaTrash" className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                          <div className="text-gray-800">
                            {review.review_content}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
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
        </>
      )}
      {/* Add responsive bottom padding to the card */}
      <div className="pb-8 md:pb-12 lg:pb-16" />
    </PageCard>
  );
}
