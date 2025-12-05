"use client";

import React, { useState } from "react";
import Icon from "@/components/Icon";

interface FiveStarEmbedGeneratorProps {
  promptPageUrl: string;
  showUrlInput?: boolean;
}

const DEFAULT_HEADING = "Reviews Help Us Grow";
const DEFAULT_SUBCOPY = "A written review is one of the most powerful ways you can help small business like ours grow. We use Prompt Reviews to make it quick and easy. It will only take a minute and it means the world to us. Thanks for your support!";
const DEFAULT_BUTTON_TEXT = "Create Review";
const DEFAULT_TEXT_COLOR = "#374151"; // charcoal
const DEFAULT_BUTTON_COLOR = "#475569"; // slate blue
const DEFAULT_BUTTON_TEXT_COLOR = "#FFFFFF"; // white

const HEADING_CHAR_LIMIT = 60;
const SUBCOPY_CHAR_LIMIT = 300;
const BUTTON_TEXT_CHAR_LIMIT = 30;

const FIVE_STAR_IMAGE_URL = "/images/5-stars-prompt-reviews.png";

/**
 * FiveStarEmbedGenerator Component
 *
 * Generates email-compatible HTML embed code with 5-star image, customizable text, and button.
 * Can be used in standalone page or embedded in modals.
 */
