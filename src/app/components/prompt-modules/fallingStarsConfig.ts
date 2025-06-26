import {
  FaStar,
  FaHeart,
  FaSmile,
  FaBolt,
  FaCoffee,
  FaFire,
  FaSun,
  FaMoon,
  FaMusic,
  FaGift,
  FaAnchor,
  FaCannabis,
  FaUtensils,
  FaWineGlass,
  FaBeer,
  FaWrench,
  FaCar,
  FaCat,
  FaDog,
  FaBicycle,
  FaSeedling,
  FaDumbbell,
  FaBriefcase,
  FaGavel,
  FaSprayCan,
  FaLaptop,
  FaCut,
  FaBox,
  FaFolder,
  FaDollarSign,
  FaHome,
  FaUserMd,
  FaFeather,
  FaPeace,
  FaGem,
  FaSnowflake,
  FaTooth,
  FaTrophy,
  FaTshirt,
  FaCampground,
  FaGlasses,
  FaHeadphones,
  FaKey,
  FaMicrophone,
  FaPepperHot,
  FaPizzaSlice,
  FaHatCowboy,
  FaSkull,
  FaCamera,
  FaShip,
  FaFlask,
  FaHammer,
  FaGuitar,
  FaBomb,
  FaCalendar,
  FaSign,
} from "react-icons/fa";
import { IconType } from "react-icons";

export const FALLING_STARS_TITLE = "Falling star animation";

export const FALLING_STARS_DESCRIPTION =
  "Enable a fun animation where stars (or other icons) rain down when the prompt page loads. You can choose the icon below.";

