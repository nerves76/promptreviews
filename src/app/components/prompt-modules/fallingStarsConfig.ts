import {
  FaStar,
  FaHeart,
  FaSmile,
  FaBolt,
  FaCoffee,
  FaSun,
  FaMoon,
  FaGem,
  FaUtensils,
  FaKey,
} from "react-icons/fa";
import { IconType } from "react-icons";

export const FALLING_STARS_TITLE = "Falling star animation";

export const FALLING_STARS_DESCRIPTION =
  "Enable a fun animation where stars (or other icons) rain down when the prompt page loads. You can choose the icon below.";

// Curated list of decorative icons with proper canvas implementations
export const FALLING_STARS_ICONS: {
  key: string;
  label: string;
  icon: IconType;
  color: string;
  category: string;
}[] = [
  // General (icons with proper canvas implementations)
  { key: "star", label: "Stars", icon: FaStar, color: "text-yellow-500", category: "General" },
  { key: "heart", label: "Hearts", icon: FaHeart, color: "text-red-500", category: "General" },
  { key: "smile", label: "Smiles", icon: FaSmile, color: "text-green-500", category: "General" },
  { key: "bolt", label: "Lightning", icon: FaBolt, color: "text-blue-500", category: "General" },
  { key: "sun", label: "Sun", icon: FaSun, color: "text-yellow-400", category: "General" },
  { key: "moon", label: "Moon", icon: FaMoon, color: "text-blue-300", category: "General" },
  { key: "gem", label: "Diamond/Gem", icon: FaGem, color: "text-purple-500", category: "General" },
  
  // Food & Beverage (icons with proper canvas implementations)
  { key: "coffee", label: "Coffee", icon: FaCoffee, color: "text-amber-600", category: "Food & Beverage" },
  { key: "utensils", label: "Food", icon: FaUtensils, color: "text-orange-500", category: "Food & Beverage" },
  
  // Tools & Services (icons with proper canvas implementations)  
  { key: "key", label: "Key", icon: FaKey, color: "text-yellow-600", category: "Tools & Services" },
];

// Export in the format expected by FallingStarsSection
export const DEFAULT_FALLING_ICONS = FALLING_STARS_ICONS.slice(0, 4);
export const EXTENDED_FALLING_ICONS = FALLING_STARS_ICONS;

/**
 * Helper function to get the falling icon by key
 */
export const getFallingIcon = (key: string) => {
  return FALLING_STARS_ICONS.find((icon) => icon.key === key);
};

/**
 * Helper function to get the falling icon color by key
 */
export const getFallingIconColor = (key: string) => {
  const icon = FALLING_STARS_ICONS.find((icon) => icon.key === key);
  return icon?.color || "text-slate-blue";
};

/**
 * Default color options for the color picker
 */
export const FALLING_ICON_COLORS = [
  { key: "yellow", label: "Yellow", class: "text-yellow-500" },
  { key: "red", label: "Red", class: "text-red-500" },
  { key: "blue", label: "Blue", class: "text-blue-500" },
  { key: "green", label: "Green", class: "text-green-500" },
  { key: "purple", label: "Purple", class: "text-purple-500" },
  { key: "pink", label: "Pink", class: "text-pink-500" },
  { key: "orange", label: "Orange", class: "text-orange-500" },
  { key: "amber", label: "Amber", class: "text-amber-500" },
  { key: "emerald", label: "Emerald", class: "text-emerald-500" },
  { key: "cyan", label: "Cyan", class: "text-cyan-500" },
  { key: "indigo", label: "Indigo", class: "text-indigo-500" },
  { key: "rose", label: "Rose", class: "text-rose-500" },
  { key: "lime", label: "Lime", class: "text-lime-500" },
  { key: "violet", label: "Violet", class: "text-violet-500" },
  { key: "teal", label: "Teal", class: "text-teal-500" },
  { key: "slate", label: "Slate", class: "text-slate-500" },
];




