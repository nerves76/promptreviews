'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/auth/providers/supabase';
import PageCard from '@/app/(app)/components/PageCard';
import Icon from '@/components/Icon';
import { useGlobalLoader } from '@/app/(app)/components/GlobalLoaderProvider';

interface PromptPage {
  id: string;
  slug: string;
  show_friendly_note: boolean;
  friendly_note: string;
  emoji_sentiment_enabled: boolean;
  created_at: string;
}

export default function DebugFriendlyNotePage() {
  const [promptPages, setPromptPages] = useState<PromptPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<string[]>([]);
  const supabase = createClient();

  useEffect(() => {
    loadPromptPages();
  }, []);

  const loadPromptPages = async () => {
    try {
      const { data, error } = await supabase
        .from('prompt_pages')
        .select('id, slug, show_friendly_note, friendly_note, emoji_sentiment_enabled, created_at')
        .not('friendly_note', 'is', null)
        .neq('friendly_note', '')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setPromptPages(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testFriendlyNoteUpdate = async (pageId: string, currentState: boolean) => {
    const newState = !currentState;
    setTestResults(prev => [...prev, `Testing update for page ${pageId}: ${currentState} → ${newState}`]);

    try {
      const { error } = await supabase
        .from('prompt_pages')
        .update({ show_friendly_note: newState })
        .eq('id', pageId);

      if (error) {
        setTestResults(prev => [...prev, `❌ Failed: ${error.message}`]);
      } else {
        setTestResults(prev => [...prev, `✅ Success: Updated to ${newState}`]);
        
        // Reload to verify
        await loadPromptPages();
      }
    } catch (err: any) {
      setTestResults(prev => [...prev, `❌ Error: ${err.message}`]);
    }
  };

  const clearTestResults = () => setTestResults([]);

  const loader = useGlobalLoader();
  useEffect(() => {
    if (loading) loader.show('debug-friendly'); else loader.hide('debug-friendly');
    return () => loader.hide('debug-friendly');
  }, [loading, loader]);

  if (loading) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <div className="max-w-6xl mx-auto">
        <PageCard
          icon={<Icon name="FaBug" className="w-8 h-8" />}
        >
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Friendly Note Debug Tool</h1>
              <p className="text-gray-600">Debug and test friendly note functionality</p>
            </div>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <strong>Error:</strong> {error}
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ Debug Mode Active</h3>
              <p className="text-yellow-700">
                This page helps debug friendly note issues. Use with caution on production data.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-blue mb-4">
                Prompt Pages with Friendly Note Content ({promptPages.length})
              </h3>
              
              {promptPages.length === 0 ? (
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-gray-600">No prompt pages found with friendly note content.</p>
                  <p className="text-sm text-gray-500 mt-2">
                    This could indicate that friendly notes aren't being saved properly.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {promptPages.map((page) => (
                    <div key={page.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            <a 
                              href={`/r/${page.slug}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {page.slug}
                            </a>
                          </h4>
                          <p className="text-sm text-gray-500">ID: {page.id}</p>
                        </div>
                        <button
                          onClick={() => testFriendlyNoteUpdate(page.id, page.show_friendly_note)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Test Toggle
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Show Friendly Note:</span>
                          <span className={`ml-2 px-2 py-1 rounded text-xs ${
                            page.show_friendly_note 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {page.show_friendly_note ? 'ENABLED' : 'DISABLED'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Emoji Sentiment:</span>
                          <span className={`ml-2 px-2 py-1 rounded text-xs ${
                            page.emoji_sentiment_enabled 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {page.emoji_sentiment_enabled ? 'ENABLED' : 'DISABLED'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Conflict:</span>
                          <span className={`ml-2 px-2 py-1 rounded text-xs ${
                            page.show_friendly_note && page.emoji_sentiment_enabled
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {page.show_friendly_note && page.emoji_sentiment_enabled ? 'YES' : 'NO'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <span className="font-medium text-sm">Friendly Note Content:</span>
                        <div className="mt-1 p-2 bg-gray-50 rounded text-sm text-gray-700">
                          "{page.friendly_note.length > 200 
                            ? page.friendly_note.substring(0, 200) + '...' 
                            : page.friendly_note}"
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {testResults.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Test Results</h3>
                  <button
                    onClick={clearTestResults}
                    className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Clear
                  </button>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {testResults.join('\n')}
                  </pre>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">💡 Troubleshooting Steps</h3>
              <ul className="text-blue-700 space-y-1 text-sm">
                <li>1. Check if "Show Friendly Note" is ENABLED but not showing on live page</li>
                <li>2. Look for conflicts where both Friendly Note and Emoji Sentiment are enabled</li>
                <li>3. Test the toggle functionality using the "Test Toggle" buttons above</li>
                <li>4. Check browser dev tools for JavaScript errors when saving changes</li>
                <li>5. Verify the database update operations are completing successfully</li>
              </ul>
            </div>

            <div className="text-center">
              <button
                onClick={loadPromptPages}
                className="px-4 py-2 bg-slate-blue text-white rounded hover:bg-slate-blue/90"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </PageCard>
      </div>
    </div>
  );
}
