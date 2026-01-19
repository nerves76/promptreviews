"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/auth";
import { useRouter } from "next/navigation";
import { useGlobalLoader } from "@/app/(app)/components/GlobalLoaderProvider";
import TrialBanner from "@/app/(app)/components/TrialBanner";

/**
 * Layout for outreach-templates - an authenticated dashboard page
 * This ensures users are logged in before accessing this page
 */
export default function OutreachTemplatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isInitialized, account, accountLoading } = useAuth();
  const [hasMounted, setHasMounted] = useState(false);
  const router = useRouter();
  const loader = useGlobalLoader();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (isInitialized && !user && hasMounted) {
      router.push('/auth/sign-in');
    }
  }, [isInitialized, user, hasMounted, router]);

  // Show loading overlay while auth is initializing
  useEffect(() => {
    const showOverlay = !isInitialized || isLoading || accountLoading;
    if (showOverlay) loader.show('outreach-layout'); else loader.hide('outreach-layout');
    return () => loader.hide('outreach-layout');
  }, [isInitialized, isLoading, accountLoading, loader]);

  // Don't render anything while checking auth
  if (!isInitialized) return null;
  if (isInitialized && !user && hasMounted) return null;
  if (isLoading || accountLoading) return null;

  return (
    <div className="w-full min-h-screen">
      <TrialBanner accountData={account} />
      {children}
    </div>
  );
}
