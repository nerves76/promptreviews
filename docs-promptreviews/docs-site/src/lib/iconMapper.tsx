/**
 * Maps emoji icons from database to Lucide React icons
 */

import {
  Sparkles, Zap, FileText, CheckCircle, Bot,
  QrCode, Smartphone, Shield, Share2, BarChart,
  Palette, Users, Settings, Clock, Star,
  TrendingUp, Target, Gift, Lightbulb, Heart,
  Mail, MessageSquare, Camera, Video, Package,
  Calendar, User, Briefcase, MapPin, Globe,
  Lock, Eye, ThumbsUp, Award, Rocket, Pin
} from 'lucide-react';

interface IconProps {
  className?: string;
}

export const iconMap: Record<string, React.ComponentType<IconProps>> = {
  '✨': Sparkles,
  '⚡': Zap,
  '📝': FileText,
  '✅': CheckCircle,
  '🤖': Bot,
  '📱': QrCode,
  '📲': Smartphone,
  '🔒': Shield,
  '🔗': Share2,
  '📊': BarChart,
  '🎨': Palette,
  '👥': Users,
  '⚙️': Settings,
  '⏰': Clock,
  '⭐': Star,
  '📈': TrendingUp,
  '🎯': Target,
  '🎁': Gift,
  '💡': Lightbulb,
  '❤️': Heart,
  '💌': Mail,
  '💬': MessageSquare,
  '📷': Camera,
  '🎥': Video,
  '📦': Package,
  '📅': Calendar,
  '👤': User,
  '💼': Briefcase,
  '📍': MapPin,
  '🌐': Globe,
  '🔐': Lock,
  '👁️': Eye,
  '👍': ThumbsUp,
  '🏆': Award,
  '🚀': Rocket,
  '📌': Pin,
};

// Color mapping for different icon contexts
export const iconColorMap: Record<string, string> = {
  '✨': 'text-purple-300',
  '⚡': 'text-yellow-300',
  '📝': 'text-blue-300',
  '✅': 'text-green-300',
  '🤖': 'text-indigo-300',
  '📱': 'text-cyan-300',
  '📲': 'text-blue-300',
  '🔒': 'text-green-300',
  '🔗': 'text-purple-300',
  '📊': 'text-blue-300',
  '🎨': 'text-pink-300',
  '👥': 'text-blue-300',
  '⚙️': 'text-gray-300',
  '⏰': 'text-orange-300',
  '⭐': 'text-yellow-300',
  '📈': 'text-green-300',
  '🎯': 'text-red-300',
  '🎁': 'text-purple-300',
  '💡': 'text-yellow-300',
  '❤️': 'text-red-300',
  '📌': 'text-red-300',
};

export function getIconComponent(emoji: string, className: string = 'w-5 h-5'): JSX.Element | string {
  const IconComponent = iconMap[emoji];
  const colorClass = iconColorMap[emoji] || 'text-white/70';

  if (IconComponent) {
    return <IconComponent className={`${className} ${colorClass}`} />;
  }

  // Fallback to emoji if no mapping found
  return emoji;
}
