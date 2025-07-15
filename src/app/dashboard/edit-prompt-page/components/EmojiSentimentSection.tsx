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
  const [headerColor, setHeaderColor] = useState<string>('#000000');
  const [showCard, setShowCard] = useState<boolean>(true);
  const [copyStatus, setCopyStatus] = useState('');

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

  const getFontAwesomeSVGPath = (label: string) => {
    switch (label) {
      case "Excellent":
        // FaGrinHearts - grin with heart eyes
        return "M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zM90.4 183.6c6.7-17.6 26.7-26.7 44.9-21.9l7.1 1.9 2-7.1c5-18.1 22.8-30.9 41.5-27.9 21.4 3.4 34.4 24.2 28.8 44.5L195.3 243c-1.2 4.5-5.9 7.2-10.5 6l-70.2-18.2c-20.4-5.4-31.9-27-24.2-47.2zM248 432c-60.6 0-134.5-38.3-143.8-93.3-2-11.8 9.2-21.5 20.7-17.9C155.1 330.5 200 336 248 336s92.9-5.5 123.1-15.2c11.4-3.6 22.6 6.1 20.7 17.9-9.3 55-83.2 93.3-143.8 93.3zm133.4-201.3l-70.2 18.2c-4.5 1.2-9.2-1.5-10.5-6L281.3 173c-5.6-20.3 7.4-41.1 28.8-44.5 18.6-3 36.4 9.8 41.5 27.9l2 7.1 7.1-1.9c18.2-4.7 38.2 4.3 44.9 21.9 7.7 20.3-3.8 41.9-24.2 47.2z";
      case "Satisfied":
        // FaSmile - smiling face
        return "M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm80 168c17.7 0 32 14.3 32 32s-14.3 32-32 32-32-14.3-32-32 14.3-32 32-32zm-160 0c17.7 0 32 14.3 32 32s-14.3 32-32 32-32-14.3-32-32 14.3-32 32-32zm194.8 170.2C334.3 380.4 292.5 400 248 400s-86.3-19.6-114.8-53.8c-13.6-16.3 11-36.7 24.6-20.5 22.4 26.9 55.2 42.2 90.2 42.2s67.8-15.4 90.2-42.2c13.4-16.2 38.1 4.2 24.6 20.5z";
      case "Neutral":
        // FaMeh - neutral/meh face
        return "M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm-80 168c17.7 0 32 14.3 32 32s-14.3 32-32 32-32-14.3-32-32 14.3-32 32-32zm176 192H152c-21.2 0-21.2-32 0-32h192c21.2 0 21.2 32 0 32zm-16-128c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32z";
      case "Unsatisfied":
        // FaFrown - frowning face
        return "M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm80 168c17.7 0 32 14.3 32 32s-14.3 32-32 32-32-14.3-32-32 14.3-32 32-32zm-160 0c17.7 0 32 14.3 32 32s-14.3 32-32 32-32-14.3-32-32 14.3-32 32-32zm170.2 218.2C315.8 367.4 282.9 352 248 352s-67.8 15.4-90.2 42.2c-13.5 16.3-38.1-4.2-24.6-20.5C161.7 339.6 203.6 320 248 320s86.3 19.6 114.7 53.8c13.6 16.2-11.1 36.6-24.5 20.4z";
      case "Frustrated":
        // FaAngry - angry face
        return "M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zM136 240c0-9.3 4.1-17.5 10.5-23.4l-31-9.3c-8.5-2.5-13.3-11.5-10.7-19.9 2.5-8.5 11.4-13.2 19.9-10.7l80 24c8.5 2.5 13.3 11.5 10.7 19.9-2.1 6.9-8.4 11.4-15.3 11.4-.5 0-1.1-.2-1.7-.2.7 2.7 1.7 5.3 1.7 8.2 0 17.7-14.3 32-32 32S136 257.7 136 240zm168 154.2c-27.8-33.4-84.2-33.4-112.1 0-13.5 16.3-38.2-4.2-24.6-20.5 20-24 49.4-37.8 80.6-37.8s60.6 13.8 80.6 37.8c13.8 16.5-11.1 36.6-24.5 20.5zm76.6-186.9l-31 9.3c6.3 5.8 10.5 14.1 10.5 23.4 0 17.7-14.3 32-32 32s-32-14.3-32-32c0-2.9.9-5.6 1.7-8.2-.6.1-1.1.2-1.7.2-6.9 0-13.2-4.5-15.3-11.4-2.5-8.5 2.3-17.4 10.7-19.9l80-24c8.4-2.5 17.4 2.3 19.9 10.7 2.5 8.5-2.3 17.4-10.8 19.9z";
      default:
        // Default to smile
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
          const url = window.location.origin + `/r/${slug || 'demo'}?emoji_sentiment=${label.toLowerCase()}&source=embed`;
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
          const url = window.location.origin + `/r/${slug || 'demo'}?emoji_sentiment=${label.toLowerCase()}&source=embed`;
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

  return (
    <div className="rounded-lg p-4 bg-blue-50 border border-blue-200 flex flex-col gap-2 shadow relative">
      <div className="flex flex-row justify-between items-start px-2 py-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 text-green-500">
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
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${enabled ? "bg-slate-blue" : "bg-gray-200"}`}
            aria-pressed={!!enabled}
            disabled={disabled}
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
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
              emojiSize={emojiSize === 'xs' ? 24 : emojiSize === 'sm' ? 32 : 48}
              headerSize={headerSize}
              showCard={showCard}
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
