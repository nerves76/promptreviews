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

// Sentry is initialized in instrumentation.ts - no need to import here

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
        
        {/* ⚡ PERFORMANCE: Resource preloading and optimization hints */}
        
        {/* Preconnect to external domains for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        
        {/* DNS prefetch for external services */}
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
        
        {/* Preload critical Inter font variations */}
        <link
          rel="preload"
          href="https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2"
          as="font"
          type="font/woff2"
          crossOrigin=""
        />
        
        {/* Preload critical CSS for faster rendering */}
        <link rel="preload" href="/globals.css" as="style" />
        
        {/* Prefetch widget assets for faster embedding */}
        <link rel="prefetch" href="/public/emojis/delighted.svg" />
        <link rel="prefetch" href="/public/emojis/happy.svg" />
        <link rel="prefetch" href="/public/emojis/neutral.svg" />
        <link rel="prefetch" href="/public/emojis/sad.svg" />
        <link rel="prefetch" href="/public/emojis/angry.svg" />
        
        {/* Resource hints for performance */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta httpEquiv="x-dns-prefetch-control" content="on" />
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
