"use client";

import React, { useState } from "react";
import { EMOJI_SENTIMENT_LABELS } from "./prompt-modules/emojiSentimentConfig";
import EmojiSentimentEmbed from "./EmojiSentimentEmbed";
import FiveStarEmbedGenerator from "./FiveStarEmbedGenerator";
import Icon from "@/components/Icon";

interface PromptPageEmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  question?: string;
  emojiSentimentEnabled?: boolean;
  isUniversal?: boolean;
}

type TabType = "5-star" | "emoji";

/**
 * PromptPageEmbedModal Component
 *
 * A modal that provides both 5-Star and Emoji sentiment embed code generation.
 * Used by the embed buttons for quick access on prompt pages.
 */
const PromptPageEmbedModal: React.FC<PromptPageEmbedModalProps> = ({
  isOpen,
  onClose,
  slug,
  question = "How was your experience?",
  emojiSentimentEnabled = false,
  isUniversal = false,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("5-star");

  // Emoji tab state
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

  const generateEmojiEmbedHTML = () => {
    const emojiSizePx = emojiSize === 'xs' ? '28px' : emojiSize === 'sm' ? '36px' : '48px';
    const fontSize = headerSize === 'sm' ? '1rem' : headerSize === 'md' ? '1.25rem' : '1.5rem';

    const brandingButton = `<div style="position:absolute;bottom:8px;right:8px;">
           <a href="https://app.promptreviews.app" target="_blank" title="Powered by Prompt Reviews - Make writing reviews quick and easy with AI">
             <img src="https://app.promptreviews.app/emojis/prompt-reviews-get-more-reviews.png" width="25" height="25" alt="Prompt Reviews - Get More Reviews" style="display:block;border:none;opacity:0.8;">
           </a>
         </div>`;

    const generateEmojiElement = (label: string, idx: number) => {
      const url = window.location.origin + `/r/${slug}?emoji_sentiment=${label.toLowerCase()}&source=embed`;

      if (embedFormat === 'png') {
        const pngFilename = getEmojiPngFilename(label);
        return `<td style="text-align:center;vertical-align:top;"><a href="${url}" target="_blank" style="text-decoration:none;display:inline-block;text-align:center;"><img src="https://app.promptreviews.app/emojis/${pngFilename}.png" width="${emojiSizePx}" height="${emojiSizePx}" alt="${label}" style="display:block;margin:0 auto;border:none;"><span style="font-size:.75rem;color:#666;margin-top:.5rem;display:block;">${label}</span></a></td>`;
      } else {
        const svgFilename = getEmojiPngFilename(label);
        return `<td style="text-align:center;vertical-align:top;"><a href="${url}" target="_blank" style="text-decoration:none;display:inline-block;text-align:center;transition:transform 0.2s ease;cursor:pointer;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'"><img src="https://app.promptreviews.app/emojis/${svgFilename}.svg" width="${emojiSizePx}" height="${emojiSizePx}" alt="${label}" style="display:block;margin:0 auto;border:none;"><span style="font-size:.75rem;color:#666;margin-top:.5rem;display:block;">${label}</span></a></td>`;
      }
    };

    if (showCard) {
      return `<!-- emoji review widget by Prompt Reviews promptreviews.app -->
<div style="max-width:450px;margin:0.5rem auto;border-radius:0.5rem;border:1px solid #e5e7eb;background:#fff;padding:1rem;box-shadow:0 1px 3px rgba(0,0,0,0.1);position:relative;">
  <div style="font-weight:bold;text-align:center;margin-bottom:0.5rem;font-size:${fontSize};color:${headerColor || '#374151'};">${question}</div>
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
  <div style="font-weight:bold;text-align:center;margin-bottom:0.5rem;font-size:${fontSize};color:${headerColor || '#374151'};">${question}</div>
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

  const promptPageUrl = `${window.location.origin}/r/${slug}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl max-w-5xl w-full mx-12 my-12 max-h-[85vh] relative border-2 border-white">
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
              <Icon name="FaCode" className="text-slate-600" size={16} />
              Prompt Page Embed
            </h2>
            <p className="text-gray-600 mt-2 text-base">
              Get more reviews from your newsletters, automation flows, and website with embeddable review capture widgets.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6 border-b border-gray-200">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab("5-star")}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === "5-star"
                    ? "border-slate-600 text-slate-700"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                5-Star Embed
              </button>
              <button
                onClick={() => setActiveTab("emoji")}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === "emoji"
                    ? "border-slate-600 text-slate-700"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Emoji Embed
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "5-star" && (
            <FiveStarEmbedGenerator promptPageUrl={promptPageUrl} />
          )}

          {activeTab === "emoji" && (
            <>
              {!emojiSentimentEnabled ? (
                <div className="text-center py-12">
                  <div className="mb-6">
                    <Icon name="FaInfoCircle" className="text-gray-400 mx-auto mb-4" size={48} />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                      Emoji Feedback Flow Not Enabled
                    </h3>
                    <p className="text-gray-600 mb-6">
                      You must enable Emoji Feedback Flow to use this feature.
                    </p>
                    <a
                      href={isUniversal ? "/dashboard/edit-prompt-page/universal" : `/dashboard/edit-prompt-page/${slug}`}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-slate-blue text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                    >
                      Enable on this Prompt Page
                    </a>
                  </div>
                </div>
              ) : (
                <>
                  {/* Live Preview section */}
                  <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-800 mb-4 text-center">Live preview</h3>
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
                        <Icon name="FaEnvelope" className="text-slate-600" size={14} />
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
                        <Icon name="FaGlobe" className="text-slate-600" size={14} />
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
                  value={generateEmojiEmbedHTML()}
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
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromptPageEmbedModal;
