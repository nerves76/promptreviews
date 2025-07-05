"use client";
import * as React from "react";
// 🔧 CONSOLIDATED: Single import from supabaseClient module
import { supabase, getUserOrMock } from "@/utils/supabaseClient";
import { getAccountIdForUser } from "@/utils/accountUtils";
import { FaArrowsAlt } from "react-icons/fa";

// Only include fonts that are actually loaded and used in the project
const fontOptions = [
  // Google Fonts
  { name: "Inter", class: "font-inter" },
  { name: "Roboto", class: "font-roboto" },
  { name: "Open Sans", class: "font-open-sans" },
  { name: "Lato", class: "font-lato" },
  { name: "Montserrat", class: "font-montserrat" },
  { name: "Poppins", class: "font-poppins" },
  { name: "Source Sans 3", class: "font-source-sans" },
  { name: "Raleway", class: "font-raleway" },
  { name: "Nunito", class: "font-nunito" },
  { name: "Playfair Display", class: "font-playfair" },
  { name: "Merriweather", class: "font-merriweather" },
  { name: "Roboto Slab", class: "font-roboto-slab" },
  { name: "PT Sans", class: "font-pt-sans" },
  { name: "Oswald", class: "font-oswald" },
  { name: "Roboto Condensed", class: "font-roboto-condensed" },
  { name: "Source Serif 4", class: "font-source-serif" },
  { name: "Noto Sans", class: "font-noto-sans" },
  { name: "Ubuntu", class: "font-ubuntu" },
  { name: "Work Sans", class: "font-work-sans" },
  { name: "Quicksand", class: "font-quicksand" },
  { name: "Josefin Sans", class: "font-josefin-sans" },
  { name: "Mukta", class: "font-mukta" },
  { name: "Rubik", class: "font-rubik" },
  { name: "IBM Plex Sans", class: "font-ibm-plex-sans" },
  { name: "Barlow", class: "font-barlow" },
  { name: "Mulish", class: "font-mulish" },
  { name: "Comfortaa", class: "font-comfortaa" },
  { name: "Outfit", class: "font-outfit" },
  { name: "Plus Jakarta Sans", class: "font-plus-jakarta-sans" },
  // Typewriter Fonts
  { name: "Courier Prime", class: "font-courier-prime" },
  { name: "IBM Plex Mono", class: "font-ibm-plex-mono" },
  // System Fonts
  { name: "Arial", class: "font-arial" },
  { name: "Helvetica", class: "font-helvetica" },
  { name: "Verdana", class: "font-verdana" },
  { name: "Tahoma", class: "font-tahoma" },
  { name: "Trebuchet MS", class: "font-trebuchet-ms" },
  { name: "Times New Roman", class: "font-times-new-roman" },
  { name: "Georgia", class: "font-georgia" },
  { name: "Courier New", class: "font-courier-new" },
  { name: "Lucida Console", class: "font-lucida-console" },
  { name: "Palatino", class: "font-palatino" },
  { name: "Garamond", class: "font-garamond" },
];

const cardBgOptions = [
  { name: "Pure White", value: "#FFFFFF" },
  { name: "Off-White", value: "#F7FAFC" },
  { name: "Distinction", value: "#F3F4F6" },
  { name: "Pale Blue", value: "#F0F6FF" },
  { name: "Cream", value: "#FFFBEA" },
];

const textColorOptions = [
  { name: "Black", value: "#1A1A1A" },
  { name: "Charcoal", value: "#22292F" },
  { name: "Dark Gray", value: "#2D3748" },
  { name: "Navy", value: "#1A237E" },
  { name: "Dark Brown", value: "#3E2723" },
];

// Helper to get font class from fontOptions
function getFontClass(fontName: string) {
  const found = fontOptions.find(f => f.name === fontName);
  return found ? found.class : '';
}

interface StylePageProps {
  onClose?: () => void;
  onStyleUpdate?: (newStyles: any) => void;
}