const FiveStarEmbedGenerator: React.FC<FiveStarEmbedGeneratorProps> = ({
  promptPageUrl,
  showUrlInput = false,
}) => {
  const [heading, setHeading] = useState(DEFAULT_HEADING);
  const [subcopy, setSubcopy] = useState(DEFAULT_SUBCOPY);
  const [buttonText, setButtonText] = useState(DEFAULT_BUTTON_TEXT);
  const [textColor, setTextColor] = useState(DEFAULT_TEXT_COLOR);
  const [buttonColor, setButtonColor] = useState(DEFAULT_BUTTON_COLOR);
  const [buttonTextColor, setButtonTextColor] = useState(DEFAULT_BUTTON_TEXT_COLOR);
  const [showStarImage, setShowStarImage] = useState(true);
  const [starSize, setStarSize] = useState(240); // Star image width in pixels (160-320)
  const [starGap, setStarGap] = useState(-40); // Gap between stars and heading (-50 to 32px)
  const [copyStatus, setCopyStatus] = useState("");
  const [customUrl, setCustomUrl] = useState(promptPageUrl);

  const url = showUrlInput ? customUrl : promptPageUrl;

  const generateEmbedHTML = () => {
    return `<!-- 5-star review embed by Prompt Reviews promptreviews.app -->
<div style="max-width:600px;margin:0 auto;background:transparent;text-align:center;font-family:Arial,sans-serif;">
  ${showStarImage ? `<div style="margin-bottom:${starGap}px;">
    <img src="${FIVE_STAR_IMAGE_URL}" alt="5 Stars" style="width:${starSize}px;height:auto;display:inline-block;" />
  </div>` : ''}
  <div style="margin-bottom:0px;">
    <h2 style="font-size:24px;font-weight:bold;color:${textColor};margin:0 0 16px 0;">${heading}</h2>
  </div>
  <div style="margin-bottom:20px;">
    <p style="font-size:16px;line-height:1.5;color:${textColor};margin:0;">${subcopy}</p>
  </div>
  <div style="margin-bottom:16px;">
    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
      <tr>
        <td style="background-color:${buttonColor};border-radius:6px;text-align:center;">
          <a href="${url}" target="_blank" style="display:inline-block;padding:12px 32px;font-size:16px;font-weight:600;color:${buttonTextColor};text-decoration:none;">
            ${buttonText}
          </a>
        </td>
      </tr>
    </table>
  </div>
</div>`;
  };

  const handleCopy = () => {
    const html = generateEmbedHTML();
    navigator.clipboard.writeText(html).then(() => {
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus(''), 2000);
    }).catch(() => {
      setCopyStatus('Failed to copy');
      setTimeout(() => setCopyStatus(''), 2000);
    });
  };

  return (
    <div className="space-y-6">
      {/* Live Preview */}
      <div>
        <h3 className="text-lg font-medium text-gray-800 mb-1 text-center">Live preview</h3>
        <p className="text-sm text-gray-500 text-center mb-4">Note: changes made here are not saved to your account. Be sure to copy your code before closing.</p>
        <div className="border border-gray-200 rounded-lg p-8 bg-gray-50">
          <div
            style={{
              maxWidth: '600px',
              margin: '0 auto',
              textAlign: 'center',
              fontFamily: 'Arial, sans-serif'
            }}
          >
            {showStarImage && (
              <div style={{ marginBottom: `${starGap}px` }}>
                <img
                  src={FIVE_STAR_IMAGE_URL}
                  alt="5 Stars"
                  style={{ width: `${starSize}px`, height: 'auto', display: 'inline-block' }}
                />
              </div>
            )}
            <div style={{ marginBottom: '0px' }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: textColor,
                margin: '0 0 16px 0'
              }}>
                {heading}
              </h2>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <p style={{
                fontSize: '16px',
                lineHeight: '1.5',
                color: textColor,
                margin: 0
              }}>
                {subcopy}
              </p>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '12px 32px',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: buttonTextColor,
                  backgroundColor: buttonColor,
                  borderRadius: '6px',
                  textDecoration: 'none',
                }}
              >
                {buttonText}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Colors, Sliders, and Copy Buttons */}
      <div className="flex items-end justify-between gap-6 bg-gray-50 p-4 rounded-lg">
        <div className="flex gap-6 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Text</label>
            <input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="w-10 h-10 border border-gray-300 rounded-md cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Button</label>
            <input
              type="color"
              value={buttonColor}
              onChange={(e) => setButtonColor(e.target.value)}
              className="w-10 h-10 border border-gray-300 rounded-md cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Btn Text</label>
            <input
              type="color"
              value={buttonTextColor}
              onChange={(e) => setButtonTextColor(e.target.value)}
              className="w-10 h-10 border border-gray-300 rounded-md cursor-pointer"
            />
          </div>
          <div className="w-28">
            <label className="block text-sm font-medium text-gray-700 mb-1">Stars {starSize}px</label>
            <input
              type="range"
              min="160"
              max="320"
              step="10"
              value={starSize}
              onChange={(e) => setStarSize(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              disabled={!showStarImage}
            />
          </div>
          <div className="w-28">
            <label className="block text-sm font-medium text-gray-700 mb-1">Gap {starGap}px</label>
            <input
              type="range"
              min="-50"
              max="32"
              step="2"
              value={starGap}
              onChange={(e) => setStarGap(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              disabled={!showStarImage}
            />
          </div>
        </div>
        <div className="text-right">
          <button
            type="button"
            className="px-5 py-2.5 bg-slate-blue text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-sm"
            onClick={handleCopy}
          >
            {copyStatus || 'Copy HTML'}
          </button>
        </div>
      </div>

      {/* Customization Options */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Customize your embed</h3>

        {/* URL Input (only if showUrlInput is true) */}
        {showUrlInput && (
          <div className="mb-4">
            <label className="block font-medium text-gray-700 mb-2">
              Prompt Page URL:
            </label>
            <input
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
              placeholder="https://app.promptreviews.app/r/your-slug"
            />
          </div>
        )}

        {/* Heading */}
        <div className="mb-4">
          <label className="block font-medium text-gray-700 mb-2">
            Heading ({heading.length}/{HEADING_CHAR_LIMIT} characters):
          </label>
          <input
            type="text"
            value={heading}
            onChange={(e) => {
              if (e.target.value.length <= HEADING_CHAR_LIMIT) {
                setHeading(e.target.value);
              }
            }}
            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
            placeholder={DEFAULT_HEADING}
          />
          {heading.length >= HEADING_CHAR_LIMIT && (
            <p className="text-xs text-red-600 mt-1">Character limit reached</p>
          )}
        </div>

        {/* Subcopy */}
        <div className="mb-4">
          <label className="block font-medium text-gray-700 mb-2">
            Subcopy ({subcopy.length}/{SUBCOPY_CHAR_LIMIT} characters):
          </label>
          <textarea
            value={subcopy}
            onChange={(e) => {
              if (e.target.value.length <= SUBCOPY_CHAR_LIMIT) {
                setSubcopy(e.target.value);
              }
            }}
            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white resize-none"
            rows={4}
            placeholder={DEFAULT_SUBCOPY}
          />
          {subcopy.length >= SUBCOPY_CHAR_LIMIT && (
            <p className="text-xs text-red-600 mt-1">Character limit reached</p>
          )}
        </div>

        {/* Button Text */}
        <div className="mb-4">
          <label className="block font-medium text-gray-700 mb-2">
            Button text ({buttonText.length}/{BUTTON_TEXT_CHAR_LIMIT} characters):
          </label>
          <input
            type="text"
            value={buttonText}
            onChange={(e) => {
              if (e.target.value.length <= BUTTON_TEXT_CHAR_LIMIT) {
                setButtonText(e.target.value);
              }
            }}
            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
            placeholder={DEFAULT_BUTTON_TEXT}
          />
          {buttonText.length >= BUTTON_TEXT_CHAR_LIMIT && (
            <p className="text-xs text-red-600 mt-1">Character limit reached</p>
          )}
        </div>

        {/* Show 5-Star Image Checkbox */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={showStarImage}
            onChange={(e) => setShowStarImage(e.target.checked)}
            className="w-4 h-4 text-slate-600 border-gray-300 rounded focus:ring-slate-500"
          />
          <label className="font-medium text-gray-700">Show 5-star image</label>
        </div>
      </div>
    </div>
  );
};

export default FiveStarEmbedGenerator;
