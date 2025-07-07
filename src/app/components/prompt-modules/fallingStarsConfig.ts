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
  FaSpinner,
  FaSearch,
  FaLeaf,
  FaTree,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
  FaCreditCard,
  FaShieldAlt,
  FaHandshake,
  FaLightbulb,
  FaChartLine,
  FaUsers,
  FaCog,
  FaTools,
  FaPaintBrush,
  FaPalette,
  FaBook,
  FaGraduationCap,
  FaBaby,
  FaChild,
  FaUserTie,
  FaStore,
  FaShoppingCart,
  FaTag,
  FaPercent,
  FaAward,
  FaMedal,
  FaCrown,
  FaMagic,
  FaRocket,
  FaPlane,
  FaMotorcycle,
  FaTruck,
  FaBus,
  FaTrain,
  FaTaxi,
  FaUmbrella,
  FaUmbrellaBeach,
  FaSpa,
  FaBed,
  FaConciergeBell,
  FaSwimmingPool,
  FaRunning,
  FaBasketballBall,
  FaFootballBall,
  FaVolleyballBall,
  FaTableTennis,
  FaChess,
  FaPuzzlePiece,
  FaGamepad,
  FaDice,
  FaDragon,
  FaGhost,
  FaWitch,
  FaWizard,
  FaHatWizard,
  FaScroll,
  FaBookOpen,
  FaPen,
  FaPencilAlt,
  FaMarker,
  FaHighlighter,
  FaEraser,
  FaPaperclip,
  FaStickyNote,
  FaClipboard,
  FaClipboardList,
  FaClipboardCheck,
  FaClipboardUser,
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
  { key: "moon", label: "Moon", icon: FaMoon, color: "text-yellow-400", category: "General" },
  { key: "peace", label: "Peace Sign", icon: FaPeace, color: "text-green-600", category: "General" },
  { key: "gem", label: "Diamond/Gem", icon: FaGem, color: "text-purple-500", category: "General" },
  { key: "trophy", label: "Trophy", icon: FaTrophy, color: "text-yellow-600", category: "General" },
  { key: "snowflake", label: "Snowflake", icon: FaSnowflake, color: "text-blue-400", category: "General" },
  { key: "gift", label: "Gifts", icon: FaGift, color: "text-pink-500", category: "General" },
  { key: "camera", label: "Camera", icon: FaCamera, color: "text-teal-500", category: "General" },
  { key: "skull", label: "Skull", icon: FaSkull, color: "text-purple-600", category: "General" },
  { key: "bomb", label: "Bomb", icon: FaBomb, color: "text-red-600", category: "General" },
  { key: "swirl", label: "Swirl", icon: FaSpinner, color: "text-purple-400", category: "General" },
  
  // Food & Beverage
  { key: "coffee", label: "Coffee", icon: FaCoffee, color: "text-amber-600", category: "Food & Beverage" },
  { key: "utensils", label: "Food", icon: FaUtensils, color: "text-orange-500", category: "Food & Beverage" },
  { key: "wine-glass", label: "Wine Glass", icon: FaWineGlass, color: "text-purple-600", category: "Food & Beverage" },
  { key: "beer", label: "Beer Mug", icon: FaBeer, color: "text-amber-500", category: "Food & Beverage" },
  { key: "pizza", label: "Pizza", icon: FaPizzaSlice, color: "text-red-500", category: "Food & Beverage" },
  { key: "pepper", label: "Hot Pepper", icon: FaPepperHot, color: "text-red-600", category: "Food & Beverage" },
  { key: "flask", label: "Flask", icon: FaFlask, color: "text-blue-500", category: "Food & Beverage" },
  
  // Plants & animals
  { key: "cat", label: "Cat", icon: FaCat, color: "text-orange-400", category: "Plants & animals" },
  { key: "dog", label: "Dog", icon: FaDog, color: "text-amber-500", category: "Plants & animals" },
  { key: "feather", label: "Feather", icon: FaFeather, color: "text-blue-300", category: "Plants & animals" },
  { key: "cannabis", label: "Cannabis", icon: FaCannabis, color: "text-green-600", category: "Plants & animals" },
  { key: "seedling", label: "Seedling", icon: FaSeedling, color: "text-green-500", category: "Plants & animals" },
  { key: "leaf", label: "Leaf", icon: FaLeaf, color: "text-green-400", category: "Plants & animals" },
  { key: "tree", label: "Tree", icon: FaTree, color: "text-green-700", category: "Plants & animals" },
  
  // Tools & Services
  { key: "wrench", label: "Wrench", icon: FaWrench, color: "text-blue-600", category: "Tools & Services" },
  { key: "hammer", label: "Hammer", icon: FaHammer, color: "text-orange-600", category: "Tools & Services" },
  { key: "spray-can", label: "Spray Bottle", icon: FaSprayCan, color: "text-blue-500", category: "Tools & Services" },
  { key: "scissors", label: "Scissors", icon: FaCut, color: "text-purple-500", category: "Tools & Services" },
  { key: "briefcase", label: "Briefcase", icon: FaBriefcase, color: "text-blue-600", category: "Tools & Services" },
  { key: "gavel", label: "Gavel", icon: FaGavel, color: "text-amber-700", category: "Tools & Services" },
  { key: "key", label: "Key", icon: FaKey, color: "text-yellow-600", category: "Tools & Services" },
  { key: "sign", label: "Sign", icon: FaSign, color: "text-green-600", category: "Tools & Services" },
  { key: "magnifying-glass", label: "Magnifying Glass", icon: FaSearch, color: "text-gray-600", category: "Tools & Services" },
  
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
  
  // Business & Communication
  { key: "phone", label: "Phone", icon: FaPhone, color: "text-green-600", category: "Business & Communication" },
  { key: "envelope", label: "Email", icon: FaEnvelope, color: "text-blue-500", category: "Business & Communication" },
  { key: "map-marker", label: "Location", icon: FaMapMarkerAlt, color: "text-red-500", category: "Business & Communication" },
  { key: "clock", label: "Clock", icon: FaClock, color: "text-gray-600", category: "Business & Communication" },
  { key: "credit-card", label: "Credit Card", icon: FaCreditCard, color: "text-blue-600", category: "Business & Communication" },
  { key: "shield", label: "Security", icon: FaShieldAlt, color: "text-green-600", category: "Business & Communication" },
  { key: "handshake", label: "Handshake", icon: FaHandshake, color: "text-blue-600", category: "Business & Communication" },
  { key: "lightbulb", label: "Lightbulb", icon: FaLightbulb, color: "text-yellow-500", category: "Business & Communication" },
  { key: "chart-line", label: "Growth Chart", icon: FaChartLine, color: "text-green-600", category: "Business & Communication" },
  { key: "users", label: "Team", icon: FaUsers, color: "text-blue-600", category: "Business & Communication" },
  { key: "cog", label: "Settings", icon: FaCog, color: "text-gray-600", category: "Business & Communication" },
  { key: "tools", label: "Tools", icon: FaTools, color: "text-orange-600", category: "Business & Communication" },
  
  // Creative & Design
  { key: "paint-brush", label: "Paint Brush", icon: FaPaintBrush, color: "text-purple-500", category: "Creative & Design" },
  { key: "palette", label: "Palette", icon: FaPalette, color: "text-pink-500", category: "Creative & Design" },
  { key: "magic", label: "Magic Wand", icon: FaMagic, color: "text-purple-600", category: "Creative & Design" },
  
  // Education & Learning
  { key: "book", label: "Book", icon: FaBook, color: "text-blue-600", category: "Education & Learning" },
  { key: "graduation-cap", label: "Graduation Cap", icon: FaGraduationCap, color: "text-blue-700", category: "Education & Learning" },
  { key: "book-open", label: "Open Book", icon: FaBookOpen, color: "text-green-600", category: "Education & Learning" },
  { key: "scroll", label: "Scroll", icon: FaScroll, color: "text-amber-600", category: "Education & Learning" },
  
  // Family & Children
  { key: "baby", label: "Baby", icon: FaBaby, color: "text-pink-400", category: "Family & Children" },
  { key: "child", label: "Child", icon: FaChild, color: "text-blue-400", category: "Family & Children" },
  
  // Professional Services
  { key: "user-tie", label: "Business Person", icon: FaUserTie, color: "text-blue-700", category: "Professional Services" },
  { key: "award", label: "Award", icon: FaAward, color: "text-yellow-600", category: "Professional Services" },
  { key: "medal", label: "Medal", icon: FaMedal, color: "text-yellow-500", category: "Professional Services" },
  { key: "crown", label: "Crown", icon: FaCrown, color: "text-yellow-600", category: "Professional Services" },
  
  // Retail & Shopping
  { key: "store", label: "Store", icon: FaStore, color: "text-blue-600", category: "Retail & Shopping" },
  { key: "shopping-cart", label: "Shopping Cart", icon: FaShoppingCart, color: "text-green-600", category: "Retail & Shopping" },
  { key: "tag", label: "Price Tag", icon: FaTag, color: "text-red-500", category: "Retail & Shopping" },
  { key: "percent", label: "Percent", icon: FaPercent, color: "text-green-600", category: "Retail & Shopping" },
  
  // Transportation & Travel
  { key: "rocket", label: "Rocket", icon: FaRocket, color: "text-purple-600", category: "Transportation & Travel" },
  { key: "plane", label: "Airplane", icon: FaPlane, color: "text-blue-500", category: "Transportation & Travel" },
  { key: "motorcycle", label: "Motorcycle", icon: FaMotorcycle, color: "text-red-600", category: "Transportation & Travel" },
  { key: "truck", label: "Truck", icon: FaTruck, color: "text-blue-600", category: "Transportation & Travel" },
  { key: "bus", label: "Bus", icon: FaBus, color: "text-green-600", category: "Transportation & Travel" },
  { key: "train", label: "Train", icon: FaTrain, color: "text-blue-700", category: "Transportation & Travel" },
  { key: "taxi", label: "Taxi", icon: FaTaxi, color: "text-yellow-600", category: "Transportation & Travel" },
  
  // Hospitality & Leisure
  { key: "umbrella", label: "Umbrella", icon: FaUmbrella, color: "text-blue-500", category: "Hospitality & Leisure" },
  { key: "umbrella-beach", label: "Beach Umbrella", icon: FaUmbrellaBeach, color: "text-yellow-500", category: "Hospitality & Leisure" },
  { key: "spa", label: "Spa", icon: FaSpa, color: "text-pink-500", category: "Hospitality & Leisure" },
  { key: "bed", label: "Bed", icon: FaBed, color: "text-blue-600", category: "Hospitality & Leisure" },
  { key: "concierge-bell", label: "Concierge Bell", icon: FaConciergeBell, color: "text-amber-600", category: "Hospitality & Leisure" },
  { key: "swimming-pool", label: "Swimming Pool", icon: FaSwimmingPool, color: "text-blue-400", category: "Hospitality & Leisure" },
  
  // Sports & Fitness
  { key: "running", label: "Running", icon: FaRunning, color: "text-green-600", category: "Sports & Fitness" },
  { key: "basketball", label: "Basketball", icon: FaBasketballBall, color: "text-orange-600", category: "Sports & Fitness" },
  { key: "football", label: "Football", icon: FaFootballBall, color: "text-brown-600", category: "Sports & Fitness" },
  { key: "volleyball", label: "Volleyball", icon: FaVolleyballBall, color: "text-orange-500", category: "Sports & Fitness" },
  { key: "table-tennis", label: "Table Tennis", icon: FaTableTennis, color: "text-green-500", category: "Sports & Fitness" },
  { key: "chess", label: "Chess", icon: FaChess, color: "text-gray-700", category: "Sports & Fitness" },
  
  // Games & Entertainment
  { key: "puzzle", label: "Puzzle", icon: FaPuzzlePiece, color: "text-purple-500", category: "Games & Entertainment" },
  { key: "gamepad", label: "Game Controller", icon: FaGamepad, color: "text-purple-600", category: "Games & Entertainment" },
  { key: "dice", label: "Dice", icon: FaDice, color: "text-red-600", category: "Games & Entertainment" },
  { key: "dragon", label: "Dragon", icon: FaDragon, color: "text-red-700", category: "Games & Entertainment" },
  { key: "ghost", label: "Ghost", icon: FaGhost, color: "text-purple-500", category: "Games & Entertainment" },
  { key: "witch", label: "Witch", icon: FaWitch, color: "text-purple-700", category: "Games & Entertainment" },
  { key: "wizard", label: "Wizard", icon: FaWizard, color: "text-blue-600", category: "Games & Entertainment" },
  { key: "hat-wizard", label: "Wizard Hat", icon: FaHatWizard, color: "text-purple-600", category: "Games & Entertainment" },
  
  // Office & Writing
  { key: "pen", label: "Pen", icon: FaPen, color: "text-blue-600", category: "Office & Writing" },
  { key: "pencil", label: "Pencil", icon: FaPencilAlt, color: "text-gray-600", category: "Office & Writing" },
  { key: "marker", label: "Marker", icon: FaMarker, color: "text-pink-500", category: "Office & Writing" },
  { key: "highlighter", label: "Highlighter", icon: FaHighlighter, color: "text-yellow-400", category: "Office & Writing" },
  { key: "eraser", label: "Eraser", icon: FaEraser, color: "text-gray-500", category: "Office & Writing" },
  { key: "paperclip", label: "Paperclip", icon: FaPaperclip, color: "text-gray-600", category: "Office & Writing" },
  { key: "sticky-note", label: "Sticky Note", icon: FaStickyNote, color: "text-yellow-400", category: "Office & Writing" },
  { key: "clipboard", label: "Clipboard", icon: FaClipboard, color: "text-gray-600", category: "Office & Writing" },
  { key: "clipboard-list", label: "Clipboard List", icon: FaClipboardList, color: "text-blue-600", category: "Office & Writing" },
  { key: "clipboard-check", label: "Clipboard Check", icon: FaClipboardCheck, color: "text-green-600", category: "Office & Writing" },
  { key: "clipboard-user", label: "Clipboard User", icon: FaClipboardUser, color: "text-blue-600", category: "Office & Writing" },
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
