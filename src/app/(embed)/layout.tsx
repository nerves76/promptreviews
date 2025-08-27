import type { Metadata } from "next";
// Import only the Tailwind base styles, not the full globals.css with gradient
import '../globals-embed.css';

export const metadata: Metadata = {
  title: "PromptReviews Infographic",
  description: "How PromptReviews helps businesses get more reviews",
};

// Minimal root layout for embeds - uses minimal CSS without gradient
export default function EmbedRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: 'transparent' }}>
        {children}
      </body>
    </html>
  );
}