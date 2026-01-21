"use client";

/**
 * Features Comparison Widget - Embed Version
 *
 * Clean embed version without demo content for iframe embedding
 * Sends height to parent window via postMessage for iframe auto-resize
 */

import { useEffect, useState, useRef } from 'react';
import FeaturesComparisonWidget from '@/components/marketing/FeaturesComparisonWidget';

export default function FeaturesWidgetEmbed() {
  const [isClient, setIsClient] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    let lastHeight = 0;

    // Send height to parent window for iframe resizing
    const sendHeight = () => {
      const container = containerRef.current;
      if (!container) return;

      // Get the full document height to handle all content
      const bodyHeight = document.body.scrollHeight;
      const containerHeight = container.scrollHeight;
      const height = Math.ceil(Math.max(bodyHeight, containerHeight));

      // Only send if height actually changed (threshold of 5px)
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
      resizeTimeout = setTimeout(sendHeight, 100);
    };

    // Send height multiple times to catch all rendering stages
    setTimeout(sendHeight, 100);
    setTimeout(sendHeight, 300);
    setTimeout(sendHeight, 500);
    setTimeout(sendHeight, 1000);

    // Use ResizeObserver for reliable height detection on content changes
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      resizeObserver = new ResizeObserver(debouncedSendHeight);
      resizeObserver.observe(containerRef.current);
      // Also observe body for any layout shifts
      resizeObserver.observe(document.body);
    }

    // Send height on window resize
    window.addEventListener('resize', debouncedSendHeight);
    window.addEventListener('load', sendHeight);

    return () => {
      window.removeEventListener('resize', debouncedSendHeight);
      window.removeEventListener('load', sendHeight);
      clearTimeout(resizeTimeout);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
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
      <div ref={containerRef} className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <FeaturesComparisonWidget />
        </div>
      </div>
    </>
  );
}
