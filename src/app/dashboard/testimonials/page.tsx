"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { FaChevronDown, FaChevronRight, FaDownload, FaStar, FaTrash, FaGoogle, FaFacebook, FaYelp, FaTripadvisor, FaRegStar } from "react-icons/fa";
import { SiAngi, SiHouzz, SiThumbtack, SiHomeadvisor, SiTrustpilot } from "react-icons/si";
import { IconType } from "react-icons";

interface Review {
  id: string;
  prompt_page_id: string;
  reviewer_name: string;
  reviewer_role: string;
  platform: string;
  review_content: string;
  created_at: string;
  status: string;
}

interface ReviewerGroup {
  reviewerKey: string;
  reviewer_name: string;
  reviewer_role: string;
  reviews: Review[];
}

interface PlatformGroup {
  platform: string;
  reviews: Review[];
}

const ITEMS_PER_PAGE = 30;

const TABS = [
  { key: "reviewer", label: "By Reviewer" },
  { key: "platform", label: "By Platform" },
];

const SAMPLE_REVIEWS = [
  {
    prompt_page_id: "00000000-0000-0000-0000-000000000000", // Placeholder UUID
    reviewer_name: "John Smith",
    reviewer_role: "Homeowner",
    platform: "Google",
    review_content: "Absolutely amazing service! The team was professional, efficient, and completed the project ahead of schedule. I couldn't be happier with the results.",
    status: "submitted"
  },
  {
    prompt_page_id: "00000000-0000-0000-0000-000000000000", // Placeholder UUID
    reviewer_name: "John Smith",
    reviewer_role: "Homeowner",
    platform: "Yelp",
    review_content: "Great experience from start to finish. The attention to detail was impressive, and the final result exceeded my expectations.",
    status: "submitted"
  },
  {
    prompt_page_id: "00000000-0000-0000-0000-000000000000", // Placeholder UUID
    reviewer_name: "Sarah Johnson",
    reviewer_role: "Business Owner",
    platform: "Google",
    review_content: "Outstanding work! The team was knowledgeable and went above and beyond to ensure everything was perfect. Highly recommend!",
    status: "submitted"
  },
  {
    prompt_page_id: "00000000-0000-0000-0000-000000000000", // Placeholder UUID
    reviewer_name: "Michael Brown",
    reviewer_role: "Property Manager",
    platform: "Facebook",
    review_content: "Professional service and excellent communication throughout the project. The quality of work is top-notch.",
    status: "submitted"
  },
  {
    prompt_page_id: "00000000-0000-0000-0000-000000000000", // Placeholder UUID
    reviewer_name: "Emily Davis",
    reviewer_role: "Interior Designer",
    platform: "Google",
    review_content: "I've worked with many contractors, but this team stands out. Their expertise and attention to detail are unmatched.",
    status: "submitted"
  }
];

// Custom BBB and Angi icons as React components
const BBBIcon: IconType = () => (
  <span style={{ fontWeight: 'bold', fontSize: '1.2em', letterSpacing: '0.05em' }}>BBB</span>
);
const AngiIcon: IconType = () => (
  <span style={{ fontWeight: 'bold', fontSize: '1.2em', letterSpacing: '0.05em' }}>Angi</span>
);

// Helper to get platform icon based on platform name
function getPlatformIcon(platform: string): { icon: IconType, label: string } {
  const lower = (platform || '').toLowerCase();
  if (lower.includes('google')) return { icon: FaGoogle, label: 'Google Business Profile' };
  if (lower.includes('yelp')) return { icon: FaYelp, label: 'Yelp' };
  if (lower.includes('facebook')) return { icon: FaFacebook, label: 'Facebook' };
  if (lower.includes('tripadvisor')) return { icon: FaTripadvisor, label: 'TripAdvisor' };
  if (lower.includes('angi')) return { icon: AngiIcon, label: 'Angi' };
  if (lower.includes('houzz')) return { icon: SiHouzz, label: 'Houzz' };
  if (lower.includes('bbb')) return { icon: BBBIcon, label: 'BBB' };
  if (lower.includes('thumbtack')) return { icon: SiThumbtack, label: 'Thumbtack' };
  if (lower.includes('homeadvisor')) return { icon: SiHomeadvisor, label: 'HomeAdvisor' };
  if (lower.includes('trustpilot')) return { icon: SiTrustpilot, label: 'Trustpilot' };
  return { icon: FaRegStar, label: platform || 'Other' };
}

