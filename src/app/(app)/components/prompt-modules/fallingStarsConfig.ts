/**
 * Falling Stars Configuration
 * 
 * Optimized icon loading strategy:
 * - Popular icons (first 15) loaded immediately for fast display
 * - Remaining icons lazy-loaded only when modal opens
 * - Preserves all 100+ icons while reducing initial bundle size
 */

import {
  // ⚡ IMMEDIATE LOAD: Print-optimized icons for fast display
  FaStar,
  FaHeart,
  FaBolt,
  FaSun,
  FaMoon,
} from "react-icons/fa";
import { IconType } from "react-icons";

export const FALLING_STARS_TITLE = "Falling star animation";

export const FALLING_STARS_DESCRIPTION =
  "Enable a fun animation where stars (or other icons) rain down when the prompt page loads. You can choose the icon below.";

// ⚡ IMMEDIATE LOAD: Popular icons for fast display
export const POPULAR_FALLING_ICONS: {
  key: string;
  label: string;
  icon: IconType;
  color: string;
  category: string;
}[] = [
  // General & Popular (immediate load) - print-optimized icons only
  { key: "star", label: "Stars", icon: FaStar, color: "text-yellow-500", category: "General" },
  { key: "heart", label: "Hearts", icon: FaHeart, color: "text-red-500", category: "General" },
  { key: "bolt", label: "Lightning", icon: FaBolt, color: "text-blue-500", category: "General" },
  
  // Nature & Weather (immediate load) - print-optimized icons only
  { key: "sun", label: "Sun", icon: FaSun, color: "text-yellow-400", category: "Nature & Weather" },
  { key: "moon", label: "Moon", icon: FaMoon, color: "text-blue-300", category: "Nature & Weather" },
];

