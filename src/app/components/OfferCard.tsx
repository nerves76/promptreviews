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
  businessProfile?: any;
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
  businessProfile,
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

  const getFontClass = (font: string) => {
    // Implement your logic to determine the appropriate font class based on the font name
    // For example, you can use a switch statement or a mapping function
    switch (font) {
      case "Inter":
        return "font-inter";
      case "Roboto":
        return "font-roboto";
      case "Helvetica":
        return "font-helvetica";
      default:
        return "font-inter";
    }
  };

  return (
    <div className="bg-yellow-50 rounded-lg flex flex-col items-center justify-center w-full min-h-[32px] h-auto px-2 pt-0 pb-0 sm:pt-2 sm:pb-1 animate-slideup">
      <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center w-full gap-1 sm:gap-2 text-sm sm:text-base">
        <span className="hidden sm:inline">{Icon}</span>
        <span className={`font-bold text-yellow-900 truncate text-center text-base sm:text-lg mb-0 ${getFontClass(businessProfile?.primary_font || "Inter")}`}>
          {title}
        </span>
        {message && (
          <span className="text-yellow-800 mx-0 sm:mx-2 text-center text-sm sm:text-base mb-0">
            {message}
          </span>
        )}
        {input && <span className="mx-1">{input}</span>}
        {learnMoreUrl ? (
          <a
            href={learnMoreUrl}
            target="_blank"
            rel="noopener"
            className="underline text-yellow-900 font-bold text-sm sm:text-base text-center"
            style={{ display: "inline", marginTop: 0 }}
          >
            {buttonText}
          </a>
        ) : (
          <button
            className="mt-1 sm:mt-0 px-3 py-1 bg-yellow-400 text-yellow-900 rounded font-bold hover:bg-yellow-300 transition text-sm sm:text-base h-auto flex items-center w-full sm:w-auto justify-center"
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
