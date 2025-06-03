"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getUserOrMock } from "@/utils/supabase";
import AppLoader from "@/app/components/AppLoader";

export default function Home() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

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
  }, [supabase.auth, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <AppLoader />
    </div>
  );
}
