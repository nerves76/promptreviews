'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function BodyWrapper({ 
  children
}: { 
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Check if this is a demo/embed page that should have transparent background
  const isEmbed = pathname.startsWith('/demo/') || pathname.startsWith('/embed/') || pathname === '/infographic/embed' || pathname === '/infographic-embed';

  // Check if this is a page that has its own custom gradient/background
  const isPromptPage = pathname.startsWith('/r/') || pathname.startsWith('/sow/');

  useEffect(() => {
    // Only modify styles, not classes to avoid hydration issues
    if (isEmbed) {
      // Set transparent background for embeds
      document.body.style.background = 'transparent';
      document.documentElement.style.background = 'transparent';
      // Remove min-height for embeds
      document.body.style.minHeight = 'auto';
    } else if (isPromptPage) {
      // For prompt pages, don't apply any default gradient
      // Let the prompt page component handle its own background
      document.body.style.removeProperty('background');
      document.body.style.removeProperty('background-attachment');
      document.documentElement.style.removeProperty('background-color');
      document.body.style.setProperty('min-height', '100vh');
    } else {
      // Apply gradient background for app pages (dashboard, etc) - uses CSS variable defined in globals.css
      document.body.style.setProperty('background', 'var(--app-gradient) fixed', 'important');
      document.body.style.setProperty('background-attachment', 'fixed', 'important');
      document.documentElement.style.setProperty('background-color', 'var(--gradient-top-color)', 'important');
      document.body.style.setProperty('min-height', '100vh', 'important');
    }
    
    // Cleanup function to ensure proper style reset when component unmounts
    return () => {
      // Clean up any inline styles when navigating away
      if (isPromptPage) {
        // Reset to default app gradient when leaving custom-background page
        document.body.style.removeProperty('background');
        document.body.style.removeProperty('background-attachment');
        document.documentElement.style.removeProperty('background-color');
      }
    };
  }, [pathname, isEmbed, isPromptPage]);
  
  return <>{children}</>;
}