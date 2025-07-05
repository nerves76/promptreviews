"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
// 🔧 CONSOLIDATED: Single import from supabaseClient module
import { supabase, getUserOrMock } from "@/utils/supabaseClient";
import AppLoader from "@/app/components/AppLoader";

// Use the singleton Supabase client instead of creating a new instance
// This prevents "Multiple GoTrueClient instances" warnings and ensures proper session persistence

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      try {
        // Add a timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Auth check timeout')), 5000);
        });

        const authPromise = getUserOrMock(supabase);
        
        const {
          data: { user },
        } = await Promise.race([authPromise, timeoutPromise]) as any;

        if (user) {
          router.push("/dashboard");
        } else {
          router.push("/auth/sign-in");
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        // On any error, redirect to sign-in as a fallback
        router.push("/auth/sign-in");
      } finally {
        setIsLoading(false);
      }
    };

    getUser();
  }, [router]);

  // Show loading for a maximum of 6 seconds, then redirect to sign-in
  useEffect(() => {
    const fallbackTimeout = setTimeout(() => {
      if (isLoading) {
        console.log('Auth check taking too long, redirecting to sign-in');
        router.push("/auth/sign-in");
      }
    }, 6000);

    return () => clearTimeout(fallbackTimeout);
  }, [isLoading, router]);

  return <AppLoader variant="default" />;
}