// 🚀 LAZY LOAD: Function to load all icons only when needed
export const loadAllFallingIcons = async (): Promise<{
  key: string;
  label: string;
  icon: IconType;
  color: string;
  category: string;
}[]> => {
  // Dynamic import of all icons
  const {
    FaSnowflake,
    FaSeedling,
    FaWineGlass,
    FaUtensils,
    FaKey,
    FaBicycle,
    FaDumbbell,
    FaTrophy,
    FaMedal,
    FaCrown,
    FaWrench,
    FaAnchor,
    FaLightbulb,
    FaMagic,
    FaRocket,
    FaPlane,
    FaCar,
    FaShip,
    FaPeace,
    FaGlobe,
    FaFlag,
    FaMusic,
    FaGamepad,
    FaCamera,
    FaBook,
    FaCat,
    FaDog,
    FaDove,
    FaFish,
    FaFrog,
    FaDragon,
    FaGhost,
    FaRobot,
    FaClock,
    FaBell,
    FaMapMarker,
    FaAppleAlt,
    FaCandyCane,
    FaIceCream,
    FaPizzaSlice,
    FaHamburger,
    FaCheese,
    FaCarrot,
    FaBirthdayCake,
    FaFootballBall,
    FaBasketballBall,
    FaVolleyballBall,
    FaTableTennis,
    FaBowlingBall,
    FaChess,
    FaDice,
    FaPuzzlePiece,
    FaMicrophone,
    FaHeadphones,
    FaPalette,
    FaBrush,
    FaCube,
    FaAtom,
    FaFlask,
    FaGraduationCap,
    FaUserGraduate,
    FaCalculator,
    FaPencilAlt,
    FaFeather,
    FaBookOpen,
    FaNewspaper,
    FaGlasses,
    FaUmbrella,
    FaTshirt,
    FaHatWizard,
    FaSocks,
    FaRing,
    FaYinYang,
    FaHeartbeat,
    FaHandsHelping,
    FaHandPeace,
    FaThumbsDown,
    FaHandRock,
    FaHandPaper,
    FaHandScissors,
    FaGlassCheers,
    FaPagelines,
    FaBone,
    FaSkull,
    FaFistRaised,
    // New diversity, inclusion, small business & nature icons
    FaStore,
    FaShoppingBag,
    FaHandshake,
    FaUsers,
    FaUserFriends,
    FaBalanceScale,
    FaHammer,
    FaStethoscope,
    FaCut,
    FaBroom,
    FaShieldAlt,
    FaChild,
    FaWheelchair,
    FaEye,
    FaHands,
    FaHandHoldingHeart,
    FaInfinity,
    FaMarsDouble,
    FaVenusDouble,
    FaQuestionCircle,
    FaBed,
    FaCannabis,
    FaBeer,
    FaRainbow,
    FaSearch,
  } = await import("react-icons/fa");

  return [
    // Popular icons (already loaded)
    ...POPULAR_FALLING_ICONS,
    
    // General (Additional)
    
    // Nature & Plants (Enhanced)
    { key: "snowflake", label: "Snowflake", icon: FaSnowflake, color: "text-blue-100", category: "Nature & Weather" },
    { key: "seedling", label: "Seedling", icon: FaSeedling, color: "text-green-400", category: "Nature & Weather" },
    { key: "flower", label: "Flower", icon: FaPagelines, color: "text-green-500", category: "Nature & Weather" },
    
    // Small Business & Commerce
    { key: "store", label: "Store", icon: FaStore, color: "text-blue-600", category: "Small Business" },
    { key: "shoppingbag", label: "Shopping Bag", icon: FaShoppingBag, color: "text-green-600", category: "Small Business" },
    { key: "handshake", label: "Handshake", icon: FaHandshake, color: "text-blue-500", category: "Small Business" },
    { key: "hammer", label: "Hammer", icon: FaHammer, color: "text-gray-600", category: "Small Business" },
    { key: "stethoscope", label: "Stethoscope", icon: FaStethoscope, color: "text-red-500", category: "Small Business" },
    { key: "cut", label: "Scissors", icon: FaCut, color: "text-gray-600", category: "Small Business" },
    { key: "broom", label: "Broom", icon: FaBroom, color: "text-brown-500", category: "Small Business" },
    { key: "shield", label: "Shield", icon: FaShieldAlt, color: "text-blue-600", category: "Small Business" },
    
    // Diversity, Equity & Inclusion
    { key: "rainbow", label: "Rainbow (Pride)", icon: FaRainbow, color: "text-pink-500", category: "Diversity & Inclusion" },
    { key: "users", label: "Users", icon: FaUsers, color: "text-blue-500", category: "Diversity & Inclusion" },
    { key: "userfriends", label: "Friends", icon: FaUserFriends, color: "text-green-500", category: "Diversity & Inclusion" },
    { key: "balancescale", label: "Balance Scale", icon: FaBalanceScale, color: "text-purple-600", category: "Diversity & Inclusion" },
    { key: "child", label: "Child", icon: FaChild, color: "text-blue-400", category: "Diversity & Inclusion" },
    { key: "wheelchair", label: "Wheelchair", icon: FaWheelchair, color: "text-blue-600", category: "Diversity & Inclusion" },
    { key: "eye", label: "Eye", icon: FaEye, color: "text-gray-600", category: "Diversity & Inclusion" },
    { key: "hands", label: "Hands", icon: FaHands, color: "text-brown-400", category: "Diversity & Inclusion" },
    { key: "handheart", label: "Hand Heart", icon: FaHandHoldingHeart, color: "text-red-500", category: "Diversity & Inclusion" },
    { key: "infinity", label: "Infinity", icon: FaInfinity, color: "text-purple-500", category: "Diversity & Inclusion" },
    { key: "marsdouble", label: "Mars Double", icon: FaMarsDouble, color: "text-blue-500", category: "Diversity & Inclusion" },
    { key: "venusdouble", label: "Venus Double", icon: FaVenusDouble, color: "text-pink-500", category: "Diversity & Inclusion" },
    
    // Food & Beverages
    { key: "wine", label: "Wine", icon: FaWineGlass, color: "text-purple-600", category: "Food & Beverages" },
    { key: "utensils", label: "Utensils", icon: FaUtensils, color: "text-gray-600", category: "Food & Beverages" },
    { key: "apple", label: "Apple", icon: FaAppleAlt, color: "text-red-500", category: "Food & Beverages" },
    { key: "candy", label: "Candy Cane", icon: FaCandyCane, color: "text-red-500", category: "Food & Beverages" },
    { key: "icecream", label: "Ice Cream", icon: FaIceCream, color: "text-pink-400", category: "Food & Beverages" },
    { key: "pizza", label: "Pizza", icon: FaPizzaSlice, color: "text-orange-500", category: "Food & Beverages" },
    { key: "burger", label: "Hamburger", icon: FaHamburger, color: "text-yellow-600", category: "Food & Beverages" },
    { key: "cheese", label: "Cheese", icon: FaCheese, color: "text-yellow-500", category: "Food & Beverages" },
    { key: "carrot", label: "Carrot", icon: FaCarrot, color: "text-orange-600", category: "Food & Beverages" },
    { key: "cake", label: "Birthday Cake", icon: FaBirthdayCake, color: "text-pink-500", category: "Food & Beverages" },
    { key: "cheers", label: "Cheers", icon: FaGlassCheers, color: "text-amber-500", category: "Food & Beverages" },
    { key: "beer", label: "Beer", icon: FaBeer, color: "text-amber-600", category: "Food & Beverages" },
    
    // Activities & Sports
    { key: "bicycle", label: "Bicycle", icon: FaBicycle, color: "text-blue-600", category: "Activities & Sports" },
    { key: "dumbbell", label: "Dumbbell", icon: FaDumbbell, color: "text-gray-600", category: "Activities & Sports" },
    { key: "trophy", label: "Trophy", icon: FaTrophy, color: "text-yellow-600", category: "Activities & Sports" },
    { key: "medal", label: "Medal", icon: FaMedal, color: "text-amber-500", category: "Activities & Sports" },
    { key: "crown", label: "Crown", icon: FaCrown, color: "text-yellow-500", category: "Activities & Sports" },
    { key: "football", label: "Football", icon: FaFootballBall, color: "text-amber-800", category: "Activities & Sports" },
    { key: "basketball", label: "Basketball", icon: FaBasketballBall, color: "text-orange-600", category: "Activities & Sports" },
    { key: "volleyball", label: "Volleyball", icon: FaVolleyballBall, color: "text-blue-400", category: "Activities & Sports" },
    { key: "tabletennis", label: "Table Tennis", icon: FaTableTennis, color: "text-orange-500", category: "Activities & Sports" },
    { key: "bowling", label: "Bowling", icon: FaBowlingBall, color: "text-gray-800", category: "Activities & Sports" },
    { key: "gamepad", label: "Gamepad", icon: FaGamepad, color: "text-indigo-500", category: "Activities & Sports" },
    
    // Tools & Objects
    { key: "wrench", label: "Wrench", icon: FaWrench, color: "text-gray-600", category: "Tools & Objects" },
    { key: "key", label: "Key", icon: FaKey, color: "text-yellow-600", category: "Tools & Objects" },
    { key: "anchor", label: "Anchor", icon: FaAnchor, color: "text-blue-700", category: "Tools & Objects" },
    { key: "lightbulb", label: "Lightbulb", icon: FaLightbulb, color: "text-yellow-400", category: "Tools & Objects" },
    { key: "rocket", label: "Rocket", icon: FaRocket, color: "text-red-500", category: "Tools & Objects" },
    { key: "cube", label: "Cube", icon: FaCube, color: "text-blue-500", category: "Tools & Objects" },
    { key: "atom", label: "Atom", icon: FaAtom, color: "text-purple-600", category: "Tools & Objects" },
    { key: "flask", label: "Flask", icon: FaFlask, color: "text-green-500", category: "Tools & Objects" },
    { key: "search", label: "Magnifying Glass", icon: FaSearch, color: "text-slate-blue", category: "Tools & Objects" },
    
    // Transportation
    { key: "plane", label: "Plane", icon: FaPlane, color: "text-blue-500", category: "Transportation" },
    { key: "car", label: "Car", icon: FaCar, color: "text-red-600", category: "Transportation" },
    { key: "ship", label: "Ship", icon: FaShip, color: "text-blue-600", category: "Transportation" },
    
    // Universal Symbols & Peace
    { key: "peace", label: "Peace", icon: FaPeace, color: "text-purple-500", category: "Universal Symbols" },
    { key: "globe", label: "Globe", icon: FaGlobe, color: "text-blue-500", category: "Universal Symbols" },
    { key: "flag", label: "Flag", icon: FaFlag, color: "text-red-500", category: "Universal Symbols" },
    
    // Entertainment & Media
    { key: "music", label: "Music", icon: FaMusic, color: "text-purple-500", category: "Entertainment & Media" },
    { key: "gamepad", label: "Gamepad", icon: FaGamepad, color: "text-indigo-500", category: "Entertainment & Media" },
    { key: "camera", label: "Camera", icon: FaCamera, color: "text-gray-700", category: "Entertainment & Media" },
    { key: "book", label: "Book", icon: FaBook, color: "text-amber-700", category: "Entertainment & Media" },
    { key: "chess", label: "Chess", icon: FaChess, color: "text-gray-800", category: "Entertainment & Media" },
    { key: "dice", label: "Dice", icon: FaDice, color: "text-red-600", category: "Entertainment & Media" },
    { key: "puzzle", label: "Puzzle", icon: FaPuzzlePiece, color: "text-blue-500", category: "Entertainment & Media" },
    { key: "microphone", label: "Microphone", icon: FaMicrophone, color: "text-gray-600", category: "Entertainment & Media" },
    { key: "headphones", label: "Headphones", icon: FaHeadphones, color: "text-purple-600", category: "Entertainment & Media" },
    { key: "palette", label: "Palette", icon: FaPalette, color: "text-pink-500", category: "Entertainment & Media" },
    { key: "brush", label: "Brush", icon: FaBrush, color: "text-blue-500", category: "Entertainment & Media" },
    
    // Education & Learning
    { key: "graduationcap", label: "Graduation Cap", icon: FaGraduationCap, color: "text-blue-600", category: "Education & Learning" },
    { key: "usergraduate", label: "Graduate", icon: FaUserGraduate, color: "text-green-600", category: "Education & Learning" },
    { key: "calculator", label: "Calculator", icon: FaCalculator, color: "text-gray-600", category: "Education & Learning" },
    { key: "pencilalt", label: "Pencil", icon: FaPencilAlt, color: "text-blue-500", category: "Education & Learning" },
    { key: "feather", label: "Feather", icon: FaFeather, color: "text-gray-500", category: "Education & Learning" },
    { key: "bookopen", label: "Open Book", icon: FaBookOpen, color: "text-amber-600", category: "Education & Learning" },
    { key: "newspaper", label: "Newspaper", icon: FaNewspaper, color: "text-gray-700", category: "Education & Learning" },
    { key: "glasses", label: "Glasses", icon: FaGlasses, color: "text-gray-600", category: "Education & Learning" },
    
    // Fashion & Accessories
    { key: "umbrella", label: "Umbrella", icon: FaUmbrella, color: "text-blue-500", category: "Fashion & Accessories" },
    { key: "tshirt", label: "T-Shirt", icon: FaTshirt, color: "text-gray-600", category: "Fashion & Accessories" },
    { key: "socks", label: "Socks", icon: FaSocks, color: "text-gray-500", category: "Fashion & Accessories" },
    { key: "ring", label: "Ring", icon: FaRing, color: "text-yellow-500", category: "Fashion & Accessories" },
    { key: "bed", label: "Bed", icon: FaBed, color: "text-blue-600", category: "Fashion & Accessories" },
    
    // Animals & Nature
    { key: "cat", label: "Cat", icon: FaCat, color: "text-orange-500", category: "Animals & Nature" },
    { key: "dog", label: "Dog", icon: FaDog, color: "text-brown-500", category: "Animals & Nature" },
    { key: "dove", label: "Dove", icon: FaDove, color: "text-gray-400", category: "Animals & Nature" },
    { key: "fish", label: "Fish", icon: FaFish, color: "text-blue-500", category: "Animals & Nature" },
    { key: "frog", label: "Frog", icon: FaFrog, color: "text-green-500", category: "Animals & Nature" },
        { key: "bone", label: "Bone", icon: FaBone, color: "text-gray-400", category: "Animals & Nature" },
    
    // Mythical & Fantasy
    { key: "dragon", label: "Dragon", icon: FaDragon, color: "text-red-600", category: "Mythical & Fantasy" },
    { key: "ghost", label: "Ghost", icon: FaGhost, color: "text-gray-400", category: "Mythical & Fantasy" },
    { key: "magic", label: "Magic", icon: FaMagic, color: "text-purple-500", category: "Mythical & Fantasy" },
    { key: "wizardhat", label: "Wizard Hat", icon: FaHatWizard, color: "text-purple-600", category: "Mythical & Fantasy" },
    { key: "skull", label: "Skull", icon: FaSkull, color: "text-gray-600", category: "Mythical & Fantasy" },
    { key: "yinyang", label: "Yin Yang", icon: FaYinYang, color: "text-gray-700", category: "Mythical & Fantasy" },
    
    // Technology & Innovation
    { key: "robot", label: "Robot", icon: FaRobot, color: "text-blue-600", category: "Technology & Innovation" },
    
    // Nature & Weather
    { key: "cannabis", label: "Cannabis Leaf", icon: FaCannabis, color: "text-green-600", category: "Nature & Weather" },
    
    // Time & Communication
    { key: "clock", label: "Clock", icon: FaClock, color: "text-gray-600", category: "Time & Communication" },
    { key: "bell", label: "Bell", icon: FaBell, color: "text-yellow-500", category: "Time & Communication" },
    { key: "mapmarkeralt", label: "Location", icon: FaMapMarker, color: "text-red-500", category: "Time & Communication" },
    { key: "questioncircle", label: "Question", icon: FaQuestionCircle, color: "text-blue-500", category: "Time & Communication" },
    
    // Community & Support
    { key: "heartbeat", label: "Heartbeat", icon: FaHeartbeat, color: "text-red-500", category: "Community & Support" },
    { key: "handshelping", label: "Helping Hands", icon: FaHandsHelping, color: "text-green-600", category: "Community & Support" },
    { key: "handpeace", label: "Peace Hand", icon: FaHandPeace, color: "text-blue-500", category: "Community & Support" },
    { key: "thumbsdown", label: "Thumbs Down", icon: FaThumbsDown, color: "text-red-600", category: "Community & Support" },
    { key: "handrock", label: "Rock Hand", icon: FaHandRock, color: "text-gray-600", category: "Community & Support" },
    { key: "handpaper", label: "Paper Hand", icon: FaHandPaper, color: "text-gray-500", category: "Community & Support" },
    { key: "handscissors", label: "Scissors Hand", icon: FaHandScissors, color: "text-gray-600", category: "Community & Support" },
    { key: "fistraised", label: "Fist Raised", icon: FaFistRaised, color: "text-red-500", category: "Community & Support" },
  ];
};

