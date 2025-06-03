import React from 'react';
import {
  EMOJI_SENTIMENT_LABELS,
  EMOJI_SENTIMENT_ICONS,
  EMOJI_SENTIMENT_TITLE,
  EMOJI_SENTIMENT_SUBTEXT,
  EMOJI_SENTIMENT_NOTE,
} from '@/app/components/prompt-modules/emojiSentimentConfig';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { FaSmile } from 'react-icons/fa';

interface EmojiSentimentSectionProps {
  enabled: boolean;
  onToggle: () => void;
  question: string;
  onQuestionChange: (val: string) => void;
  feedbackMessage: string;
  onFeedbackMessageChange: (val: string) => void;
  thankYouMessage: string;
  onThankYouMessageChange: (val: string) => void;
  emojiLabels?: string[];
  onEmojiLabelChange?: (index: number, val: string) => void;
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
  emojiLabels = EMOJI_SENTIMENT_LABELS,
  onEmojiLabelChange,
  disabled = false,
}) => (
  <div className="rounded-lg p-4 bg-blue-50 border border-blue-200 flex flex-col gap-2 shadow relative">
    <div className="flex flex-row justify-between items-start px-2 py-2">
      <div className="flex flex-col">
        <div className="flex items-center gap-3">
          <FaSmile className="w-7 h-7 text-slate-blue" />
          <span className="text-2xl font-bold text-[#1A237E]">{EMOJI_SENTIMENT_TITLE}</span>
        </div>
        <div className="text-sm text-gray-700 mt-[3px] ml-9">{EMOJI_SENTIMENT_SUBTEXT}</div>
      </div>
      <div className="flex flex-col justify-start pt-1">
        <button
          type="button"
          onClick={onToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${enabled ? 'bg-slate-blue' : 'bg-gray-200'}`}
          aria-pressed={!!enabled}
          disabled={disabled}
          title={disabled ? 'Disable the other popup feature to enable this.' : ''}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-1'}`}
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
      {emojiLabels.map((label, i) => {
        const iconDef = EMOJI_SENTIMENT_ICONS[i];
        const Icon = iconDef?.icon || EMOJI_SENTIMENT_ICONS[1].icon;
        const color = iconDef?.color || 'text-gray-400';
        return (
          <div className="flex flex-col items-center" key={i}>
            <Icon className={`w-10 h-10 ${color}`} />
            <span className="text-xs mt-1 text-gray-700">{label}</span>
          </div>
        );
      })}
    </div>
    {enabled && (
      <div className="space-y-3">
        <div className="mb-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Popup question (shown above the emojis):</label>
          <Input
            type="text"
            value={question}
            onChange={e => onQuestionChange(e.target.value)}
            placeholder="How was your experience?"
            maxLength={80}
            disabled={!enabled}
          />
        </div>
        <div className="mt-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Feedback message (shown to customers who select an indifferent or negative emoji):</label>
          <Textarea
            value={feedbackMessage}
            onChange={e => onFeedbackMessageChange(e.target.value)}
            rows={2}
            maxLength={160}
          />
        </div>
        <div className="mt-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Thank you message (shown after positive feedback):</label>
          <Textarea
            value={thankYouMessage}
            onChange={e => onThankYouMessageChange(e.target.value)}
            rows={2}
            maxLength={160}
          />
        </div>
      </div>
    )}
  </div>
);

export default EmojiSentimentSection; 