"use client";
import { useAuthGuard } from "@/utils/authGuard";
import CreatePromptPageClient from "../../create-prompt-page/CreatePromptPageClient";

export default function CreatePromptPage() {
  useAuthGuard();

  return <CreatePromptPageClient markOnboardingComplete={true} />;
} 