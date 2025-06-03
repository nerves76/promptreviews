"use client";

import { useEffect, useState } from "react";

export default function TestEnv() {
  const [envVars, setEnvVars] = useState({
    url: "",
    key: "",
  });

  useEffect(() => {
    setEnvVars({
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || "not set",
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? "set (hidden)"
        : "not set",
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Environment Variables Test</h1>
        <div className="space-y-2">
          <p>
            <span className="font-semibold">NEXT_PUBLIC_SUPABASE_URL:</span>{" "}
            {envVars.url}
          </p>
          <p>
            <span className="font-semibold">
              NEXT_PUBLIC_SUPABASE_ANON_KEY:
            </span>{" "}
            {envVars.key}
          </p>
        </div>
      </div>
    </div>
  );
}
