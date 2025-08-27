import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PromptReviews Infographic",
  description: "How PromptReviews helps businesses get more reviews",
};

// Minimal root layout for embeds - NO globals.css import!
export default function EmbedRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <style>{`
          body {
            margin: 0;
            padding: 0;
            background: transparent;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}