export default function StylePage({ onClose, onStyleUpdate }: StylePageProps) {

  // Draggable modal state
  const [modalPos, setModalPos] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });

  const [settings, setSettings] = React.useState({
    primary_font: "Inter",
    secondary_font: "Roboto",
    primary_color: "#4F46E5",
    secondary_color: "#818CF8",
    background_type: "gradient",
    background_color: "#FFFFFF",
    gradient_start: "#3B82F6",
    gradient_end: "#c026d3",
    card_bg: "#FFFFFF",
    card_text: "#1A1A1A",
  });

  // Update parent component whenever settings change (but not on initial load)
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  
  React.useEffect(() => {
    if (isInitialized && onStyleUpdate) {
      onStyleUpdate({
        primary_font: settings.primary_font,
        secondary_font: settings.secondary_font,
        primary_color: settings.primary_color,
        secondary_color: settings.secondary_color,
        background_type: settings.background_type,
        background_color: settings.background_color,
        gradient_start: settings.gradient_start,
        gradient_end: settings.gradient_end,
        card_bg: settings.card_bg,
        card_text: settings.card_text,
      });
    }
  }, [settings, onStyleUpdate, isInitialized]);

  // Mark as initialized after first load
  React.useEffect(() => {
    if (!loading) {
      setIsInitialized(true);
    }
  }, [loading]);

  // Load current style settings on mount
  async function fetchSettings() {
    setLoading(true);
    try {
      const { data: { user }, error } = await getUserOrMock(supabase);
      if (error || !user) {
        console.log("No authenticated user found for style settings");
        setLoading(false);
        return;
      }

      // Get the account ID for the user
      const accountId = await getAccountIdForUser(user.id, supabase);
      if (!accountId) {
        console.log("No account found for user");
        setLoading(false);
        return;
      }

      const { data: business } = await supabase
        .from("businesses")
        .select("primary_font,secondary_font,primary_color,secondary_color,background_type,background_color,gradient_start,gradient_end,card_bg,card_text")
        .eq("account_id", accountId)
        .single();
      
      if (business) {
        setSettings(s => ({
          ...s,
          ...business,
          card_bg: business.card_bg || "#FFFFFF",
          card_text: business.card_text || "#1A1A1A",
          background_color: business.background_color || "#FFFFFF"
        }));
      }
    } catch (error) {
      console.error("Error fetching style settings:", error);
    }
    setLoading(false);
  }

  // Center modal on mount
  React.useEffect(() => {
    const modalWidth = 672; // max-w-2xl
    const modalHeight = 600;
    const x = Math.max(0, (window.innerWidth - modalWidth) / 2);
    const y = Math.max(0, (window.innerHeight - modalHeight) / 2);
    setModalPos({ x, y });
  }, []);

  // Handle dragging
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setModalPos({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  React.useEffect(() => {
    fetchSettings();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const { data: { user }, error } = await getUserOrMock(supabase);
      if (error || !user) {
        alert("Not signed in");
        setSaving(false);
        return;
      }

      // Get the account ID for the user
      const accountId = await getAccountIdForUser(user.id, supabase);
      if (!accountId) {
        alert("No account found for user");
        setSaving(false);
        return;
      }

      const { error: updateError } = await supabase
        .from("businesses")
        .update({
          primary_font: settings.primary_font,
          secondary_font: settings.secondary_font,
          primary_color: settings.primary_color,
          secondary_color: settings.secondary_color,
          background_type: settings.background_type,
          background_color: settings.background_color,
          gradient_start: settings.gradient_start,
          gradient_end: settings.gradient_end,
          card_bg: settings.card_bg,
          card_text: settings.card_text,
        })
        .eq("account_id", accountId);
      
      setSaving(false);
      if (updateError) {
        alert("Failed to save style settings: " + updateError.message);
      } else {
        setSuccess(true);
        fetchSettings();
        setTimeout(() => setSuccess(false), 2000);
      }
    } catch (error) {
      console.error("Error saving style settings:", error);
      alert("Failed to save style settings. Please try again.");
      setSaving(false);
    }
  }

  function handleReset() {
    if (window.confirm('Are you sure you want to reset all style settings to default? This cannot be undone.')) {
      setSettings({
        primary_font: "Inter",
        secondary_font: "Roboto",
        primary_color: "#4F46E5",
        secondary_color: "#818CF8",
        background_type: "gradient",
        background_color: "#FFFFFF",
        gradient_start: "#3B82F6",
        gradient_end: "#c026d3",
        card_bg: "#FFFFFF",
        card_text: "#1A1A1A",
      });
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest('.modal-header')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - modalPos.x,
        y: e.clientY - modalPos.y,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl pointer-events-auto relative"
        style={{
          position: 'absolute',
          left: modalPos.x,
          top: modalPos.y,
          transform: 'none',
          maxHeight: '80vh',
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Draggable header */}
        <div className="modal-header flex items-center justify-between p-4 border-b cursor-move bg-slate-100 rounded-t-2xl">
          <div className="w-1/3">
            <h2 className="text-xl font-semibold text-slate-blue">Prompt Page Style</h2>
          </div>
          <div className="w-1/3 flex justify-center text-gray-400">
            <FaArrowsAlt />
          </div>
          <div className="w-1/3 flex justify-end items-center gap-2 pr-8">
            <button
              className="px-4 py-1 border border-slate-300 bg-white text-slate-blue rounded-md font-semibold shadow-sm hover:bg-slate-50 transition text-sm"
              onClick={handleReset}
              disabled={saving}
            >
              Reset
            </button>
            <button
              className="px-5 py-2 bg-slate-blue text-white rounded-md font-semibold shadow hover:bg-slate-700 transition"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {/* Circular close button that exceeds modal borders */}
        <button
          className="absolute -top-2 -right-2 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center hover:bg-gray-100 focus:outline-none z-20 transition-colors p-2"
          style={{ width: 32, height: 32 }}
          onClick={onClose || (() => window.history.back())}
          aria-label="Close style modal"
        >
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 4rem)' }}>
          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-md p-4 text-center font-medium animate-fadein">
              Style settings saved!
            </div>
          )}
        
        <div className="flex items-center gap-2 mb-6">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-gray-500">
            Design changes affect all Prompt Pages.
          </p>
        </div>
        <div className="relative my-8 p-6 rounded-lg">
          <div className="bg-white rounded-lg shadow p-6 mx-auto" style={{ maxWidth: 800, background: settings.card_bg, color: settings.card_text }}>
            {success && (
              <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200 text-center font-medium animate-fadein">
                Style settings saved!
              </div>
            )}
            <h3 className={`text-xl font-bold mb-2 ${getFontClass(settings.primary_font)}`} style={{ color: settings.primary_color }}>
              Preview heading
            </h3>
            <p className={`mb-4 ${getFontClass(settings.secondary_font)}`} style={{ color: settings.card_text }}>
              This is how your background, text, and buttons will look with selected fonts and colors.
            </p>
            <button className="px-4 py-2 rounded" style={{ background: settings.secondary_color, color: "#fff" }}>
              Sample Button
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 mt-2 mb-2">
          <div className="flex flex-col gap-8">
        {/* Font pickers */}
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-5">Primary Font</label>
            <select
              value={settings.primary_font}
              onChange={e => setSettings(s => ({ ...s, primary_font: e.target.value }))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <optgroup label="Google Fonts">
                {fontOptions.filter(f => !["Arial","Helvetica","Verdana","Tahoma","Trebuchet MS","Times New Roman","Georgia","Courier New","Lucida Console","Palatino","Garamond"].includes(f.name)).map(font => (
                    <option key={font.name} value={font.name}>{font.name}</option>
                ))}
              </optgroup>
              <optgroup label="System Fonts">
                {fontOptions.filter(f => ["Arial","Helvetica","Verdana","Tahoma","Trebuchet MS","Times New Roman","Georgia","Courier New","Lucida Console","Palatino","Garamond"].includes(f.name)).map(font => (
                    <option key={font.name} value={font.name}>{font.name}</option>
                ))}
              </optgroup>
            </select>
            <p className="text-xs text-gray-500 mt-1">System fonts may look different on different devices.</p>
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-5">Secondary Font</label>
            <select
              value={settings.secondary_font}
              onChange={e => setSettings(s => ({ ...s, secondary_font: e.target.value }))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <optgroup label="Google Fonts">
                {fontOptions.filter(f => !["Arial","Helvetica","Verdana","Tahoma","Trebuchet MS","Times New Roman","Georgia","Courier New","Lucida Console","Palatino","Garamond"].includes(f.name)).map(font => (
                    <option key={font.name} value={font.name}>{font.name}</option>
                ))}
              </optgroup>
              <optgroup label="System Fonts">
                {fontOptions.filter(f => ["Arial","Helvetica","Verdana","Tahoma","Trebuchet MS","Times New Roman","Georgia","Courier New","Lucida Console","Palatino","Garamond"].includes(f.name)).map(font => (
                    <option key={font.name} value={font.name}>{font.name}</option>
                ))}
              </optgroup>
            </select>
            <p className="text-xs text-gray-500 mt-1">System fonts may look different on different devices.</p>
          </div>
            {/* Primary color */}
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-5">Primary Color</label>
            <div className="flex items-center gap-2">
                <input type="color" value={settings.primary_color} onChange={e => setSettings(s => ({ ...s, primary_color: e.target.value }))} className="w-12 h-8 rounded" />
                <input type="text" value={settings.primary_color} readOnly className="w-24 px-2 py-1 border rounded bg-gray-50 text-gray-800" onFocus={e => e.target.select()} />
          </div>
            </div>
          </div>
          <div className="flex flex-col gap-8">
        {/* Background type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-5">Background Type</label>
          <div className="flex gap-4">
                <label><input type="radio" name="background_type" value="solid" checked={settings.background_type === "solid"} onChange={() => setSettings(s => ({ ...s, background_type: "solid" }))} /><span className="ml-2">Solid</span></label>
                <label><input type="radio" name="background_type" value="gradient" checked={settings.background_type === "gradient"} onChange={() => setSettings(s => ({ ...s, background_type: "gradient" }))} /><span className="ml-2">Gradient</span></label>
          </div>
          {settings.background_type === "gradient" && (
            <div className="flex gap-4 mt-2">
              <div>
                <label className="block text-xs text-gray-500">Start</label>
                <div className="flex items-center gap-2">
                      <input type="color" value={settings.gradient_start} onChange={e => setSettings(s => ({ ...s, gradient_start: e.target.value }))} className="w-12 h-8 rounded" />
                      <input type="text" value={settings.gradient_start} readOnly className="w-24 px-2 py-1 border rounded bg-gray-50 text-gray-800" onFocus={e => e.target.select()} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500">End</label>
                <div className="flex items-center gap-2">
                      <input type="color" value={settings.gradient_end} onChange={e => setSettings(s => ({ ...s, gradient_end: e.target.value }))} className="w-12 h-8 rounded" />
                      <input type="text" value={settings.gradient_end} readOnly className="w-24 px-2 py-1 border rounded bg-gray-50 text-gray-800" onFocus={e => e.target.select()} />
                </div>
              </div>
            </div>
          )}
        </div>
            {/* Secondary color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-5">Secondary Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={settings.secondary_color} onChange={e => setSettings(s => ({ ...s, secondary_color: e.target.value }))} className="w-12 h-8 rounded" />
                <input type="text" value={settings.secondary_color} readOnly className="w-24 px-2 py-1 border rounded bg-gray-50 text-gray-800" onFocus={e => e.target.select()} />
              </div>
            </div>
        {/* Card background and text color options */}
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-5">Card Background</label>
              <select value={settings.card_bg} onChange={e => setSettings(s => ({ ...s, card_bg: e.target.value }))} className="block w-full rounded-md border-gray-300 shadow-sm">
                {cardBgOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.name}</option>))}
            </select>
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-5">Card Text Color</label>
              <select value={settings.card_text} onChange={e => setSettings(s => ({ ...s, card_text: e.target.value }))} className="block w-full rounded-md border-gray-300 shadow-sm">
                {textColorOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.name}</option>))}
            </select>
            </div>
          </div>
        </div>
        {/* Bottom action buttons row */}
        <div className="flex justify-end gap-4 mt-10">
          <button
            className="px-4 py-1 border border-slate-300 bg-white text-slate-blue rounded-md font-semibold shadow-sm hover:bg-slate-50 transition text-sm"
            onClick={handleReset}
            disabled={saving}
          >
            Reset
          </button>
          <button
            className="px-5 py-2 bg-slate-blue text-white rounded font-semibold shadow hover:bg-slate-700 transition"
            style={{ minWidth: 90 }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
