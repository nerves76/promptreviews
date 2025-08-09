import { Suspense } from "react";
import CreatePromptPageClient from "./CreatePromptPageClient";
import FiveStarSpinner from "@/app/components/FiveStarSpinner";

export default function CreatePromptPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center">
          <FiveStarSpinner size={24} />
        </div>
      }
    >
      <CreatePromptPageClient />
    </Suspense>
  );
}
