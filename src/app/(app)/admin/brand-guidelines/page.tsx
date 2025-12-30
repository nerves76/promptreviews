/**
 * Brand Guidelines Page
 *
 * Quick reference for all brand colors with click-to-copy functionality.
 */

"use client";

import { useState } from 'react';
import Icon from '@/components/Icon';

interface ColorSwatch {
  name: string;
  hex: string;
  tailwind?: string;
  usage: string;
}

interface ColorGroup {
  title: string;
  description: string;
  colors: ColorSwatch[];
}

const brandColors: ColorGroup[] = [
  {
    title: "Primary brand",
    description: "The main brand color used for buttons, links, headings, and icons",
    colors: [
      { name: "Slate Blue", hex: "#2E4A7D", tailwind: "slate-blue", usage: "Primary buttons, headings, links, icons" },
      { name: "Slate Dark", hex: "#1e293b", tailwind: "slate-800", usage: "Sidebar, utility bars, dark UI elements" },
      { name: "Brand Gold", hex: "#FFD700", tailwind: "brand-gold", usage: "Stars, celebrations, rewards only" },
    ]
  },
  {
    title: "App background gradient",
    description: "The signature purple gradient used as the app background",
    colors: [
      { name: "Gradient Top", hex: "#527DE7", tailwind: "—", usage: "Top of page gradient" },
      { name: "Gradient Middle", hex: "#7864C8", tailwind: "—", usage: "Middle of page gradient" },
      { name: "Gradient Bottom", hex: "#914AAE", tailwind: "—", usage: "Bottom of page gradient" },
    ]
  },
  {
    title: "Status colors",
    description: "Used for feedback, alerts, and status indicators. WCAG AA compliant.",
    colors: [
      { name: "Success", hex: "#16a34a", tailwind: "green-600", usage: "Success messages, confirmations" },
      { name: "Error", hex: "#dc2626", tailwind: "red-600", usage: "Errors, destructive actions" },
      { name: "Warning", hex: "#f59e0b", tailwind: "amber-500", usage: "Warnings, cautions" },
      { name: "Info", hex: "#3b82f6", tailwind: "blue-500", usage: "Information, help" },
    ]
  },
  {
    title: "Neutrals (text)",
    description: "Text colors for different hierarchy levels. All WCAG AA compliant on white.",
    colors: [
      { name: "Text Dark", hex: "#111827", tailwind: "gray-900", usage: "Headings, primary text" },
      { name: "Text Body", hex: "#4b5563", tailwind: "gray-600", usage: "Body text, paragraphs" },
      { name: "Text Muted", hex: "#6b7280", tailwind: "gray-500", usage: "Muted text, placeholders, captions" },
    ]
  },
  {
    title: "Neutrals (UI)",
    description: "Background and border colors for UI elements",
    colors: [
      { name: "Border", hex: "#E5E7EB", tailwind: "gray-200", usage: "Borders, dividers" },
      { name: "Background Light", hex: "#F9FAFB", tailwind: "gray-50", usage: "Light backgrounds, hover states" },
      { name: "Background", hex: "#F3F4F6", tailwind: "gray-100", usage: "Card backgrounds, sections" },
      { name: "White", hex: "#FFFFFF", tailwind: "white", usage: "Cards, modals, primary backgrounds" },
    ]
  },
  {
    title: "Glassmorphic effects",
    description: "Semi-transparent colors for frosted glass UI elements",
    colors: [
      { name: "Glass Light", hex: "rgba(255,255,255,0.2)", tailwind: "white/20", usage: "Overlay backgrounds" },
      { name: "Glass Medium", hex: "rgba(255,255,255,0.7)", tailwind: "white/70", usage: "Semi-transparent cards" },
      { name: "Glass Heavy", hex: "rgba(255,255,255,0.9)", tailwind: "white/90", usage: "Readable card backgrounds" },
      { name: "Glass Border", hex: "rgba(255,255,255,0.3)", tailwind: "white/30", usage: "Glass element borders" },
    ]
  },
  {
    title: "Text on gradient",
    description: "White text with opacity for use on the purple gradient background",
    colors: [
      { name: "Text Primary", hex: "rgba(255,255,255,1)", tailwind: "white", usage: "Primary text on gradient" },
      { name: "Text Secondary", hex: "rgba(255,255,255,0.9)", tailwind: "white/90", usage: "Secondary text on gradient" },
      { name: "Text Muted", hex: "rgba(255,255,255,0.7)", tailwind: "white/70", usage: "Muted text on gradient" },
      { name: "Text/Icons Subtle", hex: "rgba(255,255,255,0.6)", tailwind: "white/60", usage: "Subtle icons on gradient" },
    ]
  },
];

function ColorCard({ color, onCopy }: { color: ColorSwatch; onCopy: (text: string, label: string) => void }) {
  const isRgba = color.hex.startsWith('rgba');
  const bgStyle = isRgba
    ? { backgroundColor: color.hex }
    : { backgroundColor: color.hex };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Color swatch */}
      <div
        className="h-20 relative"
        style={bgStyle}
      >
        {isRgba && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
              backgroundSize: '16px 16px',
              backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
              zIndex: 0
            }}
          />
        )}
        <div
          className="absolute inset-0"
          style={bgStyle}
        />
      </div>

      {/* Color info */}
      <div className="p-3">
        <h4 className="font-semibold text-gray-900 text-sm mb-1">{color.name}</h4>

        <div className="space-y-1">
          {/* Hex value */}
          <button
            onClick={() => onCopy(color.hex, `${color.name} hex`)}
            className="flex items-center justify-between w-full text-left group"
          >
            <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-700">
              {color.hex}
            </code>
            <Icon
              name="FaCopy"
              size={12}
              className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </button>

          {/* Tailwind class */}
          {color.tailwind && color.tailwind !== "—" && (
            <button
              onClick={() => onCopy(color.tailwind!, `${color.name} Tailwind`)}
              className="flex items-center justify-between w-full text-left group"
            >
              <code className="text-xs bg-blue-50 px-1.5 py-0.5 rounded font-mono text-blue-700">
                {color.tailwind}
              </code>
              <Icon
                name="FaCopy"
                size={12}
                className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </button>
          )}
        </div>

        <p className="text-xs text-gray-500 mt-2">{color.usage}</p>
      </div>
    </div>
  );
}

