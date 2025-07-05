import { 
  FaAngry, 
  FaMeh, 
  FaSmile, 
  FaGrinStars, 
  FaGrinHearts 
} from "react-icons/fa";

export const EMOJI_SENTIMENT_LABELS = [
  "Angry",
  "Neutral", 
  "Slightly Smiling",
  "Smiling",
  "Star-struck",
];

export const EMOJI_SENTIMENT_ICONS = [
  { icon: FaAngry, color: "text-red-500" },
  { icon: FaMeh, color: "text-gray-400" },
  { icon: FaSmile, color: "text-yellow-500" },
  { icon: FaGrinStars, color: "text-green-500" },
  { icon: FaGrinHearts, color: "text-purple-500" },
];

export const EMOJI_SENTIMENT_TITLE = "Emoji Sentiment Flow";

export const EMOJI_SENTIMENT_SUBTEXT =
  'This feature guides users through a sentiment-based experience. Users who select positive emojis (Slightly Smiling, Smiling, Star-struck) are sent directly to your public prompt page, while those who select neutral or negative emojis (Angry, Neutral) are offered options to either give private feedback or leave a public review.';

export const EMOJI_SENTIMENT_NOTE =
  'Note: If you have Falling stars feature enabled, it will only run when a user selects positive emojis (Slightly Smiling, Smiling, or Star-struck).';

// New configuration for the two-step flow
export const EMOJI_SENTIMENT_STEP2_HEADLINE = "Thanks for your honesty. We're always looking to improve.";

export const EMOJI_SENTIMENT_STEP2_BODY = "Would you like to:";

export const EMOJI_SENTIMENT_STEP2_FEEDBACK_BUTTON = "Give Feedback";

export const EMOJI_SENTIMENT_STEP2_REVIEW_BUTTON = "Leave a Public Review";

// Helper function to determine if emoji selection should go to step 2
export function shouldShowStep2(emojiIndex: number): boolean {
  // Show step 2 for Angry (0) and Neutral (1) emojis
  return emojiIndex === 0 || emojiIndex === 1;
}

// Helper function to determine if emoji selection is positive
export function isPositiveEmoji(emojiIndex: number): boolean {
  // Positive emojis are: Slightly Smiling (2), Smiling (3), Star-struck (4)
  return emojiIndex >= 2;
}
