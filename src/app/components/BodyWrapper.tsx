'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function BodyWrapper({ 
  children,
  fontVariables 
}: { 
  children: React.ReactNode;
  fontVariables: string;
}) {
  const pathname = usePathname();
  
  // Check if this is a demo/embed page that should have transparent background
  const isEmbed = pathname.startsWith('/demo/') || pathname.startsWith('/embed/');
  
  useEffect(() => {
    // Apply or remove background classes based on route
    if (isEmbed) {
      document.body.className = `${fontVariables} font-sans`;
    } else {
      document.body.className = `${fontVariables} font-sans min-h-screen bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600`;
    }
  }, [pathname, isEmbed, fontVariables]);
  
  return <>{children}</>;
}