"use client";
import React, { useState, useEffect } from "react";
import { useAuthGuard } from "@/utils/authGuard";
import { supabase } from "@/utils/supabaseClient";
import { markTaskAsCompleted } from "@/utils/onboardingTasks";
import CreatePromptPageClient from "./CreatePromptPageClient";

export default function CreatePromptPage() {
  useAuthGuard();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showTypeModal, setShowTypeModal] = useState(false);

  // Mark create prompt page task as completed when user visits this page
  useEffect(() => {
    const markCreatePromptTaskComplete = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await markTaskAsCompleted(user.id, "create-prompt-page");
        }
      } catch (error) {
        console.error("Error marking create prompt task as complete:", error);
      }
    };

    markCreatePromptTaskComplete();
  }, []);

  return <CreatePromptPageClient />;
} 