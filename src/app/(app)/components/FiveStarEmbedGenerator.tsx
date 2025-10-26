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

const FIVE_STAR_IMAGE_URL = "https://ltneloufqjktdplodvao.supabase.co/storage/v1/object/public/app-assets/5-stars-prompt-reviews.png";

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
  const [copyStatus, setCopyStatus] = useState("");
  const [customUrl, setCustomUrl] = useState(promptPageUrl);

  const url = showUrlInput ? customUrl : promptPageUrl;

  const generateEmbedHTML = () => {
    return `<!-- 5-star review embed by Prompt Reviews promptreviews.app -->
<div style="max-width:600px;margin:0 auto;background:transparent;text-align:center;font-family:Arial,sans-serif;">
  ${showStarImage ? `<div style="margin-bottom:16px;">
    <img src="${FIVE_STAR_IMAGE_URL}" alt="5 Stars" style="width:120px;height:auto;display:inline-block;" />
  </div>` : ''}
  <div style="margin-bottom:12px;">
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
        <h3 className="text-lg font-medium text-gray-800 mb-4">Live preview</h3>
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
              <div style={{ marginBottom: '16px' }}>
                <img
                  src={FIVE_STAR_IMAGE_URL}
                  alt="5 Stars"
                  style={{ width: '120px', height: 'auto', display: 'inline-block' }}
                />
              </div>
            )}
            <div style={{ marginBottom: '12px' }}>
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

        {/* Color Pickers */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block font-medium text-gray-700 mb-2">Text color:</label>
            <input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
            />
          </div>
          <div>
            <label className="block font-medium text-gray-700 mb-2">Button fill:</label>
            <input
              type="color"
              value={buttonColor}
              onChange={(e) => setButtonColor(e.target.value)}
              className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
            />
          </div>
          <div>
            <label className="block font-medium text-gray-700 mb-2">Button text:</label>
            <input
              type="color"
              value={buttonTextColor}
              onChange={(e) => setButtonTextColor(e.target.value)}
              className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
            />
          </div>
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

      {/* HTML Code Output */}
      <div>
        <h3 className="text-lg font-medium text-gray-800 mb-4">Embed code</h3>
        <textarea
          id="five-star-embed-html"
          className="w-full border border-gray-300 rounded-md p-4 font-mono text-sm bg-white resize-none"
          rows={8}
          value={generateEmbedHTML()}
          readOnly
          placeholder="HTML embed code will appear here..."
        />
      </div>

      {/* Copy Button */}
      <div className="flex justify-start">
        <button
          type="button"
          className="px-6 py-3 bg-slate-blue text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          onClick={handleCopy}
        >
          {copyStatus || 'Copy HTML'}
        </button>
      </div>
    </div>
  );
};

export default FiveStarEmbedGenerator;
