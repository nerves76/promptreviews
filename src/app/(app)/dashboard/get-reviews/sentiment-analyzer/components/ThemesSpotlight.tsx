"use client";

import React from "react";
import { Theme } from "../types";

interface ThemesSpotlightProps {
  themes: Theme[];
}

export default function ThemesSpotlight({ themes }: ThemesSpotlightProps) {
  if (!themes || themes.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Themes Spotlight
      </h2>
      <p className="text-gray-600 mb-6">
        Key themes discovered in your customer reviews
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {themes.map((theme) => (
          <div
            key={theme.name}
            className={`
              rounded-lg border-2 p-4 transition-all hover:shadow-md
              ${
                theme.sentiment === 'strength'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-orange-50 border-orange-200'
              }
            `}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 flex-1">
                {theme.name}
              </h3>
              <span
                className={`
                  inline-block px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ml-2
                  ${
                    theme.sentiment === 'strength'
                      ? 'bg-green-200 text-green-800'
                      : 'bg-orange-200 text-orange-800'
                  }
                `}
              >
                {theme.sentiment === 'strength' ? '💪 Strength' : '📈 Improve'}
              </span>
            </div>

            {/* Mention Count */}
            <p className="text-sm text-gray-600 mb-3">
              <span className="font-medium">{theme.mentionCount}</span> mention{theme.mentionCount !== 1 ? 's' : ''}
            </p>

            {/* Supporting Quotes */}
            <div className="space-y-2">
              {theme.supportingQuotes.slice(0, 2).map((quote, index) => (
                <blockquote
                  key={quote.reviewId}
                  className={`
                    text-sm italic border-l-3 pl-3 py-1
                    ${
                      theme.sentiment === 'strength'
                        ? 'text-green-800 border-green-400'
                        : 'text-orange-800 border-orange-400'
                    }
                  `}
                >
                  "{quote.excerpt}"
                </blockquote>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
