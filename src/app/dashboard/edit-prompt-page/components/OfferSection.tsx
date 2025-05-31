import React from 'react';
import { FaGift } from 'react-icons/fa';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';

interface OfferSectionProps {
  enabled: boolean;
  onToggle: () => void;
  title: string;
  onTitleChange: (val: string) => void;
  description: string;
  onDescriptionChange: (val: string) => void;
  url: string;
  onUrlChange: (val: string) => void;
}

const OFFER_SECTION_TITLE = 'Special Offer';
const OFFER_SECTION_SUBTEXT = 'Add a banner at the top of your prompt page with a special deal, code, or link.';
const TITLE_MAX = 40;
const DESC_MAX = 60;
const URL_MAX = 200;

const OfferSection: React.FC<OfferSectionProps> = ({
  enabled,
  onToggle,
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  url,
  onUrlChange,
}) => (
  <div className="rounded-lg p-4 bg-yellow-50 border border-yellow-200 flex flex-col gap-4 shadow relative">
    <div className="flex items-center justify-between mb-2 px-4 py-2">
      <div className="flex items-center gap-3">
        <FaGift className="w-7 h-7 text-yellow-500" />
        <span className="text-2xl font-bold text-yellow-800">{OFFER_SECTION_TITLE}</span>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${enabled ? 'bg-yellow-500' : 'bg-gray-200'}`}
        aria-pressed={!!enabled}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-1'}`}
        />
      </button>
    </div>
    <div className="text-xs text-gray-500 px-4 -mt-4">
      {OFFER_SECTION_SUBTEXT}
    </div>
    {enabled && (
      <div className="space-y-3">
        <div className="mb-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Short Title</label>
          <Input
            type="text"
            value={title}
            onChange={e => onTitleChange(e.target.value.slice(0, TITLE_MAX))}
            placeholder="Get 10% off your next visit"
            maxLength={TITLE_MAX}
            disabled={!enabled}
          />
          <div className="text-xs text-gray-400 text-right mt-1">{title.length}/{TITLE_MAX}</div>
        </div>
        <div className="mb-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Short Description</label>
          <Input
            type="text"
            value={description}
            onChange={e => onDescriptionChange(e.target.value.slice(0, DESC_MAX))}
            placeholder="Valid for 30 days"
            maxLength={DESC_MAX}
            disabled={!enabled}
          />
          <div className="text-xs text-gray-400 text-right mt-1">{description.length}/{DESC_MAX}</div>
        </div>
        <div className="mb-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">URL</label>
          <Input
            type="url"
            value={url}
            onChange={e => onUrlChange(e.target.value.slice(0, URL_MAX))}
            placeholder="https://your-website.com/offer"
            maxLength={URL_MAX}
            disabled={!enabled}
          />
          <div className="text-xs text-gray-400 text-right mt-1">{url.length}/{URL_MAX}</div>
        </div>
      </div>
    )}
  </div>
);

export default OfferSection; 