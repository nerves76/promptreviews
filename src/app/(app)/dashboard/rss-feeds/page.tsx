"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RssFeedsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/social-posting?view=rss");
  }, [router]);

  return null;
}
