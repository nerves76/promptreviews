/**
 * OfferFeature Component
 * 
 * A reusable component for the special offer feature that appears across all prompt page types.
 * This component handles the configuration of special offers including title, description, and URL.
 * 
 * Features:
 * - Toggle to enable/disable special offer
 * - Title and description configuration
 * - URL configuration
 * - Character limits and validation
 * - Proper state management and callbacks
 */

"use client";
import React, { useState, useEffect } from "react";
import { Input } from "@/app/(app)/components/ui/input";
import Icon from "@/components/Icon";

export interface OfferFeatureProps {
  /** Whether the special offer is enabled */
  enabled: boolean;
  /** The offer title */
  title: string;
  /** The offer description */
  description: string;
  /** The offer URL */
  url: string;
  /** Whether to add a 3-minute timer to the offer banner */
  timelock?: boolean;
  /** Callback when the enabled state changes */
  onEnabledChange?: (enabled: boolean) => void;
  /** Alternative callback for toggle (same as onEnabledChange) */
  onToggle?: (enabled: boolean) => void;
  /** Callback when the title changes */
  onTitleChange: (title: string) => void;
  /** Callback when the description changes */
  onDescriptionChange: (description: string) => void;
  /** Callback when the URL changes */
  onUrlChange: (url: string) => void;
  /** Callback when the timelock changes */
  onTimelockChange?: (timelock: boolean) => void;
  /** Initial values for the component */
  initialData?: {
    offer_enabled?: boolean;
    offer_title?: string;
    offer_body?: string;
    offer_url?: string;
    offer_timelock?: boolean;
  };
  /** Whether the component is disabled */
  disabled?: boolean;
}

const TITLE_MAX = 40;
const DESC_MAX = 60;
const URL_MAX = 200;

export default function OfferFeature({
  enabled,
  title,
  description,
  url,
  timelock = false,
  onEnabledChange,
  onToggle,
  onTitleChange,
  onDescriptionChange,
  onUrlChange,
  onTimelockChange,
  initialData,
  disabled = false,
}: OfferFeatureProps) {
  // Initialize state from props and initialData
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [offerTitle, setOfferTitle] = useState(title);
  const [offerDescription, setOfferDescription] = useState(description);
  const [offerUrl, setOfferUrl] = useState(url);
  const [offerTimelock, setOfferTimelock] = useState(timelock);

  // Update state when props change
  useEffect(() => {
    setIsEnabled(enabled);
  }, [enabled]);

  useEffect(() => {
    setOfferTitle(title);
  }, [title]);

  useEffect(() => {
    setOfferDescription(description);
  }, [description]);

  useEffect(() => {
    setOfferUrl(url);
  }, [url]);

  useEffect(() => {
    setOfferTimelock(timelock);
  }, [timelock]);

  // Initialize from initialData if provided
  useEffect(() => {
    if (initialData) {
      if (initialData.offer_enabled !== undefined) {
        setIsEnabled(initialData.offer_enabled);
      }
      if (initialData.offer_title !== undefined) {
        setOfferTitle(initialData.offer_title);
      }
      if (initialData.offer_body !== undefined) {
        setOfferDescription(initialData.offer_body);
      }
      if (initialData.offer_url !== undefined) {
        setOfferUrl(initialData.offer_url);
      }
      if (initialData.offer_timelock !== undefined) {
        setOfferTimelock(initialData.offer_timelock);
      }
    }
  }, [initialData]);

  const handleToggle = () => {
    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);
    onEnabledChange?.(newEnabled);
    onToggle?.(newEnabled);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value.slice(0, TITLE_MAX);
    setOfferTitle(newTitle);
    onTitleChange(newTitle);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDescription = e.target.value.slice(0, DESC_MAX);
    setOfferDescription(newDescription);
    onDescriptionChange(newDescription);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value.slice(0, URL_MAX);
    setOfferUrl(newUrl);
    onUrlChange(newUrl);
  };

  return (
    <div className="rounded-lg p-4 bg-blue-50 border border-blue-200 flex flex-col gap-4 shadow relative">
      <div className="flex flex-row justify-between items-start mb-2 px-4 py-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <Icon name="FaGift" className="w-7 h-7" style={{ color: "#1A237E" }} size={28} />
            <span className="text-2xl font-bold text-slate-blue">
              Special Offer
            </span>
          </div>
          <div className="text-sm text-gray-700 mt-[3px] ml-9">
            Add a banner at the top of your prompt page with a special deal, code, or link.
          </div>
        </div>
        <div className="flex flex-col justify-start pt-1">
          <button
            type="button"
            onClick={handleToggle}
            disabled={disabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              isEnabled ? "bg-slate-blue" : "bg-gray-200"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            aria-pressed={isEnabled}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                isEnabled ? "translate-x-5" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>
      
      {isEnabled && (
        <div className="space-y-3">
          <div className="mb-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Short Title
            </label>
            <Input
              type="text"
              value={offerTitle || ""}
              onChange={handleTitleChange}
              placeholder="Get 10% off your next visit"
              maxLength={TITLE_MAX}
              disabled={disabled}
            />
            <div className="text-xs text-gray-400 text-right mt-1">
              {(offerTitle || '').length}/{TITLE_MAX}
            </div>
          </div>
          
          <div className="mb-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Short Description
            </label>
            <Input
              type="text"
              value={offerDescription || ""}
              onChange={handleDescriptionChange}
              placeholder="Valid for 30 days"
              maxLength={DESC_MAX}
              disabled={disabled}
            />
            <div className="text-xs text-gray-400 text-right mt-1">
              {(offerDescription || '').length}/{DESC_MAX}
            </div>
          </div>
          
          <div className="mb-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              URL
            </label>
            <Input
              type="url"
              value={offerUrl || ""}
              onChange={handleUrlChange}
              placeholder="https://your-website.com/offer"
              maxLength={URL_MAX}
              disabled={disabled}
            />
            <div className="text-xs text-gray-400 text-right mt-1">
              {(offerUrl || '').length}/{URL_MAX}
            </div>
          </div>
          
          <div className="mb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={offerTimelock}
                onChange={(e) => {
                  const newTimelock = e.target.checked;
                  setOfferTimelock(newTimelock);
                  onTimelockChange?.(newTimelock);
                }}
                disabled={disabled}
                className="w-4 h-4 text-slate-blue bg-gray-100 border-gray-300 rounded focus:ring-slate-blue focus:ring-2"
              />
              <Icon name="FaClock" className="w-4 h-4 text-slate-blue" size={16} />
              <span className="text-sm font-medium text-gray-700">
                Timelock
              </span>
              <span className="text-xs text-gray-500">
                Add a 3-minute before your offer is revealed. Your customers will see a countdown on the banner. This gives users time to write a review.
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
} 