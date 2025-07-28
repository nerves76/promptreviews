import React from "react";
import offerConfig from "./prompt-modules/offerConfig";
import { FaGift } from "react-icons/fa";

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
  offerTitle?: string;
  offerDescription?: string;
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
  offerTitle,
  offerDescription,
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
    <div className="bg-yellow-200 rounded-lg flex flex-col items-center justify-center w-full min-h-[32px] h-auto px-2 pt-0 pb-0 sm:pt-2 sm:pb-1 animate-slideup">
      <div className="flex flex-col sm:flex-row items-center justify-center w-full text-center">
        <FaGift 
          className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-700 mb-1 sm:mb-0 sm:mr-2 flex-shrink-0" 
          aria-hidden="true" 
        />
        <span className="text-yellow-900 mx-0 sm:mx-2 text-center text-sm sm:text-base mb-0 font-semibold">
          <strong>{offerTitle || "Special Offer"}</strong>
          {message && (
            <>
              {" "} &mdash; {message}
            </>
          )}
        </span>
        {buttonText && learnMoreUrl && (
          <a
            href={learnMoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 px-3 py-1 bg-yellow-600 text-white rounded text-sm font-medium hover:bg-yellow-700 transition-colors"
          >
            {buttonText}
          </a>
        )}
      </div>
    </div>
  );
};

export default OfferCard;