// Legacy support - returns popular icons immediately, loads all on demand
export const FALLING_STARS_ICONS = POPULAR_FALLING_ICONS;

export const EXTENDED_FALLING_ICONS = POPULAR_FALLING_ICONS;

/**
 * Helper function to get the falling icon by key
 * Now supports both popular icons (immediate) and full icons (lazy loaded)
 */
export const getFallingIcon = (key: string) => {
  try {
    // Validate input
    if (!key || typeof key !== 'string') {
      console.warn('Invalid icon key provided to getFallingIcon:', key);
      return POPULAR_FALLING_ICONS[0]; // Default to star
    }
    
    // First check popular icons (immediate)
    const popularIcon = POPULAR_FALLING_ICONS.find((icon) => icon.key === key);
    if (popularIcon) {
      return popularIcon;
    }
    
    // For non-popular icons, return a default (will be loaded when modal opens)
    return POPULAR_FALLING_ICONS[0]; // Default to star
  } catch (error) {
    console.error('Error in getFallingIcon:', error);
    return POPULAR_FALLING_ICONS[0]; // Default to star
  }
};

/**
 * Enhanced helper function that can load non-popular icons dynamically
 * Use this for runtime scenarios where the full icon list might be needed
 */
export const getFallingIconAsync = async (key: string) => {
  try {
    // First check popular icons (immediate)
    const popularIcon = POPULAR_FALLING_ICONS.find((icon) => icon.key === key);
    if (popularIcon) {
      return popularIcon;
    }
    
    // For non-popular icons, load the full list
    try {
      const allIcons = await loadAllFallingIcons();
      const foundIcon = allIcons.find((icon) => icon.key === key);
      if (foundIcon) {
        return foundIcon;
      }
    } catch (loadError) {
      console.warn('Failed to load full icon list, falling back to star:', loadError);
    }
    
    // Final fallback to star
    return POPULAR_FALLING_ICONS[0];
  } catch (error) {
    console.error('Error in getFallingIconAsync:', error);
    return POPULAR_FALLING_ICONS[0];
  }
};

/**
 * Helper function to get the falling icon color by key
 */
export const getFallingIconColor = (key: string) => {
  const icon = getFallingIcon(key);
  return icon?.color || "text-yellow-500";
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




// Cache bust: Wed Jul 23 18:58:43 PDT 2025
