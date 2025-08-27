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
      // Remove inline styles to let CSS handle the gradient
      document.body.style.removeProperty('background');
      document.documentElement.style.removeProperty('background');
      document.body.style.removeProperty('min-height');
    }
  }, [pathname, isEmbed]);
  
  return <>{children}</>;
}