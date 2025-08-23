/**
 * Quote Display Component
 * Displays quotes on the dashboard with navigation arrows and optional buttons
 */

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/auth/providers/supabase';
import { getAllActiveQuotes } from '../../auth/utils/admin';
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
      {/* Navigation Arrows - Desktop: further outside, Mobile: below */}
      <button
        onClick={previousQuote}
        className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-8 md:-translate-x-20 p-2.5 text-white/90 hover:text-white transition-all duration-200 z-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg hover:bg-white/15 hover:scale-105 hidden md:block"
        aria-label="Previous quote"
      >
                    <Icon name="FaChevronLeft" className="h-5 w-5" size={20} />
      </button>
      <button
        onClick={nextQuote}
        className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-8 md:translate-x-20 p-2.5 text-white/90 hover:text-white transition-all duration-200 z-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg hover:bg-white/15 hover:scale-105 hidden md:block"
        aria-label="Next quote"
      >
                    <Icon name="FaChevronRight" className="h-5 w-5" size={20} />
      </button>
      
      {/* Mobile Navigation - Below the quote */}
      <div className="flex md:hidden justify-center gap-4 absolute -bottom-16 left-1/2 transform -translate-x-1/2">
        <button
          onClick={previousQuote}
          className="p-2.5 text-white/90 hover:text-white transition-all duration-200 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg hover:bg-white/15"
          aria-label="Previous quote"
        >
          <Icon name="FaChevronLeft" className="h-5 w-5" size={20} />
        </button>
        <button
          onClick={nextQuote}
          className="p-2.5 text-white/90 hover:text-white transition-all duration-200 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg hover:bg-white/15"
          aria-label="Next quote"
        >
          <Icon name="FaChevronRight" className="h-5 w-5" size={20} />
        </button>
      </div>

      {/* Quote Box - Enhanced glassmorphic styling */}
      <div className="relative backdrop-blur-xl bg-white/10 border border-white/30 rounded-2xl p-8 shadow-lg w-full md:min-w-[800px] md:max-w-[800px] before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none overflow-hidden">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-white/5 pointer-events-none"></div>
        
        <div className="relative text-center z-10">
          {/* Quote Text */}
          <blockquote className="text-xl font-medium text-white/95 mb-3 tracking-wide leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
            "{currentQuote.text}"
          </blockquote>

          {/* Author */}
          {currentQuote.author && (
            <cite className="block text-sm text-white/75 mb-3 font-light">
              — {currentQuote.author}
            </cite>
          )}

          {/* Optional Button/Link */}
          {currentQuote.button_text && currentQuote.button_url && (
            <div className="mt-5">
              <a
                href={currentQuote.button_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-5 py-2.5 bg-white/90 hover:bg-white text-slate-blue text-sm font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 backdrop-blur-sm"
              >
                {currentQuote.button_text}
              </a>
            </div>
          )}

          {/* Quote Counter - More subtle styling */}
          <div className="mt-5 text-xs text-white/50 font-light">
            {currentIndex + 1} of {quotes.length}
          </div>
        </div>
      </div>
    </div>
  );
} 