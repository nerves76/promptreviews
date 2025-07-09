/**
 * Root layout component with Sentry integration and Google Analytics
 * This layout initializes Sentry for global error tracking and GA4 for analytics
 */

import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ClientRoot from "./ClientRoot";
import AppMain from "./components/AppMain";
import GoogleAnalytics from "./components/GoogleAnalytics";
import { Providers } from "@/components/Providers";

// Initialize Sentry for server-side error tracking
import * as Sentry from '@sentry/nextjs';

// Only load Inter for the main dashboard UI - all other fonts loaded dynamically
const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter'
});

export const metadata: Metadata = {
  title: "PromptReviews - Get More Reviews",
  description: "Make it easy and fun for your customers to post reviews online. Grow your presence on traditional and AI search platforms.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <GoogleAnalytics />
      </head>
      <body 
        className={`${inter.variable} font-sans min-h-screen bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600`}
        suppressHydrationWarning={true}
      >
        <Providers>
          <ClientRoot>
            <AppMain>{children}</AppMain>
          </ClientRoot>
        </Providers>
      </body>
    </html>
  );
}
