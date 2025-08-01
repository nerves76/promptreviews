import "../globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter'
});

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
    <div
        className={`${inter.className} min-h-screen bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600`}
      >
        {children}
    </div>
  );
}
