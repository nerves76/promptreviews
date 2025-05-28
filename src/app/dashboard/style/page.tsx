'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useAuthGuard } from '@/utils/authGuard';
import { HexColorPicker } from 'react-colorful';
import { FaPalette, FaSwatchbook } from 'react-icons/fa';
import { getUserOrMock } from '@/utils/supabase';
import DashboardCard from '../components/DashboardCard';
import FiveStarSpinner from '@/app/components/FiveStarSpinner';

interface StyleSettings {
  primary_font: string;
  secondary_font: string;
  header_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  background_type: 'solid' | 'gradient' | 'none';
  gradient_start: string;
  gradient_middle: string;
  gradient_end: string;
}

const fontOptions = [
  { name: 'Inter', class: 'font-inter' },
  { name: 'Roboto', class: 'font-roboto' },
  { name: 'Open Sans', class: 'font-open-sans' },
  { name: 'Lato', class: 'font-lato' },
  { name: 'Montserrat', class: 'font-montserrat' },
  { name: 'Poppins', class: 'font-poppins' },
  { name: 'Source Sans 3', class: 'font-source-sans' },
  { name: 'Raleway', class: 'font-raleway' },
  { name: 'Nunito', class: 'font-nunito' },
  { name: 'Playfair Display', class: 'font-playfair' },
  { name: 'Merriweather', class: 'font-merriweather' },
  { name: 'Roboto Slab', class: 'font-roboto-slab' },
  { name: 'PT Sans', class: 'font-pt-sans' },
  { name: 'Oswald', class: 'font-oswald' },
  { name: 'Roboto Condensed', class: 'font-roboto-condensed' },
  { name: 'Source Serif 4', class: 'font-source-serif' },
  { name: 'Noto Sans', class: 'font-noto-sans' },
  { name: 'Ubuntu', class: 'font-ubuntu' },
  { name: 'Work Sans', class: 'font-work-sans' },
  { name: 'Quicksand', class: 'font-quicksand' },
  { name: 'Josefin Sans', class: 'font-josefin-sans' },
  { name: 'Mukta', class: 'font-mukta' },
  { name: 'Rubik', class: 'font-rubik' },
  { name: 'IBM Plex Sans', class: 'font-ibm-plex-sans' },
  { name: 'Barlow', class: 'font-barlow' },
  { name: 'Mulish', class: 'font-mulish' },
  { name: 'Comfortaa', class: 'font-comfortaa' },
  { name: 'Outfit', class: 'font-outfit' },
  { name: 'Plus Jakarta Sans', class: 'font-plus-jakarta-sans' }
];

