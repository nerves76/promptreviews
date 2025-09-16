/**
 * Root layout component with Sentry integration and Google Analytics
 * Canonical root at app/layout.tsx; segment layouts under (app) should not define html/body.
 */

import "./globals.css";
import type { Metadata } from "next";
import ClientRoot from "./ClientRoot";
import AppMain from "./(app)/components/AppMain";
import GoogleAnalytics from "./(app)/components/GoogleAnalytics";
import { Providers } from "@/components/Providers";
import BodyWrapper from "./(app)/components/BodyWrapper";
import { inter, fontVariables } from "./fonts";
import IconSpriteInjector from "./(app)/components/IconSpriteInjector";
import GlobalLocalStorageMigration from "./(app)/components/GlobalLocalStorageMigration";

export const metadata: Metadata = {
  title: "PromptReviews - Get More Reviews",
  description:
    "Make it easy and fun for your customers to post reviews online. Grow your presence on traditional and AI search platforms.",
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
              <AppMain>{children}</AppMain>
            </ClientRoot>
          </BodyWrapper>
        </Providers>
      </body>
    </html>
  );
}