export default function TestimonialsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [grouped, setGrouped] = useState<ReviewerGroup[]>([]);
  const [platformGrouped, setPlatformGrouped] = useState<PlatformGroup[]>([]);
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'reviewer' | 'platform'>('reviewer');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

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
          .select("id, prompt_page_id, reviewer_name, reviewer_role, platform, review_content, created_at, status")
          .order("created_at", { ascending: false })
          .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

        if (fetchError) throw fetchError;

        // If no reviews exist, insert sample reviews
        if (!existingReviews || existingReviews.length === 0) {
          // First, get a valid prompt page ID
          const { data: promptPages, error: promptError } = await supabase
            .from("prompt_pages")
            .select("id")
            .limit(1);

          if (promptError) throw promptError;

          if (!promptPages || promptPages.length === 0) {
            throw new Error("No prompt pages found. Please create a prompt page first.");
          }

          const promptPageId = promptPages[0].id;

          // Insert sample reviews with the valid prompt_page_id
          const { error: insertError } = await supabase
            .from("review_submissions")
            .insert(
              SAMPLE_REVIEWS.map(review => ({
                ...review,
                prompt_page_id: promptPageId,
                created_at: new Date().toISOString()
              }))
            );

          if (insertError) throw insertError;

          // Fetch the newly inserted reviews
          const { data: newReviews, error: newFetchError } = await supabase
            .from("review_submissions")
            .select("id, prompt_page_id, reviewer_name, reviewer_role, platform, review_content, created_at, status")
            .order("created_at", { ascending: false })
            .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

          if (newFetchError) throw newFetchError;
          setReviews(newReviews || []);
        } else {
          setReviews(existingReviews);
        }
      } catch (err) {
        console.error("Error:", err);
        setError(err instanceof Error ? err.message : "Failed to load reviews.");
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
      const reviewerKey = `${review.reviewer_name}||${review.reviewer_role}`;
      if (!groups[reviewerKey]) {
        groups[reviewerKey] = {
          reviewerKey,
          reviewer_name: review.reviewer_name,
          reviewer_role: review.reviewer_role,
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
      setReviews(prev => prev.filter(review => review.id !== reviewId));
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

  return (
    <div className="min-h-screen py-12 px-2">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow pt-4 pb-24 px-8 relative">
        <div className="absolute -top-4 -left-4 bg-white rounded-full shadow p-2 flex items-center justify-center">
          <FaStar className="w-7 h-7 text-indigo-500" />
        </div>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-bold text-gray-900">
            Testimonials
          </h1>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-indigo-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FaDownload className="text-indigo-500" />
            Export CSV
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex gap-4 border-b border-gray-200">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as 'reviewer' | 'platform')}
              className={`px-4 py-2 -mb-px border-b-2 font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-indigo-500 text-indigo-700'
                  : 'border-transparent text-gray-500 hover:text-indigo-500'
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
            className="w-full max-w-md rounded-lg border border-gray-200 px-4 py-2 shadow-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none"
            disabled
          />
        </div>

        {/* Reviews Section */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading reviews...</p>
          </div>
        ) : error ? (
          <div className="text-red-500 p-4 bg-red-50 rounded-lg">{error}</div>
        ) : (activeTab === 'reviewer' ? (
          grouped.length === 0 ? (
            <div className="text-center py-8 text-gray-600">No testimonials found.</div>
          ) : (
            <>
              <div className="space-y-6">
                {grouped.map((group) => (
                  <div key={group.reviewerKey} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <button
                      className="flex items-center w-full text-left gap-3"
                      onClick={() => toggleExpand(group.reviewerKey)}
                    >
                      {expanded[group.reviewerKey] ? (
                        <FaChevronDown className="text-indigo-500" />
                      ) : (
                        <FaChevronRight className="text-indigo-500" />
                      )}
                      <span className="font-semibold text-lg text-gray-800">
                        {group.reviewer_name || "[No Name]"}
                      </span>
                      {group.reviewer_role && (
                        <span className="ml-2 text-sm text-gray-500">({group.reviewer_role})</span>
                      )}
                      <span className="ml-auto text-sm text-gray-400">
                        {group.reviews.length} review{group.reviews.length !== 1 ? "s" : ""}
                      </span>
                    </button>
                    {expanded[group.reviewerKey] && (
                      <div className="mt-4 space-y-4">
                        {group.reviews.map((review) => {
                          const { icon: PlatformIcon, label } = getPlatformIcon(review.platform);
                          return (
                            <div key={review.id} className="bg-white rounded-lg p-4 border border-gray-200 relative">
                              {/* Platform icon in top-left corner */}
                              <div className="absolute -top-4 -left-4 bg-white rounded-full shadow p-2 flex items-center justify-center" title={label}>
                                <PlatformIcon className="w-6 h-6 text-indigo-500" />
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-indigo-700">{review.platform}</span>
                                <span className="text-xs text-gray-400 ml-2">{new Date(review.created_at).toLocaleDateString()}</span>
                                <span className={`ml-2 text-xs px-2 py-1 rounded ${
                                  review.status === 'submitted' 
                                    ? 'bg-green-100 text-green-600' 
                                    : 'bg-yellow-100 text-yellow-600'
                                }`}>
                                  {review.status}
                                </span>
                                <button
                                  onClick={() => handleDelete(review.id)}
                                  disabled={isDeleting === review.id}
                                  className="ml-auto text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                                  title="Delete review"
                                >
                                  {isDeleting === review.id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                                  ) : (
                                    <FaTrash className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                              <div className="text-gray-800">{review.review_content}</div>
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
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )
        ) : (
          platformGrouped.length === 0 ? (
            <div className="text-center py-8 text-gray-600">No testimonials found.</div>
          ) : (
            <>
              <div className="space-y-6">
                {platformGrouped.map((group) => (
                  <div key={group.platform} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <button
                      className="flex items-center w-full text-left gap-3"
                      onClick={() => toggleExpand(group.platform)}
                    >
                      {expanded[group.platform] ? (
                        <FaChevronDown className="text-indigo-500" />
                      ) : (
                        <FaChevronRight className="text-indigo-500" />
                      )}
                      <span className="font-semibold text-lg text-gray-800">
                        {group.platform}
                      </span>
                      <span className="ml-auto text-sm text-gray-400">
                        {group.reviews.length} review{group.reviews.length !== 1 ? "s" : ""}
                      </span>
                    </button>
                    {expanded[group.platform] && (
                      <div className="mt-4 space-y-4">
                        {group.reviews.map((review) => {
                          const { icon: PlatformIcon, label } = getPlatformIcon(review.platform);
                          return (
                            <div key={review.id} className="bg-white rounded-lg p-4 border border-gray-200 relative">
                              {/* Platform icon in top-left corner */}
                              <div className="absolute -top-4 -left-4 bg-white rounded-full shadow p-2 flex items-center justify-center" title={label}>
                                <PlatformIcon className="w-6 h-6 text-indigo-500" />
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-indigo-700">{review.reviewer_name || "[No Name]"}</span>
                                {review.reviewer_role && (
                                  <span className="ml-2 text-sm text-gray-500">({review.reviewer_role})</span>
                                )}
                                <span className="text-xs text-gray-400 ml-2">{new Date(review.created_at).toLocaleDateString()}</span>
                                <span className={`ml-2 text-xs px-2 py-1 rounded ${
                                  review.status === 'submitted' 
                                    ? 'bg-green-100 text-green-600' 
                                    : 'bg-yellow-100 text-yellow-600'
                                }`}>
                                  {review.status}
                                </span>
                                <button
                                  onClick={() => handleDelete(review.id)}
                                  disabled={isDeleting === review.id}
                                  className="ml-auto text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                                  title="Delete review"
                                >
                                  {isDeleting === review.id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                                  ) : (
                                    <FaTrash className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                              <div className="text-gray-800">{review.review_content}</div>
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
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )
        ))}
      </div>
    </div>
  );
} 