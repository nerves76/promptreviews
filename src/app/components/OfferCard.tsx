import React from "react";
import offerConfig from "./prompt-modules/offerConfig";

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
  buttonText = "Learn More",
  iconColor = offerConfig.iconColor,
  onButtonClick,
  icon,
  learnMoreUrl,
  input,
}) => {
  const Icon = icon || (
    <offerConfig.icon
      style={{
        color: iconColor,
        fontSize: 32,
        marginRight: 12,
        verticalAlign: "middle",
      }}
    />
  );
  return (
    <div className="bg-yellow-50 rounded-lg flex flex-col items-center justify-center w-full min-h-[48px] h-auto px-4 pt-0 pb-1 sm:pt-4 sm:pb-3 animate-slideup">
      <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center w-full gap-2 sm:gap-3 text-sm sm:text-base">
        <span className="hidden sm:inline">{Icon}</span>
        <span className="font-bold text-yellow-900 truncate text-center text-lg sm:text-lg mb-0">
          {title}
        </span>
        {message && (
          <span className="text-yellow-800 mx-0 sm:mx-3 text-center text-base sm:text-base text-sm mb-0">
            {message}
          </span>
        )}
        {input && <span className="mx-2">{input}</span>}
        {learnMoreUrl ? (
          <a
            href={learnMoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-yellow-900 font-bold text-base text-center"
            style={{ display: "inline", marginTop: 0 }}
          >
            {buttonText}
          </a>
        ) : (
          <button
            className="mt-2 sm:mt-0 px-4 py-2 bg-yellow-400 text-yellow-900 rounded font-bold hover:bg-yellow-300 transition text-base h-auto flex items-center w-full sm:w-auto justify-center"
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
