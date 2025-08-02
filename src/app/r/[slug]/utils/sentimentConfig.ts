/**
 * Sentiment Configuration
 * 
 * Configuration for sentiment options used in the prompt page.
 * Extracted from the main component for better organization.
 */

import React from 'react';
import Icon from '@/components/Icon';

export const sentimentOptions = [
  {
    value: "love",
    icon: <Icon name="FaGrinHearts" className="text-pink-400" />,
    label: "Excellent",
  },
  {
    value: "satisfied",
    icon: <Icon name="FaSmile" className="text-green-500" />,
    label: "Satisfied",
  },
  {
    value: "neutral",
    icon: <Icon name="FaMeh" className="text-gray-400" />,
    label: "Neutral",
  },
  {
    value: "unsatisfied",
    icon: <Icon name="FaFrown" className="text-orange-400" />,
    label: "Unsatisfied",
  },
  {
    value: "angry",
    icon: <Icon name="FaAngry" className="text-red-500" />,
    label: "Angry",
  },
]; 