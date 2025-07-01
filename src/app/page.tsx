"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";
import { getUserOrMock } from "@/utils/supabase";
import AppLoader from "@/app/components/AppLoader";

// Use the singleton Supabase client instead of creating a new instance
// This prevents "Multiple GoTrueClient instances" warnings and ensures proper session persistence

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await getUserOrMock(supabase);
      if (user) {
        router.push("/dashboard");
      } else {
        router.push("/auth/sign-in");
      }
    };
    getUser();
  }, [router]);

  return <AppLoader variant="default" />;
}
