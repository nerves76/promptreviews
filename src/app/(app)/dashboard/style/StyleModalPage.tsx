"use client";
import * as React from "react";
// 🔧 CONSOLIDATED: Single import from supabaseClient module
import { createClient, getUserOrMock } from "@/utils/supabaseClient";

const supabase = createClient();
import Icon from "@/components/Icon";

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

// Color preset options are no longer needed since we're using color pickers

// Helper to get font class from fontOptions
function getFontClass(fontName: string) {
  const found = fontOptions.find(f => f.name === fontName);
  return found ? found.class : '';
}

interface StylePageProps {
  onClose?: () => void;
  onStyleUpdate?: (newStyles: any) => void;
  accountId?: string; // Account ID to use for saving styles
}

export default function StylePage({ onClose, onStyleUpdate, accountId: propAccountId }: StylePageProps) {

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
    card_inner_shadow: false,
    card_shadow_color: "#222222",
    card_shadow_intensity: 0.20,
    card_transparency: 1.00,
    card_border_width: 0,
    card_border_color: "#222222",
    card_border_transparency: 1.00,
    kickstarters_background_design: false,
  });

  // Update parent component whenever settings change (but not on initial load)
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [universalPromptPageSlug, setUniversalPromptPageSlug] = React.useState<string | null>(null);
  
  // Helper function to validate hex color
  const isValidHexColor = (hex: string): boolean => {
    return /^#[0-9A-F]{6}$/i.test(hex);
  };

  // Helper function to handle hex input changes
  const handleHexInputChange = (field: string, value: string) => {
    // Allow typing # and partial hex codes
    if (value.startsWith('#') && value.length <= 7) {
      setSettings(s => ({ ...s, [field]: value }));
      
      // Only validate and update if it's a complete hex code
      if (value.length === 7 && isValidHexColor(value)) {
        setSettings(s => ({ ...s, [field]: value.toUpperCase() }));
      }
    } else if (value.length === 6 && /^[0-9A-F]+$/i.test(value)) {
      // If user types without #, add it
      const hexValue = '#' + value.toUpperCase();
      setSettings(s => ({ ...s, [field]: hexValue }));
    }
  };

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
        card_inner_shadow: settings.card_inner_shadow,
        card_shadow_color: settings.card_shadow_color,
        card_shadow_intensity: settings.card_shadow_intensity,
        card_transparency: settings.card_transparency,
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

      // Use prop accountId - should always be provided by parent component
      const accountId = propAccountId;
      if (!accountId) {
        console.log("No account ID provided as prop");
        setLoading(false);
        return;
      }

      const { data: business } = await supabase
        .from("businesses")
        .select("primary_font,secondary_font,primary_color,secondary_color,background_type,background_color,gradient_start,gradient_end,card_bg,card_text,card_inner_shadow,card_shadow_color,card_shadow_intensity,card_transparency,card_border_width,card_border_color,card_border_transparency,kickstarters_background_design")
        .eq("account_id", accountId)
        .single();
      
      // Fetch universal prompt page
      const { data: universalPage } = await supabase
        .from("prompt_pages")
        .select('slug')
        .eq("account_id", accountId)
        .eq("is_universal", true)
        .maybeSingle();
      
      if (universalPage?.slug) {
        setUniversalPromptPageSlug(universalPage.slug);
      }
      
      if (business) {
        setSettings(s => ({
          ...s,
          ...business,
          card_bg: business.card_bg || "#FFFFFF",
          card_text: business.card_text || "#1A1A1A",
          background_color: business.background_color || "#FFFFFF",
          card_inner_shadow: business.card_inner_shadow || false,
          card_shadow_color: business.card_shadow_color || "#222222",
          card_shadow_intensity: business.card_shadow_intensity || 0.20,
          card_transparency: business.card_transparency || 1.00,
          card_border_width: business.card_border_width || 0,
          card_border_color: business.card_border_color || "#222222",
          card_border_transparency: business.card_border_transparency || 1.00,
          kickstarters_background_design: business.kickstarters_background_design ?? false
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
    const modalHeight = Math.min(window.innerHeight * 0.9, 800); // Use 90% of viewport height or 800px max
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

      // Use prop accountId - should always be provided by parent component
      const accountId = propAccountId;
      if (!accountId) {
        alert("No account ID provided");
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
          card_inner_shadow: settings.card_inner_shadow,
          card_shadow_color: settings.card_shadow_color,
          card_shadow_intensity: settings.card_shadow_intensity,
          card_transparency: settings.card_transparency,
          card_border_width: settings.card_border_width,
          card_border_color: settings.card_border_color,
          card_border_transparency: settings.card_border_transparency,
          kickstarters_background_design: settings.kickstarters_background_design,
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
        card_inner_shadow: false,
        card_shadow_color: "#222222",
        card_shadow_intensity: 0.20,
        card_transparency: 1.00,
        card_glassmorphism: false,
        card_backdrop_blur: 0,
        card_border_width: 0,
        card_border_color: "rgba(255, 255, 255, 0.2)",
        kickstarters_background_design: false,
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
      {/* Transparent backdrop - no blur or dark overlay */}
      <div 
        className="absolute inset-0"
        onClick={onClose || (() => window.history.back())}
        aria-label="Close modal"
        style={{ pointerEvents: 'auto' }}
      />
      
      {/* Modal */}
      <div
        className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-2xl shadow-2xl w-full max-w-2xl relative border border-white/20 backdrop-blur-sm"
        style={{
          position: 'absolute',
          left: modalPos.x,
          top: modalPos.y,
          transform: 'none',
          maxHeight: '90vh',
          height: 'auto',
          pointerEvents: 'auto',
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Draggable header */}
        <div className="modal-header flex items-center justify-between p-4 cursor-move bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 rounded-t-2xl">
          <div className="w-1/3">
            <h2 className="text-xl font-semibold text-white">Prompt Page Style</h2>
          </div>
          <div className="w-1/3 flex justify-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
              <Icon name="FaArrowsAlt" className="text-white" size={16} />
            </div>
          </div>
          <div className="w-1/3 flex justify-end items-center gap-2 pr-8">
            <button
              className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/30 transition text-sm border border-white/30"
              onClick={handleReset}
              disabled={saving}
            >
              Reset
            </button>
            <button
              className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/30 transition text-sm border border-white/30"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {/* Circular close button that exceeds modal borders */}
        <button
          className="absolute -top-3 -right-3 bg-white/70 backdrop-blur-sm border border-white/40 rounded-full shadow-lg flex items-center justify-center hover:bg-white/90 focus:outline-none z-20 transition-colors p-2"
          style={{ width: 36, height: 36 }}
          onClick={onClose || (() => window.history.back())}
          aria-label="Close style modal"
        >
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 5rem)' }}>
          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-md p-4 text-center font-medium animate-fadein">
              Style settings saved!
            </div>
          )}
        
        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/30">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-white/80 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-white/90">
              <p>
                Design changes affect all Prompt Pages. Try designing live with your{' '}
                {universalPromptPageSlug ? (
                  <a 
                    href={`/r/${universalPromptPageSlug}`} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white underline hover:text-white/80 transition-colors"
                  >
                    Universal Prompt Page
                  </a>
                ) : (
                  'Universal Prompt Page'
                )}, it's more fun!
              </p>
            </div>
          </div>
        </div>
        <div className="relative my-8 p-6 rounded-lg">
          <div className="bg-white rounded-lg shadow p-6 mx-auto relative" style={{ 
            maxWidth: 800, 
            background: settings.card_glassmorphism 
              ? `${settings.card_bg}${Math.round(settings.card_transparency * 255).toString(16).padStart(2, '0')}`
              : settings.card_bg,
            color: settings.card_text,
            position: 'relative',
            opacity: !settings.card_glassmorphism ? settings.card_transparency : 1,
            backdropFilter: settings.card_glassmorphism && settings.card_backdrop_blur > 0 
              ? `blur(${settings.card_backdrop_blur}px)` 
              : 'none',
            WebkitBackdropFilter: settings.card_glassmorphism && settings.card_backdrop_blur > 0 
              ? `blur(${settings.card_backdrop_blur}px)` 
              : 'none',
            border: settings.card_glassmorphism && settings.card_border_width > 0 
              ? `${settings.card_border_width}px solid ${settings.card_border_color}`
              : 'none'
          }}>
            {settings.card_inner_shadow && (
              <div
                className="pointer-events-none absolute inset-0 rounded-lg"
                style={{
                  boxShadow: `inset 0 0 32px 0 ${settings.card_shadow_color}${Math.round(settings.card_shadow_intensity * 255).toString(16).padStart(2, '0')}`,
                  borderRadius: '0.5rem',
                  zIndex: 1,
                }}
              />
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2 mb-2">
          <div className="flex flex-col gap-6">
        {/* Font pickers */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-5 border border-white/30">
              <label className="block text-sm font-medium text-gray-700 mb-3">Primary Font</label>
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
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-5 border border-white/30">
              <label className="block text-sm font-medium text-gray-700 mb-3">Secondary Font</label>
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
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-5 border border-white/30">
              <label className="block text-sm font-medium text-gray-700 mb-3">Primary Color</label>
                <input type="color" value={settings.primary_color} onChange={e => setSettings(s => ({ ...s, primary_color: e.target.value }))} className="w-full h-10 rounded cursor-pointer" />
                <input 
                  type="text" 
                  value={settings.primary_color} 
                  onChange={e => handleHexInputChange('primary_color', e.target.value)}
                  className="w-full mt-2 px-2 py-1 text-xs border rounded bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent" 
                  placeholder="#000000"
                />
          </div>
          </div>
          <div className="flex flex-col gap-6">
        {/* Background type */}
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-5 border border-white/30">
              <label className="block text-sm font-medium text-gray-700 mb-3">Background Type</label>
          <div className="flex gap-4">
                <label><input type="radio" name="background_type" value="solid" checked={settings.background_type === "solid"} onChange={() => setSettings(s => ({ ...s, background_type: "solid" }))} /><span className="ml-2">Solid</span></label>
                <label><input type="radio" name="background_type" value="gradient" checked={settings.background_type === "gradient"} onChange={() => setSettings(s => ({ ...s, background_type: "gradient" }))} /><span className="ml-2">Gradient</span></label>
          </div>
          {settings.background_type === "solid" && (
            <div className="mt-3">
              <label className="block text-xs text-gray-500 mb-1">Background Color</label>
              <input type="color" value={settings.background_color} onChange={e => setSettings(s => ({ ...s, background_color: e.target.value }))} className="w-full h-10 rounded cursor-pointer" />
              <input 
                type="text" 
                value={settings.background_color} 
                onChange={e => handleHexInputChange('background_color', e.target.value)}
                className="w-full mt-1 px-2 py-1 text-xs border rounded bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent" 
                placeholder="#FFFFFF"
              />
            </div>
          )}
          {settings.background_type === "gradient" && (
            <div className="flex gap-4 mt-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Start</label>
                <input type="color" value={settings.gradient_start} onChange={e => setSettings(s => ({ ...s, gradient_start: e.target.value }))} className="w-full h-10 rounded cursor-pointer" />
                <input 
                  type="text" 
                  value={settings.gradient_start} 
                  onChange={e => handleHexInputChange('gradient_start', e.target.value)}
                  className="w-full mt-1 px-2 py-1 text-xs border rounded bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent" 
                  placeholder="#000000"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">End</label>
                <input type="color" value={settings.gradient_end} onChange={e => setSettings(s => ({ ...s, gradient_end: e.target.value }))} className="w-full h-10 rounded cursor-pointer" />
                <input 
                  type="text" 
                  value={settings.gradient_end} 
                  onChange={e => handleHexInputChange('gradient_end', e.target.value)}
                  className="w-full mt-1 px-2 py-1 text-xs border rounded bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent" 
                  placeholder="#000000"
                />
              </div>
            </div>
          )}
        </div>
        {/* Card background - moved up and with color picker */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-5 border border-white/30">
          <label className="block text-sm font-medium text-gray-700 mb-3">Card Background</label>
          <input type="color" value={settings.card_bg} onChange={e => setSettings(s => ({ ...s, card_bg: e.target.value }))} className="w-full h-10 rounded cursor-pointer" />
          <input 
            type="text" 
            value={settings.card_bg} 
            onChange={e => handleHexInputChange('card_bg', e.target.value)}
            className="w-full mt-2 px-2 py-1 text-xs border rounded bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent" 
            placeholder="#FFFFFF"
          />
        </div>
            {/* Secondary color */}
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-5 border border-white/30">
              <label className="block text-sm font-medium text-gray-700 mb-3">Secondary Color</label>
                <input type="color" value={settings.secondary_color} onChange={e => setSettings(s => ({ ...s, secondary_color: e.target.value }))} className="w-full h-10 rounded cursor-pointer" />
                <input 
                  type="text" 
                  value={settings.secondary_color} 
                  onChange={e => handleHexInputChange('secondary_color', e.target.value)}
                  className="w-full mt-2 px-2 py-1 text-xs border rounded bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent" 
                  placeholder="#000000"
                />
            </div>
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-5 border border-white/30">
              <label className="block text-sm font-medium text-gray-700 mb-3">Card Text Color</label>
              <input type="color" value={settings.card_text} onChange={e => setSettings(s => ({ ...s, card_text: e.target.value }))} className="w-full h-10 rounded cursor-pointer" />
              <input 
                type="text" 
                value={settings.card_text} 
                onChange={e => handleHexInputChange('card_text', e.target.value)}
                className="w-full mt-2 px-2 py-1 text-xs border rounded bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent" 
                placeholder="#1A1A1A"
              />
            </div>
          </div>
        </div>
        
        {/* Card Styling Settings */}
        <div className="mt-8 p-6 bg-white/95 backdrop-blur-sm rounded-xl border border-white/30">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Card Styling</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Card Transparency</label>
              <input
                type="range"
                min="0.5"
                max="1"
                step="0.05"
                value={settings.card_transparency}
                onChange={(e) => setSettings(s => ({ ...s, card_transparency: parseFloat(e.target.value) }))}
                className="w-full"
              />
              <span className="text-xs text-gray-500">{Math.round(settings.card_transparency * 100)}% opacity</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Inner Shadow Vignette</label>
              <select
                value={settings.card_inner_shadow ? 'true' : 'false'}
                onChange={(e) => setSettings(s => ({ ...s, card_inner_shadow: e.target.value === 'true' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="false">No Vignette</option>
                <option value="true">Show Vignette</option>
              </select>
            </div>
            {settings.card_inner_shadow && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Vignette Color</label>
                  <input
                    type="color"
                    value={settings.card_shadow_color}
                    onChange={(e) => setSettings(s => ({ ...s, card_shadow_color: e.target.value }))}
                    className="w-full h-10 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Vignette Intensity</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.card_shadow_intensity}
                    onChange={(e) => setSettings(s => ({ ...s, card_shadow_intensity: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">{Math.round(settings.card_shadow_intensity * 100)}%</span>
                </div>
              </>
            )}

            {/* Kickstarters Background Design */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Kickstarters Design Style</label>
              <select
                value={settings.kickstarters_background_design ? 'true' : 'false'}
                onChange={(e) => setSettings(s => ({ ...s, kickstarters_background_design: e.target.value === 'true' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="true">With Background</option>
                <option value="false">Without Background</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Choose how the inspiration questions appear: with a card background or transparent using card colors.
              </p>
            </div>
          </div>
        </div>

        {/* Border Settings */}
        <div className="mt-8 p-6 bg-white/95 backdrop-blur-sm rounded-xl border border-white/30">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Border Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Border Thickness</label>
              <select
                value={settings.card_border_width}
                onChange={(e) => setSettings(s => ({ ...s, card_border_width: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="0">No border</option>
                <option value="0.5">0.5px (hairline)</option>
                <option value="1">1px (thin)</option>
                <option value="1.5">1.5px</option>
                <option value="2">2px (medium)</option>
                <option value="3">3px (thick)</option>
                <option value="4">4px (extra thick)</option>
              </select>
            </div>
            
            {settings.card_border_width > 0 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Border Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.card_border_color}
                      onChange={(e) => setSettings(s => ({ ...s, card_border_color: e.target.value }))}
                      className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.card_border_color}
                      onChange={(e) => handleHexInputChange('card_border_color', e.target.value)}
                      placeholder="#222222"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Border Transparency: {Math.round(settings.card_border_transparency * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.card_border_transparency}
                    onChange={(e) => setSettings(s => ({ ...s, card_border_transparency: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Transparent</span>
                    <span>Opaque</span>
                  </div>
                </div>
              </>
            )}
          </div>
          
          {settings.card_border_width > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <p className="text-xs text-blue-700">
                <strong>Preview:</strong> {settings.card_border_width}px border with color {settings.card_border_color} at {Math.round(settings.card_border_transparency * 100)}% opacity
              </p>
            </div>
          )}
        </div>

        {/* Bottom action buttons row */}
        <div className="flex justify-end gap-4 mt-10">
          <button
            className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/30 transition text-sm border border-white/30"
            onClick={handleReset}
            disabled={saving}
          >
            Reset
          </button>
          <button
            className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/30 transition text-sm border border-white/30"
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
