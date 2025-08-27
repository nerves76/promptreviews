/**
 * Auth Layout Component
 * This layout provides the structure for authentication pages
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication - PromptReviews",
  description: "Sign in or sign up for PromptReviews",
};

export default function AuthLayout({
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