export default function BrandGuidelinesPage() {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Brand guidelines</h1>
        <p className="text-gray-600">
          Click any color code to copy it to your clipboard.
        </p>
      </div>

      {/* Toast notification */}
      {copiedText && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in z-50">
          <Icon name="FaCheck" size={14} className="text-green-400" />
          <span className="text-sm">Copied {copiedText}</span>
        </div>
      )}

      {/* Quick reference */}
      <div className="bg-slate-blue text-white rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Quick reference</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div>
            <p className="text-white/70 mb-1">Primary</p>
            <button
              onClick={() => handleCopy('#2E4A7D', 'Primary')}
              className="font-mono hover:bg-white/10 px-2 py-1 rounded transition-colors"
            >
              #2E4A7D
            </button>
          </div>
          <div>
            <p className="text-white/70 mb-1">Slate Dark</p>
            <button
              onClick={() => handleCopy('#1e293b', 'Slate Dark')}
              className="font-mono hover:bg-white/10 px-2 py-1 rounded transition-colors"
            >
              #1e293b
            </button>
          </div>
          <div>
            <p className="text-white/70 mb-1">Success</p>
            <button
              onClick={() => handleCopy('#16a34a', 'Success')}
              className="font-mono hover:bg-white/10 px-2 py-1 rounded transition-colors"
            >
              #16a34a
            </button>
          </div>
          <div>
            <p className="text-white/70 mb-1">Error</p>
            <button
              onClick={() => handleCopy('#dc2626', 'Error')}
              className="font-mono hover:bg-white/10 px-2 py-1 rounded transition-colors"
            >
              #dc2626
            </button>
          </div>
          <div>
            <p className="text-white/70 mb-1">Warning</p>
            <button
              onClick={() => handleCopy('#f59e0b', 'Warning')}
              className="font-mono hover:bg-white/10 px-2 py-1 rounded transition-colors"
            >
              #f59e0b
            </button>
          </div>
        </div>
      </div>

      {/* Color groups */}
      <div className="space-y-10">
        {brandColors.map((group) => (
          <section key={group.title}>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{group.title}</h2>
              <p className="text-sm text-gray-600">{group.description}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {group.colors.map((color) => (
                <ColorCard
                  key={color.name}
                  color={color}
                  onCopy={handleCopy}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Usage guidelines */}
      <section className="mt-12 bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage guidelines</h2>

        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Do</h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <Icon name="FaCheck" size={14} className="text-green-600 mt-0.5 flex-shrink-0" />
                Use <code className="bg-gray-200 px-1 rounded">slate-blue</code> for primary actions
              </li>
              <li className="flex items-start gap-2">
                <Icon name="FaCheck" size={14} className="text-green-600 mt-0.5 flex-shrink-0" />
                Use <code className="bg-gray-200 px-1 rounded">gray-500</code> or darker for readable text
              </li>
              <li className="flex items-start gap-2">
                <Icon name="FaCheck" size={14} className="text-green-600 mt-0.5 flex-shrink-0" />
                Use <code className="bg-gray-200 px-1 rounded">white/70</code> or higher for text on gradients
              </li>
              <li className="flex items-start gap-2">
                <Icon name="FaCheck" size={14} className="text-green-600 mt-0.5 flex-shrink-0" />
                Use opacity variants for hover states (e.g., <code className="bg-gray-200 px-1 rounded">hover:bg-slate-blue/80</code>)
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Don't</h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <Icon name="FaTimes" size={14} className="text-red-600 mt-0.5 flex-shrink-0" />
                Use <code className="bg-gray-200 px-1 rounded">gray-400</code> for text (fails WCAG)
              </li>
              <li className="flex items-start gap-2">
                <Icon name="FaTimes" size={14} className="text-red-600 mt-0.5 flex-shrink-0" />
                Use <code className="bg-gray-200 px-1 rounded">white/50</code> or lower for readable text
              </li>
              <li className="flex items-start gap-2">
                <Icon name="FaTimes" size={14} className="text-red-600 mt-0.5 flex-shrink-0" />
                Create new hex colors - use existing palette
              </li>
              <li className="flex items-start gap-2">
                <Icon name="FaTimes" size={14} className="text-red-600 mt-0.5 flex-shrink-0" />
                Use inline hex values - use Tailwind classes
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CSS Variables reference */}
      <section className="mt-8 bg-gray-900 text-white rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">CSS variables (globals.css)</h2>
        <pre className="text-sm font-mono overflow-x-auto">
{`:root {
  --primary-color: #2E4A7D;
  --text-color: #111827;
  --text-muted: #4b5563;
  --border-color: #E5E7EB;
  --success-color: #16a34a;
  --error-color: #dc2626;
  --warning-color: #f59e0b;
  --info-color: #3b82f6;
  --gradient-top: #527DE7;
  --gradient-middle: #7864C8;
  --gradient-bottom: #914AAE;
}`}
        </pre>
      </section>
    </div>
  );
}
