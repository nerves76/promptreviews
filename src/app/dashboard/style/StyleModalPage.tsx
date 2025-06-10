"use client";
import * as React from "react";
import { createBrowserClient } from "@supabase/ssr";

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

export default function StylePage() {
  const supabase = React.useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

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
    showQuotes: false,
    showRelativeDate: false,
    vignetteShadow: false,
    vignetteIntensity: 0.2,
    vignetteColor: "#222222",
  });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  // Load current style settings on mount
  async function fetchSettings() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setLoading(false);
    const { data: business } = await supabase
      .from("businesses")
      .select("primary_font,secondary_font,primary_color,secondary_color,background_type,background_color,gradient_start,gradient_end,card_bg,card_text")
      .eq("account_id", user.id)
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
    setLoading(false);
  }

  React.useEffect(() => {
    fetchSettings();
  }, [supabase]);

  async function handleSave() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Not signed in");
      setSaving(false);
      return;
    }
    const { error } = await supabase
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
      .eq("account_id", user.id);
    setSaving(false);
    if (error) {
      alert("Failed to save style settings: " + error.message);
    } else {
      setSuccess(true);
      fetchSettings();
      setTimeout(() => setSuccess(false), 2000);
    }
  }

  return (
    <div className="bg-white p-8 rounded-2xl shadow max-w-2xl w-full overflow-y-auto relative" style={{ maxHeight: '80vh' }}>
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-md p-4 text-center font-medium animate-fadein">
          Style settings saved!
        </div>
      )}
      <button
        className="absolute top-6 right-8 px-5 py-2 bg-slate-blue text-white rounded font-semibold shadow hover:bg-slate-700 transition z-10"
        style={{ minWidth: 90 }}
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "Saving..." : "Save"}
      </button>
      <h2 className="text-2xl font-bold text-slate-blue mb-4">Prompt page style</h2>
      <p className="text-gray-600 mb-6">
        Use these settings to make your prompt pages match your brand.
      </p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-6">
          {/* Font pickers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Primary Font</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Font</label>
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
          {/* Color pickers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={settings.primary_color} onChange={e => setSettings(s => ({ ...s, primary_color: e.target.value }))} className="w-12 h-8 rounded" />
              <input type="text" value={settings.primary_color} readOnly className="w-24 px-2 py-1 border rounded bg-gray-50 text-gray-800" onFocus={e => e.target.select()} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={settings.secondary_color} onChange={e => setSettings(s => ({ ...s, secondary_color: e.target.value }))} className="w-12 h-8 rounded" />
              <input type="text" value={settings.secondary_color} readOnly className="w-24 px-2 py-1 border rounded bg-gray-50 text-gray-800" onFocus={e => e.target.select()} />
            </div>
          </div>
          {/* Card background and text color options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Card Background</label>
            <select value={settings.card_bg} onChange={e => setSettings(s => ({ ...s, card_bg: e.target.value }))} className="block w-full rounded-md border-gray-300 shadow-sm">
              {cardBgOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Card Text Color</label>
            <select value={settings.card_text} onChange={e => setSettings(s => ({ ...s, card_text: e.target.value }))} className="block w-full rounded-md border-gray-300 shadow-sm">
              {textColorOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.name}</option>))}
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-6">
          {/* Background type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Background Type</label>
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
          {/* Toggles and vignette controls for balance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Show Quotes</label>
            <input type="checkbox" checked={settings.showQuotes} onChange={e => setSettings(s => ({ ...s, showQuotes: e.target.checked }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Show Relative Date</label>
            <input type="checkbox" checked={settings.showRelativeDate} onChange={e => setSettings(s => ({ ...s, showRelativeDate: e.target.checked }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vignette Shadow</label>
            <input type="checkbox" checked={settings.vignetteShadow} onChange={e => setSettings(s => ({ ...s, vignetteShadow: e.target.checked }))} />
          </div>
          {/* Vignette Intensity and Color controls */}
          {settings.vignetteShadow && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs text-gray-500">Vignette Intensity</label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={settings.vignetteIntensity ?? 0.2}
                  onChange={e => setSettings(s => ({ ...s, vignetteIntensity: parseFloat(e.target.value) }))}
                  className="w-full"
                  style={{ maxWidth: 120 }}
                />
                <span className="text-xs text-gray-500 ml-2">{Math.round((settings.vignetteIntensity ?? 0.2) * 100)}%</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs text-gray-500">Vignette Color</label>
                <input
                  type="color"
                  value={settings.vignetteColor || '#222222'}
                  onChange={e => setSettings(s => ({ ...s, vignetteColor: e.target.value }))}
                  className="h-6 w-10 border border-gray-300 rounded"
                />
              </div>
            </>
          )}
        </div>
      </div>
      <div className="mt-8 text-right">
        <button className="px-6 py-2 bg-slate-blue text-white rounded hover:bg-slate-700 transition" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
