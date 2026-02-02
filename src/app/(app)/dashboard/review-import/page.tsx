"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import PageCard, { PageCardHeader } from "@/app/(app)/components/PageCard";
import Icon from "@/components/Icon";
import { useAuthGuard } from "@/utils/authGuard";
import { useAccountData } from "@/auth/hooks/granularAuthHooks";
import PlatformImportSection from "@/app/(app)/components/reviews/PlatformImportSection";
import { useToast, ToastContainer } from "@/app/(app)/components/reviews/Toast";

export default function ReviewImportPage() {
  useAuthGuard();
  const { selectedAccountId } = useAccountData();
  const searchParams = useSearchParams();
  const { toasts, closeToast, success } = useToast();

  // Capture OAuth redirect params once, persist across URL cleanup and re-renders
  const oauthHandled = useRef(false);
  const initialPlatformRef = useRef<string | undefined>(undefined);

  if (!oauthHandled.current && searchParams.get("connected") === "true") {
    initialPlatformRef.current = "google_business_profile";
  }

  // Show toast and clean URL once
  useEffect(() => {
    if (oauthHandled.current) return;
    if (searchParams.get("connected") !== "true") return;

    oauthHandled.current = true;
    const message = searchParams.get("message");
    success(message ? decodeURIComponent(message) : "Google Business Profile connected successfully!", 5000);
    window.history.replaceState({}, "", window.location.pathname);
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!selectedAccountId) {
    return (
      <div className="min-h-screen flex justify-center items-start px-4 sm:px-0">
        <PageCard
          icon={<Icon name="FaGlobe" className="w-7 h-7 text-slate-blue" size={28} />}
        >
          <div className="flex justify-center py-12">
            <Icon name="FaSpinner" className="w-8 h-8 text-slate-blue animate-spin" size={32} />
          </div>
        </PageCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center items-start px-4 sm:px-0">
      <ToastContainer toasts={toasts} onClose={closeToast} />
      <PageCard
        icon={<Icon name="FaGlobe" className="w-7 h-7 text-slate-blue" size={28} />}
      >
        <PageCardHeader
          title="Import reviews"
          description="Import reviews from Trustpilot, TripAdvisor, Google Play, App Store, and Google Business Profile."
          iconClearance={false}
        />

        <PlatformImportSection
          initialPlatform={initialPlatformRef.current}
          onSuccess={() => {
            setTimeout(() => window.location.reload(), 1500);
          }}
        />

        <div className="mt-4">
          <Link
            href="/dashboard/reviews"
            className="text-sm text-slate-blue hover:underline flex items-center gap-1"
          >
            <Icon name="FaArrowLeft" className="w-3 h-3" size={12} />
            Back to reviews
          </Link>
        </div>
      </PageCard>
    </div>
  );
}
