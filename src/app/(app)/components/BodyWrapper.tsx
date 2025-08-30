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
  
  useEffect(() => {
    // Only modify styles, not classes to avoid hydration issues
    if (isEmbed) {
      // Set transparent background for embeds
      document.body.style.background = 'transparent';
      document.documentElement.style.background = 'transparent';
      // Remove min-height for embeds
      document.body.style.minHeight = 'auto';
    } else {
      // Apply gradient background for non-embed pages with !important to override any other styles
      document.body.style.setProperty('background', 'linear-gradient(to bottom, rgb(82, 125, 231) 0%, rgb(120, 100, 200) 50%, rgb(145, 74, 174) 100%) fixed', 'important');
      document.body.style.setProperty('background-attachment', 'fixed', 'important');
      document.documentElement.style.setProperty('background-color', 'rgb(82, 125, 231)', 'important');
      document.body.style.setProperty('min-height', '100vh', 'important');
    }
  }, [pathname, isEmbed]);
  
  return <>{children}</>;
}