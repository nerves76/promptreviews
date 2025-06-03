import React, { useState, useEffect, forwardRef } from 'react';
import OfferToggle from '../components/OfferToggle';
import EmojiSentimentSection from '../components/EmojiSentimentSection';
import ReviewWriteSection, { ReviewWritePlatform } from '../components/ReviewWriteSection';
import { Input } from '@/app/components/ui/input';
import { Textarea } from "@/app/components/ui/textarea";
import { FaStar, FaHeart, FaSmile, FaThumbsUp, FaBolt, FaCoffee, FaWrench, FaRainbow, FaGlassCheers, FaDumbbell, FaPagelines, FaPeace } from 'react-icons/fa';
import OfferSection from '../components/OfferSection';
import DisableAIGenerationSection from '@/app/components/DisableAIGenerationSection';
import RobotTooltip from '@/app/components/RobotTooltip';

export interface ServicePromptFormState {
  offerEnabled: boolean;
  offerTitle: string;
  offerBody: string;
  offerUrl: string;
  emojiSentimentEnabled: boolean;
  emojiSentimentQuestion: string;
  emojiFeedbackMessage: string;
  emojiThankYouMessage: string;
  emojiLabels: string[];
  reviewPlatforms: ReviewWritePlatform[];
  fallingEnabled: boolean;
  fallingIcon: string;
  aiButtonEnabled: boolean;
}

interface ServicePromptPageFormProps {
  onSave: (state: ServicePromptFormState) => void;
  isLoading?: boolean;
  initialData?: Partial<ServicePromptFormState>;
  showResetButton?: boolean;
  businessReviewPlatforms?: ReviewWritePlatform[];
  onGenerateReview: (idx: number) => void;
}

