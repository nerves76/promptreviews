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
      // Apply gradient background for non-embed pages
      document.body.style.background = 'linear-gradient(to bottom, rgb(82, 125, 231) 0%, rgb(120, 100, 200) 50%, rgb(145, 74, 174) 100%) fixed';
      document.documentElement.style.backgroundColor = 'rgb(82, 125, 231)';
      document.body.style.minHeight = '100vh';
    }
  }, [pathname, isEmbed]);
  
  return <>{children}</>;
}