// Expanded configuration with small business focused icons organized by category
export const FALLING_STARS_ICONS: {
  key: string;
  label: string;
  icon: IconType;
  color: string;
  category: string;
}[] = [
  // General (Universal icons)
  { key: "star", label: "Stars", icon: FaStar, color: "text-yellow-500", category: "General" },
  { key: "heart", label: "Hearts", icon: FaHeart, color: "text-red-500", category: "General" },
  { key: "smile", label: "Smiles", icon: FaSmile, color: "text-green-500", category: "General" },
  { key: "bolt", label: "Lightning", icon: FaBolt, color: "text-blue-500", category: "General" },
  { key: "fire", label: "Fire", icon: FaFire, color: "text-orange-500", category: "General" },
  { key: "sun", label: "Sun", icon: FaSun, color: "text-yellow-400", category: "General" },
  { key: "moon", label: "Moon", icon: FaMoon, color: "text-indigo-500", category: "General" },
  { key: "peace", label: "Peace Sign", icon: FaPeace, color: "text-green-600", category: "General" },
  { key: "gem", label: "Diamond/Gem", icon: FaGem, color: "text-purple-500", category: "General" },
  { key: "trophy", label: "Trophy", icon: FaTrophy, color: "text-yellow-600", category: "General" },
  { key: "seedling", label: "Flowers", icon: FaSeedling, color: "text-green-500", category: "General" },
  { key: "snowflake", label: "Snowflake", icon: FaSnowflake, color: "text-blue-400", category: "General" },
  { key: "gift", label: "Gifts", icon: FaGift, color: "text-pink-500", category: "General" },
  { key: "camera", label: "Camera", icon: FaCamera, color: "text-teal-500", category: "General" },
  { key: "skull", label: "Skull", icon: FaSkull, color: "text-purple-600", category: "General" },
  { key: "bomb", label: "Bomb", icon: FaBomb, color: "text-red-600", category: "General" },
  
  // Food & Beverage
  { key: "coffee", label: "Coffee", icon: FaCoffee, color: "text-amber-600", category: "Food & Beverage" },
  { key: "utensils", label: "Food", icon: FaUtensils, color: "text-orange-500", category: "Food & Beverage" },
  { key: "wine-glass", label: "Wine Glass", icon: FaWineGlass, color: "text-purple-600", category: "Food & Beverage" },
  { key: "beer", label: "Beer Mug", icon: FaBeer, color: "text-amber-500", category: "Food & Beverage" },
  { key: "pizza", label: "Pizza", icon: FaPizzaSlice, color: "text-red-500", category: "Food & Beverage" },
  { key: "pepper", label: "Hot Pepper", icon: FaPepperHot, color: "text-red-600", category: "Food & Beverage" },
  { key: "flask", label: "Flask", icon: FaFlask, color: "text-blue-500", category: "Food & Beverage" },
  
  // Pets & Animals
  { key: "cat", label: "Cat", icon: FaCat, color: "text-orange-400", category: "Pets & Animals" },
  { key: "dog", label: "Dog", icon: FaDog, color: "text-amber-500", category: "Pets & Animals" },
  { key: "feather", label: "Feather", icon: FaFeather, color: "text-blue-300", category: "Pets & Animals" },
  { key: "cannabis", label: "Cannabis", icon: FaCannabis, color: "text-green-600", category: "Pets & Animals" },
  
  // Tools & Services
  { key: "wrench", label: "Wrench", icon: FaWrench, color: "text-blue-600", category: "Tools & Services" },
  { key: "hammer", label: "Hammer", icon: FaHammer, color: "text-orange-600", category: "Tools & Services" },
  { key: "spray-can", label: "Spray Bottle", icon: FaSprayCan, color: "text-blue-500", category: "Tools & Services" },
  { key: "scissors", label: "Scissors", icon: FaCut, color: "text-purple-500", category: "Tools & Services" },
  { key: "briefcase", label: "Briefcase", icon: FaBriefcase, color: "text-blue-600", category: "Tools & Services" },
  { key: "gavel", label: "Gavel", icon: FaGavel, color: "text-amber-700", category: "Tools & Services" },
  { key: "key", label: "Key", icon: FaKey, color: "text-yellow-600", category: "Tools & Services" },
  { key: "sign", label: "Sign", icon: FaSign, color: "text-green-600", category: "Tools & Services" },
  
  // Transportation
  { key: "car", label: "Car", icon: FaCar, color: "text-blue-500", category: "Transportation" },
  { key: "bicycle", label: "Bike", icon: FaBicycle, color: "text-green-600", category: "Transportation" },
  { key: "ship", label: "Boat", icon: FaShip, color: "text-blue-600", category: "Transportation" },
  { key: "anchor", label: "Anchor", icon: FaAnchor, color: "text-indigo-600", category: "Transportation" },
  
  // Technology & Business
  { key: "laptop", label: "Computer", icon: FaLaptop, color: "text-blue-500", category: "Technology & Business" },
  { key: "folder", label: "Folder", icon: FaFolder, color: "text-yellow-500", category: "Technology & Business" },
  { key: "dollar", label: "Dollar Sign", icon: FaDollarSign, color: "text-green-600", category: "Technology & Business" },
  { key: "box", label: "Shipping Package", icon: FaBox, color: "text-orange-500", category: "Technology & Business" },
  { key: "calendar", label: "Calendar", icon: FaCalendar, color: "text-red-500", category: "Technology & Business" },
  
  // Health & Wellness
  { key: "doctor", label: "Doctor", icon: FaUserMd, color: "text-blue-600", category: "Health & Wellness" },
  { key: "tooth", label: "Tooth", icon: FaTooth, color: "text-blue-300", category: "Health & Wellness" },
  { key: "dumbbell", label: "Dumbbells", icon: FaDumbbell, color: "text-purple-600", category: "Health & Wellness" },
  
  // Entertainment & Music
  { key: "music", label: "Music", icon: FaMusic, color: "text-purple-500", category: "Entertainment & Music" },
  { key: "guitar", label: "Guitar", icon: FaGuitar, color: "text-amber-600", category: "Entertainment & Music" },
  { key: "microphone", label: "Microphone", icon: FaMicrophone, color: "text-pink-500", category: "Entertainment & Music" },
  { key: "headphones", label: "Headphones", icon: FaHeadphones, color: "text-purple-600", category: "Entertainment & Music" },
  
  // Fashion & Accessories
  { key: "tshirt", label: "T-Shirt", icon: FaTshirt, color: "text-blue-500", category: "Fashion & Accessories" },
  { key: "hat", label: "Hat", icon: FaHatCowboy, color: "text-amber-600", category: "Fashion & Accessories" },
  { key: "glasses", label: "Glasses", icon: FaGlasses, color: "text-indigo-500", category: "Fashion & Accessories" },
  
  // Nature & Outdoors
  { key: "campground", label: "Campground", icon: FaCampground, color: "text-green-600", category: "Nature & Outdoors" },
  { key: "home", label: "House", icon: FaHome, color: "text-blue-600", category: "Nature & Outdoors" },
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
  return icon?.color || "text-slate-600";
};
