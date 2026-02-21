"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import PageCard, { PageCardHeader } from "@/app/(app)/components/PageCard";
import { SubNav } from "@/app/(app)/components/SubNav";
import Icon from "@/components/Icon";
import { Pagination } from "@/components/Pagination";
import { useAuthGuard } from "@/utils/authGuard";
import { useAccountData } from "@/auth/hooks/granularAuthHooks";
import { apiClient } from "@/utils/apiClient";
import { useToast, ToastContainer } from "@/app/(app)/components/reviews/Toast";

interface LibraryItem {
  id: string;
  keyword_phrase: string;
  tone: string;
  business_name: string;
  page_title: string | null;
  credit_cost: number;
  created_at: string;
}

const PAGE_SIZE = 25;

const SUB_NAV_ITEMS = [
  { label: "Create", icon: "FaRocket" as const, href: "/dashboard/web-page-outlines", matchType: "exact" as const },
  { label: "Library", icon: "FaClock" as const, href: "/dashboard/web-page-outlines/library", matchType: "exact" as const },
];

export default function WebPageOutlinesLibraryPage() {
  useAuthGuard();
  const { selectedAccountId } = useAccountData();
  const router = useRouter();

  const { toasts, closeToast, success, error: showError } = useToast();
  const [outlines, setOutlines] = useState<LibraryItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [addingToWMId, setAddingToWMId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  const fetchOutlines = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const offset = (page - 1) * PAGE_SIZE;
      const data = await apiClient.get<{ outlines: LibraryItem[]; total: number }>(
        `/web-page-outlines?limit=${PAGE_SIZE}&offset=${offset}`
      );
      setOutlines(data.outlines || []);
      setTotalItems(data.total || 0);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedAccountId) return;
    fetchOutlines(currentPage);
  }, [selectedAccountId, currentPage, fetchOutlines]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Delete this page plan? This cannot be undone.")) return;

    setDeletingId(id);
    try {
      await apiClient.delete(`/web-page-outlines/${id}`);
      // If we deleted the last item on this page, go back one page
      if (outlines.length === 1 && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      } else {
        await fetchOutlines(currentPage);
      }
    } catch {
      // Silently fail
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddToWorkManager = async (e: React.MouseEvent, item: LibraryItem) => {
    e.stopPropagation();
    setAddingToWMId(item.id);
    try {
      const result = await apiClient.post<{ task: { title: string }; board_id: string }>(
        '/work-manager/tasks/from-outline',
        { outline_id: item.id }
      );
      success(`Task created: ${result.task.title}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create task';
      showError(msg);
    } finally {
      setAddingToWMId(null);
    }
  };

  return (
    <>
      <ToastContainer toasts={toasts} onClose={closeToast} />
      <div className="px-4 sm:px-6 lg:px-8 pt-8 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col items-center mb-3">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Web Page Planner
          </h1>
        </div>
      </div>

      <SubNav items={SUB_NAV_ITEMS} />

      <PageCard
        icon={
          <Icon
            name="FaFileAlt"
            className="w-7 h-7 text-slate-blue"
            size={28}
          />
        }
      >
        <PageCardHeader
          title="Page planner library"
          description="Browse and revisit your previously generated web page plans."
          variant="large"
        />

        {loading ? (
          <div className="flex justify-center py-12">
            <Icon
              name="FaSpinner"
              className="w-8 h-8 text-slate-blue animate-spin"
              size={32}
            />
          </div>
        ) : totalItems === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Icon
              name="FaFileAlt"
              size={32}
              className="text-gray-300 mb-3"
            />
            <p className="text-gray-600 text-sm font-medium">
              No page plans yet
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Generate your first plan from the{" "}
              <button
                type="button"
                onClick={() => router.push("/dashboard/web-page-outlines")}
                className="text-slate-blue hover:underline focus:outline-none"
              >
                planner
              </button>
              .
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Outline list */}
            {outlines.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/60 border border-gray-100 bg-white/40 transition-colors"
              >
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/dashboard/web-page-outlines/${item.id}`
                    )
                  }
                  className="flex-1 min-w-0 text-left focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2 rounded"
                >
                  <p className="text-base font-semibold text-gray-900 truncate">
                    {item.keyword_phrase}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {item.tone} &middot; {item.business_name} &middot;{" "}
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={(e) => handleAddToWorkManager(e, item)}
                  disabled={addingToWMId === item.id}
                  className="flex-shrink-0 p-2 rounded-lg text-gray-500 hover:text-slate-blue hover:bg-slate-blue/10 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
                  aria-label={`Add ${item.keyword_phrase} to Work Manager`}
                >
                  <Icon
                    name={addingToWMId === item.id ? "FaSpinner" : "FaBriefcase"}
                    size={13}
                    className={addingToWMId === item.id ? "animate-spin" : ""}
                  />
                </button>

                <button
                  type="button"
                  onClick={(e) => handleDelete(e, item.id)}
                  disabled={deletingId === item.id}
                  className="flex-shrink-0 p-2 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
                  aria-label={`Delete ${item.keyword_phrase} page plan`}
                >
                  <Icon
                    name={deletingId === item.id ? "FaSpinner" : "FaTrash"}
                    size={13}
                    className={deletingId === item.id ? "animate-spin" : ""}
                  />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/dashboard/web-page-outlines/${item.id}`
                    )
                  }
                  className="flex-shrink-0 text-gray-500"
                  aria-label={`Open ${item.keyword_phrase} page plan`}
                >
                  <Icon name="FaChevronRight" size={10} />
                </button>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={PAGE_SIZE}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        )}
      </PageCard>
    </>
  );
}
