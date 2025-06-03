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
  'This feature keeps negative reviews off the web and allows you to respond directly while gathering valuable feedback. Users who select "Delighted" or "Satisfied" are sent to your public prompt page, while those who select "Neutral" or "Unsatisfied" are shown a private feedback form that is saved to your account but not shared publicly.';

export const EMOJI_SENTIMENT_NOTE =
  'Note: If you have Falling stars feature enabled, it will only run when a user selects "Excellent" or "Satisfied."';
