import React from 'react';
import { FaStar, FaHeart, FaSmile, FaThumbsUp, FaBolt, FaCoffee, FaWrench, FaRainbow, FaGlassCheers, FaDumbbell, FaPagelines, FaPeace } from 'react-icons/fa';
import { FALLING_STARS_ICONS } from '@/app/components/prompt-modules/fallingStarsConfig';

interface FallingStarsSectionProps {
  enabled: boolean;
  onToggle: () => void;
  icon: string;
  onIconChange: (icon: string) => void;
  description?: string;
}

const ICON_OPTIONS = [
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
];

const FallingStarsSection: React.FC<FallingStarsSectionProps> = ({ enabled, onToggle, icon, onIconChange, description }) => (
  <div className="rounded-lg p-4 bg-blue-50 border border-blue-200 flex flex-col gap-2 shadow relative mb-8">
    <div className="flex items-center justify-between px-2 py-2">
      <div className="flex items-center gap-3">
        <FaStar className="w-7 h-7 text-slate-blue" />
        <span className="text-2xl font-bold text-[#1A237E]">Falling star animation</span>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${enabled ? 'bg-slate-blue' : 'bg-gray-200'}`}
        aria-pressed={!!enabled}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-1'}`}
        />
      </button>
    </div>
    <div className="text-sm text-gray-700 -mt-2 mb-5 px-2">
      {description || 'Enable a fun animation where stars (or other icons) rain down when the prompt page loads. You can choose the icon below.'}
    </div>
    {/* Icon picker (enabled) */}
    <div className="flex gap-4 px-2 flex-wrap">
      {FALLING_STARS_ICONS.map(opt => {
        const Icon = opt.icon;
        return (
          <button
            key={opt.key}
            className={`p-2 rounded-full border transition bg-white flex items-center justify-center ${icon === opt.key ? 'border-slate-blue ring-2 ring-slate-blue' : 'border-gray-300'}`}
            onClick={() => onIconChange(opt.key)}
            aria-label={opt.label}
            type="button"
            disabled={!enabled}
          >
            <Icon className={
              opt.key === 'star' ? 'w-6 h-6 text-yellow-400' :
              opt.key === 'heart' ? 'w-6 h-6 text-red-500' :
              opt.key === 'smile' ? 'w-6 h-6 text-yellow-400' :
              opt.key === 'thumb' ? 'w-6 h-6 text-blue-500' :
              opt.key === 'bolt' ? 'w-6 h-6 text-amber-400' :
              opt.key === 'rainbow' ? 'w-6 h-6 text-fuchsia-400' :
              opt.key === 'coffee' ? 'w-6 h-6 text-amber-800' :
              opt.key === 'wrench' ? 'w-6 h-6 text-gray-500' :
              opt.key === 'confetti' ? 'w-6 h-6 text-pink-400' :
              opt.key === 'barbell' ? 'w-6 h-6 text-gray-600' :
              opt.key === 'flower' ? 'w-6 h-6 text-green-500' :
              opt.key === 'peace' ? 'w-6 h-6 text-purple-500' :
              'w-6 h-6'
            } />
          </button>
        );
      })}
    </div>
  </div>
);

export default FallingStarsSection; 