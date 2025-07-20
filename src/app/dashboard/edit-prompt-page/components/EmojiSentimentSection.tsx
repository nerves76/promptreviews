/**
 * Emoji Sentiment Section Component
 * 
 * This component provides the configuration interface for the emoji sentiment flow feature.
 * It allows users to enable/disable the feature and configure various text messages.
 */

import React, { useState } from "react";
import {
  EMOJI_SENTIMENT_LABELS,
  EMOJI_SENTIMENT_ICONS,
  EMOJI_SENTIMENT_TITLE,
  EMOJI_SENTIMENT_SUBTEXT,
  EMOJI_SENTIMENT_NOTE,
} from "@/app/components/prompt-modules/emojiSentimentConfig";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import EmojiSentimentEmbed from "@/app/components/EmojiSentimentEmbed";
import { FaEnvelope, FaGlobe } from "react-icons/fa";

interface EmojiSentimentSectionProps {
  enabled: boolean;
  onToggle: () => void;
  question: string;
  onQuestionChange: (question: string) => void;
  feedbackMessage: string;
  onFeedbackMessageChange: (message: string) => void;
  thankYouMessage: string;
  onThankYouMessageChange: (message: string) => void;
  emojiLabels?: string[];
  onEmojiLabelsChange?: (labels: string[]) => void;
  headerColor?: string;
  onHeaderColorChange?: (color: string) => void;
  buttonColor?: string;
  onButtonColorChange?: (color: string) => void;
  fontFamily?: string;
  onFontFamilyChange?: (font: string) => void;
  promptPageId?: string;
  onEmojiEmbed?: (emoji: string) => void;
  slug?: string;
  feedbackPopupHeader?: string;
  onFeedbackPopupHeaderChange?: (header: string) => void;
  feedbackPageHeader?: string;
  onFeedbackPageHeaderChange?: (header: string) => void;
  disabled?: boolean;
}

