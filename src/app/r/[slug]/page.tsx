"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import AppLoader from "@/app/components/AppLoader";

export default function PromptPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <AppLoader variant="centered" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full">
      <div className="min-h-screen flex justify-center items-start">
        <div className="relative w-full">
          <div className="max-w-[1000px] w-full mx-auto px-4">
            <h1>Test Page</h1>
          </div>
        </div>
      </div>
    </div>
  );
}
