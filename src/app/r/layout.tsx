import "../globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PromptReviews - Public Prompt Page",
  description: "Public review request page",
};

export default function PublicPromptLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