const ServicePromptPageForm = forwardRef<any, ServicePromptPageFormProps>(
  ({ onSave, isLoading, initialData, showResetButton, businessReviewPlatforms = [], onGenerateReview }, ref) => {
    const [offerEnabled, setOfferEnabled] = useState(initialData?.offerEnabled ?? false);
    const [offerTitle, setOfferTitle] = useState(initialData?.offerTitle ?? '');
    const [offerBody, setOfferBody] = useState(initialData?.offerBody ?? '');
    const [offerUrl, setOfferUrl] = useState(initialData?.offerUrl ?? '');
    const [emojiSentimentEnabled, setEmojiSentimentEnabled] = useState(initialData?.emojiSentimentEnabled ?? false);
    const [emojiSentimentQuestion, setEmojiSentimentQuestion] = useState(initialData?.emojiSentimentQuestion ?? 'How was your experience?');
    const [emojiFeedbackMessage, setEmojiFeedbackMessage] = useState(initialData?.emojiFeedbackMessage ?? 'We value your feedback! Let us know how we can do better.');
    const [emojiThankYouMessage, setEmojiThankYouMessage] = useState(
      initialData?.emojiThankYouMessage && initialData.emojiThankYouMessage.trim() !== ''
        ? initialData.emojiThankYouMessage
        : "Thank you for your feedback. It's important to us."
    );
    const [emojiLabels, setEmojiLabels] = useState(initialData?.emojiLabels ?? [
      'Excellent', 'Satisfied', 'Neutral', 'Unsatisfied', 'Frustrated'
    ]);
    const [reviewPlatforms, setReviewPlatforms] = useState<ReviewWritePlatform[]>(initialData?.reviewPlatforms ?? []);
    const [fallingEnabled, setFallingEnabled] = useState(initialData?.fallingEnabled ?? false);
    const [fallingIcon, setFallingIcon] = useState(initialData?.fallingIcon ?? 'star');
    const [aiButtonEnabled, setAiButtonEnabled] = useState(initialData?.aiButtonEnabled ?? true);

    const handleEmojiLabelChange = (index: number, val: string) => {
      setEmojiLabels(labels => labels.map((l, i) => (i === index ? val : l)));
    };

    // Expose a submit function via ref
    React.useImperativeHandle(ref, () => ({
      submit: () => {
        onSave({
          offerEnabled,
          offerTitle,
          offerBody,
          offerUrl,
          emojiSentimentEnabled,
          emojiSentimentQuestion,
          emojiFeedbackMessage,
          emojiThankYouMessage,
          emojiLabels,
          reviewPlatforms,
          fallingEnabled,
          fallingIcon,
          aiButtonEnabled,
        });
      }
    }), [offerEnabled, offerTitle, offerBody, offerUrl, emojiSentimentEnabled, emojiSentimentQuestion, emojiFeedbackMessage, emojiThankYouMessage, emojiLabels, reviewPlatforms, fallingEnabled, fallingIcon, aiButtonEnabled, onSave]);

    return (
      <form className="space-y-8" onSubmit={e => {
        e.preventDefault();
        if (reviewPlatforms.length === 0) {
          if (!window.confirm("You didn't add a review platform. Are you sure you want to save?")) {
            return;
          }
        }
        if (!emojiThankYouMessage || emojiThankYouMessage.trim() === "") {
          alert("Please enter a thank you message for the emoji sentiment module.");
          return;
        }
        onSave({
          offerEnabled,
          offerTitle,
          offerBody,
          offerUrl,
          emojiSentimentEnabled,
          emojiSentimentQuestion,
          emojiFeedbackMessage,
          emojiThankYouMessage: emojiThankYouMessage || 'Thank you for your feedback!',
          emojiLabels,
          reviewPlatforms,
          fallingEnabled,
          fallingIcon,
          aiButtonEnabled,
        });
      }}>
        {/* Review Platforms Section with review and AI (Service only) */}
        <div className="mt-16">
          <ReviewWriteSection
            value={reviewPlatforms}
            onChange={setReviewPlatforms}
            onGenerateReview={onGenerateReview}
          />
        </div>
        {/* Special Offer Section (shared design) */}
        <OfferSection
          enabled={offerEnabled}
          onToggle={() => setOfferEnabled(v => !v)}
          title={offerTitle}
          onTitleChange={setOfferTitle}
          description={offerBody}
          onDescriptionChange={setOfferBody}
          url={offerUrl}
          onUrlChange={setOfferUrl}
        />
        {/* Emoji Sentiment Section (shared design) */}
        <EmojiSentimentSection
          enabled={emojiSentimentEnabled}
          onToggle={() => setEmojiSentimentEnabled(v => !v)}
          question={emojiSentimentQuestion}
          onQuestionChange={setEmojiSentimentQuestion}
          feedbackMessage={emojiFeedbackMessage}
          onFeedbackMessageChange={setEmojiFeedbackMessage}
          thankYouMessage={emojiThankYouMessage}
          onThankYouMessageChange={setEmojiThankYouMessage}
          emojiLabels={emojiLabels}
          onEmojiLabelChange={handleEmojiLabelChange}
        />
        {/* AI Review Generation Toggle */}
        <DisableAIGenerationSection enabled={aiButtonEnabled} onToggle={() => setAiButtonEnabled(v => !v)} />
        {/* Falling Stars Section (full module) */}
        <div className="rounded-lg p-4 bg-blue-50 border border-blue-200 flex flex-col gap-2 shadow relative mb-8">
          <div className="flex items-center justify-between mb-2 px-2 py-2">
            <div className="flex items-center gap-3">
              <FaStar className="w-7 h-7 text-slate-blue" />
              <span className="text-2xl font-bold text-[#1A237E]">Falling star animation</span>
            </div>
            <button
              type="button"
              onClick={() => setFallingEnabled(v => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${fallingEnabled ? 'bg-slate-blue' : 'bg-gray-200'}`}
              aria-pressed={!!fallingEnabled}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${fallingEnabled ? 'translate-x-5' : 'translate-x-1'}`}
              />
            </button>
          </div>
          <div className="text-sm text-gray-700 mb-3 max-w-[85ch] px-2">
            Enable a fun animation where stars (or other icons) rain down when the prompt page loads. You can choose the icon below.
          </div>
          {/* Icon picker (enabled) */}
          <div className="flex gap-4 px-2 flex-wrap">
            {[
              { key: 'star', label: 'Stars', icon: <FaStar className="w-6 h-6 text-yellow-400" /> },
              { key: 'heart', label: 'Hearts', icon: <FaHeart className="w-6 h-6 text-red-500" /> },
              { key: 'smile', label: 'Smiles', icon: <FaSmile className="w-6 h-6 text-yellow-400" /> },
              { key: 'thumb', label: 'Thumbs Up', icon: <FaThumbsUp className="w-6 h-6 text-blue-500" /> },
              { key: 'bolt', label: 'Bolts', icon: <FaBolt className="w-6 h-6 text-amber-400" /> },
              { key: 'rainbow', label: 'Rainbows', icon: <FaRainbow className="w-6 h-6 text-fuchsia-400" /> },
              { key: 'coffee', label: 'Coffee Cups', icon: <FaCoffee className="w-6 h-6 text-amber-800" /> },
              { key: 'wrench', label: 'Wrenches', icon: <FaWrench className="w-6 h-6 text-gray-500" /> },
              { key: 'confetti', label: 'Wine Glass', icon: <FaGlassCheers className="w-6 h-6 text-pink-400" /> },
              { key: 'barbell', label: 'Barbell', icon: <FaDumbbell className="w-6 h-6 text-gray-600" /> },
              { key: 'flower', label: 'Flower', icon: <FaPagelines className="w-6 h-6 text-green-500" /> },
              { key: 'peace', label: 'Peace', icon: <FaPeace className="w-6 h-6 text-purple-500" /> },
            ].map(opt => (
              <button
                key={opt.key}
                type="button"
                className={`p-2 rounded-full border transition bg-white flex items-center justify-center ${fallingIcon === opt.key ? 'border-slate-blue ring-2 ring-slate-blue' : 'border-gray-300'}`}
                onClick={() => setFallingIcon(opt.key)}
                aria-label={opt.label}
              >
                {opt.icon}
              </button>
            ))}
          </div>
        </div>
        {/* No Save button here; Save is handled by parent */}
      </form>
    );
  }
);

export default ServicePromptPageForm; 