/**
 * Sentiment Configuration
 * 
 * Configuration for sentiment options used in the prompt page.
 * Extracted from the main component for better organization.
 */

import React from 'react';
import { FaGrinHearts, FaSmile, FaMeh, FaFrown, FaAngry } from 'react-icons/fa';

export const sentimentOptions = [
  {
    value: "love",
    icon: React.createElement(FaGrinHearts, { className: "text-pink-400" }),
    label: "Excellent",
  },
  {
    value: "satisfied",
    icon: React.createElement(FaSmile, { className: "text-green-500" }),
    label: "Satisfied",
  },
  {
    value: "neutral",
    icon: React.createElement(FaMeh, { className: "text-gray-500" }),
    label: "Neutral",
  },
  {
    value: "unsatisfied",
    icon: React.createElement(FaFrown, { className: "text-orange-400" }),
    label: "Unsatisfied",
  },
  {
    value: "angry",
    icon: React.createElement(FaAngry, { className: "text-red-500" }),
    label: "Angry",
  },
]; 