/**
 * Quote Display Component
 * Displays inspirational quotes on the dashboard
 */

'use client';

import { useState, useEffect } from 'react';
import { getRandomQuote } from '../../utils/admin';

interface QuoteDisplayProps {
  className?: string;
}

export default function QuoteDisplay({ className = '' }: QuoteDisplayProps) {
  const [quote, setQuote] = useState<{text: string, author?: string} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuote();
  }, []);

  const loadQuote = async () => {
    try {
      const randomQuote = await getRandomQuote();
      setQuote(randomQuote);
    } catch (error) {
      console.error('Error loading quote:', error);
    } finally {
      setLoading(false);
    }
  };

  // Don't render if no quote or loading
  if (loading || !quote) {
    return null;
  }

  return (
    <div className={`bg-gradient-to-r from-slateblue/5 to-slateblue/10 rounded-lg p-6 border border-slateblue/20 ${className}`}>
      <div className="text-center">
        <div className="mb-3">
          <svg 
            className="h-8 w-8 text-slateblue mx-auto" 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
          </svg>
        </div>
        <blockquote className="text-lg font-medium text-gray-900 mb-2">
          "{quote.text}"
        </blockquote>
        {quote.author && (
          <cite className="text-sm text-gray-600">
            — {quote.author}
          </cite>
        )}
      </div>
    </div>
  );
} 