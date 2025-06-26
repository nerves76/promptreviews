/**
 * Root layout component with Sentry integration and Google Analytics
 * This layout initializes Sentry for global error tracking and GA4 for analytics
 */

import "./globals.css";
import type { Metadata } from "next";
import { Inter, Roboto, Open_Sans, Montserrat, Poppins } from "next/font/google";
import ClientRoot from "./ClientRoot";
import AppMain from "./components/AppMain";
import GoogleAnalytics from "./components/GoogleAnalytics";

// Initialize Sentry for server-side error tracking
import * as Sentry from '@sentry/nextjs';

// Optimized font loading - only essential fonts
const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter'
});

const roboto = Roboto({ 
  subsets: ["latin"], 
  weight: ["400", "700"],
  display: 'swap',
  variable: '--font-roboto'
});

const openSans = Open_Sans({ 
  subsets: ["latin"], 
  weight: ["400", "700"],
  display: 'swap',
  variable: '--font-open-sans'
});

const montserrat = Montserrat({ 
  subsets: ["latin"], 
  weight: ["400", "700"],
  display: 'swap',
  variable: '--font-montserrat'
});

const poppins = Poppins({ 
  subsets: ["latin"], 
  weight: ["400", "700"],
  display: 'swap',
  variable: '--font-poppins'
});

export const metadata: Metadata = {
  title: "PromptReviews - AI Review Request App",
  description: "Generate and manage review requests for your business",
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
      <body className={inter.className + " min-h-screen bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600 overscroll-x-auto"}>
        <ClientRoot>
          <AppMain>{children}</AppMain>
        </ClientRoot>
      </body>
    </html>
  );
}
