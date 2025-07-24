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
  FaRainbow,
  FaCloud,
  FaSnowflake,
  FaFire,
  FaTree,
  FaLeaf,
  FaSeedling,
  FaGift,
  FaWineGlass,
  FaThumbsUp,
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
  FaMapMarkerAlt,
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
  FaAnkh,
  FaYinYang,
  FaOm,
  FaCross,
  FaStarOfDavid,
  FaHeartbeat,
  FaHandsHelping,
  FaHandPeace,
  FaThumbsDown,
  FaHandRock,
  FaHandPaper,
  FaHandScissors,
  FaPray,
} from "react-icons/fa";
import { IconType } from "react-icons";

export const FALLING_STARS_TITLE = "Falling star animation";

export const FALLING_STARS_DESCRIPTION =
  "Enable a fun animation where stars (or other icons) rain down when the prompt page loads. You can choose the icon below.";

// Comprehensive list of decorative icons organized by category
export const FALLING_STARS_ICONS: {
  key: string;
  label: string;
  icon: IconType;
  color: string;
  category: string;
}[] = [
  // General & Popular
  { key: "star", label: "Stars", icon: FaStar, color: "text-yellow-500", category: "General" },
  { key: "heart", label: "Hearts", icon: FaHeart, color: "text-red-500", category: "General" },
  { key: "smile", label: "Smiles", icon: FaSmile, color: "text-green-500", category: "General" },
  { key: "bolt", label: "Lightning", icon: FaBolt, color: "text-blue-500", category: "General" },
  { key: "gem", label: "Diamond/Gem", icon: FaGem, color: "text-purple-500", category: "General" },
  { key: "thumbsup", label: "Thumbs Up", icon: FaThumbsUp, color: "text-green-600", category: "General" },
  
  // Nature & Weather
  { key: "rainbow", label: "Rainbow", icon: FaRainbow, color: "text-pink-500", category: "Nature & Weather" },
  { key: "sun", label: "Sun", icon: FaSun, color: "text-yellow-400", category: "Nature & Weather" },
  { key: "moon", label: "Moon", icon: FaMoon, color: "text-blue-300", category: "Nature & Weather" },
  { key: "cloud", label: "Cloud", icon: FaCloud, color: "text-blue-200", category: "Nature & Weather" },
  { key: "snowflake", label: "Snowflake", icon: FaSnowflake, color: "text-blue-100", category: "Nature & Weather" },
  { key: "fire", label: "Fire", icon: FaFire, color: "text-orange-500", category: "Nature & Weather" },
  { key: "tree", label: "Tree", icon: FaTree, color: "text-green-600", category: "Nature & Weather" },
  { key: "leaf", label: "Leaf", icon: FaLeaf, color: "text-green-500", category: "Nature & Weather" },
  { key: "seedling", label: "Seedling", icon: FaSeedling, color: "text-green-400", category: "Nature & Weather" },
  
  // Food & Beverages
  { key: "coffee", label: "Coffee", icon: FaCoffee, color: "text-amber-600", category: "Food & Beverages" },
  { key: "utensils", label: "Food", icon: FaUtensils, color: "text-orange-500", category: "Food & Beverages" },
  { key: "gift", label: "Gift", icon: FaGift, color: "text-red-400", category: "Food & Beverages" },
  { key: "wine", label: "Wine", icon: FaWineGlass, color: "text-purple-600", category: "Food & Beverages" },
  { key: "apple", label: "Apple", icon: FaAppleAlt, color: "text-red-500", category: "Food & Beverages" },
  { key: "candy", label: "Candy Cane", icon: FaCandyCane, color: "text-red-400", category: "Food & Beverages" },
  { key: "icecream", label: "Ice Cream", icon: FaIceCream, color: "text-pink-300", category: "Food & Beverages" },
  { key: "pizza", label: "Pizza", icon: FaPizzaSlice, color: "text-orange-600", category: "Food & Beverages" },
  { key: "hamburger", label: "Hamburger", icon: FaHamburger, color: "text-amber-700", category: "Food & Beverages" },
  { key: "cheese", label: "Cheese", icon: FaCheese, color: "text-yellow-600", category: "Food & Beverages" },
  { key: "carrot", label: "Carrot", icon: FaCarrot, color: "text-orange-500", category: "Food & Beverages" },
  { key: "cake", label: "Birthday Cake", icon: FaBirthdayCake, color: "text-pink-500", category: "Food & Beverages" },
  
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
  
  // Tools & Objects
  { key: "wrench", label: "Wrench", icon: FaWrench, color: "text-gray-600", category: "Tools & Objects" },
  { key: "key", label: "Key", icon: FaKey, color: "text-yellow-600", category: "Tools & Objects" },
  { key: "anchor", label: "Anchor", icon: FaAnchor, color: "text-blue-700", category: "Tools & Objects" },
  { key: "lightbulb", label: "Lightbulb", icon: FaLightbulb, color: "text-yellow-400", category: "Tools & Objects" },
  { key: "magic", label: "Magic", icon: FaMagic, color: "text-purple-500", category: "Tools & Objects" },
  { key: "rocket", label: "Rocket", icon: FaRocket, color: "text-red-500", category: "Tools & Objects" },
  { key: "cube", label: "Cube", icon: FaCube, color: "text-blue-500", category: "Tools & Objects" },
  { key: "atom", label: "Atom", icon: FaAtom, color: "text-purple-600", category: "Tools & Objects" },
  { key: "flask", label: "Flask", icon: FaFlask, color: "text-green-500", category: "Tools & Objects" },
  
  // Transportation
  { key: "plane", label: "Plane", icon: FaPlane, color: "text-blue-500", category: "Transportation" },
  { key: "car", label: "Car", icon: FaCar, color: "text-red-600", category: "Transportation" },
  { key: "ship", label: "Ship", icon: FaShip, color: "text-blue-600", category: "Transportation" },
  
  // Symbols & Peace
  { key: "peace", label: "Peace", icon: FaPeace, color: "text-purple-500", category: "Symbols & Peace" },
  { key: "globe", label: "Globe", icon: FaGlobe, color: "text-blue-500", category: "Symbols & Peace" },
  { key: "flag", label: "Flag", icon: FaFlag, color: "text-red-500", category: "Symbols & Peace" },
  { key: "ankh", label: "Ankh", icon: FaAnkh, color: "text-amber-600", category: "Symbols & Peace" },
  { key: "yinyang", label: "Yin Yang", icon: FaYinYang, color: "text-gray-700", category: "Symbols & Peace" },
  { key: "om", label: "Om", icon: FaOm, color: "text-orange-500", category: "Symbols & Peace" },
  { key: "cross", label: "Cross", icon: FaCross, color: "text-amber-700", category: "Symbols & Peace" },
  { key: "starofdavid", label: "Star of David", icon: FaStarOfDavid, color: "text-blue-600", category: "Symbols & Peace" },
  
  // Entertainment & Media
  { key: "music", label: "Music", icon: FaMusic, color: "text-purple-500", category: "Entertainment & Media" },
  { key: "gamepad", label: "Gamepad", icon: FaGamepad, color: "text-indigo-500", category: "Entertainment & Media" },
  { key: "camera", label: "Camera", icon: FaCamera, color: "text-gray-700", category: "Entertainment & Media" },
  { key: "book", label: "Book", icon: FaBook, color: "text-amber-700", category: "Entertainment & Media" },
  { key: "chess", label: "Chess", icon: FaChess, color: "text-gray-800", category: "Entertainment & Media" },
  { key: "dice", label: "Dice", icon: FaDice, color: "text-red-600", category: "Entertainment & Media" },
  { key: "puzzle", label: "Puzzle", icon: FaPuzzlePiece, color: "text-blue-500", category: "Entertainment & Media" },
  { key: "microphone", label: "Microphone", icon: FaMicrophone, color: "text-gray-600", category: "Entertainment & Media" },
  { key: "headphones", label: "Headphones", icon: FaHeadphones, color: "text-gray-700", category: "Entertainment & Media" },
  
  // Animals
  { key: "cat", label: "Cat", icon: FaCat, color: "text-orange-400", category: "Animals" },
  { key: "dog", label: "Dog", icon: FaDog, color: "text-amber-600", category: "Animals" },
  { key: "dove", label: "Bird", icon: FaDove, color: "text-blue-300", category: "Animals" },
  { key: "fish", label: "Fish", icon: FaFish, color: "text-blue-400", category: "Animals" },
  { key: "frog", label: "Frog", icon: FaFrog, color: "text-green-500", category: "Animals" },
  
  // Fantasy & Fun
  { key: "dragon", label: "Dragon", icon: FaDragon, color: "text-red-600", category: "Fantasy & Fun" },
  { key: "ghost", label: "Ghost", icon: FaGhost, color: "text-gray-300", category: "Fantasy & Fun" },
  { key: "robot", label: "Robot", icon: FaRobot, color: "text-gray-600", category: "Fantasy & Fun" },
  
  // Time & Communication
  { key: "clock", label: "Clock", icon: FaClock, color: "text-gray-600", category: "Time & Communication" },
  { key: "bell", label: "Bell", icon: FaBell, color: "text-yellow-600", category: "Time & Communication" },
  { key: "location", label: "Location", icon: FaMapMarkerAlt, color: "text-red-500", category: "Time & Communication" },
  
  // Arts & Education
  { key: "palette", label: "Palette", icon: FaPalette, color: "text-pink-500", category: "Arts & Education" },
  { key: "brush", label: "Brush", icon: FaBrush, color: "text-purple-500", category: "Arts & Education" },
  { key: "graduation", label: "Graduation Cap", icon: FaGraduationCap, color: "text-blue-900", category: "Arts & Education" },
  { key: "student", label: "Student", icon: FaUserGraduate, color: "text-blue-700", category: "Arts & Education" },
  { key: "calculator", label: "Calculator", icon: FaCalculator, color: "text-gray-600", category: "Arts & Education" },
  { key: "pencil", label: "Pencil", icon: FaPencilAlt, color: "text-yellow-600", category: "Arts & Education" },
  { key: "feather", label: "Feather", icon: FaFeather, color: "text-blue-400", category: "Arts & Education" },
  { key: "bookopen", label: "Open Book", icon: FaBookOpen, color: "text-amber-600", category: "Arts & Education" },
  { key: "newspaper", label: "Newspaper", icon: FaNewspaper, color: "text-gray-700", category: "Arts & Education" },
  
  // Fashion & Accessories
  { key: "glasses", label: "Glasses", icon: FaGlasses, color: "text-gray-700", category: "Fashion & Accessories" },
  { key: "umbrella", label: "Umbrella", icon: FaUmbrella, color: "text-blue-500", category: "Fashion & Accessories" },
  { key: "tshirt", label: "T-Shirt", icon: FaTshirt, color: "text-blue-500", category: "Fashion & Accessories" },
  { key: "hat", label: "Wizard Hat", icon: FaHatWizard, color: "text-purple-600", category: "Fashion & Accessories" },
  { key: "socks", label: "Socks", icon: FaSocks, color: "text-gray-600", category: "Fashion & Accessories" },
  { key: "ring", label: "Ring", icon: FaRing, color: "text-yellow-500", category: "Fashion & Accessories" },
  
  // Hands & Gestures
  { key: "heartbeat", label: "Heartbeat", icon: FaHeartbeat, color: "text-red-500", category: "Hands & Gestures" },
  { key: "helping", label: "Helping Hands", icon: FaHandsHelping, color: "text-blue-500", category: "Hands & Gestures" },
  { key: "handpeace", label: "Peace Sign", icon: FaHandPeace, color: "text-green-500", category: "Hands & Gestures" },
  { key: "thumbsdown", label: "Thumbs Down", icon: FaThumbsDown, color: "text-red-500", category: "Hands & Gestures" },
  { key: "rock", label: "Rock", icon: FaHandRock, color: "text-gray-600", category: "Hands & Gestures" },
  { key: "paper", label: "Paper", icon: FaHandPaper, color: "text-blue-400", category: "Hands & Gestures" },
  { key: "scissors", label: "Scissors", icon: FaHandScissors, color: "text-gray-600", category: "Hands & Gestures" },
  { key: "pray", label: "Pray", icon: FaPray, color: "text-purple-500", category: "Hands & Gestures" },
];

// Export in the format expected by FallingStarsSection
export const DEFAULT_FALLING_ICONS = FALLING_STARS_ICONS.slice(0, 6);
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




// Cache bust: Wed Jul 23 18:58:43 PDT 2025