const EmojiSentimentSection: React.FC<EmojiSentimentSectionProps> = ({
  enabled,
  onToggle,
  question,
  onQuestionChange,
  feedbackMessage,
  onFeedbackMessageChange,
  thankYouMessage,
  onThankYouMessageChange,
  feedbackPopupHeader = "",
  onFeedbackPopupHeaderChange,
  feedbackPageHeader = "",
  onFeedbackPageHeaderChange,
  disabled = false,
  slug,
}) => {
  const [showEmbed, setShowEmbed] = useState(false);
  const [emojiSize, setEmojiSize] = useState<'xs' | 'sm' | 'md'>('sm');
  const [headerSize, setHeaderSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [headerColor, setHeaderColor] = useState<string>('#374151');
  const [showCard, setShowCard] = useState<boolean>(true);
  const [copyStatus, setCopyStatus] = useState('');
  const [embedFormat, setEmbedFormat] = useState<'png' | 'svg'>('png');

  const getFontAwesomeIconName = (label: string) => {
    switch (label) {
      case "Excellent":
        return "grin-hearts";
      case "Satisfied":
        return "smile";
      case "Neutral":
        return "meh";
      case "Unsatisfied":
        return "frown";
      case "Frustrated":
        return "angry";
      default:
        return "smile";
    }
  };

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
      ? `<div style="position:absolute;bottom:8px;right:8px;">
           <a href="https://app.promptreviews.app" target="_blank" title="Powered by Prompt Reviews - Make writing reviews quick and easy with AI">
             <img src="https://app.promptreviews.app/emojis/prompt-reviews-get-more-reviews.png" width="64" height="30" alt="Prompt Reviews - Get More Reviews" style="display:block;border:none;opacity:0.8;">
           </a>
         </div>`
      : `<div style="position:absolute;bottom:8px;right:8px;">
           <a href="https://app.promptreviews.app" target="_blank" title="Powered by Prompt Reviews - Make writing reviews quick and easy with AI">
             <img src="https://app.promptreviews.app/emojis/prompt-reviews-get-more-reviews.png" width="64" height="30" alt="Prompt Reviews - Get More Reviews" style="display:block;border:none;opacity:0.8;">
           </a>
         </div>`;

    const generateEmojiElement = (label: string, idx: number) => {
      const url = window.location.origin + `/r/${slug || 'demo'}?emoji_sentiment=${label.toLowerCase()}&source=embed`;
      
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

  return (
    <div className="rounded-lg p-4 bg-blue-50 border border-blue-200 flex flex-col gap-2 shadow relative">
      <div className="flex flex-row justify-between items-start px-2 py-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 text-slate-600">
              {(() => {
                const IconComponent = EMOJI_SENTIMENT_ICONS[1].icon;
                return IconComponent ? <IconComponent className="w-7 h-7" /> : null;
              })()}
            </div>
            <span className="text-2xl font-bold text-[#1A237E]">
              {EMOJI_SENTIMENT_TITLE}
            </span>
          </div>
          <div className="text-sm text-gray-700 mt-[3px] ml-9">
            {EMOJI_SENTIMENT_SUBTEXT}
          </div>
        </div>
        <div className="flex flex-col justify-start pt-1">
          <button
            type="button"
            onClick={onToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              enabled 
                ? "bg-slate-blue" 
                : disabled 
                  ? "bg-gray-300 cursor-not-allowed opacity-50" 
                  : "bg-gray-200"
            }`}
            aria-pressed={!!enabled}
            title={
              disabled ? "Disable the other popup feature to enable this." : ""
            }
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-5" : "translate-x-1"}`}
            />
          </button>
        </div>
      </div>
      {enabled && (
        <div className="text-xs text-blue-700 bg-blue-100 border border-blue-200 rounded px-3 py-2 mb-2 mt-2">
          {EMOJI_SENTIMENT_NOTE}
        </div>
      )}
      <div className="flex justify-center gap-3 my-3 select-none">
        {EMOJI_SENTIMENT_LABELS.map((label, i) => {
          const iconDef = EMOJI_SENTIMENT_ICONS[i];
          const IconComponent = iconDef?.icon || EMOJI_SENTIMENT_ICONS[1].icon;
          const color = iconDef?.color || "text-gray-400";
          return (
            <div className="flex flex-col items-center" key={i}>
              {IconComponent && <IconComponent className={`w-10 h-10 ${color}`} />}
              <span className="text-xs mt-1 text-gray-700">{label}</span>
            </div>
          );
        })}
      </div>

      {enabled && (
        <div className="space-y-3">
          <div className="mb-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Popup header (shown above the emojis):
            </label>
            <Input
              type="text"
              value={question || ""}
              onChange={(e) => onQuestionChange(e.target.value)}
              placeholder="How was Your Experience?"
              maxLength={80}
              disabled={!enabled}
            />
          </div>
          
          <div className="mb-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Feedback header in popup (Shown if Neutral, Unsatisfied, or Frustrated is selected):
            </label>
            <Input
              type="text"
              value={feedbackPopupHeader || ""}
              onChange={(e) => onFeedbackPopupHeaderChange?.(e.target.value)}
              placeholder="How can we improve?"
              maxLength={80}
              disabled={!enabled}
            />
          </div>

          <div className="mb-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Feedback page header (Shown on dedicated feedback page):
            </label>
            <Input
              type="text"
              value={feedbackPageHeader || ""}
              onChange={(e) => onFeedbackPageHeaderChange?.(e.target.value)}
              placeholder="Please share your feedback"
              maxLength={80}
              disabled={!enabled}
            />
          </div>

          <div className="mb-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Feedback prompt message (if unsatisfied):
            </label>
            <Textarea
              value={feedbackMessage || ""}
              onChange={(e) => onFeedbackMessageChange(e.target.value)}
              placeholder="We value your feedback! Let us know how we can do better."
              maxLength={160}
              disabled={!enabled}
            />
          </div>
          <div className="mb-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Thank you message (after feedback is submitted):
            </label>
            <Textarea
              value={thankYouMessage || ""}
              onChange={(e) => onThankYouMessageChange(e.target.value)}
              placeholder="Thank you for your feedback! We appreciate you taking the time to help us improve."
              maxLength={160}
              disabled={!enabled}
            />
          </div>
        </div>
      )}

      <div className="flex justify-start mb-2">
        <button
          type="button"
          className={`px-4 py-2 rounded border font-semibold transition ${
            slug 
              ? "border-slate-blue text-slate-blue hover:bg-slate-blue hover:text-white" 
              : "border-gray-300 text-gray-400 cursor-not-allowed"
          }`}
          onClick={() => {
            if (slug) {
              setShowEmbed((v) => !v);
            } else {
              alert('Please save your page first to generate embed code.');
            }
          }}
        >
          {showEmbed ? 'Close Embed' : 'Embed'}
        </button>
        {!slug && (
          <span className="text-xs text-gray-500 ml-2 self-center">
            Save page first to generate embed code
          </span>
        )}
      </div>

      {showEmbed && (
        <div className="border border-blue-200 rounded-xl p-6 bg-blue-50 mb-6">
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-slate-blue mb-2">
              Add Emoji Sentiment Flow to your website or newsletter
            </h3>
            <p className="text-sm text-gray-600">
              Users who click an emoji will be redirected based on their selection.
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

          <div className="mb-4 flex gap-4 items-center flex-wrap">
            <div className="flex flex-col gap-2">
              <label className="font-medium">Format:</label>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setEmbedFormat('png')}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${
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
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${
                    embedFormat === 'svg'
                      ? 'bg-white text-slate-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <FaGlobe className="text-slate-600" size={14} />
                  Website (SVG)
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {embedFormat === 'png' 
                  ? 'PNG images work in all email clients and newsletters'
                  : 'SVG graphics are smaller and scale better on websites'
                }
              </p>
            </div>
          </div>
          {/* Live Preview */}
          <div className="mb-4">
            <EmojiSentimentEmbed
              header={question}
              headerColor={headerColor}
              emojiLinks={EMOJI_SENTIMENT_LABELS.map((label, idx) => {
                const url = window.location.origin + `/r/${slug || 'demo'}?emoji_sentiment=${label.toLowerCase()}&source=embed`;
                return {
                  label,
                  emoji: "😊", // Default emoji for embed
                  url,
                };
              })}
              emojiSize={emojiSize === 'xs' ? 28 : emojiSize === 'sm' ? 36 : 48}
              headerSize={headerSize}
              showCard={showCard}
              embedFormat={embedFormat}
            />
          </div>

          {/* HTML Code Box */}
          <div className="mb-2">
            <label className="font-medium mb-1 block">Embed HTML:</label>
            <textarea
              id="emoji-embed-html"
              className="w-full border rounded p-2 font-mono text-xs bg-white"
              rows={8}
              value={generateEmbedHTML()}
              readOnly
            />
          </div>
          <button
            type="button"
            className="px-4 py-2 bg-slate-blue text-white rounded hover:bg-blue-700 transition"
            onClick={() => {
              const textarea = document.getElementById('emoji-embed-html') as HTMLTextAreaElement;
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
      )}
    </div>
  );
};

export default EmojiSentimentSection;
