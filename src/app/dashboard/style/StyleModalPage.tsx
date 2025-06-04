"use client";
import * as React from "react";
import { createBrowserClient } from "@supabase/ssr";

const fontOptions = [
  { name: "Inter", class: "font-inter" },
  { name: "Roboto", class: "font-roboto" },
  { name: "Open Sans", class: "font-open-sans" },
  // ...add more as needed
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
    <div className="bg-white p-8 rounded-2xl shadow max-w-3xl w-full overflow-y-auto relative" style={{ maxHeight: '80vh' }}>
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-md p-4 text-center font-medium animate-fadein">
          Style settings saved!
        </div>
      )}
      {/* Top-right Save button */}
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

      {/* Preview */}
      <div
        className="relative my-8 p-6 rounded-lg"
        style={{
          background:
            settings.background_type === "solid"
              ? settings.background_color
              : `linear-gradient(to right, ${settings.gradient_start}, ${settings.gradient_end})`,
        }}
      >
        <div className="bg-white rounded-lg shadow p-6 mx-auto" style={{ maxWidth: 800, background: settings.card_bg, color: settings.card_text }}>
          {success && (
            <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200 text-center font-medium animate-fadein">
              Style settings saved!
            </div>
          )}
          <h3
            className="text-xl font-bold mb-2"
            style={{ color: settings.primary_color, fontFamily: settings.primary_font }}
          >
            Preview heading
          </h3>
          <p
            className="mb-4"
            style={{ color: settings.card_text, fontFamily: settings.secondary_font }}
          >
            This is how your background, text, and buttons will look with selected fonts and colors.
          </p>
          <button
            className="px-4 py-2 rounded"
            style={{ background: settings.secondary_color, color: "#fff" }}
          >
            Sample Button
          </button>
        </div>
      </div>

      {/* Font pickers */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Primary Font</label>
          <select
            value={settings.primary_font}
            onChange={e => setSettings(s => ({ ...s, primary_font: e.target.value }))}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            {fontOptions.map(font => (
              <option key={font.name} value={font.name}>
                {font.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Font</label>
          <select
            value={settings.secondary_font}
            onChange={e => setSettings(s => ({ ...s, secondary_font: e.target.value }))}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            {fontOptions.map(font => (
              <option key={font.name} value={font.name}>
                {font.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Color pickers */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={settings.primary_color}
              onChange={e => setSettings(s => ({ ...s, primary_color: e.target.value }))}
              className="w-12 h-8 rounded"
            />
            <input
              type="text"
              value={settings.primary_color}
              readOnly
              className="w-24 px-2 py-1 border rounded bg-gray-50 text-gray-800"
              onFocus={e => e.target.select()}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={settings.secondary_color}
              onChange={e => setSettings(s => ({ ...s, secondary_color: e.target.value }))}
              className="w-12 h-8 rounded"
            />
            <input
              type="text"
              value={settings.secondary_color}
              readOnly
              className="w-24 px-2 py-1 border rounded bg-gray-50 text-gray-800"
              onFocus={e => e.target.select()}
            />
          </div>
        </div>
      </div>

      {/* Background type */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Background Type</label>
        <div className="flex gap-4">
          <label>
            <input
              type="radio"
              name="background_type"
              value="solid"
              checked={settings.background_type === "solid"}
              onChange={() => setSettings(s => ({ ...s, background_type: "solid" }))}
            />
            <span className="ml-2">Solid</span>
          </label>
          <label>
            <input
              type="radio"
              name="background_type"
              value="gradient"
              checked={settings.background_type === "gradient"}
              onChange={() => setSettings(s => ({ ...s, background_type: "gradient" }))}
            />
            <span className="ml-2">Gradient</span>
          </label>
        </div>
        {settings.background_type === "gradient" && (
          <div className="flex gap-4 mt-2">
            <div>
              <label className="block text-xs text-gray-500">Start</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.gradient_start}
                  onChange={e => setSettings(s => ({ ...s, gradient_start: e.target.value }))}
                  className="w-12 h-8 rounded"
                />
                <input
                  type="text"
                  value={settings.gradient_start}
                  readOnly
                  className="w-24 px-2 py-1 border rounded bg-gray-50 text-gray-800"
                  onFocus={e => e.target.select()}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500">End</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.gradient_end}
                  onChange={e => setSettings(s => ({ ...s, gradient_end: e.target.value }))}
                  className="w-12 h-8 rounded"
                />
                <input
                  type="text"
                  value={settings.gradient_end}
                  readOnly
                  className="w-24 px-2 py-1 border rounded bg-gray-50 text-gray-800"
                  onFocus={e => e.target.select()}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Card background and text color options */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Card Background</label>
          <select
            value={settings.card_bg}
            onChange={e => setSettings(s => ({ ...s, card_bg: e.target.value }))}
            className="block w-full rounded-md border-gray-300 shadow-sm"
          >
            {cardBgOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Card Text Color</label>
          <select
            value={settings.card_text}
            onChange={e => setSettings(s => ({ ...s, card_text: e.target.value }))}
            className="block w-full rounded-md border-gray-300 shadow-sm"
          >
            {textColorOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Save button */}
      <div className="mt-8 text-right">
        <button className="px-6 py-2 bg-slate-blue text-white rounded hover:bg-slate-700 transition" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
