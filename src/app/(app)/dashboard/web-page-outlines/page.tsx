"use client";

import { useState, useCallback, useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import PageCard, { PageCardHeader } from "@/app/(app)/components/PageCard";
import { SubNav } from "@/app/(app)/components/SubNav";
import Icon from "@/components/Icon";
import { Button } from "@/app/(app)/components/ui/button";
import { Modal } from "@/app/(app)/components/ui/modal";
import { useAuthGuard } from "@/utils/authGuard";
import { useAccountData, useBusinessData } from "@/auth/hooks/granularAuthHooks";
import { apiClient } from "@/utils/apiClient";
import { useToast, ToastContainer } from "@/app/(app)/components/reviews/Toast";
import {
  KeywordSelector,
  ToneSelector,
  PagePurposeSelector,
  BusinessInfoPanel,
} from "@/features/web-page-outlines/components";
import { FULL_GENERATION_COST } from "@/features/web-page-outlines/services/credits";
import type {
  OutlineTone,
  PagePurpose,
  BusinessInfoForOutline,
  GenerateOutlineResponse,
} from "@/features/web-page-outlines/types";

// --- Skeleton label for the preview ---
function SkeletonLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
      {children}
    </span>
  );
}

// --- Placeholder bar ---
function SkeletonBar({ className = "" }: { className?: string }) {
  return <div className={`rounded bg-gray-200/70 ${className}`} />;
}

// --- Skeleton preview matching the real outline layout ---
function OutlineSkeletonPreview() {
  return (
    <div className="opacity-60 pointer-events-none select-none" aria-hidden="true">
      {/* Hero skeleton */}
      <div className="rounded-t-2xl border border-white/20 border-b-0 bg-gradient-to-br from-slate-blue/10 to-slate-blue/5 px-8 py-12 text-center">
        {/* Fake nav */}
        <div className="flex items-center justify-between mb-10">
          <SkeletonBar className="h-3 w-6" />
          <div className="flex gap-6">
            <SkeletonBar className="h-3 w-10" />
            <SkeletonBar className="h-3 w-12" />
            <SkeletonBar className="h-3 w-8" />
            <SkeletonBar className="h-3 w-12" />
          </div>
        </div>
        <div className="max-w-md mx-auto space-y-3">
          <SkeletonLabel>H1 headline</SkeletonLabel>
          <SkeletonBar className="h-6 w-3/4 mx-auto" />
          <SkeletonBar className="h-4 w-full mx-auto" />
          <SkeletonBar className="h-4 w-2/3 mx-auto" />
        </div>
      </div>

      {/* Body skeleton */}
      <div className="rounded-b-2xl border border-white/20 border-t-0 bg-white/40">
        <div className="max-w-[680px] mx-auto px-6 sm:px-10 py-8 space-y-8">
          {/* Intro */}
          <div className="space-y-2">
            <SkeletonLabel>Introduction</SkeletonLabel>
            <div className="rounded-xl p-5 bg-white/70 border border-white/60 space-y-2">
              <SkeletonBar className="h-3 w-full" />
              <SkeletonBar className="h-3 w-5/6" />
              <SkeletonBar className="h-3 w-3/4" />
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-2">
            <SkeletonLabel>Key benefits</SkeletonLabel>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl p-5 bg-white/70 border border-white/60 space-y-2">
                  <SkeletonBar className="h-4 w-2/3" />
                  <SkeletonBar className="h-3 w-full" />
                  <SkeletonBar className="h-3 w-4/5" />
                </div>
              ))}
            </div>
          </div>

          {/* Body sections */}
          <div className="space-y-2">
            <SkeletonLabel>Body content</SkeletonLabel>
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-xl p-5 bg-white/70 border border-white/60 space-y-3">
                  <SkeletonBar className="h-5 w-1/2" />
                  <SkeletonBar className="h-3 w-full" />
                  <SkeletonBar className="h-3 w-5/6" />
                  <SkeletonBar className="h-3 w-full" />
                  <SkeletonBar className="h-3 w-3/4" />
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-2">
            <SkeletonLabel>Call to action</SkeletonLabel>
            <div className="rounded-2xl px-8 py-8 text-center bg-white/70 border border-white/60 space-y-3">
              <SkeletonBar className="h-5 w-1/3 mx-auto" />
              <SkeletonBar className="h-3 w-1/2 mx-auto" />
              <SkeletonBar className="h-10 w-36 mx-auto rounded-xl" />
            </div>
          </div>

          {/* FAQ */}
          <div className="space-y-2">
            <SkeletonLabel>FAQ</SkeletonLabel>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-xl px-5 py-3.5 bg-white/70 border border-white/60 flex items-center justify-between">
                  <SkeletonBar className="h-3.5 w-2/3" />
                  <Icon name="FaChevronDown" size={10} className="text-gray-300" />
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-gray-200/40 flex justify-center">
            <SkeletonBar className="h-3 w-1/2" />
          </div>
        </div>
      </div>
    </div>
  );
}

