import "../globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PromptReviews - Public Prompt Page",
  description: "Public review request page",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      'max-video-preview': -1,
      'max-image-preview': 'none',
      'max-snippet': -1,
    },
  },
  other: {
    'Referrer-Policy': 'no-referrer',
  },
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
