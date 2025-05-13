'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useAuthGuard } from '@/utils/authGuard';

interface StyleSettings {
  primary_font: string;
  secondary_font: string;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
}

const FONT_OPTIONS = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Source Sans Pro',
  'Raleway',
  'Nunito',
  'Playfair Display'
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
    primary_color: '#4F46E5',
    secondary_color: '#818CF8',
    background_color: '#FFFFFF',
    text_color: '#1F2937'
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('businesses')
          .select('primary_font, secondary_font, primary_color, secondary_color, background_color, text_color')
          .eq('account_id', user.id)
          .single();

        if (error) throw error;
        if (data) {
          setSettings({
            primary_font: data.primary_font || 'Inter',
            secondary_font: data.secondary_font || 'Inter',
            primary_color: data.primary_color || '#4F46E5',
            secondary_color: data.secondary_color || '#818CF8',
            background_color: data.background_color || '#FFFFFF',
            text_color: data.text_color || '#1F2937'
          });
        }
      } catch (err) {
        setError('Failed to load style settings');
        console.error('Error loading style settings:', err);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('businesses')
        .update({
          primary_font: settings.primary_font,
          secondary_font: settings.secondary_font,
          primary_color: settings.primary_color,
          secondary_color: settings.secondary_color,
          background_color: settings.background_color,
          text_color: settings.text_color
        })
        .eq('account_id', user.id);

      if (error) throw error;
      setSuccess('Style settings saved successfully!');
    } catch (err) {
      setError('Failed to save style settings');
      console.error('Error saving style settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-indigo-300 to-purple-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading style settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-indigo-300 to-purple-200 py-12">
      <div className="max-w-[1000px] mx-auto bg-white rounded-lg shadow p-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">Style Settings</h1>
          
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
                  {FONT_OPTIONS.map((font) => (
                    <option key={font} value={font}>
                      {font}
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
                  {FONT_OPTIONS.map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Color Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={settings.primary_color}
                    onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                    className="h-8 w-8 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.primary_color}
                    onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secondary Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={settings.secondary_color}
                    onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                    className="h-8 w-8 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.secondary_color}
                    onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Background Color
                </label>
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
                    onChange={(e) => setSettings({ ...settings, background_color: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Text Color
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
                    onChange={(e) => setSettings({ ...settings, text_color: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="mt-8 p-6 rounded-lg border" style={{ backgroundColor: settings.background_color }}>
              <h2 className="text-xl font-bold mb-4" style={{ fontFamily: settings.primary_font, color: settings.primary_color }}>
                Preview Heading
              </h2>
              <p style={{ fontFamily: settings.secondary_font, color: settings.text_color }}>
                This is how your text will look with the selected fonts and colors. The heading uses your primary font and color, while this paragraph uses your secondary font and text color.
              </p>
              <button
                className="mt-4 px-4 py-2 rounded"
                style={{ backgroundColor: settings.secondary_color, color: '#FFFFFF' }}
              >
                Sample Button
              </button>
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
      </div>
    </div>
  );
} 