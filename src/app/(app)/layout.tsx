/**
 * Root layout component with Sentry integration and Google Analytics
 * This layout initializes Sentry for global error tracking and GA4 for analytics
 */

import "../globals.css";
import type { Metadata } from "next";
import ClientRoot from "../ClientRoot";
import AppMain from "./components/AppMain";
import GoogleAnalytics from "./components/GoogleAnalytics";
import { Providers } from "@/components/Providers";
import BodyWrapper from "./components/BodyWrapper";
import { inter, fontVariables } from "../fonts";
import { GlobalRefreshMonitor } from "./components/GlobalRefreshMonitor";
import { NavigationDebugger } from "./components/NavigationDebugger";
import { RefreshDebugger } from "./components/RefreshDebugger";
import { UltimateRefreshDebugger } from "./components/UltimateRefreshDebugger";
import IconSpriteInjector from "./components/IconSpriteInjector";

// Sentry is initialized in instrumentation.ts - no need to import here

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <GoogleAnalytics />
        
        {/* ⚡ PERFORMANCE: Resource preloading and optimization hints */}
        
        {/* Preconnect to external domains for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        
        {/* DNS prefetch for external services */}
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
        
        {/* Prefetch widget assets for faster embedding */}
        <link rel="prefetch" href="/emojis/excellent.svg" />
        <link rel="prefetch" href="/emojis/satisfied.svg" />
        <link rel="prefetch" href="/emojis/neutral.svg" />
        <link rel="prefetch" href="/emojis/unsatisfied.svg" />
        <link rel="prefetch" href="/emojis/frustrated.svg" />
        
        {/* Resource hints for performance */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta httpEquiv="x-dns-prefetch-control" content="on" />
      </head>
      <body 
        className={`${fontVariables} font-sans min-h-screen`}
        suppressHydrationWarning={true}
      >
        <Providers>
          <BodyWrapper>
            {process.env.NODE_ENV === 'development' && (
              <>
                <GlobalRefreshMonitor />
                <NavigationDebugger />
                <RefreshDebugger />
                <UltimateRefreshDebugger />
              </>
            )}
            <ClientRoot>
              <IconSpriteInjector />
              <AppMain>{children}</AppMain>
            </ClientRoot>
          </BodyWrapper>
        </Providers>
      </body>
    </html>
  );
}
