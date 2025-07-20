"use client";

import React, { useState } from "react";
import { EMOJI_SENTIMENT_LABELS } from "./prompt-modules/emojiSentimentConfig";
import EmojiSentimentEmbed from "./EmojiSentimentEmbed";
import { FaSmile, FaEnvelope, FaGlobe } from "react-icons/fa";

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
  const [headerColor, setHeaderColor] = useState<string>('#374151');
  const [showCard, setShowCard] = useState<boolean>(true);
  const [copyStatus, setCopyStatus] = useState('');
  const [embedFormat, setEmbedFormat] = useState<'png' | 'svg'>('png');

  const getEmojiPngFilename = (label: string) => {
    switch (label) {
      case "Excellent":
        return "excellent";
      case "Satisfied":
        return "satisfied";
      case "Neutral":
        return "neutral";
      case "Unsatisfied":
        return "unsatisfied";
      case "Frustrated":
        return "frustrated";
      default:
        return "satisfied";
    }
  };



  const generateEmbedHTML = () => {
    const emojiSizePx = emojiSize === 'xs' ? '28px' : emojiSize === 'sm' ? '36px' : '48px';
    const emojiSizeNum = emojiSize === 'xs' ? 28 : emojiSize === 'sm' ? 36 : 48;
    const fontSize = headerSize === 'sm' ? '1rem' : headerSize === 'md' ? '1.25rem' : '1.5rem';
    
    const brandingButton = embedFormat === 'png' 
      ? `<div style="position:absolute;bottom:16px;right:8px;">
           <a href="https://app.promptreviews.app" target="_blank" title="Powered by Prompt Reviews - Make writing reviews quick and easy with AI">
             <img src="https://app.promptreviews.app/emojis/promptreviews-logo.png" width="24" height="20" alt="Prompt Reviews" style="display:block;border:none;">
           </a>
         </div>`
      : `<div style="position:absolute;bottom:16px;right:8px;">
           <a href="https://app.promptreviews.app" target="_blank" style="width:24px;height:20px;font-size:10px;font-family:monospace;border-radius:4px;display:flex;align-items:center;justify-content:center;border:1px solid #d1d5db;background-color:#f8fafc;color:#2E4A7D;line-height:1;text-decoration:none;" title="Powered by Prompt Reviews - Make writing reviews quick and easy with AI">[P]</a>
         </div>`;

    const generateEmojiElement = (label: string, idx: number) => {
      const url = window.location.origin + `/r/${slug}?emoji_sentiment=${label.toLowerCase()}&source=embed`;
      
      if (embedFormat === 'png') {
        const pngFilename = getEmojiPngFilename(label);
        return `<td style="text-align:center;vertical-align:top;"><a href="${url}" target="_blank" style="text-decoration:none;display:inline-block;text-align:center;"><img src="https://app.promptreviews.app/emojis/${pngFilename}.png" width="${emojiSizePx}" height="${emojiSizePx}" alt="${label}" style="display:block;margin:0 auto;border:none;"><span style="font-size:.75rem;color:#666;margin-top:.25rem;display:block;">${label}</span></a></td>`;
      } else {
        const svgFilename = getEmojiPngFilename(label);
        return `<td style="text-align:center;vertical-align:top;"><a href="${url}" target="_blank" style="text-decoration:none;display:inline-block;text-align:center;transition:transform 0.2s ease;cursor:pointer;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'"><img src="https://app.promptreviews.app/emojis/${svgFilename}.svg" width="${emojiSizePx}" height="${emojiSizePx}" alt="${label}" style="display:block;margin:0 auto;border:none;"><span style="font-size:.75rem;color:#666;margin-top:.25rem;display:block;">${label}</span></a></td>`;
      }
    };
    
    if (showCard) {
      return `<!-- emoji review widget by Prompt Reviews promptreviews.app -->
<div style="max-width:450px;margin:0.5rem auto;border-radius:0.5rem;border:1px solid #e5e7eb;background:#fff;padding:1rem;box-shadow:0 1px 3px rgba(0,0,0,0.1);position:relative;">
  <div style="font-weight:bold;text-align:center;margin-bottom:1rem;font-size:${fontSize};color:${headerColor || '#374151'};">${question}</div>
  <div style="text-align:center;padding:0.5rem 0.5rem 2rem 0.5rem;">
    <table style="margin:0 auto;border-collapse:separate;border-spacing:12px;">
      <tr>
        ${EMOJI_SENTIMENT_LABELS.map((label, idx) => generateEmojiElement(label, idx)).join('')}
      </tr>
    </table>
  </div>
  ${brandingButton}
</div>`;
    } else {
      return `<!-- emoji review widget by Prompt Reviews promptreviews.app -->
<div style="max-width:450px;margin:0.5rem auto;position:relative;">
  <div style="font-weight:bold;text-align:center;margin-bottom:1rem;font-size:${fontSize};color:${headerColor || '#374151'};">${question}</div>
  <div style="text-align:center;padding:0.5rem 0.5rem 2rem 0.5rem;">
    <table style="margin:0 auto;border-collapse:separate;border-spacing:12px;">
      <tr>
        ${EMOJI_SENTIMENT_LABELS.map((label, idx) => generateEmojiElement(label, idx)).join('')}
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
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full mx-12 my-12 max-h-[85vh] relative">
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
        <div className="p-8 overflow-y-auto max-h-[85vh]">
          {/* Header section */}
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-slate-700 flex items-center gap-3">
              <FaSmile className="text-slate-600" />
              Emoji Sentiment Embed
            </h2>
            <p className="text-gray-600 mt-2 text-base">
              Add Emoji Sentiment Flow to your website, newsletter, or auto-responders
            </p>
          </div>

          {/* Live Preview section */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Live preview</h3>
            <div className="border border-gray-200 rounded-lg p-8 bg-gray-50 flex justify-center">
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
              emojiSize={emojiSize === 'xs' ? 28 : emojiSize === 'sm' ? 36 : 48}
              headerSize={headerSize}
              showCard={showCard}
              embedFormat={embedFormat}
            />
            </div>
          </div>

          {/* Configuration section */}
          <div className="mb-8 bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Customize your embed</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-medium text-gray-700">Emoji size:</label>
                <select value={emojiSize} onChange={e => setEmojiSize(e.target.value as any)} className="border border-gray-300 rounded-md px-3 py-2 bg-white">
                  <option value="xs">Small</option>
                  <option value="sm">Medium</option>
                  <option value="md">Large</option>
                </select>
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="font-medium text-gray-700">Header size:</label>
                <select value={headerSize} onChange={e => setHeaderSize(e.target.value as any)} className="border border-gray-300 rounded-md px-3 py-2 bg-white">
                  <option value="sm">Small</option>
                  <option value="md">Medium</option>
                  <option value="lg">Large</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-medium text-gray-700">Header color:</label>
                <input 
                  type="color" 
                  value={headerColor} 
                  onChange={(e) => setHeaderColor(e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  checked={showCard} 
                  onChange={(e) => setShowCard(e.target.checked)}
                  className="w-4 h-4 text-slate-600 border-gray-300 rounded focus:ring-slate-500"
                />
                <label className="font-medium text-gray-700">Show background card</label>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex flex-col gap-2">
                <label className="font-medium text-gray-700">Format:</label>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setEmbedFormat('png')}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${
                      embedFormat === 'png'
                        ? 'bg-white text-slate-700 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <FaEnvelope className="text-slate-600" size={14} />
                    Email (PNG)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmbedFormat('svg')}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${
                      embedFormat === 'svg'
                        ? 'bg-white text-slate-700 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <FaGlobe className="text-slate-600" size={14} />
                    Website (SVG)
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  {embedFormat === 'png' 
                    ? 'PNG images work in all email clients and newsletters'
                    : 'SVG graphics are smaller and scale better on websites'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* HTML Code section */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Embed code</h3>
            <textarea
              id="emoji-embed-html-modal"
              className="w-full border border-gray-300 rounded-md p-4 font-mono text-sm bg-white resize-none"
              rows={5}
              value={generateEmbedHTML()}
              readOnly
              placeholder="HTML embed code will appear here..."
            />
          </div>
          
          <div className="flex justify-start">
            <button
              type="button"
              className="px-6 py-3 bg-slate-blue text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
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