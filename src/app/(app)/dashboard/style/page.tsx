"use client";
import * as React from "react";
import { useState } from "react";
import { useAuthGuard } from "@/utils/authGuard";
import { createClient } from "@/utils/supabaseClient";
import { useAuth } from "@/auth";
import StyleModalPage from "./StyleModalPage";

export default function StylePage() {
  const supabase = createClient();
  const { selectedAccountId } = useAuth();

  useAuthGuard();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [business, setBusiness] = useState<any>(null);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Style your prompt pages</h1>
      <p className="text-gray-600 mb-6">
        Customize the appearance of your prompt pages to match your brand.
      </p>
      
      <button
        onClick={() => setShowModal(true)}
        className="bg-slate-blue text-white px-4 py-2 rounded hover:bg-slate-blue/90"
      >
        Open style editor
      </button>

      {showModal && (
        <StyleModalPage 
          onClose={() => setShowModal(false)} 
          accountId={selectedAccountId}
        />
      )}
    </div>
  );
}
