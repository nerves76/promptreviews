/**
 * Root layout component with Sentry integration and Google Analytics
 * Canonical root at app/layout.tsx; segment layouts under (app) should not define html/body.
 */

import "./globals.css";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import ClientRoot from "./ClientRoot";
import AppMain from "./(app)/components/AppMain";
import GoogleAnalytics from "./(app)/components/GoogleAnalytics";
import { Providers } from "@/components/Providers";
import BodyWrapper from "./(app)/components/BodyWrapper";
import { inter, fontVariables } from "./fonts";
import IconSpriteInjector from "./(app)/components/IconSpriteInjector";
import GlobalLocalStorageMigration from "./(app)/components/GlobalLocalStorageMigration";
import { GlobalRefreshMonitor } from "./(app)/components/GlobalRefreshMonitor";
import { UltimateRefreshDebugger } from "./(app)/components/UltimateRefreshDebugger";
import { NavigationDebugger } from "./(app)/components/NavigationDebugger";

const enableDebugTools =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_REFRESH_DEBUG === "true";

export const metadata: Metadata = {
  title: "PromptReviews - Get More Reviews",
  description:
    "Power your business with the voice of your customers. Collect authentic, keyword-rich reviews that boost your visibility online.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <GoogleAnalytics />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
        <link rel="prefetch" href="/emojis/excellent.svg" />
        <link rel="prefetch" href="/emojis/satisfied.svg" />
        <link rel="prefetch" href="/emojis/neutral.svg" />
        <link rel="prefetch" href="/emojis/unsatisfied.svg" />
        <link rel="prefetch" href="/emojis/frustrated.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta httpEquiv="x-dns-prefetch-control" content="on" />
      </head>
      <body className={`${fontVariables} font-sans min-h-screen`} suppressHydrationWarning>
        <Providers>
          <BodyWrapper>
            <ClientRoot>
              <IconSpriteInjector />
              <GlobalLocalStorageMigration />
              <GlobalRefreshMonitor />
              {enableDebugTools && <UltimateRefreshDebugger />}
              {enableDebugTools && <NavigationDebugger />}
              <AppMain>{children}</AppMain>
            </ClientRoot>
          </BodyWrapper>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
