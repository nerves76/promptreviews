/**
 * Quote Display Component
 * Displays quotes on the dashboard with navigation arrows and optional buttons
 */

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabaseClient';
import { getAllActiveQuotes } from '../../utils/admin';
import Icon from '@/components/Icon';

// Using singleton Supabase client from supabaseClient.ts

// Simple caching for quotes to improve performance
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let quotesCache: any[] | null = null;
let cacheTimestamp = 0;

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

export default function QuoteDisplay({
  className = '' 
}: QuoteDisplayProps) {
  const supabase = createClient();
  const [quotes, setQuotes] = useState<QuoteData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    try {
      const now = Date.now();
      
      // Check if we have valid cached quotes
      if (quotesCache && (now - cacheTimestamp) < CACHE_DURATION) {
        setQuotes(quotesCache);
        if (quotesCache.length > 0) {
          setCurrentIndex(Math.floor(Math.random() * quotesCache.length));
        }
        setLoading(false);
        return;
      }

      // Fetch fresh quotes if cache is invalid or expired
      const activeQuotes = await getAllActiveQuotes(supabase);
      
      // Update cache
      quotesCache = activeQuotes;
      cacheTimestamp = now;
      
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
    <div className={`relative ${className}`}>
      {/* Navigation Arrows - Positioned outside the quote box */}
      <button
        onClick={previousQuote}
        className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-8 md:-translate-x-12 p-2 text-white hover:text-white/80 transition-colors z-10 bg-black/20 rounded"
        aria-label="Previous quote"
      >
                    <Icon name="FaChevronLeft" className="h-5 w-5" size={20} />
      </button>
      <button
        onClick={nextQuote}
        className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-8 md:translate-x-12 p-2 text-white hover:text-white/80 transition-colors z-10 bg-black/20 rounded"
        aria-label="Next quote"
      >
                    <Icon name="FaChevronRight" className="h-5 w-5" size={20} />
      </button>

      {/* Quote Box */}
      <div className="border-2 border-white rounded-lg p-6 shadow-lg w-full md:min-w-[800px] md:max-w-[800px]">
        <div className="text-center">
          {/* Quote Text */}
          <blockquote className="text-xl font-medium text-white mb-2 tracking-wide">
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
    </div>
  );
} 