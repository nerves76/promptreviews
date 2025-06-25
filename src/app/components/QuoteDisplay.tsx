/**
 * Quote Display Component
 * Displays quotes on the dashboard with navigation arrows and optional buttons
 */

'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { getAllActiveQuotes } from '../../utils/admin';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

// Use the same Supabase client pattern as other components
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface QuoteDisplayProps {
  className?: string;
}

interface QuoteData {
  id: string;
  text: string;
  author?: string;
  button_text?: string;
  button_url?: string;
  created_at: string;
}

export default function QuoteDisplay({ className = '' }: QuoteDisplayProps) {
  const [quotes, setQuotes] = useState<QuoteData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    try {
      const activeQuotes = await getAllActiveQuotes(supabase);
      setQuotes(activeQuotes);
      if (activeQuotes.length > 0) {
        // Start with a random quote
        setCurrentIndex(Math.floor(Math.random() * activeQuotes.length));
      }
    } catch (error) {
      console.error('Error loading quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextQuote = () => {
    if (quotes.length > 1) {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % quotes.length);
    }
  };

  const previousQuote = () => {
    if (quotes.length > 1) {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + quotes.length) % quotes.length);
    }
  };

  // Don't render if no quotes or loading
  if (loading || quotes.length === 0) {
    return null;
  }

  const currentQuote = quotes[currentIndex];

  return (
    <div className={`border-2 border-white rounded-lg p-6 shadow-lg relative ${className}`}>
      <div className="text-center">
        {/* Navigation Arrows - Always show for testing */}
        <button
          onClick={previousQuote}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 text-white hover:text-white/80 transition-colors z-10 bg-black/20 rounded"
          aria-label="Previous quote"
        >
          <FaChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={nextQuote}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-white hover:text-white/80 transition-colors z-10 bg-black/20 rounded"
          aria-label="Next quote"
        >
          <FaChevronRight className="h-5 w-5" />
        </button>

        {/* Quote Text */}
        <blockquote className="text-lg font-medium text-white mb-2 px-12">
          "{currentQuote.text}"
        </blockquote>

        {/* Author */}
        {currentQuote.author && (
          <cite className="text-sm text-white/80 mb-3">
            — {currentQuote.author}
          </cite>
        )}

        {/* Optional Button/Link */}
        {currentQuote.button_text && currentQuote.button_url && (
          <div className="mt-4">
            <a
              href={currentQuote.button_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-white text-slate-blue text-sm font-medium rounded hover:bg-white/90 transition-colors"
            >
              {currentQuote.button_text}
            </a>
          </div>
        )}

        {/* Quote Counter - Always show for debugging */}
        <div className="mt-4 text-xs text-white/60">
          {currentIndex + 1} of {quotes.length} quotes
        </div>
      </div>
    </div>
  );
} 