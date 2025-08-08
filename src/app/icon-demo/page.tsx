'use client';

import React, { useEffect, useState } from 'react';

/**
 * SVG Icon Sprite Demo Page
 * 
 * This page demonstrates the new SVG sprite system that replaces react-icons
 * with a single optimized sprite file, reducing bundle size by ~533KB (90%)
 */

// Icon component that uses the SVG sprite
interface IconProps {
  name: string;
  size?: number;
  className?: string;
  color?: string;
  style?: React.CSSProperties;
}

const Icon: React.FC<IconProps> = ({ 
  name, 
  size = 24, 
  className = '', 
  color = 'currentColor',
  style = {} 
}) => {
  const iconStyle = {
    width: size,
    height: size,
    fill: color,
    ...style
  };

  return (
    <svg 
      className={className}
      style={iconStyle}
      role="img"
      aria-hidden="true"
    >
      <use href={`#${name}`} />
    </svg>
  );
};

export default function IconDemoPage() {
  const [spriteLoaded, setSpriteLoaded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('common');

  // Load the SVG sprite
  useEffect(() => {
    const loadSprite = async () => {
      try {
        const response = await fetch('/icons-sprite.svg');
        const spriteContent = await response.text();
        
        // Create a div to hold the sprite
        const div = document.createElement('div');
        div.innerHTML = spriteContent;
        div.style.display = 'none';
        
        // Insert sprite at the beginning of body
        document.body.insertBefore(div, document.body.firstChild);
        
        setSpriteLoaded(true);
      } catch (error) {
        console.error('Failed to load SVG sprite:', error);
      }
    };

    loadSprite();
  }, []);

  // Icon categories for demonstration
  const iconCategories = {
    common: {
      title: 'Most Used Icons',
      description: 'These are the most frequently used icons in PromptReviews',
      icons: ['FaStar', 'FaGoogle', 'FaFacebook', 'FaHeart', 'FaTimes', 'FaUser', 'FaCog', 'FaHome', 'FaPlus', 'FaCheck']
    },
    social: {
      title: 'Social & Review Platforms', 
      description: 'Icons for review platforms and social media',
      icons: ['FaGoogle', 'FaFacebook', 'FaYelp', 'FaTripadvisor', 'SiTrustpilot', 'SiHouzz', 'SiHomeadvisor', 'FaAmazon', 'SiG2', 'SiAngi', 'FaRegStar', 'FaStar']
    },
    ui: {
      title: 'User Interface',
      description: 'Common UI elements and navigation icons',
      icons: ['FaTimes', 'FaPlus', 'FaEdit', 'FaTrash', 'FaSearch', 'FaCog', 'FiMenu', 'FiX', 'FaChevronDown', 'FaChevronUp', 'FaChevronLeft', 'FaChevronRight']
    },
    business: {
      title: 'Business & Operations',
      description: 'Icons related to business operations and features',
      icons: ['FaStore', 'FaBuilding', 'FaUsers', 'FaCalendarAlt', 'FaMapMarker', 'FaClock', 'FaPhone', 'FaEnvelope', 'FaGlobe', 'FaChartLine']
    },
    content: {
      title: 'Content & Media',
      description: 'Icons for content creation and media',
      icons: ['FaCamera', 'FaImage', 'FaVideo', 'MdPhotoCamera', 'MdVideoLibrary', 'MdEvent', 'FaBoxOpen', 'FaGift', 'FaStickyNote', 'FaCommentDots']
    },
    emotions: {
      title: 'Sentiment & Emotions',
      description: 'Icons used in the emoji sentiment feature',
      icons: ['FaSmile', 'FaGrinHearts', 'FaMeh', 'FaFrown', 'FaAngry', 'FaHeart', 'FaThumbsUp', 'FaThumbsDown']
    }
  };

  const performanceStats = {
    totalIcons: 197,
    oldSize: '591KB',
    newSize: '58KB', 
    savings: '533KB',
    reduction: '90%'
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎨 SVG Icon Sprite System
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Optimized icon system for PromptReviews - 90% smaller bundles, faster loading
          </p>
          
          {/* Load Status */}
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
            spriteLoaded 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {spriteLoaded ? (
              <>
                <Icon name="FaCheck" size={16} className="mr-2" />
                SVG Sprite Loaded Successfully
              </>
            ) : (
              <>
                <div className="animate-spin mr-2">
                  <Icon name="FaSpinner" size={16} />
                </div>
                Loading SVG Sprite...
              </>
            )}
          </div>
        </div>

        {/* Performance Stats */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            📊 Performance Impact
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{performanceStats.totalIcons}</div>
              <div className="text-sm text-gray-600">Total Icons</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500">{performanceStats.oldSize}</div>
              <div className="text-sm text-gray-600">Before (react-icons)</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500">{performanceStats.newSize}</div>
              <div className="text-sm text-gray-600">After (SVG sprite)</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{performanceStats.reduction}</div>
              <div className="text-sm text-gray-600">Size Reduction</div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <span className="text-lg font-semibold text-green-600">
              💾 Savings: {performanceStats.savings}
            </span>
          </div>
        </div>

        {/* Category Navigation */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-2">
            {Object.entries(iconCategories).map(([key, category]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category.title}
              </button>
            ))}
          </div>
        </div>

        {/* Icon Display */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {iconCategories[selectedCategory as keyof typeof iconCategories].title}
            </h2>
            <p className="text-gray-600">
              {iconCategories[selectedCategory as keyof typeof iconCategories].description}
            </p>
          </div>

          {spriteLoaded ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {iconCategories[selectedCategory as keyof typeof iconCategories].icons.map((iconName) => (
                <div key={iconName} className="text-center p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex justify-center mb-3">
                    <Icon 
                      name={iconName} 
                      size={32} 
                      className="text-gray-700"
                    />
                  </div>
                  <div className="text-xs text-gray-600 font-mono break-all">
                    {iconName}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="animate-spin mx-auto mb-4">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
              <p className="text-gray-600">Loading icons...</p>
            </div>
          )}
        </div>

        {/* Size Demonstration */}
        {spriteLoaded && (
          <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              🎯 Size & Color Demonstration
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Size Demo */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Different Sizes</h3>
                <div className="space-y-4">
                  {[16, 24, 32, 48, 64].map(size => (
                    <div key={size} className="flex items-center space-x-4">
                      <Icon name="FaStar" size={size} className="text-yellow-500" />
                      <span className="text-sm text-gray-600">{size}px</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Color Demo */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Different Colors</h3>
                <div className="space-y-4">
                  {[
                    { color: '#ef4444', name: 'Red' },
                    { color: '#3b82f6', name: 'Blue' },
                    { color: '#10b981', name: 'Green' },
                    { color: '#f59e0b', name: 'Yellow' },
                    { color: '#8b5cf6', name: 'Purple' }
                  ].map(({ color, name }) => (
                    <div key={color} className="flex items-center space-x-4">
                      <Icon name="FaHeart" size={24} color={color} />
                      <span className="text-sm text-gray-600">{name} ({color})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Usage Examples */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            💻 Usage Examples
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Basic Usage</h3>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`import Icon from '@/components/Icon';

// Simple icon
<Icon name="FaStar" />

// With size and styling
<Icon 
  name="FaGoogle" 
  size={24} 
  className="text-blue-500 hover:text-blue-600" 
/>

// With custom color
<Icon 
  name="FaHeart" 
  size={20} 
  color="#ff6b6b" 
/>`}
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Migration from react-icons</h3>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`// Before (react-icons)
import { FaStar, FaGoogle } from 'react-icons/fa';
<FaStar className="text-yellow-500" />

// After (SVG sprite)  
import Icon from '@/components/Icon';
<Icon name="FaStar" className="text-yellow-500" />`}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-600">
          <p className="mb-2">
            🚀 This sprite system reduces your bundle size by <strong>533KB</strong> and improves loading performance!
          </p>
          <p className="text-sm">
            Ready to migrate? Check out the documentation in <code>docs/ICON_SPRITE_SYSTEM.md</code>
          </p>
        </div>

      </div>
    </div>
  );
} 