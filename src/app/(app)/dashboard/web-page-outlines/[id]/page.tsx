"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { SubNav } from "@/app/(app)/components/SubNav";
import Icon from "@/components/Icon";
import { Button } from "@/app/(app)/components/ui/button";
import { useAuthGuard } from "@/utils/authGuard";
import { useAccountData } from "@/auth/hooks/granularAuthHooks";
import { apiClient } from "@/utils/apiClient";
import { useToast, ToastContainer } from "@/app/(app)/components/reviews/Toast";
import {
  OutlinePreview,
  SEOMetadataPanel,
  SchemaMarkupViewer,
  CompetitorTopicsCard,
} from "@/features/web-page-outlines/components";
import type {
  PageOutline,
  SEOMetadata,
  CompetitorData,
  SectionKey,
  WebPageOutlineRecord,
  RegenerateSectionResponse,
} from "@/features/web-page-outlines/types";

const SUB_NAV_ITEMS = [
  { label: "Create", icon: "FaRocket" as const, href: "/dashboard/web-page-outlines", matchType: "exact" as const },
  { label: "Library", icon: "FaClock" as const, href: "/dashboard/web-page-outlines/library", matchType: "exact" as const },
];

export default function OutlineDetailPage() {
  useAuthGuard();
  const { selectedAccountId } = useAccountData();
  const { toasts, closeToast, success, error: showError } = useToast();
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [outline, setOutline] = useState<WebPageOutlineRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [regeneratingSection, setRegeneratingSection] = useState<SectionKey | null>(null);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);

  // Load outline
  const loadOutline = useCallback(async () => {
    if (!params.id || !selectedAccountId) return;
    try {
      const data = await apiClient.get<{ outline: WebPageOutlineRecord }>(
        `/web-page-outlines/${params.id}`
      );
      if (data.outline) {
        setOutline(data.outline);
      }
    } catch {
      showError("Failed to load page plan");
    } finally {
      setLoading(false);
    }
  }, [params.id, selectedAccountId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadOutline();
  }, [loadOutline]);

  // Load credit balance
  useEffect(() => {
    async function fetchBalance() {
      try {
        const data = await apiClient.get<{ totalCredits: number }>("/credits/balance");
        setCreditBalance(data.totalCredits);
      } catch {
        // Balance will show as unknown
      }
    }
    fetchBalance();
  }, []);

  // Regenerate a section
  const handleRegenerate = async (sectionKey: SectionKey) => {
    if (!outline) return;

    setRegeneratingSection(sectionKey);

    try {
      const result = await apiClient.post<RegenerateSectionResponse>(
        "/web-page-outlines/regenerate-section",
        {
          outlineId: outline.id,
          sectionKey,
        }
      );

      if (result.success && result.sectionData) {
        const updatedOutlineJson = {
          ...(outline.outline_json as unknown as PageOutline),
          [sectionKey]: result.sectionData,
        };
        setOutline({
          ...outline,
          outline_json: updatedOutlineJson as unknown as WebPageOutlineRecord["outline_json"],
        });
        setCreditBalance(result.creditsRemaining);
        success(`${sectionKey} regenerated!`);
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to regenerate section";
      showError(msg);
    } finally {
      setRegeneratingSection(null);
    }
  };

  // Extract competitor data from stored outline
  const competitorData: CompetitorData | null = useMemo(() => {
    if (!outline?.competitor_data) return null;
    return outline.competitor_data as unknown as CompetitorData;
  }, [outline]);

  if (!selectedAccountId || loading) {
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
        <div className="flex justify-center py-16">
          <Icon
            name="FaSpinner"
            className="w-8 h-8 text-slate-blue animate-spin"
            size={32}
          />
        </div>
      </>
    );
  }

  if (!outline) {
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
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Icon name="FaFileAlt" size={32} className="text-gray-300 mb-3" />
          <p className="text-gray-600 text-sm font-medium">Page plan not found</p>
          <button
            type="button"
            onClick={() => router.push("/dashboard/web-page-outlines/library")}
            className="mt-2 text-sm text-slate-blue hover:underline focus:outline-none"
          >
            Back to library
          </button>
        </div>
      </>
    );
  }

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

      {/* Lightweight header bar */}
      <div className="w-full max-w-[1280px] mx-auto px-4 mt-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <button
            type="button"
            onClick={() => router.push("/dashboard/web-page-outlines/library")}
            className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-2 rounded"
          >
            <Icon name="FaArrowLeft" size={12} />
            Back to library
          </button>

          <h2 className="text-lg font-semibold text-white truncate">
            <span className="font-normal text-white/70">Keyword:</span> {outline.keyword_phrase}
          </h2>

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/web-page-outlines")}
            className="whitespace-nowrap border-white/40 text-white hover:bg-white/10"
          >
            <Icon name="prompty" size={12} className="mr-1.5" />
            Create new
          </Button>
        </div>

        {/* Make it human disclaimer */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl p-3 flex items-start gap-2 mb-6 max-w-[750px]">
          <Icon
            name="FaExclamationTriangle"
            size={14}
            className="text-white/70 mt-0.5 flex-shrink-0"
          />
          <p className="text-sm text-white/90">
            <span className="font-semibold">Make it human:</span> We do not
            recommend publishing AI content verbatim on your website. Instead,
            think of this as a starting point and make it great!
          </p>
        </div>
      </div>

      {/* Preview + panels */}
      <div className="w-full max-w-[1280px] mx-auto px-4 space-y-6 pb-12">
        <OutlinePreview
          outline={outline.outline_json as unknown as PageOutline}
          outlineId={outline.id}
          seo={outline.schema_markup as unknown as SEOMetadata}
          keyword={outline.keyword_phrase}
          onRegenerate={handleRegenerate}
          regeneratingSection={regeneratingSection}
        />

        {/* Side panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SEOMetadataPanel
            seo={outline.schema_markup as unknown as SEOMetadata}
          />
          {competitorData && (
            <CompetitorTopicsCard data={competitorData} keyword={outline.keyword_phrase} />
          )}
        </div>

        <SchemaMarkupViewer
          seo={outline.schema_markup as unknown as SEOMetadata}
        />
      </div>
    </>
  );
}