const SUB_NAV_ITEMS = [
  { label: "Create", icon: "FaRocket" as const, href: "/dashboard/web-page-outlines", matchType: "exact" as const },
  { label: "Library", icon: "FaClock" as const, href: "/dashboard/web-page-outlines/library", matchType: "exact" as const },
];

const PROGRESS_MESSAGES = [
  "Analyzing your keyword...",
  "Checking top ranked pages...",
  "Building content structure...",
  "Generating SEO-optimized sections...",
  "Creating schema markup...",
  "Polishing your page plan...",
];

// Helper to safely extract services as a string
function servicesAsString(val: unknown): string {
  if (Array.isArray(val)) return val.join(", ");
  if (typeof val === "string") return val;
  return "";
}

export default function WebPageOutlinesPage() {
  useAuthGuard();
  const { selectedAccountId } = useAccountData();
  const { business, hasBusiness } = useBusinessData();
  const { toasts, closeToast, success, error: showError } = useToast();
  const router = useRouter();

  // Modal & generation state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState<{
    id: string;
    phrase: string;
  } | null>(null);
  const [tone, setTone] = useState<OutlineTone>("professional");
  const [pagePurpose, setPagePurpose] = useState<PagePurpose>("service");
  const [businessInfo, setBusinessInfo] = useState<BusinessInfoForOutline>(() =>
    buildBusinessInfo(business)
  );
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [progressIdx, setProgressIdx] = useState(0);

  // Load credit balance on mount
  const loadBalance = useCallback(async () => {
    try {
      const data = await apiClient.get<{ totalCredits: number }>(
        "/credits/balance"
      );
      setCreditBalance(data.totalCredits);
    } catch {
      // Balance will show as unknown
    }
  }, []);

  // Build business info from business profile
  function buildBusinessInfo(
    biz: typeof business
  ): BusinessInfoForOutline {
    if (!biz) {
      return {
        name: "",
        aboutUs: "",
        servicesOffered: "",
        differentiators: "",
        industriesServed: "",
        yearsInBusiness: "",
        phone: "",
        website: "",
        city: "",
        state: "",
        companyValues: "",
        aiDos: "",
        aiDonts: "",
      };
    }

    // The business object from context includes all DB columns via select('*')
    const b = biz as unknown as Record<string, unknown>;

    return {
      name: (b.name as string) || "",
      aboutUs: (b.about_us as string) || "",
      servicesOffered: servicesAsString(b.services_offered),
      differentiators: (b.differentiators as string) || "",
      industriesServed: (b.industries_served as string) || "",
      yearsInBusiness: String(b.years_in_business || ""),
      phone: (b.phone as string) || "",
      website: (b.business_website as string) || "",
      city: (b.address_city as string) || "",
      state: (b.address_state as string) || "",
      companyValues: (b.company_values as string) || "",
      aiDos: (b.ai_dos as string) || "",
      aiDonts: (b.ai_donts as string) || "",
    };
  }

  // Update business info when business data loads
  useMemo(() => {
    if (business && !businessInfo.name) {
      setBusinessInfo(buildBusinessInfo(business));
    }
    loadBalance();
  }, [business]); // eslint-disable-line react-hooks/exhaustive-deps

  // Generate outline
  const handleGenerate = async () => {
    if (!selectedKeyword) {
      showError("Please select a keyword first");
      return;
    }
    if (!businessInfo.name) {
      showError("Business name is required");
      return;
    }

    setIsModalOpen(false);
    setIsGenerating(true);
    setProgressIdx(0);

    // Cycle progress messages
    const interval = setInterval(() => {
      setProgressIdx((prev) =>
        prev < PROGRESS_MESSAGES.length - 1 ? prev + 1 : prev
      );
    }, 3000);

    try {
      const result = await apiClient.post<GenerateOutlineResponse>(
        "/web-page-outlines/generate",
        {
          keywordId: selectedKeyword.id,
          keywordPhrase: selectedKeyword.phrase,
          tone,
          pagePurpose,
          businessInfo,
        }
      );

      if (result.success && result.outline) {
        success("Page plan generated successfully!");
        router.push(`/dashboard/web-page-outlines/${result.outline.id}`);
      } else {
        throw new Error("Generation failed");
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to generate page plan";
      showError(msg);
      setIsGenerating(false);
    } finally {
      clearInterval(interval);
    }
  };

  if (!selectedAccountId) {
    return (
      <PageCard
        icon={
          <Icon
            name="FaFileAlt"
            className="w-7 h-7 text-slate-blue"
            size={28}
          />
        }
      >
        <div className="flex justify-center py-12">
          <Icon
            name="FaSpinner"
            className="w-8 h-8 text-slate-blue animate-spin"
            size={32}
          />
        </div>
      </PageCard>
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
          title="Create web page outlines"
          description="Create a page outline with optimized copy and metadata that you can easily copy or download. Prompty will scrape the top ranking pages for your keyword and use your business info to create keyword focused content."
          variant="large"
          actions={
            !isGenerating ? (
              <Button onClick={() => setIsModalOpen(true)} className="whitespace-nowrap">
                <Icon name="FaPlus" size={14} className="mr-1.5" />
                Create
              </Button>
            ) : undefined
          }
        />

        {/* Generating spinner */}
        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Icon
              name="FaSpinner"
              size={32}
              className="text-slate-blue animate-spin"
            />
            <p className="text-gray-600 text-sm animate-pulse">
              {PROGRESS_MESSAGES[progressIdx]}
            </p>
          </div>
        )}
      </PageCard>

      {/* Skeleton preview — sits on gradient background below the card */}
      {!isGenerating && (
        <div className="px-4 sm:px-6 lg:px-8 pb-8">
          <div className="max-w-7xl mx-auto">
            <OutlineSkeletonPreview />
          </div>
        </div>
      )}

      {/* Configuration modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New page outline"
        size="2xl"
        allowOverflow
      >
        <div className="space-y-6">
          <KeywordSelector
            selectedKeyword={selectedKeyword}
            onSelect={setSelectedKeyword}
          />

          <ToneSelector selected={tone} onChange={setTone} />

          <PagePurposeSelector selected={pagePurpose} onChange={setPagePurpose} />

          <BusinessInfoPanel
            businessInfo={businessInfo}
            onChange={setBusinessInfo}
            hasBusiness={hasBusiness}
          />

          {creditBalance !== null &&
            creditBalance < FULL_GENERATION_COST && (
              <p className="text-sm text-red-600">
                You need at least {FULL_GENERATION_COST} credits to generate
                a page plan.
              </p>
            )}
        </div>

        <Modal.Footer>
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-gray-500">
              {creditBalance !== null ? (
                <>
                  <span className="font-medium text-gray-700">
                    {creditBalance}
                  </span>{" "}
                  credits available
                </>
              ) : (
                "Loading balance..."
              )}
            </div>
            <Button
              onClick={handleGenerate}
              disabled={
                !selectedKeyword ||
                !businessInfo.name ||
                (creditBalance !== null &&
                  creditBalance < FULL_GENERATION_COST)
              }
              className="whitespace-nowrap"
            >
              <Icon name="prompty" size={14} className="mr-1.5" />
              Generate plan ({FULL_GENERATION_COST} credits)
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
    </>
  );
}
