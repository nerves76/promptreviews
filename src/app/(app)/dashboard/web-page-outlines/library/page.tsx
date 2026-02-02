"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import PageCard, { PageCardHeader } from "@/app/(app)/components/PageCard";
import { SubNav } from "@/app/(app)/components/SubNav";
import Icon from "@/components/Icon";
import { useAuthGuard } from "@/utils/authGuard";
import { useAccountData } from "@/auth/hooks/granularAuthHooks";
import { apiClient } from "@/utils/apiClient";

interface LibraryItem {
  id: string;
  keyword_phrase: string;
  tone: string;
  business_name: string;
  page_title: string | null;
  credit_cost: number;
  created_at: string;
}

type SortField = "created_at" | "keyword_phrase";
type SortDir = "asc" | "desc";

const SUB_NAV_ITEMS = [
  { label: "Create", icon: "FaRocket" as const, href: "/dashboard/web-page-outlines", matchType: "exact" as const },
  { label: "Library", icon: "FaClock" as const, href: "/dashboard/web-page-outlines/library", matchType: "exact" as const },
];

export default function WebPageOutlinesLibraryPage() {
  useAuthGuard();
  const { selectedAccountId } = useAccountData();
  const router = useRouter();

  const [outlines, setOutlines] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    if (!selectedAccountId) return;

    async function fetchOutlines() {
      try {
        const data = await apiClient.get<{ outlines: LibraryItem[] }>(
          "/web-page-outlines?limit=50"
        );
        setOutlines(data.outlines || []);
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }

    fetchOutlines();
  }, [selectedAccountId]);

  const sortedOutlines = useMemo(() => {
    const sorted = [...outlines].sort((a, b) => {
      if (sortField === "keyword_phrase") {
        return a.keyword_phrase.localeCompare(b.keyword_phrase);
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
    return sortDir === "desc" ? sorted.reverse() : sorted;
  }, [outlines, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "created_at" ? "desc" : "asc");
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Delete this page plan? This cannot be undone.")) return;

    setDeletingId(id);
    try {
      await apiClient.delete(`/web-page-outlines/${id}`);
      setOutlines((prev) => prev.filter((o) => o.id !== id));
    } catch {
      // Silently fail
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
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
        ) : outlines.length === 0 ? (
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
            {/* Sort controls */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Sort by:</span>
              <button
                type="button"
                onClick={() => handleSort("created_at")}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border transition-colors whitespace-nowrap ${
                  sortField === "created_at"
                    ? "bg-slate-blue/10 border-slate-blue/30 text-slate-blue font-medium"
                    : "bg-white/50 border-gray-200 text-gray-600 hover:bg-white/80"
                }`}
                aria-label={`Sort by date ${sortField === "created_at" ? (sortDir === "desc" ? "descending" : "ascending") : ""}`}
              >
                Date
                {sortField === "created_at" && (
                  <Icon
                    name={sortDir === "desc" ? "FaChevronDown" : "FaChevronUp"}
                    size={8}
                  />
                )}
              </button>
              <button
                type="button"
                onClick={() => handleSort("keyword_phrase")}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border transition-colors whitespace-nowrap ${
                  sortField === "keyword_phrase"
                    ? "bg-slate-blue/10 border-slate-blue/30 text-slate-blue font-medium"
                    : "bg-white/50 border-gray-200 text-gray-600 hover:bg-white/80"
                }`}
                aria-label={`Sort by keyword ${sortField === "keyword_phrase" ? (sortDir === "desc" ? "descending" : "ascending") : ""}`}
              >
                Keyword
                {sortField === "keyword_phrase" && (
                  <Icon
                    name={sortDir === "desc" ? "FaChevronDown" : "FaChevronUp"}
                    size={8}
                  />
                )}
              </button>
            </div>

            {/* Outline list */}
            {sortedOutlines.map((item) => (
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
                  onClick={(e) => handleDelete(e, item.id)}
                  disabled={deletingId === item.id}
                  className="flex-shrink-0 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
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
                  className="flex-shrink-0 text-gray-400"
                  aria-label={`Open ${item.keyword_phrase} page plan`}
                >
                  <Icon name="FaChevronRight" size={10} />
                </button>
              </div>
            ))}
          </div>
        )}
      </PageCard>
    </>
  );
}
