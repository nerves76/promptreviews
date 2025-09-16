import { Suspense } from "react";
import CreatePromptPageClient from "./CreatePromptPageClient";
import AppLoader from "@/app/(app)/components/AppLoader";

export default function CreatePromptPage() {
  return (
    <Suspense fallback={<AppLoader /> }>
      <CreatePromptPageClient />
    </Suspense>
  );
}
