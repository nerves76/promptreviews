import { FaStar, FaHeart, FaSmile, FaThumbsUp, FaBolt, FaCoffee, FaWrench, FaRainbow, FaGlassCheers, FaDumbbell, FaPagelines, FaPeace } from 'react-icons/fa';

export const FALLING_STARS_TITLE = 'Falling star animation';

export const FALLING_STARS_DESCRIPTION =
  'Enable a fun animation where stars (or other icons) rain down when the prompt page loads. You can choose the icon below.';

export const FALLING_STARS_ICONS = [
  { key: 'star', label: 'Stars', icon: <FaStar className="w-6 h-6 text-yellow-400" /> },
  { key: 'heart', label: 'Hearts', icon: <FaHeart className="w-6 h-6 text-red-500" /> },
  { key: 'smile', label: 'Smiles', icon: <FaSmile className="w-6 h-6 text-yellow-400" /> },
  { key: 'thumb', label: 'Thumbs Up', icon: <FaThumbsUp className="w-6 h-6 text-blue-500" /> },
  { key: 'bolt', label: 'Bolts', icon: <FaBolt className="w-6 h-6 text-amber-400" /> },
  { key: 'rainbow', label: 'Rainbows', icon: <FaRainbow className="w-6 h-6 text-fuchsia-400" /> },
  { key: 'coffee', label: 'Coffee Cups', icon: <FaCoffee className="w-6 h-6 text-amber-800" /> },
  { key: 'wrench', label: 'Wrenches', icon: <FaWrench className="w-6 h-6 text-gray-500" /> },
  { key: 'confetti', label: 'Wine Glass', icon: <FaGlassCheers className="w-6 h-6 text-pink-400" /> },
  { key: 'barbell', label: 'Barbell', icon: <FaDumbbell className="w-6 h-6 text-gray-600" /> },
  { key: 'flower', label: 'Flower', icon: <FaPagelines className="w-6 h-6 text-green-500" /> },
  { key: 'peace', label: 'Peace', icon: <FaPeace className="w-6 h-6 text-purple-500" /> },
]; 