"use client";
import * as React from "react";
import { useState, useEffect } from "react";
import { markTaskAsCompleted } from "@/utils/onboardingTasks";
import { useAuthGuard } from "@/utils/authGuard";
import { supabase } from "@/utils/supabaseClient";
import StyleModalPage from "./StyleModalPage";

export default function StylePage() {
  useAuthGuard();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [business, setBusiness] = useState<any>(null);

  // Mark style prompt pages task as completed when user visits this page
  useEffect(() => {
    const markStyleTaskComplete = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await markTaskAsCompleted(user.id, "style-prompt-pages");
        }
      } catch (error) {
        console.error("Error marking style task as complete:", error);
      }
    };

    markStyleTaskComplete();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Style Your Prompt Pages</h1>
      <p className="text-gray-600 mb-6">
        Customize the appearance of your prompt pages to match your brand.
      </p>
      
      <button
        onClick={() => setShowModal(true)}
        className="bg-slate-blue text-white px-4 py-2 rounded hover:bg-slate-blue/90"
      >
        Open Style Editor
      </button>

      {showModal && (
        <StyleModalPage onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
