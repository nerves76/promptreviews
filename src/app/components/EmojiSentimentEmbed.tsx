"use client";

// EmojiSentimentEmbed.tsx
// This component renders a simple, embeddable emoji sentiment row with a header and clickable emojis. Designed for use in website or email embeds, it contains no extra controls or buttons.

import React, { useState } from "react";
import { EMOJI_SENTIMENT_LABELS, EMOJI_SENTIMENT_ICONS } from "./prompt-modules/emojiSentimentConfig";

/**
 * EmojiSentimentEmbed Component
 * Renders a header and a row of clickable emojis for sentiment selection.
 *
 * Props:
 * - header: string - The question or prompt to display above the emojis.
 * - headerColor: string - The color of the header text.
 * - emojiLinks: Array<{ label: string, emoji: string, url: string }> - The emojis and their links.
 * - emojiSize: number - The size (px) of each emoji.
 * - headerSize: string - The size of the header text ('sm', 'md', 'lg', 'xl').
 * - showCard: boolean - Whether to show the background card or just the content.
 */
interface EmojiSentimentEmbedProps {
  header: string;
  headerColor?: string;
  emojiLinks: Array<{ label: string; emoji: string; url: string }>;
  emojiSize?: number;
  headerSize?: "sm" | "md" | "lg" | "xl";
  showCard?: boolean;
}

const EmojiSentimentEmbed: React.FC<EmojiSentimentEmbedProps> = ({
  header,
  headerColor = "#000000",
  emojiLinks,
  emojiSize = 32,
  headerSize = "md",
  showCard = true,
}) => {
  const [showPopup, setShowPopup] = useState(false);

  // Map the emoji links to the corresponding Font Awesome icons
  const getIconForLabel = (label: string) => {
    const index = EMOJI_SENTIMENT_LABELS.indexOf(label);
    if (index !== -1) {
      return EMOJI_SENTIMENT_ICONS[index];
    }
    // Fallback to first icon if label not found
    return EMOJI_SENTIMENT_ICONS[0];
  };

  const getHeaderSizeClass = () => {
    switch (headerSize) {
      case "sm":
        return "text-base";
      case "lg":
        return "text-2xl";
      case "xl":
        return "text-3xl";
      default:
        return "text-xl";
    }
  };

  const content = (
    <>
      <div
        className={`font-bold text-center mb-4 ${getHeaderSizeClass()}`}
        style={{ color: headerColor }}
      >
        {header}
      </div>
      <div className="flex justify-center items-center gap-1 px-2 max-w-sm mx-auto pb-8">
        {emojiLinks.map((link, index) => {
          const iconConfig = getIconForLabel(link.label);
          const IconComponent = iconConfig.icon;
          
          return (
            <a
              key={index}
              href={link.url}
              className="flex flex-col items-center focus:outline-none px-2 py-1"
              style={{ textDecoration: "none" }}
            >
              <IconComponent
                className={iconConfig.color}
                size={emojiSize}
              />
              <span className="text-xs text-gray-600 mt-1">{link.label}</span>
            </a>
          );
        })}
      </div>
    </>
  );

  return (
    <div className="relative">
      {showCard ? (
        <div className="max-w-md mx-auto rounded-lg border border-gray-200 bg-white p-4 shadow-sm relative" style={{ margin: '0.5rem auto' }}>
          {content}
          {/* Prompt Reviews branding */}
          <div className="absolute bottom-4 right-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowPopup(!showPopup);
              }}
              className="w-6 h-5 text-xs font-mono rounded flex items-center justify-center transition-colors border border-gray-300 hover:border-slate-400"
              style={{ 
                fontSize: '10px', 
                backgroundColor: '#f8fafc', 
                color: '#2E4A7D'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2E4A7D';
                e.currentTarget.style.color = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.color = '#2E4A7D';
              }}
            >
              [P]
            </button>
            {showPopup && (
              <div className="absolute bottom-8 right-0 w-64 bg-white border border-gray-300 rounded-lg shadow-lg p-3 text-sm z-10">
                <div className="relative">
                  <button
                    onClick={() => setShowPopup(false)}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-gray-200 rounded-full text-xs hover:bg-gray-300 flex items-center justify-center leading-none"
                    style={{ lineHeight: '1' }}
                  >
                    ×
                  </button>
                  <p className="text-gray-700 pr-3">
                    Prompt Reviews makes writing reviews quick and easy with the help of AI. -{" "}
                    <a 
                      href="https://promptreviews.app" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      promptreviews.app
                    </a>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-md mx-auto relative" style={{ margin: '0.5rem auto' }}>
          {content}
          {/* Prompt Reviews branding for no-card version */}
          <div className="absolute bottom-4 right-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowPopup(!showPopup);
              }}
              className="w-6 h-5 text-xs font-mono rounded flex items-center justify-center transition-colors border border-gray-300 hover:border-slate-400"
              style={{ 
                fontSize: '10px', 
                backgroundColor: '#f8fafc', 
                color: '#2E4A7D'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2E4A7D';
                e.currentTarget.style.color = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.color = '#2E4A7D';
              }}
            >
              [P]
            </button>
            {showPopup && (
              <div className="absolute bottom-8 right-0 w-64 bg-white border border-gray-300 rounded-lg shadow-lg p-3 text-sm z-10">
                <div className="relative">
                  <button
                    onClick={() => setShowPopup(false)}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-gray-200 rounded-full text-xs hover:bg-gray-300 flex items-center justify-center leading-none"
                    style={{ lineHeight: '1' }}
                  >
                    ×
                  </button>
                  <p className="text-gray-700 pr-3">
                    Prompt Reviews makes writing reviews quick and easy with the help of AI. -{" "}
                    <a 
                      href="https://promptreviews.app" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      promptreviews.app
                    </a>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmojiSentimentEmbed; 