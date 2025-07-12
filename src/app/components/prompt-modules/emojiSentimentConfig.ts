import { FaGrinHearts, FaSmile, FaMeh, FaFrown, FaAngry } from "react-icons/fa";

export const EMOJI_SENTIMENT_LABELS = [
  "Excellent",
  "Satisfied",
  "Neutral",
  "Unsatisfied",
  "Frustrated",
];

export const EMOJI_SENTIMENT_ICONS = [
  { icon: FaGrinHearts, color: "text-pink-400" },
  { icon: FaSmile, color: "text-green-500" },
  { icon: FaMeh, color: "text-gray-400" },
  { icon: FaFrown, color: "text-orange-400" },
  { icon: FaAngry, color: "text-red-500" },
];

export const EMOJI_SENTIMENT_TITLE = "Emoji Sentiment Flow";

export const EMOJI_SENTIMENT_SUBTEXT =
  'This feature encourages users to think twice before pasting negative reviews online. If users select "Delighted" or "Satisfied," they are sent to your public prompt page, while those who select "Neutral, Unsatisfied, or Frustrated" receive a secondary message which asks if they would rather leave feedback directly or publish publicly. (This is designed to satisfy Google\'s "no gating" policy where users are not given a choice.)';

export const EMOJI_SENTIMENT_NOTE =
  'Note: If you have Falling stars feature enabled, it will only run when a user selects "Excellent" or "Satisfied."';
