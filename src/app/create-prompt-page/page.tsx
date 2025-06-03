import { Suspense } from "react";
import CreatePromptPageClient from "./CreatePromptPageClient";
import AppLoader from "@/app/components/AppLoader";

export default function CreatePromptPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center">
          <AppLoader />
        </div>
      }
    >
      <CreatePromptPageClient />
    </Suspense>
  );
}
