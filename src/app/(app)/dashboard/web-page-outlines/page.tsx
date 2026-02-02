"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import PageCard, { PageCardHeader } from "@/app/(app)/components/PageCard";
import { SubNav } from "@/app/(app)/components/SubNav";
import Icon from "@/components/Icon";
import { Button } from "@/app/(app)/components/ui/button";
import { useAuthGuard } from "@/utils/authGuard";
import { useAccountData, useBusinessData } from "@/auth/hooks/granularAuthHooks";
import { apiClient } from "@/utils/apiClient";
import { useToast, ToastContainer } from "@/app/(app)/components/reviews/Toast";
import {
  KeywordSelector,
  ToneSelector,
  BusinessInfoPanel,
} from "@/features/web-page-outlines/components";
import { FULL_GENERATION_COST } from "@/features/web-page-outlines/services/credits";
import type {
  OutlineTone,
  BusinessInfoForOutline,
  GenerateOutlineResponse,
} from "@/features/web-page-outlines/types";

type PageState = "configuring" | "generating";

const SUB_NAV_ITEMS = [
  { label: "Create", icon: "FaRocket" as const, href: "/dashboard/web-page-outlines", matchType: "exact" as const },
  { label: "Library", icon: "FaClock" as const, href: "/dashboard/web-page-outlines/library", matchType: "exact" as const },
];

const PROGRESS_MESSAGES = [
  "Analyzing your keyword...",
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

  // Page state
  const [pageState, setPageState] = useState<PageState>("configuring");
  const [selectedKeyword, setSelectedKeyword] = useState<{
    id: string;
    phrase: string;
  } | null>(null);
  const [tone, setTone] = useState<OutlineTone>("professional");
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

    setPageState("generating");
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
      setPageState("configuring");
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
          title="Create web page outline"
          description="Plan AI-powered web page content optimized for search engines and AI visibility."
          variant="large"
        />

        {/* Configuring state */}
        {pageState === "configuring" && (
          <div className="space-y-6">
            <KeywordSelector
              selectedKeyword={selectedKeyword}
              onSelect={setSelectedKeyword}
            />

            <ToneSelector selected={tone} onChange={setTone} />

            <BusinessInfoPanel
              businessInfo={businessInfo}
              onChange={setBusinessInfo}
              hasBusiness={hasBusiness}
            />

            {/* Credit balance & generate button */}
            <div className="flex items-center justify-between pt-2">
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
                <Icon name="FaRocket" size={14} className="mr-1.5" />
                Generate plan ({FULL_GENERATION_COST} credits)
              </Button>
            </div>

            {creditBalance !== null &&
              creditBalance < FULL_GENERATION_COST && (
                <p className="text-sm text-red-600">
                  You need at least {FULL_GENERATION_COST} credits to generate
                  a page plan.
                </p>
              )}
          </div>
        )}

        {/* Generating state */}
        {pageState === "generating" && (
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
    </>
  );
}
