import {
  FaStar,
  FaHeart,
  FaSmile,
  FaThumbsUp,
  FaBolt,
  FaCoffee,
  FaWrench,
  FaRainbow,
  FaGlassCheers,
  FaDumbbell,
  FaPagelines,
  FaPeace,
  FaBicycle,
  FaAnchor,
} from "react-icons/fa";
import { IconType } from "react-icons";

export const FALLING_STARS_TITLE = "Falling star animation";

export const FALLING_STARS_DESCRIPTION =
  "Enable a fun animation where stars (or other icons) rain down when the prompt page loads. You can choose the icon below.";

export const FALLING_STARS_ICONS: {
  key: string;
  label: string;
  icon: IconType;
}[] = [
  { key: "star", label: "Stars", icon: FaStar },
  { key: "heart", label: "Hearts", icon: FaHeart },
  { key: "smile", label: "Smiles", icon: FaSmile },
  { key: "thumb", label: "Thumbs Up", icon: FaThumbsUp },
  { key: "bolt", label: "Bolts", icon: FaBolt },
  { key: "rainbow", label: "Rainbows", icon: FaRainbow },
  { key: "coffee", label: "Coffee Cups", icon: FaCoffee },
  { key: "wrench", label: "Wrenches", icon: FaWrench },
  { key: "confetti", label: "Wine Glass", icon: FaGlassCheers },
  { key: "barbell", label: "Barbell", icon: FaDumbbell },
  { key: "flower", label: "Flower", icon: FaPagelines },
  { key: "peace", label: "Peace", icon: FaPeace },
  { key: "bicycle", label: "Bicycles", icon: FaBicycle },
  { key: "anchor", label: "Anchors", icon: FaAnchor },
];