export default function StylePage() {
  useAuthGuard();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [settings, setSettings] = useState<StyleSettings>({
    primary_font: 'Inter',
    secondary_font: 'Inter',
    header_color: '#4F46E5',
    secondary_color: '#818CF8',
    background_color: '#FFFFFF',
    text_color: '#1F2937',
    background_type: 'gradient',
    gradient_start: '#4F46E5',
    gradient_middle: '#818CF8',
    gradient_end: '#C7D2FE'
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data: { user }, error: userError } = await getUserOrMock(supabase);
        if (userError) throw userError;
        if (!user) {
          setError('Not authenticated');
          setIsLoading(false);
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('businesses')
          .select('*')
          .eq('account_id', user.id)
          .single();

        if (fetchError) {
          console.error('Error fetching settings:', fetchError);
          throw new Error(fetchError.message);
        }

        if (data) {
          setSettings({
            primary_font: data.primary_font || 'Inter',
            secondary_font: data.secondary_font || 'Inter',
            header_color: data.header_color || '#4F46E5',
            secondary_color: data.secondary_color || '#818CF8',
            background_color: data.background_color || '#FFFFFF',
            text_color: data.text_color || '#1F2937',
            background_type: data.background_type || 'gradient',
            gradient_start: data.gradient_start || '#4F46E5',
            gradient_middle: data.gradient_middle || '#818CF8',
            gradient_end: data.gradient_end || '#C7D2FE'
          });
        } else {
          // If no data exists, use default settings
          setSettings({
            primary_font: 'Inter',
            secondary_font: 'Inter',
            header_color: '#4F46E5',
            secondary_color: '#818CF8',
            background_color: '#FFFFFF',
            text_color: '#1F2937',
            background_type: 'gradient',
            gradient_start: '#4F46E5',
            gradient_middle: '#818CF8',
            gradient_end: '#C7D2FE'
          });
        }
      } catch (err) {
        console.error('Error in fetchSettings:', err);
        setError(err instanceof Error ? err.message : 'Failed to load style settings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [supabase]);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: { user } } = await getUserOrMock(supabase);
      if (!user) throw new Error('Not authenticated');

      const { error: updateError } = await supabase
        .from('businesses')
        .update({
          primary_font: settings.primary_font,
          secondary_font: settings.secondary_font,
          header_color: settings.header_color,
          secondary_color: settings.secondary_color,
          background_color: settings.background_color,
          text_color: settings.text_color,
          background_type: settings.background_type,
          gradient_start: settings.gradient_start,
          gradient_middle: settings.gradient_middle,
          gradient_end: settings.gradient_end
        })
        .eq('account_id', user.id);

      if (updateError) throw updateError;
      setSuccess('Style settings saved successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save style settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <div className="mb-4"><FiveStarSpinner /></div>
          <p className="mt-4 text-gray-600">Loading style settings...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardCard>
      <div className="absolute -top-6 -left-6 z-10 bg-white rounded-full shadow p-3 flex items-center justify-center">
        <FaPalette className="w-9 h-9 text-[#1A237E]" />
      </div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col">
          <h1 className="text-4xl font-bold text-[#1A237E]">Style settings</h1>
          {/* Optionally add subcopy here if needed */}
        </div>
      </div>

      {/* Color Scheme Section */}
      <div className="mb-16">
        <h2 className="mt-20 text-2xl font-bold text-[#1A237E] flex items-center gap-3 mb-12">
          <FaSwatchbook className="w-7 h-7 text-[#1A237E]" />
          Color scheme
        </h2>
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-md">
            {success}
          </div>
        )}

        <div className="space-y-6">
          {/* Font Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Font
              </label>
              <select
                value={settings.primary_font}
                onChange={(e) => setSettings({ ...settings, primary_font: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {fontOptions.map((font) => (
                  <option key={font.name} value={font.class}>
                    {font.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secondary Font
              </label>
              <select
                value={settings.secondary_font}
                onChange={(e) => setSettings({ ...settings, secondary_font: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {fontOptions.map((font) => (
                  <option key={font.name} value={font.class}>
                    {font.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Color Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Header color
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={settings.header_color}
                  onChange={(e) => setSettings({ ...settings, header_color: e.target.value })}
                  className="h-8 w-8 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.header_color}
                  onChange={(e) => {
                    let value = e.target.value.trim();
                    // Remove any non-hex characters except #
                    value = value.replace(/[^#0-9A-Fa-f]/g, '');
                    // Ensure # prefix
                    if (!value.startsWith('#')) {
                      value = '#' + value;
                    }
                    // Pad with zeros if needed
                    if (value.length < 7) {
                      value = value + '0'.repeat(7 - value.length);
                    }
                    // Truncate if too long
                    if (value.length > 7) {
                      value = value.slice(0, 7);
                    }
                    setSettings({ ...settings, header_color: value });
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Button color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings.secondary_color}
                  onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                  className="h-10 w-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.secondary_color}
                  onChange={(e) => {
                    let value = e.target.value.trim();
                    // Remove any non-hex characters except #
                    value = value.replace(/[^#0-9A-Fa-f]/g, '');
                    // Ensure # prefix
                    if (!value.startsWith('#')) {
                      value = '#' + value;
                    }
                    // Pad with zeros if needed
                    if (value.length < 7) {
                      value = value + '0'.repeat(7 - value.length);
                    }
                    // Truncate if too long
                    if (value.length > 7) {
                      value = value.slice(0, 7);
                    }
                    setSettings({ ...settings, secondary_color: value });
                  }}
                  className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="#000000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text color
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={settings.text_color}
                  onChange={(e) => setSettings({ ...settings, text_color: e.target.value })}
                  className="h-8 w-8 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.text_color}
                  onChange={(e) => {
                    let value = e.target.value.trim();
                    // Remove any non-hex characters except #
                    value = value.replace(/[^#0-9A-Fa-f]/g, '');
                    // Ensure # prefix
                    if (!value.startsWith('#')) {
                      value = '#' + value;
                    }
                    // Pad with zeros if needed
                    if (value.length < 7) {
                      value = value + '0'.repeat(7 - value.length);
                    }
                    // Truncate if too long
                    if (value.length > 7) {
                      value = value.slice(0, 7);
                    }
                    setSettings({ ...settings, text_color: value });
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Background Settings */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Background type
              </label>
              <div className="flex gap-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="none"
                    checked={settings.background_type === 'none'}
                    onChange={(e) => setSettings({ ...settings, background_type: 'none' })}
                    className="form-radio h-4 w-4 text-indigo-600"
                  />
                  <span className="ml-2 text-sm">No Background</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="solid"
                    checked={settings.background_type === 'solid'}
                    onChange={(e) => setSettings({ ...settings, background_type: 'solid' })}
                    className="form-radio h-4 w-4 text-indigo-600"
                  />
                  <span className="ml-2 text-sm">Solid Color</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="gradient"
                    checked={settings.background_type === 'gradient'}
                    onChange={(e) => setSettings({ ...settings, background_type: 'gradient' })}
                    className="form-radio h-4 w-4 text-indigo-600"
                  />
                  <span className="ml-2 text-sm">Gradient</span>
                </label>
              </div>
            </div>

            {settings.background_type === 'solid' ? (
              <div>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={settings.background_color}
                    onChange={(e) => setSettings({ ...settings, background_color: e.target.value })}
                    className="h-8 w-8 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.background_color}
                    onChange={(e) => {
                      let value = e.target.value.trim();
                      // Remove any non-hex characters except #
                      value = value.replace(/[^#0-9A-Fa-f]/g, '');
                      // Ensure # prefix
                      if (!value.startsWith('#')) {
                        value = '#' + value;
                      }
                      // Pad with zeros if needed
                      if (value.length < 7) {
                        value = value + '0'.repeat(7 - value.length);
                      }
                      // Truncate if too long
                      if (value.length > 7) {
                        value = value.slice(0, 7);
                      }
                      setSettings({ ...settings, background_color: value });
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            ) : settings.background_type === 'gradient' ? (
              <div className="space-y-4">
                <div className="relative h-16 w-full rounded-lg overflow-hidden">
                  <div 
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(to right, ${settings.gradient_start}, ${settings.gradient_end})`
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex space-x-4">
                      <div className="flex flex-col items-center">
                        <input
                          type="color"
                          value={settings.gradient_start}
                          onChange={(e) => setSettings({ ...settings, gradient_start: e.target.value })}
                          className="h-6 w-6 rounded cursor-pointer border-2 border-white shadow-lg"
                        />
                        <span className="text-xs text-white mt-1 drop-shadow-lg">Start</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <input
                          type="color"
                          value={settings.gradient_end}
                          onChange={(e) => setSettings({ ...settings, gradient_end: e.target.value })}
                          className="h-6 w-6 rounded cursor-pointer border-2 border-white shadow-lg"
                        />
                        <span className="text-xs text-white mt-1 drop-shadow-lg">End</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={settings.gradient_start}
                      onChange={(e) => {
                        let value = e.target.value.trim();
                        // Remove any non-hex characters except #
                        value = value.replace(/[^#0-9A-Fa-f]/g, '');
                        // Ensure # prefix
                        if (!value.startsWith('#')) {
                          value = '#' + value;
                        }
                        // Pad with zeros if needed
                        if (value.length < 7) {
                          value = value + '0'.repeat(7 - value.length);
                        }
                        // Truncate if too long
                        if (value.length > 7) {
                          value = value.slice(0, 7);
                        }
                        setSettings({ ...settings, gradient_start: value });
                      }}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Start color"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={settings.gradient_end}
                      onChange={(e) => {
                        let value = e.target.value.trim();
                        // Remove any non-hex characters except #
                        value = value.replace(/[^#0-9A-Fa-f]/g, '');
                        // Ensure # prefix
                        if (!value.startsWith('#')) {
                          value = '#' + value;
                        }
                        // Pad with zeros if needed
                        if (value.length < 7) {
                          value = value + '0'.repeat(7 - value.length);
                        }
                        // Truncate if too long
                        if (value.length > 7) {
                          value = value.slice(0, 7);
                        }
                        setSettings({ ...settings, gradient_end: value });
                      }}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="End color"
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Preview */}
          <div className="mt-8 p-6 rounded-lg border">
            <div 
              className="p-6 rounded-lg bg-gray-50 border shadow-sm"
              style={{
                background: settings.background_type === 'solid'
                  ? settings.background_color
                  : settings.background_type === 'gradient'
                    ? `linear-gradient(to bottom right, ${settings.gradient_start}, ${settings.gradient_end})`
                    : 'none'
              }}
            >
              <div className="bg-gray-50 p-6 rounded-lg border">
                <h2 className={`text-xl font-bold mb-4 ${settings.primary_font}`} style={{ color: settings.header_color }}>
                  Preview heading
                </h2>
                <p className={settings.secondary_font} style={{ color: settings.text_color }}>
                  This is how your text will look with the selected fonts and colors. The heading uses your primary font and color, while this paragraph uses your secondary font and text color.
                </p>
                <button
                  className="mt-4 px-4 py-2 rounded"
                  style={{ backgroundColor: settings.secondary_color, color: '#FFFFFF' }}
                >
                  Sample Button
                </button>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-8">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full md:w-auto px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
} 