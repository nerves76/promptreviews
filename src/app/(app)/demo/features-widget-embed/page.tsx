"use client";

/**
 * Features Comparison Widget - Embed Version
 *
 * Clean embed version without demo content for iframe embedding
 * Sends height to parent window via postMessage for iframe auto-resize
 */

import { useEffect, useState } from 'react';
import FeaturesComparisonWidget from '@/components/marketing/FeaturesComparisonWidget';

export default function FeaturesWidgetEmbed() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    let lastHeight = 0;

    // Send height to parent window for iframe resizing
    const sendHeight = () => {
      const body = document.body;
      const html = document.documentElement;
      const height = Math.max(
        body.scrollHeight,
        body.offsetHeight,
        html.clientHeight,
        html.scrollHeight,
        html.offsetHeight
      );

      // Only send if height actually changed
      if (Math.abs(height - lastHeight) > 5) {
        lastHeight = height;
        window.parent.postMessage(
          { type: 'features-widget-resize', height },
          '*'
        );
      }
    };

    // Debounced version for resize events
    let resizeTimeout: NodeJS.Timeout;
    const debouncedSendHeight = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(sendHeight, 250);
    };

    // Send height multiple times to catch all rendering stages
    setTimeout(sendHeight, 100);
    setTimeout(sendHeight, 500);
    setTimeout(sendHeight, 1000);
    setTimeout(sendHeight, 2000);

    // Send height on window resize with debounce
    window.addEventListener('resize', debouncedSendHeight);
    window.addEventListener('load', sendHeight);

    return () => {
      window.removeEventListener('resize', debouncedSendHeight);
      window.removeEventListener('load', sendHeight);
      clearTimeout(resizeTimeout);
    };
  }, [isClient]);

  if (!isClient) {
    return null;
  }

  return (
    <>
      <style jsx global>{`
        html, body {
          overflow: hidden;
        }
      `}</style>
      <div className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <FeaturesComparisonWidget />
        </div>
      </div>
    </>
  );
}
