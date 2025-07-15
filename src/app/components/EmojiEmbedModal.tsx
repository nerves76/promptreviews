"use client";

import React, { useState } from "react";
import { EMOJI_SENTIMENT_LABELS } from "./prompt-modules/emojiSentimentConfig";
import EmojiSentimentEmbed from "./EmojiSentimentEmbed";
import { FaSmile } from "react-icons/fa";

interface EmojiEmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  question?: string;
}

/**
 * EmojiEmbedModal Component
 * 
 * A modal that provides emoji sentiment embed code generation.
 * Used by the EmojiEmbedButton for quick access on live pages.
 */
const EmojiEmbedModal: React.FC<EmojiEmbedModalProps> = ({
  isOpen,
  onClose,
  slug,
  question = "How was your experience?"
}) => {
  const [emojiSize, setEmojiSize] = useState<'xs' | 'sm' | 'md'>('sm');
  const [headerSize, setHeaderSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [headerColor, setHeaderColor] = useState<string>('#000000');
  const [showCard, setShowCard] = useState<boolean>(true);
  const [copyStatus, setCopyStatus] = useState('');

  const getFontAwesomeSVGPath = (label: string) => {
    switch (label) {
      case "Excellent":
        return "M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zM90.4 183.6c6.7-17.6 26.7-26.7 44.9-21.9l7.1 1.9 2-7.1c5-18.1 22.8-30.9 41.5-27.9 21.4 3.4 34.4 24.2 28.8 44.5L195.3 243c-1.2 4.5-5.9 7.2-10.5 6l-70.2-18.2c-20.4-5.4-31.9-27-24.2-47.2zM248 432c-60.6 0-134.5-38.3-143.8-93.3-2-11.8 9.2-21.5 20.7-17.9C155.1 330.5 200 336 248 336s92.9-5.5 123.1-15.2c11.4-3.6 22.6 6.1 20.7 17.9-9.3 55-83.2 93.3-143.8 93.3zm133.4-201.3l-70.2 18.2c-4.5 1.2-9.2-1.5-10.5-6L281.3 173c-5.6-20.3 7.4-41.1 28.8-44.5 18.6-3 36.4 9.8 41.5 27.9l2 7.1 7.1-1.9c18.2-4.7 38.2 4.3 44.9 21.9 7.7 20.3-3.8 41.9-24.2 47.2z";
      case "Satisfied":
        return "M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm80 168c17.7 0 32 14.3 32 32s-14.3 32-32 32-32-14.3-32-32 14.3-32 32-32zm-160 0c17.7 0 32 14.3 32 32s-14.3 32-32 32-32-14.3-32-32 14.3-32 32-32zm194.8 170.2C334.3 380.4 292.5 400 248 400s-86.3-19.6-114.8-53.8c-13.6-16.3 11-36.7 24.6-20.5 22.4 26.9 55.2 42.2 90.2 42.2s67.8-15.4 90.2-42.2c13.4-16.2 38.1 4.2 24.6 20.5z";
      case "Neutral":
        return "M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm-80 168c17.7 0 32 14.3 32 32s-14.3 32-32 32-32-14.3-32-32 14.3-32 32-32zm176 192H152c-21.2 0-21.2-32 0-32h192c21.2 0 21.2 32 0 32zm-16-128c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32z";
      case "Unsatisfied":
        return "M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm80 168c17.7 0 32 14.3 32 32s-14.3 32-32 32-32-14.3-32-32 14.3-32 32-32zm-160 0c17.7 0 32 14.3 32 32s-14.3 32-32 32-32-14.3-32-32 14.3-32 32-32zm170.2 218.2C315.8 367.4 282.9 352 248 352s-67.8 15.4-90.2 42.2c-13.5 16.3-38.1-4.2-24.6-20.5C161.7 339.6 203.6 320 248 320s86.3 19.6 114.7 53.8c13.6 16.2-11.1 36.6-24.5 20.4z";
      case "Frustrated":
        return "M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zM136 240c0-9.3 4.1-17.5 10.5-23.4l-31-9.3c-8.5-2.5-13.3-11.5-10.7-19.9 2.5-8.5 11.4-13.2 19.9-10.7l80 24c8.5 2.5 13.3 11.5 10.7 19.9-2.1 6.9-8.4 11.4-15.3 11.4-.5 0-1.1-.2-1.7-.2.7 2.7 1.7 5.3 1.7 8.2 0 17.7-14.3 32-32 32S136 257.7 136 240zm168 154.2c-27.8-33.4-84.2-33.4-112.1 0-13.5 16.3-38.2-4.2-24.6-20.5 20-24 49.4-37.8 80.6-37.8s60.6 13.8 80.6 37.8c13.8 16.5-11.1 36.6-24.5 20.5zm76.6-186.9l-31 9.3c6.3 5.8 10.5 14.1 10.5 23.4 0 17.7-14.3 32-32 32s-32-14.3-32-32c0-2.9.9-5.6 1.7-8.2-.6.1-1.1.2-1.7.2-6.9 0-13.2-4.5-15.3-11.4-2.5-8.5 2.3-17.4 10.7-19.9l80-24c8.4-2.5 17.4 2.3 19.9 10.7 2.5 8.5-2.3 17.4-10.8 19.9z";
      default:
        return "M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm80 168c17.7 0 32 14.3 32 32s-14.3 32-32 32-32-14.3-32-32 14.3-32 32-32zm-160 0c17.7 0 32 14.3 32 32s-14.3 32-32 32-32-14.3-32-32 14.3-32 32-32zm194.8 170.2C334.3 380.4 292.5 400 248 400s-86.3-19.6-114.8-53.8c-13.6-16.3 11-36.7 24.6-20.5 22.4 26.9 55.2 42.2 90.2 42.2s67.8-15.4 90.2-42.2c13.4-16.2 38.1 4.2 24.6 20.5z";
    }
  };

  const generateEmbedHTML = () => {
    const emojiSizePx = emojiSize === 'xs' ? '24px' : emojiSize === 'sm' ? '32px' : '48px';
    const fontSize = headerSize === 'sm' ? '1rem' : headerSize === 'md' ? '1.25rem' : '1.5rem';
    
    const brandingButton = `
    <div style="position:absolute;bottom:16px;right:8px;">
      <a href="https://promptreviews.app" target="_blank" style="width:24px;height:20px;font-size:10px;font-family:monospace;border-radius:4px;display:flex;align-items:center;justify-content:center;border:1px solid #d1d5db;background-color:#f8fafc;color:#2E4A7D;line-height:1;text-decoration:none;" title="Powered by Prompt Reviews - Make writing reviews quick and easy with AI">[P]</a>
    </div>`;
    
    if (showCard) {
      return `<div style="max-width:450px;margin:0.5rem auto;border-radius:0.5rem;border:1px solid #e5e7eb;background:#fff;padding:1rem;box-shadow:0 1px 3px rgba(0,0,0,0.1);position:relative;">
  <div style="font-weight:bold;text-align:center;margin-bottom:1rem;font-size:${fontSize};color:${headerColor || '#000000'};">${question}</div>
  <div style="text-align:center;padding:0.5rem 0.5rem 2rem 0.5rem;">
    <table style="margin:0 auto;border-collapse:separate;border-spacing:12px;">
      <tr>
        ${EMOJI_SENTIMENT_LABELS.map((label, idx) => {
          const url = window.location.origin + `/r/${slug}?emoji_sentiment=${label.toLowerCase()}&source=embed`;
          const iconColors = ['#f472b6', '#22c55e', '#9ca3af', '#f97316', '#ef4444'];
          const svgPath = getFontAwesomeSVGPath(label);
          return `<td style="text-align:center;vertical-align:top;"><a href="${url}" target="_blank" style="text-decoration:none;display:inline-block;text-align:center;"><svg width="${emojiSizePx}" height="${emojiSizePx}" viewBox="0 0 496 512" fill="currentColor" style="color: ${iconColors[idx]};display:block;margin:0 auto;"><path d="${svgPath}"></path></svg><span style="font-size:.75rem;color:#666;margin-top:.25rem;display:block;">${label}</span></a></td>`;
        }).join('')}
      </tr>
    </table>
  </div>
  ${brandingButton}
</div>`;
    } else {
      return `<div style="max-width:450px;margin:0.5rem auto;position:relative;">
  <div style="font-weight:bold;text-align:center;margin-bottom:1rem;font-size:${fontSize};color:${headerColor || '#000000'};">${question}</div>
  <div style="text-align:center;padding:0.5rem 0.5rem 2rem 0.5rem;">
    <table style="margin:0 auto;border-collapse:separate;border-spacing:12px;">
      <tr>
        ${EMOJI_SENTIMENT_LABELS.map((label, idx) => {
          const url = window.location.origin + `/r/${slug}?emoji_sentiment=${label.toLowerCase()}&source=embed`;
          const iconColors = ['#f472b6', '#22c55e', '#9ca3af', '#f97316', '#ef4444'];
          const svgPath = getFontAwesomeSVGPath(label);
          return `<td style="text-align:center;vertical-align:top;"><a href="${url}" target="_blank" style="text-decoration:none;display:inline-block;text-align:center;"><svg width="${emojiSizePx}" height="${emojiSizePx}" viewBox="0 0 496 512" fill="currentColor" style="color: ${iconColors[idx]};display:block;margin:0 auto;"><path d="${svgPath}"></path></svg><span style="font-size:.75rem;color:#666;margin-top:.25rem;display:block;">${label}</span></a></td>`;
        }).join('')}
      </tr>
    </table>
  </div>
  ${brandingButton}
</div>`;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-12 my-12 max-h-[80vh] relative">
        {/* Standardized red X close button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200 flex items-center justify-center hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 z-50"
          style={{ width: 48, height: 48 }}
          aria-label="Close modal"
        >
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Scrollable content area */}
        <div className="p-6 overflow-y-auto max-h-[80vh]">
          <div className="mb-2">
            <h2 className="text-xl font-semibold text-slate-700 flex items-center gap-2">
              <FaSmile className="text-slate-600" />
              Emoji Sentiment Embed
            </h2>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Add Emoji Sentiment Flow to your website, newsletter, or auto-responders
            </p>
          </div>

          <div className="mb-4 flex gap-4 items-center flex-wrap">
            <label className="font-medium">Emoji size:</label>
            <select value={emojiSize} onChange={e => setEmojiSize(e.target.value as any)} className="border rounded px-2 py-1">
              <option value="xs">Small</option>
              <option value="sm">Medium</option>
              <option value="md">Large</option>
            </select>
            
            <label className="font-medium">Header size:</label>
            <select value={headerSize} onChange={e => setHeaderSize(e.target.value as any)} className="border rounded px-2 py-1">
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
            </select>

            <label className="font-medium">Header color:</label>
            <input 
              type="color" 
              value={headerColor} 
              onChange={(e) => setHeaderColor(e.target.value)}
              className="w-8 h-8 border rounded cursor-pointer"
            />
            
            <label className="flex items-center gap-2 font-medium">
              <input 
                type="checkbox" 
                checked={showCard} 
                onChange={(e) => setShowCard(e.target.checked)}
                className="rounded"
              />
              Show background card
            </label>
          </div>

          {/* Live Preview */}
          <div className="mb-4">
            <EmojiSentimentEmbed
              header={question}
              headerColor={headerColor}
              emojiLinks={EMOJI_SENTIMENT_LABELS.map((label, idx) => {
                const url = window.location.origin + `/r/${slug}?emoji_sentiment=${label.toLowerCase()}&source=embed`;
                return {
                  label,
                  emoji: "😊",
                  url,
                };
              })}
              emojiSize={emojiSize === 'xs' ? 24 : emojiSize === 'sm' ? 32 : 48}
              headerSize={headerSize}
              showCard={showCard}
            />
          </div>

          {/* HTML Code Box */}
          <div className="mb-2">
            <label className="font-medium mb-1 block">Embed HTML:</label>
            <textarea
              id="emoji-embed-html-modal"
              className="w-full border rounded p-2 font-mono text-xs bg-white"
              rows={8}
              value={generateEmbedHTML()}
              readOnly
            />
          </div>
          
          <div className="flex justify-start">
            <button
              type="button"
              className="px-4 py-2 bg-slate-blue text-white rounded hover:bg-blue-700 transition"
              onClick={() => {
                const textarea = document.getElementById('emoji-embed-html-modal') as HTMLTextAreaElement;
                if (textarea) {
                  textarea.select();
                  navigator.clipboard.writeText(textarea.value).then(() => {
                    setCopyStatus('Copied!');
                    setTimeout(() => setCopyStatus(''), 2000);
                  }).catch(() => {
                    setCopyStatus('Failed to copy');
                    setTimeout(() => setCopyStatus(''), 2000);
                  });
                }
              }}
            >
              {copyStatus || 'Copy HTML'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmojiEmbedModal; 