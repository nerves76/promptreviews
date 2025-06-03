import "../globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

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
    <div className={`${inter.className} min-h-screen overscroll-x-auto`}>
      {children}
    </div>
  );
}
