import React from 'react';
import offerConfig from './prompt-modules/offerConfig';

interface OfferCardProps {
  title?: string;
  message?: string;
  buttonText?: string;
  iconColor?: string;
  onButtonClick?: () => void;
  icon?: React.ReactNode;
  learnMoreUrl?: string;
  input?: React.ReactNode;
}

const OfferCard: React.FC<OfferCardProps> = ({
  title = offerConfig.title,
  message,
  buttonText = 'Learn More',
  iconColor = offerConfig.iconColor,
  onButtonClick,
  icon,
  learnMoreUrl,
  input,
}) => {
  const Icon = icon || <offerConfig.icon style={{ color: iconColor, fontSize: 18, marginRight: 8, verticalAlign: 'middle' }} />;
  return (
    <div className="bg-yellow-50 rounded-lg flex flex-col items-center justify-center w-full min-h-[30px] h-[30px] px-4 py-0 animate-slideup">
      <div className="flex items-center justify-center w-full gap-2">
        {Icon}
        <span className="text-sm font-semibold text-yellow-900 truncate text-center">{title}</span>
        {message && <span className="text-xs text-yellow-800 mx-2 text-center">{message}</span>}
        {input && <span className="mx-2">{input}</span>}
        {learnMoreUrl ? (
          <a
            href={learnMoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-0 bg-yellow-400 text-yellow-900 rounded font-semibold hover:bg-yellow-300 transition text-xs h-[22px] flex items-center"
          >
            {buttonText}
          </a>
        ) : (
          <button
            className="px-2 py-0 bg-yellow-400 text-yellow-900 rounded font-semibold hover:bg-yellow-300 transition text-xs h-[22px] flex items-center"
            onClick={onButtonClick}
          >
            {buttonText}
          </button>
        )}
      </div>
    </div>
  );
};

export default OfferCard; 